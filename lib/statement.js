// Pure, side-effect-free functions that turn raw invoice/payment rows into a
// classic accounting-style statement: a chronological ledger with a running
// balance (Date | Description | Debit | Credit | Balance).
//
// "Debit" = amount billed (invoice) — increases balance owed.
// "Credit" = amount received (payment) — decreases balance owed.

function toEntries(invoices, payments, projectName) {
  const entries = [];

  for (const inv of invoices || []) {
    entries.push({
      date: inv.date,
      type: "invoice",
      project: projectName,
      description: `Invoice #${inv.invoiceNumber || "-"}`,
      debit: inv.amount,
      credit: 0,
      status: inv.status,
    });
  }

  for (const p of payments || []) {
    entries.push({
      date: p.date,
      type: "payment",
      project: projectName,
      description: p.receiptNo
        ? `Payment received (Receipt #${p.receiptNo}${p.paymentType ? ` · ${p.paymentType}` : ""})`
        : `Payment received${p.paymentType ? ` (${p.paymentType})` : ""}`,
      debit: 0,
      credit: p.amount,
      remarks: p.remarks,
    });
  }

  return entries;
}

function sortByDate(entries) {
  return entries.slice().sort((a, b) => {
    const da = new Date(a.date).getTime();
    const db = new Date(b.date).getTime();
    const ta = Number.isNaN(da) ? 0 : da;
    const tb = Number.isNaN(db) ? 0 : db;
    return ta - tb;
  });
}

function withRunningBalance(entries) {
  let balance = 0;
  return entries.map((entry) => {
    balance += entry.debit - entry.credit;
    return { ...entry, runningBalance: balance };
  });
}

// Ledger for a single project.
export function buildProjectLedger(project) {
  const entries = sortByDate(toEntries(project.invoices, project.payments, project.name));
  return withRunningBalance(entries);
}

// Combined, chronological ledger across every project a contractor has,
// each row tagged with which project it belongs to.
export function buildContractorLedger(projects) {
  const allEntries = [];
  for (const project of projects) {
    allEntries.push(...toEntries(project.invoices, project.payments, project.name));
  }
  return withRunningBalance(sortByDate(allEntries));
}

export function buildProjectStatement(project) {
  return {
    kind: "project",
    project: {
      name: project.name,
      contractor: project.contractor,
      phone: project.phone,
      totalAmount: project.totalAmount,
      totalPayment: project.totalPayment,
      balance: project.balance,
    },
    generatedAt: new Date(),
    ledger: buildProjectLedger(project),
  };
}

export function buildContractorStatement(contractor) {
  return {
    kind: "contractor",
    contractor: {
      name: contractor.name,
      phone: contractor.phone,
      totalAmount: contractor.totalAmount,
      totalPayment: contractor.totalPayment,
      totalBalance: contractor.totalBalance,
    },
    projects: contractor.projects.map((p) => ({
      name: p.name,
      active: p.active,
      totalAmount: p.totalAmount,
      totalPayment: p.totalPayment,
      balance: p.balance,
    })),
    generatedAt: new Date(),
    ledger: buildContractorLedger(contractor.projects),
  };
}
