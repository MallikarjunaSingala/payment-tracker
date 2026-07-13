import { getContractors } from "@/lib/sheets";
import { formatCurrency } from "@/lib/format";
import Header from "@/components/Header";
import SearchBar from "@/components/SearchBar";
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
        <Header title="Payment Tracker" subtitle="Contractors overview" />
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
      return acc;
    },
    { totalAmount: 0, totalPayment: 0, totalBalance: 0 }
  );

  return (
    <div className="flex-1">
      <Header
        title="Payment Tracker"
        subtitle={`${contractors.length} contractors · Total ${formatCurrency(
          totals.totalAmount
        )} · Paid ${formatCurrency(totals.totalPayment)} · Balance ${formatCurrency(
          totals.totalBalance
        )}`}
      />
      <main className="max-w-6xl mx-auto px-4 py-6 sm:py-8">
        <SearchBar items={contractors} />
      </main>
    </div>
  );
}
