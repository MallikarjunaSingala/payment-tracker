import { getAnalyticsSnapshot } from "@/lib/sheets";
import {
  computeContractorHealth,
  computeAging,
  computeContractorAgingDetail,
  computeMonthlyCashFlow,
  computeCollectionsTrend,
  computeCollectionEstimates,
  buildRecommendations,
} from "@/lib/analytics";
import Header from "@/components/Header";
import ErrorState from "@/components/ErrorState";
import AnalyticsDashboard from "@/components/analytics/AnalyticsDashboard";

export const dynamic = "force-dynamic";

export default async function AnalyticsPage() {
  let snapshot = null;
  let errorMessage = null;

  try {
    snapshot = await getAnalyticsSnapshot();
  } catch (err) {
    errorMessage = err.message;
  }

  if (errorMessage) {
    return (
      <div className="flex-1">
        <Header title="Shop Analytics" backHref="/" backLabel="Dashboard" />
        <main className="max-w-6xl mx-auto px-4 py-8">
          <ErrorState message={errorMessage} />
        </main>
      </div>
    );
  }

  const { contractors, invoices, payments } = snapshot;

  const healthResults = computeContractorHealth(contractors, payments);
  const aging = computeAging(invoices, contractors);
  const agingDetail = computeContractorAgingDetail(invoices, contractors);
  const monthlyCashFlow = computeMonthlyCashFlow(invoices, payments, 12);
  const totalOutstanding = contractors.reduce((sum, c) => sum + c.totalBalance, 0);
  const collectionsTrend = computeCollectionsTrend(monthlyCashFlow, totalOutstanding);
  const collectionEstimates = computeCollectionEstimates(contractors, payments);
  const recommendations = buildRecommendations({ healthResults, aging, collectionEstimates });

  const kpis = {
    totalOutstanding,
    healthyCount: healthResults.filter((c) => c.healthLabel === "Healthy").length,
    watchCount: healthResults.filter((c) => c.healthLabel === "Watch").length,
    atRiskCount: healthResults.filter((c) => c.healthLabel === "At Risk").length,
  };

  return (
    <div className="flex-1">
      <Header
        title="Shop Analytics"
        subtitle="Forecasting, credit exposure, and healthy vs. at-risk contractors"
        backHref="/"
        backLabel="Dashboard"
      />
      <main className="max-w-6xl mx-auto px-4 py-6 sm:py-8">
        <AnalyticsDashboard
          kpis={kpis}
          recommendations={recommendations}
          monthlyCashFlow={monthlyCashFlow}
          collectionsTrend={collectionsTrend}
          aging={aging}
          agingDetail={agingDetail}
          healthResults={healthResults}
          collectionEstimates={collectionEstimates}
        />
      </main>
    </div>
  );
}
