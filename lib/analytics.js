// Pure, side-effect-free analytics computations for the shop-level
// analytics dashboard. Everything here is deterministic and rule-based
// (weighted scoring + trailing-average trend projection) rather than a
// black-box model, so the numbers can be explained and trusted.

function clamp(n, min, max) {
  return Math.max(min, Math.min(max, n));
}

function parseDateSafe(value) {
  if (!value) return null;
  const d = new Date(value);
  return Number.isNaN(d.getTime()) ? null : d;
}

function daysBetween(a, b) {
  return Math.round((a.getTime() - b.getTime()) / (1000 * 60 * 60 * 24));
}

function monthKey(date) {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`;
}

function monthLabel(key) {
  const [y, m] = key.split("-").map(Number);
  const d = new Date(y, m - 1, 1);
  return d.toLocaleDateString("en-IN", { month: "short", year: "numeric" });
}

// ---------------------------------------------------------------------
// 1. Per-contractor health score
// ---------------------------------------------------------------------

export function computeContractorHealth(contractors, payments, now = new Date()) {
  const lastPaymentByContractor = new Map();
  for (const p of payments) {
    const d = parseDateSafe(p.date);
    if (!d) continue;
    const current = lastPaymentByContractor.get(p.contractorName);
    if (!current || d > current) lastPaymentByContractor.set(p.contractorName, d);
  }

  return contractors.map((c) => {
    const creditLimit = c.creditLimit || 0;
    const balanceRatio =
      creditLimit > 0 ? c.totalBalance / creditLimit : c.totalAmount > 0 ? c.totalBalance / c.totalAmount : 0;
    const balanceScore = clamp(100 - balanceRatio * 100, 0, 100);

    const paidRatio = c.totalAmount > 0 ? c.totalPayment / c.totalAmount : 1;
    const paidScore = clamp(paidRatio * 100, 0, 100);

    const lastPaymentDate = lastPaymentByContractor.get(c.name) || null;
    let recencyScore;
    let daysSincePayment = null;
    if (!lastPaymentDate) {
      recencyScore = c.totalAmount === 0 ? 70 : 0;
    } else {
      daysSincePayment = daysBetween(now, lastPaymentDate);
      if (daysSincePayment <= 30) recencyScore = 100;
      else if (daysSincePayment <= 60) recencyScore = 75;
      else if (daysSincePayment <= 90) recencyScore = 50;
      else if (daysSincePayment <= 180) recencyScore = 25;
      else recencyScore = 0;
    }

    const activeScore = c.activeProjectCount > 0 ? 100 : 60;

    const healthScore = Math.round(
      balanceScore * 0.35 + paidScore * 0.3 + recencyScore * 0.25 + activeScore * 0.1
    );

    let label;
    if (c.hold || c.limitStatus === "over") {
      label = "At Risk";
    } else if (healthScore >= 75) {
      label = "Healthy";
    } else if (healthScore >= 45) {
      label = "Watch";
    } else {
      label = "At Risk";
    }

    return {
      ...c,
      healthScore,
      healthLabel: label,
      lastPaymentDate,
      daysSincePayment,
      scoreBreakdown: { balanceScore, paidScore, recencyScore, activeScore },
    };
  });
}

// ---------------------------------------------------------------------
// 2. Accounts-receivable aging (outstanding invoice balances by age)
// ---------------------------------------------------------------------

const AGING_BUCKETS = [
  { key: "0-30", label: "0-30 days", min: 0, max: 30 },
  { key: "31-60", label: "31-60 days", min: 31, max: 60 },
  { key: "61-90", label: "61-90 days", min: 61, max: 90 },
  { key: "90+", label: "90+ days", min: 91, max: Infinity },
];

// Invoice-level BalanceAmount in this sheet isn't always kept in sync with
// the project/contractor-level DueAmount (e.g. lump-sum payments applied
// against a project rather than a specific invoice line leave that
// invoice's own balance looking stale/unpaid forever). Left unchecked,
// that shows up as "90+ days overdue" noise for accounts that are
// actually fully settled today. To keep aging trustworthy, this:
//   1. Skips contractors whose current total balance is already 0 (or
//      less) entirely - a stale invoice row shouldn't resurrect a
//      settled account.
//   2. Scales each contractor's summed invoice balances down so they
//      never exceed that contractor's real current balance, preserving
//      the relative age split but keeping the grand total honest.
export function computeAging(invoices, contractors = [], now = new Date()) {
  const currentBalanceByContractor = new Map(contractors.map((c) => [c.name, c.totalBalance]));

  const byContractor = new Map();
  for (const inv of invoices) {
    if (!inv.balanceAmount || inv.balanceAmount <= 0) continue;
    const invDate = parseDateSafe(inv.date);
    const age = invDate ? Math.max(0, daysBetween(now, invDate)) : 0;
    if (!byContractor.has(inv.contractorName)) byContractor.set(inv.contractorName, []);
    byContractor.get(inv.contractorName).push({ amount: inv.balanceAmount, age });
  }

  const buckets = AGING_BUCKETS.map((b) => ({ ...b, amount: 0, count: 0 }));
  const contractorAgeMax = new Map();

  for (const [contractorName, rows] of byContractor.entries()) {
    const currentBalance = currentBalanceByContractor.get(contractorName) ?? 0;
    if (currentBalance <= 0) continue; // settled - ignore stale invoice rows

    const rawTotal = rows.reduce((sum, r) => sum + r.amount, 0);
    const scale = rawTotal > 0 ? Math.min(1, currentBalance / rawTotal) : 0;
    if (scale <= 0) continue;

    for (const row of rows) {
      const scaledAmount = row.amount * scale;
      const bucket =
        buckets.find((b) => row.age >= b.min && row.age <= b.max) || buckets[buckets.length - 1];
      bucket.amount += scaledAmount;
      bucket.count += 1;

      const entry =
        contractorAgeMax.get(contractorName) || { contractorName, amount: 0, maxAge: 0 };
      entry.amount += scaledAmount;
      entry.maxAge = Math.max(entry.maxAge, row.age);
      contractorAgeMax.set(contractorName, entry);
    }
  }

  const totalOutstanding = buckets.reduce((sum, b) => sum + b.amount, 0);

  const over90 = Array.from(contractorAgeMax.values())
    .filter((c) => c.maxAge >= 91)
    .sort((a, b) => b.amount - a.amount);

  return { buckets, totalOutstanding, over90 };
}

// ---------------------------------------------------------------------
// 3. Monthly cash flow (invoiced vs collected), last N months
// ---------------------------------------------------------------------

export function computeMonthlyCashFlow(invoices, payments, monthsBack = 12, now = new Date()) {
  const months = [];
  for (let i = monthsBack - 1; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    months.push(monthKey(d));
  }
  const index = new Map(months.map((k) => [k, { month: k, label: monthLabel(k), invoiced: 0, collected: 0 }]));

  for (const inv of invoices) {
    const d = parseDateSafe(inv.date);
    if (!d) continue;
    const key = monthKey(d);
    const row = index.get(key);
    if (row) row.invoiced += inv.amount || 0;
  }

  for (const p of payments) {
    const d = parseDateSafe(p.date);
    if (!d) continue;
    const key = monthKey(d);
    const row = index.get(key);
    if (row) row.collected += p.amount || 0;
  }

  return months.map((k) => index.get(k));
}

// ---------------------------------------------------------------------
// 4. Collections trend / 30-60-90 day projection
// ---------------------------------------------------------------------

export function computeCollectionsTrend(monthlyCashFlow, currentOutstanding, trailingMonths = 3) {
  const recent = monthlyCashFlow.slice(-trailingMonths);
  const avgMonthlyCollected = recent.length
    ? recent.reduce((sum, m) => sum + m.collected, 0) / recent.length
    : 0;
  const avgMonthlyInvoiced = recent.length
    ? recent.reduce((sum, m) => sum + m.invoiced, 0) / recent.length
    : 0;

  const dailyCollected = avgMonthlyCollected / 30;
  const dailyInvoiced = avgMonthlyInvoiced / 30;

  const horizons = [30, 60, 90].map((days) => {
    const projectedCollected = dailyCollected * days;
    const projectedNewInvoiced = dailyInvoiced * days;
    const projectedBalance = Math.max(0, currentOutstanding - projectedCollected + projectedNewInvoiced);
    return { days, projectedCollected, projectedNewInvoiced, projectedBalance };
  });

  return { avgMonthlyCollected, avgMonthlyInvoiced, horizons };
}

// ---------------------------------------------------------------------
// 5. Per-contractor "time to clear balance at current pace" estimate
// ---------------------------------------------------------------------

export function computeCollectionEstimates(contractors, payments, monthsBack = 6, now = new Date()) {
  const cutoff = new Date(now);
  cutoff.setMonth(cutoff.getMonth() - monthsBack);

  const recentPaymentTotals = new Map();
  for (const p of payments) {
    const d = parseDateSafe(p.date);
    if (!d || d < cutoff) continue;
    recentPaymentTotals.set(p.contractorName, (recentPaymentTotals.get(p.contractorName) || 0) + (p.amount || 0));
  }

  return contractors
    .filter((c) => c.totalBalance > 0)
    .map((c) => {
      const recentTotal = recentPaymentTotals.get(c.name) || 0;
      const avgMonthlyPayment = recentTotal / monthsBack;
      const monthsToClear = avgMonthlyPayment > 0 ? c.totalBalance / avgMonthlyPayment : null;
      return {
        name: c.name,
        balance: c.totalBalance,
        avgMonthlyPayment,
        monthsToClear,
        stalled: avgMonthlyPayment <= 0,
      };
    })
    .sort((a, b) => {
      if (a.stalled !== b.stalled) return a.stalled ? -1 : 1;
      if (a.stalled) return b.balance - a.balance;
      return b.monthsToClear - a.monthsToClear;
    });
}

// ---------------------------------------------------------------------
// 6. Rules-based, deterministic recommendations
// ---------------------------------------------------------------------

export function buildRecommendations({ healthResults, aging, collectionEstimates }) {
  const recs = [];

  const onHold = healthResults.filter((c) => c.hold && c.totalBalance > 0);
  if (onHold.length) {
    const exposure = onHold.reduce((s, c) => s + c.totalBalance, 0);
    recs.push({
      type: "hold",
      severity: "high",
      title: `${onHold.length} contractor${onHold.length !== 1 ? "s" : ""} on hold with an open balance`,
      detail: `Total exposure on hold: ₹${Math.round(exposure).toLocaleString("en-IN")}. Resolve or collect before releasing the hold.`,
      contractors: onHold.slice(0, 5).map((c) => c.name),
    });
  }

  const overLimit = healthResults.filter((c) => c.limitStatus === "over");
  if (overLimit.length) {
    recs.push({
      type: "over-limit",
      severity: "high",
      title: `${overLimit.length} contractor${overLimit.length !== 1 ? "s" : ""} over their credit limit`,
      detail: "Pause additional credit/sales to these contractors until their balance is back under the limit.",
      contractors: overLimit.slice(0, 5).map((c) => c.name),
    });
  }

  if (aging.over90.length) {
    const total90 = aging.over90.reduce((s, c) => s + c.amount, 0);
    recs.push({
      type: "aging",
      severity: "high",
      title: `₹${Math.round(total90).toLocaleString("en-IN")} outstanding for 90+ days`,
      detail: `Across ${aging.over90.length} contractor${aging.over90.length !== 1 ? "s" : ""}. These are your best collection targets to bring the credit total down.`,
      contractors: aging.over90.slice(0, 5).map((c) => c.contractorName),
    });
  }

  const stalled = collectionEstimates.filter((c) => c.stalled && c.balance > 0);
  if (stalled.length) {
    recs.push({
      type: "stalled",
      severity: "medium",
      title: `${stalled.length} contractor${stalled.length !== 1 ? "s" : ""} with a balance but no payment in the last 6 months`,
      detail: "No recent payment activity to project from — worth a direct follow-up call.",
      contractors: stalled.slice(0, 5).map((c) => c.name),
    });
  }

  const healthy = healthResults
    .filter((c) => c.healthLabel === "Healthy")
    .sort((a, b) => b.healthScore - a.healthScore);
  if (healthy.length) {
    recs.push({
      type: "growth",
      severity: "positive",
      title: `${healthy.length} healthy contractor${healthy.length !== 1 ? "s" : ""} — good candidates to grow`,
      detail: "Strong payment history, active projects, and balance well within limit. Good targets for more business or a higher credit limit.",
      contractors: healthy.slice(0, 5).map((c) => c.name),
    });
  }

  return recs;
}

// ---------------------------------------------------------------------
// 7. Daily follow-up list: merges on-hold, over-limit, 90+ day aging, and
// stalled (no payment in 6mo) contractors into one deduped, prioritized
// checklist. Fully deterministic - recomputed fresh on every page load,
// nothing persisted, so "today's list" just reflects current data.
// ---------------------------------------------------------------------

export function buildDailyFollowUpList({ healthResults, aging, collectionEstimates }) {
  const byContractor = new Map();

  function addReason(name, reason, severity, action) {
    if (!byContractor.has(name)) {
      byContractor.set(name, { name, reasons: [], actions: [], severity: "medium" });
    }
    const entry = byContractor.get(name);
    entry.reasons.push(reason);
    entry.actions.push(action);
    if (severity === "high") entry.severity = "high";
  }

  const balanceByName = new Map(healthResults.map((c) => [c.name, c]));

  for (const c of healthResults) {
    if (c.hold && c.totalBalance > 0) {
      addReason(c.name, "On hold with balance", "high", "Resolve hold or collect balance");
    }
    if (c.limitStatus === "over") {
      addReason(c.name, "Over credit limit", "high", "Collect before extending further credit");
    }
  }

  for (const entry of aging.over90) {
    addReason(entry.contractorName, "90+ days overdue", "high", "Priority collection call");
  }

  for (const est of collectionEstimates) {
    if (est.stalled && est.balance > 0) {
      addReason(est.name, "No payment in 6+ months", "medium", "Reconnect / confirm status");
    }
  }

  const list = Array.from(byContractor.values()).map((entry) => {
    const contractor = balanceByName.get(entry.name);
    return {
      name: entry.name,
      phone: contractor?.phone || "",
      balance: contractor?.totalBalance || 0,
      reasons: Array.from(new Set(entry.reasons)),
      actions: Array.from(new Set(entry.actions)),
      severity: entry.severity,
    };
  });

  return list.sort((a, b) => {
    if (a.severity !== b.severity) return a.severity === "high" ? -1 : 1;
    return b.balance - a.balance;
  });
}
