"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import {
  Wallet,
  TrendingDown,
  TrendingUp,
  HeartPulse,
  AlertTriangle,
  ShieldAlert,
  Search,
} from "lucide-react";
import { formatCurrency, formatDate } from "@/lib/format";
import StatCard from "@/components/StatCard";
import CashFlowChart from "./CashFlowChart";
import BalanceProjectionChart from "./BalanceProjectionChart";

const LABEL_STYLES = {
  Healthy: "bg-emerald-100 text-emerald-700",
  Watch: "bg-amber-100 text-amber-700",
  "At Risk": "bg-rose-100 text-rose-700",
};

const SEVERITY_STYLES = {
  high: "border-rose-200 bg-rose-50",
  medium: "border-amber-200 bg-amber-50",
  positive: "border-emerald-200 bg-emerald-50",
};

const SEVERITY_ICON = {
  high: ShieldAlert,
  medium: AlertTriangle,
  positive: HeartPulse,
};

function RecommendationsPanel({ recommendations }) {
  if (recommendations.length === 0) {
    return (
      <p className="rounded-xl border border-slate-200 bg-white p-4 text-sm text-slate-500 shadow-sm">
        No urgent actions right now — nothing on hold, over limit, or badly overdue.
      </p>
    );
  }
  return (
    <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
      {recommendations.map((rec, i) => {
        const Icon = SEVERITY_ICON[rec.severity] || AlertTriangle;
        return (
          <div key={i} className={`rounded-xl border p-4 shadow-sm ${SEVERITY_STYLES[rec.severity]}`}>
            <div className="flex items-start gap-2">
              <Icon className="mt-0.5 h-4 w-4 shrink-0 text-slate-600" />
              <div>
                <p className="text-sm font-semibold text-slate-800">{rec.title}</p>
                <p className="mt-0.5 text-xs text-slate-600">{rec.detail}</p>
                {rec.contractors.length > 0 && (
                  <p className="mt-1.5 text-xs text-slate-500">
                    {rec.contractors.join(", ")}
                    {rec.contractors.length >= 5 ? "…" : ""}
                  </p>
                )}
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}

function AgingTable({ aging }) {
  return (
    <div className="overflow-x-auto rounded-xl border border-slate-200 bg-white shadow-sm">
      <table className="min-w-full divide-y divide-slate-200 text-sm">
        <thead className="bg-slate-50">
          <tr>
            <th className="px-4 py-2 text-left font-medium text-slate-500">Age of unpaid invoices</th>
            <th className="px-4 py-2 text-right font-medium text-slate-500">Outstanding amount</th>
            <th className="px-4 py-2 text-right font-medium text-slate-500">Invoices</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-100">
          {aging.buckets.map((b) => (
            <tr key={b.key}>
              <td className="px-4 py-2 font-medium text-slate-700">{b.label}</td>
              <td
                className={`px-4 py-2 text-right font-medium ${
                  b.key === "90+" ? "text-rose-600" : "text-slate-700"
                }`}
              >
                {formatCurrency(b.amount)}
              </td>
              <td className="px-4 py-2 text-right text-slate-500">{b.count}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

const THRESHOLD_OPTIONS = [
  { value: 30, label: "30+ days pending" },
  { value: 60, label: "60+ days pending" },
  { value: 90, label: "90+ days pending" },
  { value: 0, label: "Any balance (all)" },
];

function AgingDetailTable({ agingDetail }) {
  const [threshold, setThreshold] = useState(30);
  const [query, setQuery] = useState("");

  const rows = useMemo(() => {
    const q = query.trim().toLowerCase();
    return agingDetail
      .filter((r) => r.daysPending >= threshold)
      .filter((r) => !q || r.name.toLowerCase().includes(q));
  }, [agingDetail, threshold, query]);

  const totalBalance = rows.reduce((sum, r) => sum + r.balance, 0);

  return (
    <div>
      <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
        <select
          value={threshold}
          onChange={(e) => setThreshold(Number(e.target.value))}
          className="rounded-lg border border-slate-300 px-3 py-1.5 text-sm text-slate-700 shadow-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
        >
          {THRESHOLD_OPTIONS.map((o) => (
            <option key={o.value} value={o.value}>
              {o.label}
            </option>
          ))}
        </select>
        <div className="relative w-full sm:w-56">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search contractor..."
            className="w-full rounded-lg border border-slate-300 pl-9 pr-3 py-1.5 text-sm shadow-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
          />
        </div>
      </div>
      <p className="mb-2 text-xs text-slate-500">
        {rows.length} contractor{rows.length !== 1 ? "s" : ""} · {formatCurrency(totalBalance)} total
      </p>
      {rows.length === 0 ? (
        <p className="rounded-xl border border-slate-200 bg-white p-4 text-sm text-slate-500 shadow-sm">
          No one matches this filter.
        </p>
      ) : (
        <div className="overflow-x-auto rounded-xl border border-slate-200 bg-white shadow-sm">
          <table className="min-w-full divide-y divide-slate-200 text-sm">
            <thead className="bg-slate-50">
              <tr>
                <th className="px-4 py-2 text-left font-medium text-slate-500">Contractor</th>
                <th className="px-4 py-2 text-left font-medium text-slate-500 whitespace-nowrap">Phone</th>
                <th className="px-4 py-2 text-right font-medium text-slate-500">Balance</th>
                <th className="px-4 py-2 text-right font-medium text-slate-500 whitespace-nowrap">
                  Days pending
                </th>
                <th className="px-4 py-2 text-left font-medium text-slate-500 whitespace-nowrap">Bucket</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {rows.map((r) => (
                <tr key={r.name}>
                  <td className="px-4 py-2 font-medium text-slate-800">
                    <Link href={`/contractor/${encodeURIComponent(r.name)}`} className="hover:text-indigo-600">
                      {r.name}
                    </Link>
                  </td>
                  <td className="px-4 py-2 text-slate-500 whitespace-nowrap">{r.phone || "-"}</td>
                  <td className="px-4 py-2 text-right font-medium text-rose-600">{formatCurrency(r.balance)}</td>
                  <td className="px-4 py-2 text-right text-slate-700 whitespace-nowrap">{r.daysPending} days</td>
                  <td className="px-4 py-2 whitespace-nowrap">
                    <span
                      className={`rounded-full px-2 py-0.5 text-xs font-medium ${
                        r.bucketKey === "90+"
                          ? "bg-rose-100 text-rose-700"
                          : r.bucketKey === "61-90"
                          ? "bg-amber-100 text-amber-700"
                          : "bg-slate-100 text-slate-600"
                      }`}
                    >
                      {r.bucketLabel}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

function HealthList({ healthResults }) {
  const [filter, setFilter] = useState("all");
  const [query, setQuery] = useState("");

  const tabs = [
    { key: "all", label: "All" },
    { key: "Healthy", label: "Healthy" },
    { key: "Watch", label: "Watch" },
    { key: "At Risk", label: "At Risk" },
  ];

  const counts = useMemo(() => {
    const c = { Healthy: 0, Watch: 0, "At Risk": 0 };
    healthResults.forEach((r) => (c[r.healthLabel] = (c[r.healthLabel] || 0) + 1));
    return c;
  }, [healthResults]);

  const rows = useMemo(() => {
    const q = query.trim().toLowerCase();
    return healthResults
      .filter((r) => filter === "all" || r.healthLabel === filter)
      .filter((r) => !q || r.name.toLowerCase().includes(q))
      .sort((a, b) => b.healthScore - a.healthScore);
  }, [healthResults, filter, query]);

  return (
    <div>
      <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
        <div className="flex flex-wrap gap-1.5">
          {tabs.map((t) => (
            <button
              key={t.key}
              onClick={() => setFilter(t.key)}
              className={`rounded-full px-3 py-1 text-xs font-medium transition ${
                filter === t.key
                  ? "bg-indigo-600 text-white"
                  : "bg-slate-100 text-slate-600 hover:bg-slate-200"
              }`}
            >
              {t.label}
              {t.key !== "all" ? ` (${counts[t.key] || 0})` : ""}
            </button>
          ))}
        </div>
        <div className="relative w-full sm:w-56">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search contractor..."
            className="w-full rounded-lg border border-slate-300 pl-9 pr-3 py-1.5 text-sm shadow-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
          />
        </div>
      </div>
      <div className="overflow-x-auto rounded-xl border border-slate-200 bg-white shadow-sm">
        <table className="min-w-full divide-y divide-slate-200 text-sm">
          <thead className="bg-slate-50">
            <tr>
              <th className="px-4 py-2 text-left font-medium text-slate-500">Contractor</th>
              <th className="px-4 py-2 text-right font-medium text-slate-500">Balance</th>
              <th className="px-4 py-2 text-right font-medium text-slate-500">Score</th>
              <th className="px-4 py-2 text-left font-medium text-slate-500">Status</th>
              <th className="px-4 py-2 text-left font-medium text-slate-500 whitespace-nowrap">Last payment</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {rows.slice(0, 100).map((r) => (
              <tr key={r.name}>
                <td className="px-4 py-2 font-medium text-slate-800">
                  <Link href={`/contractor/${encodeURIComponent(r.name)}`} className="hover:text-indigo-600">
                    {r.name}
                  </Link>
                </td>
                <td className={`px-4 py-2 text-right ${r.totalBalance > 0 ? "text-rose-600" : "text-slate-700"}`}>
                  {formatCurrency(r.totalBalance)}
                </td>
                <td className="px-4 py-2 text-right font-medium text-slate-700">{r.healthScore}</td>
                <td className="px-4 py-2">
                  <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${LABEL_STYLES[r.healthLabel]}`}>
                    {r.healthLabel}
                  </span>
                </td>
                <td className="px-4 py-2 text-slate-500 whitespace-nowrap">
                  {r.lastPaymentDate ? formatDate(r.lastPaymentDate) : "Never"}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {rows.length > 100 && (
          <p className="border-t border-slate-100 px-4 py-2 text-xs text-slate-400">
            Showing top 100 of {rows.length}. Narrow with search to see more specific contractors.
          </p>
        )}
      </div>
    </div>
  );
}

function CollectionEstimatesTable({ estimates }) {
  const top = estimates.slice(0, 15);
  return (
    <div className="overflow-x-auto rounded-xl border border-slate-200 bg-white shadow-sm">
      <table className="min-w-full divide-y divide-slate-200 text-sm">
        <thead className="bg-slate-50">
          <tr>
            <th className="px-4 py-2 text-left font-medium text-slate-500">Contractor</th>
            <th className="px-4 py-2 text-right font-medium text-slate-500">Balance</th>
            <th className="px-4 py-2 text-right font-medium text-slate-500 whitespace-nowrap">
              Avg monthly payment
            </th>
            <th className="px-4 py-2 text-right font-medium text-slate-500 whitespace-nowrap">
              Est. time to clear
            </th>
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-100">
          {top.map((e) => (
            <tr key={e.name}>
              <td className="px-4 py-2 font-medium text-slate-800">
                <Link href={`/contractor/${encodeURIComponent(e.name)}`} className="hover:text-indigo-600">
                  {e.name}
                </Link>
              </td>
              <td className="px-4 py-2 text-right text-rose-600">{formatCurrency(e.balance)}</td>
              <td className="px-4 py-2 text-right text-slate-600">{formatCurrency(e.avgMonthlyPayment)}</td>
              <td className="px-4 py-2 text-right whitespace-nowrap">
                {e.stalled ? (
                  <span className="rounded-full bg-rose-100 px-2 py-0.5 text-xs font-medium text-rose-700">
                    No recent payments
                  </span>
                ) : (
                  <span className="font-medium text-slate-700">
                    ~{Math.round(e.monthsToClear * 10) / 10} months
                  </span>
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
      <p className="border-t border-slate-100 px-4 py-2 text-xs text-slate-400">
        Estimated from each contractor's own average monthly payments over the last 6 months. Sorted by
        priority (no recent payment first, then longest projected time to clear).
      </p>
    </div>
  );
}

export default function AnalyticsDashboard({
  kpis,
  recommendations,
  monthlyCashFlow,
  collectionsTrend,
  aging,
  agingDetail,
  healthResults,
  collectionEstimates,
}) {
  return (
    <div className="space-y-8">
      <section>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          <StatCard label="Outstanding Balance" value={formatCurrency(kpis.totalOutstanding)} tone="negative" icon={Wallet} />
          <StatCard
            label="Avg Monthly Collected"
            value={formatCurrency(collectionsTrend.avgMonthlyCollected)}
            tone="positive"
            icon={TrendingUp}
          />
          <StatCard
            label="Avg Monthly Invoiced"
            value={formatCurrency(collectionsTrend.avgMonthlyInvoiced)}
            icon={TrendingDown}
          />
          <StatCard label="Healthy Contractors" value={kpis.healthyCount} tone="positive" icon={HeartPulse} />
        </div>
      </section>

      <section>
        <h2 className="mb-3 text-sm font-semibold text-slate-700">Recommended actions</h2>
        <RecommendationsPanel recommendations={recommendations} />
      </section>

      <section className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <div>
          <h2 className="mb-3 text-sm font-semibold text-slate-700">Monthly cash flow (last 12 months)</h2>
          <div className="rounded-xl border border-slate-200 bg-white p-3 shadow-sm">
            <CashFlowChart data={monthlyCashFlow} />
          </div>
        </div>
        <div>
          <h2 className="mb-3 text-sm font-semibold text-slate-700">
            Collections forecast (based on last 3 months' pace)
          </h2>
          <div className="rounded-xl border border-slate-200 bg-white p-3 shadow-sm">
            <BalanceProjectionChart
              currentOutstanding={kpis.totalOutstanding}
              horizons={collectionsTrend.horizons}
            />
          </div>
        </div>
      </section>

      <section>
        <h2 className="mb-3 text-sm font-semibold text-slate-700">Credit aging (outstanding invoices by age)</h2>
        <AgingTable aging={aging} />
      </section>

      <section>
        <h2 className="mb-3 text-sm font-semibold text-slate-700">Customers with bills pending 30+ days</h2>
        <AgingDetailTable agingDetail={agingDetail} />
      </section>

      <section>
        <h2 className="mb-3 text-sm font-semibold text-slate-700">
          Contractor health ({kpis.healthyCount} healthy · {kpis.watchCount} watch · {kpis.atRiskCount} at risk)
        </h2>
        <HealthList healthResults={healthResults} />
      </section>

      <section>
        <h2 className="mb-3 text-sm font-semibold text-slate-700">Priority collection targets</h2>
        <CollectionEstimatesTable estimates={collectionEstimates} />
      </section>
    </div>
  );
}
