import { getAnalyticsSnapshot } from "@/lib/sheets";
import {
  computeContractorHealth,
  computeAging,
  computeCollectionEstimates,
  buildDailyFollowUpList,
} from "@/lib/analytics";
import Header from "@/components/Header";
import ErrorState from "@/components/ErrorState";
import FollowUpChecklist from "@/components/FollowUpChecklist";

export const dynamic = "force-dynamic";

export default async function FollowUpsPage() {
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
        <Header title="Daily Follow-Ups" backHref="/" backLabel="Dashboard" />
        <main className="max-w-4xl mx-auto px-4 py-8">
          <ErrorState message={errorMessage} />
        </main>
      </div>
    );
  }

  const { contractors, invoices, payments } = snapshot;
  const healthResults = computeContractorHealth(contractors, payments);
  const aging = computeAging(invoices, contractors);
  const collectionEstimates = computeCollectionEstimates(contractors, payments);
  const followUpList = buildDailyFollowUpList({ healthResults, aging, collectionEstimates });

  const today = new Date().toLocaleDateString("en-IN", {
    weekday: "long",
    day: "2-digit",
    month: "long",
    year: "numeric",
  });

  return (
    <div className="flex-1">
      <Header title="Daily Follow-Ups" subtitle={today} backHref="/" backLabel="Dashboard" />
      <main className="max-w-4xl mx-auto px-4 py-6 sm:py-8">
        <FollowUpChecklist items={followUpList} />
      </main>
    </div>
  );
}
