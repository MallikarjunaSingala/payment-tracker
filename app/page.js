import { Users, Wallet, CheckCircle2, AlertCircle } from "lucide-react";
import { getContractors } from "@/lib/sheets";
import { formatCurrency } from "@/lib/format";
import Header from "@/components/Header";
import StatCard from "@/components/StatCard";
import ContractorsTable from "@/components/ContractorsTable";
import ErrorState from "@/components/ErrorState";

export const dynamic = "force-dynamic";

export default async function DashboardPage() {
  let contractors = [];
  let errorMessage = null;

  try {
    contractors = await getContractors();
  } catch (err) {
    errorMessage = err.message;
  }

  if (errorMessage) {
    return (
      <div className="flex-1">
        <Header title="Dashboard" subtitle="Contractors overview" />
        <main className="max-w-6xl mx-auto px-4 py-8">
          <ErrorState message={errorMessage} />
        </main>
      </div>
    );
  }

  const totals = contractors.reduce(
    (acc, c) => {
      acc.totalAmount += c.totalAmount;
      acc.totalPayment += c.totalPayment;
      acc.totalBalance += c.totalBalance;
      if (c.activeProjectCount > 0) acc.activeContractors += 1;
      return acc;
    },
    { totalAmount: 0, totalPayment: 0, totalBalance: 0, activeContractors: 0 }
  );

  return (
    <div className="flex-1">
      <Header title="Dashboard" subtitle={`${contractors.length} contractors across all projects`} />
      <main className="max-w-6xl mx-auto px-4 py-6 sm:py-8">
        <div className="mb-6 grid grid-cols-2 sm:grid-cols-4 gap-3">
          <StatCard label="Contractors" value={contractors.length} icon={Users} />
          <StatCard label="Total Amount" value={formatCurrency(totals.totalAmount)} icon={Wallet} />
          <StatCard
            label="Total Paid"
            value={formatCurrency(totals.totalPayment)}
            tone="positive"
            icon={CheckCircle2}
          />
          <StatCard
            label="Outstanding Balance"
            value={formatCurrency(totals.totalBalance)}
            tone={totals.totalBalance > 0 ? "negative" : "neutral"}
            icon={AlertCircle}
          />
        </div>

        <ContractorsTable contractors={contractors} />
      </main>
    </div>
  );
}
