import { notFound } from "next/navigation";
import { headers } from "next/headers";
import { FileDown, Wallet, CheckCircle2, AlertCircle, PauseCircle, AlertTriangle } from "lucide-react";
import { getContractor, getProjectsForContractor } from "@/lib/sheets";
import { formatCurrency, formatPhone } from "@/lib/format";
import { generateContractorToken } from "@/lib/portalToken";
import Header from "@/components/Header";
import StatCard from "@/components/StatCard";
import ProjectsTable from "@/components/ProjectsTable";
import ErrorState from "@/components/ErrorState";
import EmptyState from "@/components/EmptyState";
import CopyPortalLinkButton from "@/components/CopyPortalLinkButton";

export const dynamic = "force-dynamic";

export default async function ContractorPage({ params }) {
  const contractorName = decodeURIComponent(params.name);

  let contractor = null;
  let projects = [];
  let errorMessage = null;

  try {
    [contractor, projects] = await Promise.all([
      getContractor(contractorName),
      getProjectsForContractor(contractorName),
    ]);
  } catch (err) {
    errorMessage = err.message;
  }

  if (errorMessage) {
    return (
      <div className="flex-1">
        <Header title="Payment Tracker" backHref="/" backLabel="All contractors" />
        <main className="max-w-6xl mx-auto px-4 py-8">
          <ErrorState message={errorMessage} />
        </main>
      </div>
    );
  }

  if (!contractor) {
    notFound();
  }

  const portalToken = generateContractorToken(contractor.name);
  let portalUrl = null;
  if (portalToken) {
    const headerList = headers();
    const host = headerList.get("host");
    const proto = headerList.get("x-forwarded-proto") || "https";
    portalUrl = `${proto}://${host}/portal/${encodeURIComponent(portalToken)}`;
  }

  return (
    <div className="flex-1">
      <Header
        title={contractor.name}
        subtitle={`${formatPhone(contractor.phone)} · ${contractor.projectCount} project${
          contractor.projectCount !== 1 ? "s" : ""
        }`}
        backHref="/"
        backLabel="All contractors"
        actions={
          <>
            {portalUrl && <CopyPortalLinkButton url={portalUrl} />}
            <a
              href={`/api/statement/contractor/${encodeURIComponent(contractor.name)}`}
              className="inline-flex items-center gap-2 rounded-lg bg-indigo-600 px-3.5 py-2 text-sm font-medium text-white shadow-sm transition hover:bg-indigo-700"
            >
              <FileDown className="h-4 w-4" />
              Download Statement (PDF)
            </a>
          </>
        }
      />
      <main className="max-w-6xl mx-auto px-4 py-6 sm:py-8">
        <div className="mb-4 flex flex-wrap items-center gap-1.5">
          {contractor.hold ? (
            <span className="inline-flex items-center gap-1 rounded-full bg-rose-100 px-2.5 py-1 text-xs font-medium text-rose-700">
              <PauseCircle className="h-3.5 w-3.5" /> Account on Hold
            </span>
          ) : null}
          {contractor.limitStatus === "over" ? (
            <span className="inline-flex items-center gap-1 rounded-full bg-rose-100 px-2.5 py-1 text-xs font-medium text-rose-700">
              <AlertTriangle className="h-3.5 w-3.5" /> Over Credit Limit ({formatCurrency(contractor.creditLimit)})
            </span>
          ) : contractor.limitStatus === "near" ? (
            <span className="inline-flex items-center gap-1 rounded-full bg-amber-100 px-2.5 py-1 text-xs font-medium text-amber-700">
              <AlertTriangle className="h-3.5 w-3.5" /> Approaching Credit Limit ({formatCurrency(contractor.creditLimit)})
            </span>
          ) : null}
        </div>
        <div className="mb-6 grid grid-cols-1 sm:grid-cols-3 gap-3">
          <StatCard label="Total Amount" value={formatCurrency(contractor.totalAmount)} icon={Wallet} />
          <StatCard
            label="Total Payment"
            value={formatCurrency(contractor.totalPayment)}
            tone="positive"
            icon={CheckCircle2}
          />
          <StatCard
            label="Balance"
            value={formatCurrency(contractor.totalBalance)}
            tone={contractor.totalBalance > 0 ? "negative" : "neutral"}
            icon={AlertCircle}
          />
        </div>

        {projects.length === 0 ? (
          <EmptyState message="No projects found for this contractor." />
        ) : (
          <ProjectsTable projects={projects} />
        )}
      </main>
    </div>
  );
}
