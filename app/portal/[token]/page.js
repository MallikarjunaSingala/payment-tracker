import { FileDown, Wallet, CheckCircle2, AlertCircle, PauseCircle, AlertTriangle, ShieldAlert } from "lucide-react";
import { verifyContractorToken, isPortalConfigured } from "@/lib/portalToken";
import { getContractorFullDetail } from "@/lib/sheets";
import { buildContractorLedger } from "@/lib/statement";
import { formatCurrency, formatDate, formatPhone } from "@/lib/format";
import StatCard from "@/components/StatCard";
import ErrorState from "@/components/ErrorState";

export const dynamic = "force-dynamic";

function PortalShell({ children }) {
  return (
    <div className="min-h-screen bg-slate-50">
      <header className="border-b border-slate-200 bg-white">
        <div className="mx-auto flex max-w-5xl items-center gap-2 px-4 py-3">
          <span className="flex h-7 w-7 items-center justify-center rounded-md bg-indigo-600 text-xs font-bold text-white">
            PT
          </span>
          <span className="text-sm font-semibold text-slate-700">Payment Tracker · Your Statement</span>
        </div>
      </header>
      <main className="mx-auto max-w-5xl px-4 py-6 sm:py-8">{children}</main>
    </div>
  );
}

export default async function ContractorPortalPage({ params }) {
  const token = decodeURIComponent(params.token || "");

  if (!isPortalConfigured()) {
    return (
      <PortalShell>
        <ErrorState message="The contractor portal isn't configured yet. Ask the site owner to set CONTRACTOR_PORTAL_SECRET." />
      </PortalShell>
    );
  }

  const contractorName = verifyContractorToken(token);
  if (!contractorName) {
    return (
      <PortalShell>
        <div className="rounded-xl border border-rose-200 bg-rose-50 p-6 text-center">
          <ShieldAlert className="mx-auto mb-2 h-8 w-8 text-rose-500" />
          <p className="font-medium text-rose-700">This link is invalid or has expired.</p>
          <p className="mt-1 text-sm text-rose-600">
            Please contact us to get a fresh link to your statement.
          </p>
        </div>
      </PortalShell>
    );
  }

  let contractor = null;
  let errorMessage = null;
  try {
    contractor = await getContractorFullDetail(contractorName);
  } catch (err) {
    errorMessage = err.message;
  }

  if (errorMessage) {
    return (
      <PortalShell>
        <ErrorState message={errorMessage} />
      </PortalShell>
    );
  }

  if (!contractor) {
    return (
      <PortalShell>
        <ErrorState message="We couldn't find your account. Please contact us." />
      </PortalShell>
    );
  }

  const ledger = buildContractorLedger(contractor.projects);

  return (
    <PortalShell>
      <div className="mb-6 flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-xl font-bold text-slate-900 sm:text-2xl">{contractor.name}</h1>
          <p className="mt-1 text-sm text-slate-500">
            {formatPhone(contractor.phone)} · {contractor.projectCount} project
            {contractor.projectCount !== 1 ? "s" : ""}
          </p>
          <div className="mt-2 flex flex-wrap items-center gap-1.5">
            {contractor.hold ? (
              <span className="inline-flex items-center gap-1 rounded-full bg-rose-100 px-2 py-0.5 text-xs font-medium text-rose-700">
                <PauseCircle className="h-3 w-3" /> Account on Hold
              </span>
            ) : null}
            {contractor.limitStatus === "over" ? (
              <span className="inline-flex items-center gap-1 rounded-full bg-rose-100 px-2 py-0.5 text-xs font-medium text-rose-700">
                <AlertTriangle className="h-3 w-3" /> Over Credit Limit
              </span>
            ) : contractor.limitStatus === "near" ? (
              <span className="inline-flex items-center gap-1 rounded-full bg-amber-100 px-2 py-0.5 text-xs font-medium text-amber-700">
                <AlertTriangle className="h-3 w-3" /> Approaching Credit Limit
              </span>
            ) : null}
          </div>
        </div>
        <a
          href={`/api/portal-statement/${encodeURIComponent(token)}`}
          className="inline-flex items-center gap-2 rounded-lg bg-indigo-600 px-3.5 py-2 text-sm font-medium text-white shadow-sm transition hover:bg-indigo-700"
        >
          <FileDown className="h-4 w-4" />
          Download Statement (PDF)
        </a>
      </div>

      <div className="mb-6 grid grid-cols-1 gap-3 sm:grid-cols-3">
        <StatCard label="Total Billed" value={formatCurrency(contractor.totalAmount)} icon={Wallet} />
        <StatCard
          label="Total Paid"
          value={formatCurrency(contractor.totalPayment)}
          tone="positive"
          icon={CheckCircle2}
        />
        <StatCard
          label="Balance Due"
          value={formatCurrency(contractor.totalBalance)}
          tone={contractor.totalBalance > 0 ? "negative" : "neutral"}
          icon={AlertCircle}
        />
      </div>

      <div className="mb-6 rounded-xl border border-slate-200 bg-white shadow-sm">
        <div className="border-b border-slate-100 px-4 py-3">
          <h2 className="text-sm font-semibold text-slate-700">Projects</h2>
        </div>
        <div className="divide-y divide-slate-100">
          {contractor.projects.map((p) => (
            <div key={p.name} className="flex flex-wrap items-center justify-between gap-2 px-4 py-3 text-sm">
              <div>
                <p className="font-medium text-slate-800">{p.name}</p>
                <span
                  className={`mt-1 inline-block rounded-full px-2 py-0.5 text-xs font-medium ${
                    p.active ? "bg-emerald-100 text-emerald-700" : "bg-slate-100 text-slate-500"
                  }`}
                >
                  {p.active ? "Active" : "Closed"}
                </span>
              </div>
              <div className="text-right">
                <p className="text-slate-500">
                  Billed {formatCurrency(p.totalAmount)} · Paid {formatCurrency(p.totalPayment)}
                </p>
                <p className={`font-medium ${p.balance > 0 ? "text-rose-600" : "text-slate-700"}`}>
                  Balance {formatCurrency(p.balance)}
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="rounded-xl border border-slate-200 bg-white shadow-sm">
        <div className="border-b border-slate-100 px-4 py-3">
          <h2 className="text-sm font-semibold text-slate-700">Invoices &amp; Payments</h2>
        </div>
        {ledger.length === 0 ? (
          <p className="px-4 py-6 text-center text-sm text-slate-500">No invoices or payments yet.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-slate-200 text-sm">
              <thead className="bg-slate-50">
                <tr>
                  <th className="px-4 py-2 text-left font-medium text-slate-500 whitespace-nowrap">Date</th>
                  <th className="px-4 py-2 text-left font-medium text-slate-500 whitespace-nowrap">Project</th>
                  <th className="px-4 py-2 text-left font-medium text-slate-500">Description</th>
                  <th className="px-4 py-2 text-right font-medium text-slate-500 whitespace-nowrap">Debit</th>
                  <th className="px-4 py-2 text-right font-medium text-slate-500 whitespace-nowrap">Credit</th>
                  <th className="px-4 py-2 text-right font-medium text-slate-500 whitespace-nowrap">Balance</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {ledger.map((entry, i) => (
                  <tr key={i}>
                    <td className="px-4 py-2 whitespace-nowrap text-slate-500">{formatDate(entry.date)}</td>
                    <td className="px-4 py-2 whitespace-nowrap text-slate-500">{entry.project}</td>
                    <td className="px-4 py-2 text-slate-700">{entry.description}</td>
                    <td className="px-4 py-2 text-right whitespace-nowrap text-slate-700">
                      {entry.debit ? formatCurrency(entry.debit) : "-"}
                    </td>
                    <td className="px-4 py-2 text-right whitespace-nowrap text-emerald-600">
                      {entry.credit ? formatCurrency(entry.credit) : "-"}
                    </td>
                    <td className="px-4 py-2 text-right whitespace-nowrap font-medium text-slate-800">
                      {formatCurrency(entry.runningBalance)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <p className="mt-6 text-center text-xs text-slate-400">
        This is a private link generated for you. Please don&apos;t share it.
      </p>
    </PortalShell>
  );
}
