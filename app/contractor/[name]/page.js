import { notFound } from "next/navigation";
import { getContractor, getProjectsForContractor } from "@/lib/sheets";
import { formatCurrency, formatPhone } from "@/lib/format";
import Header from "@/components/Header";
import StatCard from "@/components/StatCard";
import ProjectCard from "@/components/ProjectCard";
import ErrorState from "@/components/ErrorState";
import EmptyState from "@/components/EmptyState";

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

  return (
    <div className="flex-1">
      <Header
        title={contractor.name}
        subtitle={`${formatPhone(contractor.phone)} · ${contractor.projectCount} project${
          contractor.projectCount !== 1 ? "s" : ""
        }`}
        backHref="/"
        backLabel="All contractors"
      />
      <main className="max-w-6xl mx-auto px-4 py-6 sm:py-8">
        <div className="mb-6 grid grid-cols-1 sm:grid-cols-3 gap-3">
          <StatCard label="Total Amount" value={formatCurrency(contractor.totalAmount)} />
          <StatCard
            label="Total Payment"
            value={formatCurrency(contractor.totalPayment)}
            tone="positive"
          />
          <StatCard
            label="Balance"
            value={formatCurrency(contractor.totalBalance)}
            tone={contractor.totalBalance > 0 ? "negative" : "neutral"}
          />
        </div>

        {projects.length === 0 ? (
          <EmptyState message="No projects found for this contractor." />
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {projects.map((p) => (
              <ProjectCard key={p.name} project={p} />
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
