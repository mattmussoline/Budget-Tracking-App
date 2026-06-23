import { BudgetDashboard } from "@/features/budget/components/budget-dashboard";
import { demoFiscalYear, demoLicenses } from "@/features/budget/demo-data";
import { buildDashboardModel } from "@/features/budget/dashboard-model";
import type { ContentLicense, PaymentCadence } from "@/features/budget/budget-types";
import type { ProviderColorKey, ProviderColorOverrides } from "@/features/budget/provider-colors";
import { requireInternalSession } from "@/lib/auth/internal-auth-server";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";

type DashboardPageProps = {
  searchParams?: Promise<{
    fy?: string;
  }>;
};

export default async function DashboardPage({ searchParams }: DashboardPageProps) {
  const selectedFiscalYearId = (await searchParams)?.fy;
  const admin = createSupabaseAdminClient();

  if (!admin) {
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
        mode="demo"
      />
    );
  }

  const session = await requireInternalSession();

  const { data: fiscalYears, error: fiscalYearsError } = await admin
    .from("fiscal_years")
    .select("id,label,fiscal_year,fiscal_year_start_month,budget_cents")
    .order("fiscal_year", { ascending: false });

  if (fiscalYearsError) {
    throw new Error(fiscalYearsError.message);
  }

  const activeFiscalYear =
    fiscalYears?.find((fiscalYear) => fiscalYear.id === selectedFiscalYearId) ?? fiscalYears?.[0] ?? null;

  if (!activeFiscalYear) {
    return <BudgetDashboard fiscalYear={null} fiscalYears={[]} model={null} licenses={[]} mode="live" />;
  }

  const { data: licenseRows, error: licensesError } = await admin
    .from("content_licenses")
    .select("id,title,provider,installment_cents,cadence,added_fiscal_month,notes")
    .eq("fiscal_year_id", activeFiscalYear.id)
    .order("created_at", { ascending: true });

  if (licensesError) {
    throw new Error(licensesError.message);
  }

  const { data: providerColorRows, error: providerColorError } = await admin
    .from("provider_color_overrides")
    .select("provider,color_key")
    .eq("fiscal_year_id", activeFiscalYear.id);

  if (providerColorError) {
    throw new Error(providerColorError.message);
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
  const providerColorOverrides: ProviderColorOverrides = Object.fromEntries(
    (providerColorRows ?? []).map((row) => [row.provider, row.color_key as ProviderColorKey])
  );

  const model = buildDashboardModel({
    fiscalYear: activeFiscalYear.fiscal_year,
    fiscalYearStartMonth: activeFiscalYear.fiscal_year_start_month,
    budgetCents: activeFiscalYear.budget_cents,
    licenses
  });

  return (
    <BudgetDashboard
      fiscalYear={activeFiscalYear}
      fiscalYears={fiscalYears ?? []}
      model={model}
      licenses={licenses}
      providerColorOverrides={providerColorOverrides}
      mode="live"
      userEmail={session.email}
    />
  );
}
