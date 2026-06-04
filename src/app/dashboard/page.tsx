import { redirect } from "next/navigation";
import { BudgetDashboard } from "@/features/budget/components/budget-dashboard";
import { demoFiscalYear, demoLicenses } from "@/features/budget/demo-data";
import { buildDashboardModel } from "@/features/budget/dashboard-model";
import type { ContentLicense, PaymentCadence } from "@/features/budget/budget-types";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export default async function DashboardPage() {
  const supabase = await createSupabaseServerClient();

  if (!supabase) {
    const model = buildDashboardModel({
      fiscalYear: demoFiscalYear.fiscal_year,
      fiscalYearStartMonth: demoFiscalYear.fiscal_year_start_month,
      budgetCents: demoFiscalYear.budget_cents,
      licenses: demoLicenses
    });

    return (
      <BudgetDashboard
        fiscalYear={demoFiscalYear}
        model={model}
        licenses={demoLicenses}
        mode="demo"
      />
    );
  }

  const { data: userData } = await supabase.auth.getUser();

  if (!userData.user) {
    redirect("/login");
  }

  const { data: fiscalYears, error: fiscalYearsError } = await supabase
    .from("fiscal_years")
    .select("id,label,fiscal_year,fiscal_year_start_month,budget_cents")
    .order("fiscal_year", { ascending: false });

  if (fiscalYearsError) {
    throw new Error(fiscalYearsError.message);
  }

  const activeFiscalYear = fiscalYears?.[0] ?? null;

  if (!activeFiscalYear) {
    return <BudgetDashboard fiscalYear={null} model={null} licenses={[]} mode="live" />;
  }

  const { data: licenseRows, error: licensesError } = await supabase
    .from("content_licenses")
    .select("id,title,provider,installment_cents,cadence,added_fiscal_month,notes")
    .eq("fiscal_year_id", activeFiscalYear.id)
    .order("created_at", { ascending: true });

  if (licensesError) {
    throw new Error(licensesError.message);
  }

  const licenses: ContentLicense[] = (licenseRows ?? []).map((license) => ({
    id: license.id,
    title: license.title,
    provider: license.provider,
    installmentCents: license.installment_cents,
    cadence: license.cadence as PaymentCadence,
    addedFiscalMonth: license.added_fiscal_month,
    notes: license.notes
  }));

  const model = buildDashboardModel({
    fiscalYear: activeFiscalYear.fiscal_year,
    fiscalYearStartMonth: activeFiscalYear.fiscal_year_start_month,
    budgetCents: activeFiscalYear.budget_cents,
    licenses
  });

  return <BudgetDashboard fiscalYear={activeFiscalYear} model={model} licenses={licenses} mode="live" />;
}
