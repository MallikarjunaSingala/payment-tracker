import { notFound } from "next/navigation";
import { FileDown, Wallet, CheckCircle2, AlertCircle } from "lucide-react";
import { getProject } from "@/lib/sheets";
import { formatCurrency, formatPhone } from "@/lib/format";
import Header from "@/components/Header";
import StatCard from "@/components/StatCard";
import InvoiceTable from "@/components/InvoiceTable";
import PaymentTable from "@/components/PaymentTable";
import ErrorState from "@/components/ErrorState";

export const dynamic = "force-dynamic";

export default async function ProjectPage({ params }) {
  const projectName = decodeURIComponent(params.name);

  let project = null;
  let errorMessage = null;

  try {
    project = await getProject(projectName);
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

  if (!project) {
    notFound();
  }

  return (
    <div className="flex-1">
      <Header
        title={project.name}
        subtitle={`${project.contractor} · ${formatPhone(project.phone)}`}
        backHref={`/contractor/${encodeURIComponent(project.contractor)}`}
        backLabel={project.contractor}
        actions={
          <a
            href={`/api/statement/project/${encodeURIComponent(project.name)}`}
            className="inline-flex items-center gap-2 rounded-lg bg-indigo-600 px-3.5 py-2 text-sm font-medium text-white shadow-sm transition hover:bg-indigo-700"
          >
            <FileDown className="h-4 w-4" />
            Download Statement (PDF)
          </a>
        }
      />
      <main className="max-w-6xl mx-auto px-4 py-6 sm:py-8 space-y-8">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <StatCard label="Total Amount" value={formatCurrency(project.totalAmount)} icon={Wallet} />
          <StatCard
            label="Total Payment"
            value={formatCurrency(project.totalPayment)}
            tone="positive"
            icon={CheckCircle2}
          />
          <StatCard
            label="Balance"
            value={formatCurrency(project.balance)}
            tone={project.balance > 0 ? "negative" : "neutral"}
            icon={AlertCircle}
          />
        </div>

        {project.notes && (
          <p className="rounded-lg bg-amber-50 border border-amber-200 px-4 py-3 text-sm text-amber-800">
            {project.notes}
          </p>
        )}

        <section>
          <h2 className="mb-3 text-lg font-semibold text-slate-900">
            Invoices ({project.invoices.length})
          </h2>
          <InvoiceTable invoices={project.invoices} />
        </section>

        <section>
          <h2 className="mb-3 text-lg font-semibold text-slate-900">
            Payments ({project.payments.length})
          </h2>
          <PaymentTable payments={project.payments} />
        </section>
      </main>
    </div>
  );
}
