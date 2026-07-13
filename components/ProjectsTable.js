"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { Search, FileDown, ChevronRight, ChevronUp, ChevronDown, PauseCircle } from "lucide-react";
import { formatCurrency } from "@/lib/format";
import EmptyState from "./EmptyState";

const BALANCE_OPTIONS = [
  { value: "outstanding", label: "Outstanding balance (default)" },
  { value: "all", label: "All projects" },
  { value: "settled", label: "Fully settled only" },
];

const STATUS_OPTIONS = [
  { value: "all", label: "All statuses" },
  { value: "active", label: "Active only" },
  { value: "closed", label: "Closed only" },
];

const HOLD_OPTIONS = [
  { value: "all", label: "Hold: all" },
  { value: "hold", label: "On hold only" },
  { value: "not-hold", label: "Not on hold" },
];

function SortHeader({ label, sortKey, activeKey, direction, onSort, align = "left" }) {
  const isActive = sortKey === activeKey;
  return (
    <th
      className={`px-4 py-3 font-medium text-slate-500 select-none cursor-pointer whitespace-nowrap ${
        align === "right" ? "text-right" : "text-left"
      }`}
      onClick={() => onSort(sortKey)}
    >
      <span className={`inline-flex items-center gap-1 ${align === "right" ? "flex-row-reverse" : ""}`}>
        {label}
        {isActive ? (
          direction === "asc" ? (
            <ChevronUp className="h-3.5 w-3.5" />
          ) : (
            <ChevronDown className="h-3.5 w-3.5" />
          )
        ) : (
          <span className="h-3.5 w-3.5" />
        )}
      </span>
    </th>
  );
}

export default function ProjectsTable({ projects }) {
  const router = useRouter();
  const [query, setQuery] = useState("");
  const [balanceFilter, setBalanceFilter] = useState("outstanding");
  const [statusFilter, setStatusFilter] = useState("all");
  const [holdFilter, setHoldFilter] = useState("all");
  const [sortKey, setSortKey] = useState("balance");
  const [sortDir, setSortDir] = useState("desc");

  function handleSort(key) {
    if (key === sortKey) {
      setSortDir((d) => (d === "asc" ? "desc" : "asc"));
    } else {
      setSortKey(key);
      setSortDir("desc");
    }
  }

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();

    let rows = projects.filter((p) => {
      if (q && !p.name.toLowerCase().includes(q) && !(p.employee || "").toLowerCase().includes(q)) {
        return false;
      }
      const roundedBalance = Math.round(p.balance);
      if (balanceFilter === "outstanding" && roundedBalance === 0) return false;
      if (balanceFilter === "settled" && roundedBalance !== 0) return false;
      if (statusFilter === "active" && !p.active) return false;
      if (statusFilter === "closed" && p.active) return false;
      if (holdFilter === "hold" && !p.hold) return false;
      if (holdFilter === "not-hold" && p.hold) return false;
      return true;
    });

    rows = rows.slice().sort((a, b) => {
      let av = a[sortKey];
      let bv = b[sortKey];
      if (typeof av === "string") {
        av = av.toLowerCase();
        bv = String(bv).toLowerCase();
        return sortDir === "asc" ? av.localeCompare(bv) : bv.localeCompare(av);
      }
      return sortDir === "asc" ? av - bv : bv - av;
    });

    return rows;
  }, [projects, query, balanceFilter, statusFilter, holdFilter, sortKey, sortDir]);

  return (
    <div>
      <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="relative w-full sm:w-72">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search projects by name..."
            className="w-full rounded-lg border border-slate-300 pl-9 pr-3 py-2 text-sm shadow-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
          />
        </div>
        <div className="flex flex-wrap gap-2">
          <select
            value={balanceFilter}
            onChange={(e) => setBalanceFilter(e.target.value)}
            className="rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-700 shadow-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
          >
            {BALANCE_OPTIONS.map((o) => (
              <option key={o.value} value={o.value}>
                {o.label}
              </option>
            ))}
          </select>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-700 shadow-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
          >
            {STATUS_OPTIONS.map((o) => (
              <option key={o.value} value={o.value}>
                {o.label}
              </option>
            ))}
          </select>
          <select
            value={holdFilter}
            onChange={(e) => setHoldFilter(e.target.value)}
            className="rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-700 shadow-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
          >
            {HOLD_OPTIONS.map((o) => (
              <option key={o.value} value={o.value}>
                {o.label}
              </option>
            ))}
          </select>
        </div>
      </div>

      <p className="mb-2 text-xs text-slate-500">
        Showing {filtered.length} of {projects.length} projects
      </p>

      {filtered.length === 0 ? (
        <EmptyState message="No projects match your filters." />
      ) : (
        <div className="overflow-x-auto rounded-xl border border-slate-200 bg-white shadow-sm">
          <table className="min-w-full divide-y divide-slate-200 text-sm">
            <thead className="bg-slate-50">
              <tr>
                <SortHeader label="Project" sortKey="name" activeKey={sortKey} direction={sortDir} onSort={handleSort} />
                <th className="px-4 py-3 text-left font-medium text-slate-500 whitespace-nowrap">Handled by</th>
                <SortHeader
                  label="Total"
                  sortKey="totalAmount"
                  activeKey={sortKey}
                  direction={sortDir}
                  onSort={handleSort}
                  align="right"
                />
                <SortHeader
                  label="Paid"
                  sortKey="totalPayment"
                  activeKey={sortKey}
                  direction={sortDir}
                  onSort={handleSort}
                  align="right"
                />
                <SortHeader
                  label="Balance"
                  sortKey="balance"
                  activeKey={sortKey}
                  direction={sortDir}
                  onSort={handleSort}
                  align="right"
                />
                <th className="px-4 py-3 text-left font-medium text-slate-500 whitespace-nowrap">Status</th>
                <th className="px-4 py-3 text-right font-medium text-slate-500 whitespace-nowrap">Statement</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filtered.map((p) => (
                <tr
                  key={p.name}
                  onClick={() => router.push(`/project/${encodeURIComponent(p.name)}`)}
                  className="cursor-pointer hover:bg-slate-50"
                >
                  <td className="px-4 py-3 font-medium text-slate-800">{p.name}</td>
                  <td className="px-4 py-3 text-slate-500 whitespace-nowrap">{p.employee || "-"}</td>
                  <td className="px-4 py-3 text-right text-slate-700 whitespace-nowrap">
                    {formatCurrency(p.totalAmount)}
                  </td>
                  <td className="px-4 py-3 text-right text-emerald-600 whitespace-nowrap">
                    {formatCurrency(p.totalPayment)}
                  </td>
                  <td
                    className={`px-4 py-3 text-right whitespace-nowrap font-medium ${
                      p.balance > 0 ? "text-rose-600" : "text-slate-700"
                    }`}
                  >
                    {formatCurrency(p.balance)}
                  </td>
                  <td className="px-4 py-3 whitespace-nowrap">
                    <div className="flex flex-wrap items-center gap-1.5">
                      <span
                        className={`rounded-full px-2 py-0.5 text-xs font-medium ${
                          p.active ? "bg-emerald-100 text-emerald-700" : "bg-slate-100 text-slate-500"
                        }`}
                      >
                        {p.active ? "Active" : "Closed"}
                      </span>
                      {p.hold ? (
                        <span className="inline-flex items-center gap-1 rounded-full bg-rose-100 px-2 py-0.5 text-xs font-medium text-rose-700">
                          <PauseCircle className="h-3 w-3" /> On Hold
                        </span>
                      ) : null}
                    </div>
                  </td>
                  <td className="px-4 py-3 text-right whitespace-nowrap">
                    <div className="flex items-center justify-end gap-2">
                      <a
                        href={`/api/statement/project/${encodeURIComponent(p.name)}`}
                        onClick={(e) => e.stopPropagation()}
                        title="Download statement (PDF)"
                        className="rounded-md p-1.5 text-slate-400 hover:bg-slate-100 hover:text-indigo-600"
                      >
                        <FileDown className="h-4 w-4" />
                      </a>
                      <ChevronRight className="h-4 w-4 text-slate-300" />
                    </div>
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
