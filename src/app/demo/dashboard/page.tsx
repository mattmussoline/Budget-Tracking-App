import { buildNeedsAttentionItems } from "@/features/budget/attention-model";
import { buildBudgetSourceSummary } from "@/features/budget/budget-source";
import { BudgetDashboard } from "@/features/budget/components/budget-dashboard";
import { buildDashboardModel } from "@/features/budget/dashboard-model";
import {
  demoContentReviewItems,
  demoFiscalYear,
  demoLicenses,
  demoProviderColorOverrides,
  demoRoadmapItems
} from "@/features/budget/demo-data";

export const metadata = {
  title: "Demo Dashboard | Licensing Budget",
  description: "Public sample dashboard with popout metrics, provider mix, attention items, and dummy licensing budget data"
};

export default function DemoDashboardPage() {
  const model = buildDashboardModel({
    fiscalYear: demoFiscalYear.fiscal_year,
    fiscalYearStartMonth: demoFiscalYear.fiscal_year_start_month,
    budgetCents: demoFiscalYear.budget_cents,
    licenses: demoLicenses
  });
  const needsAttention = buildNeedsAttentionItems({
    licenses: demoLicenses,
    reviewItems: demoContentReviewItems,
    roadmapItems: demoRoadmapItems,
    remainingBudgetCents: model.remainingCents
  });
  const budgetSourceSummary = buildBudgetSourceSummary([
    ...demoLicenses,
    ...demoRoadmapItems,
    ...demoContentReviewItems
  ]);

  return (
    <BudgetDashboard
      fiscalYear={demoFiscalYear}
      fiscalYears={[demoFiscalYear]}
      model={model}
      licenses={demoLicenses}
      providerColorOverrides={demoProviderColorOverrides}
      mode="demo"
      needsAttention={needsAttention}
      budgetSourceSummary={budgetSourceSummary}
    />
  );
}
