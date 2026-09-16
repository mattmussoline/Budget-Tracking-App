import { BudgetDashboard } from "@/features/budget/components/budget-dashboard";
import { buildDashboardModel } from "@/features/budget/dashboard-model";
import { demoFiscalYear, demoLicenses, demoProviderColorOverrides } from "@/features/budget/demo-data";

export const metadata = {
  title: "Demo Licensing Summary | Licensing Budget",
  description: "Public sample licensing summary with fiscal-year health, payment timeline, provider mix, and dummy licensing budget data"
};

export default function DemoDashboardPage() {
  const model = buildDashboardModel({
    fiscalYear: demoFiscalYear.fiscal_year,
    fiscalYearStartMonth: demoFiscalYear.fiscal_year_start_month,
    budgetCents: demoFiscalYear.budget_cents,
    licenses: demoLicenses
  });

  return (
    <BudgetDashboard
      fiscalYear={demoFiscalYear}
      fiscalYears={[demoFiscalYear]}
      model={model}
      licenses={demoLicenses}
      providerColorOverrides={demoProviderColorOverrides}
      mode="demo"
    />
  );
}
