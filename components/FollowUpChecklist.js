"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { Phone, Check } from "lucide-react";
import { formatCurrency, formatPhone } from "@/lib/format";

const SEVERITY_DOT = {
  high: "bg-rose-500",
  medium: "bg-amber-500",
};

export default function FollowUpChecklist({ items }) {
  const [checked, setChecked] = useState(() => new Set());

  function toggle(name) {
    setChecked((prev) => {
      const next = new Set(prev);
      if (next.has(name)) next.delete(name);
      else next.add(name);
      return next;
    });
  }

  const doneCount = checked.size;
  const total = items.length;

  const sorted = useMemo(() => {
    // Keep checked-off items visible but sink them to the bottom.
    return items.slice().sort((a, b) => {
      const aDone = checked.has(a.name);
      const bDone = checked.has(b.name);
      if (aDone !== bDone) return aDone ? 1 : -1;
      return 0;
    });
  }, [items, checked]);

  if (total === 0) {
    return (
      <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-6 text-center">
        <p className="font-medium text-emerald-700">Nothing needs follow-up today.</p>
        <p className="mt-1 text-sm text-emerald-600">
          No one is on hold, over their credit limit, 90+ days overdue, or without a payment in 6 months.
        </p>
      </div>
    );
  }

  return (
    <div>
      <div className="mb-4 flex items-center justify-between rounded-xl border border-slate-200 bg-white px-4 py-3 shadow-sm">
        <p className="text-sm font-medium text-slate-700">
          {doneCount} of {total} done today
        </p>
        <div className="h-2 w-40 overflow-hidden rounded-full bg-slate-100">
          <div
            className="h-full rounded-full bg-indigo-600 transition-all"
            style={{ width: `${total ? (doneCount / total) * 100 : 0}%` }}
          />
        </div>
      </div>

      <div className="space-y-2">
        {sorted.map((item) => {
          const isDone = checked.has(item.name);
          return (
            <div
              key={item.name}
              className={`flex flex-wrap items-start gap-3 rounded-xl border p-4 shadow-sm transition ${
                isDone ? "border-slate-200 bg-slate-50 opacity-60" : "border-slate-200 bg-white"
              }`}
            >
              <button
                onClick={() => toggle(item.name)}
                aria-label={isDone ? "Mark as not done" : "Mark as done"}
                className={`mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-md border transition ${
                  isDone ? "border-indigo-600 bg-indigo-600 text-white" : "border-slate-300 bg-white"
                }`}
              >
                {isDone && <Check className="h-3.5 w-3.5" />}
              </button>

              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-2">
                  <Link
                    href={`/contractor/${encodeURIComponent(item.name)}`}
                    className={`font-medium hover:text-indigo-600 ${isDone ? "line-through text-slate-500" : "text-slate-800"}`}
                  >
                    {item.name}
                  </Link>
                  {item.reasons.map((r) => (
                    <span
                      key={r}
                      className="inline-flex items-center gap-1 rounded-full bg-slate-100 px-2 py-0.5 text-xs font-medium text-slate-600"
                    >
                      <span className={`h-1.5 w-1.5 rounded-full ${SEVERITY_DOT[item.severity]}`} />
                      {r}
                    </span>
                  ))}
                </div>
                <p className="mt-1 text-xs text-slate-500">
                  {item.phone ? (
                    <span className="inline-flex items-center gap-1">
                      <Phone className="h-3 w-3" /> {formatPhone(item.phone)}
                    </span>
                  ) : null}
                  {item.phone ? " · " : ""}
                  Balance {formatCurrency(item.balance)} · Suggested: {item.actions.join("; ")}
                </p>
              </div>
            </div>
          );
        })}
      </div>

      <p className="mt-4 text-center text-xs text-slate-400">
        This list is generated fresh from live data — it isn&apos;t saved between visits, so checking
        items off here only lasts for this session. Come back tomorrow for a new list.
      </p>
    </div>
  );
}
