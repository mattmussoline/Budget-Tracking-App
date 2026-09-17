import { BudgetDashboard } from "@/features/budget/components/budget-dashboard";
import { demoFiscalYear, demoLicenses } from "@/features/budget/demo-data";
import { buildDashboardModel } from "@/features/budget/dashboard-model";
import { selectFiscalYear } from "@/features/budget/fiscal-year-selection";
import type { ContentLicense, PaymentCadence } from "@/features/budget/budget-types";
import type { ProviderColorKey, ProviderColorOverrides } from "@/features/budget/provider-colors";
import { releaseDueScheduledRoadmapItems, syncReleasedRoadmapFormedLinks } from "@/features/planning/roadmap-auto-release";
import { requireInternalSession } from "@/lib/auth/internal-auth-server";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";

type DashboardPageProps = {
  searchParams?: Promise<{
    fy?: string;
  }>;
};

export const metadata = {
  title: "Licensing Summary | Licensing Budget",
  description: "Summary of fiscal-year licensing spend, provider mix, cadence, budget sources, and attention items"
};

export default async function DashboardPage({ searchParams }: DashboardPageProps) {
  const paramsPromise = searchParams;
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

  // Resolve the session before any Supabase call. Racing them in one Promise.all
  // means a Supabase rejection can settle first and surface as a 500, swallowing
  // the signed-out redirect to /login. The check is local HMAC work, so awaiting
  // it up front costs no round trip.
  const session = await requireInternalSession();

  const [{ data: fiscalYears, error: fiscalYearsError }, params] = await Promise.all([
    admin
      .from("fiscal_years")
      .select("id,label,fiscal_year,fiscal_year_start_month,budget_cents,is_pinned")
      .order("fiscal_year", { ascending: false }),
    paramsPromise
  ]);

  if (fiscalYearsError) {
    throw new Error(fiscalYearsError.message);
  }

  const selectedFiscalYearId = params?.fy;
  const activeFiscalYear = selectFiscalYear(fiscalYears ?? [], selectedFiscalYearId);

  if (!activeFiscalYear) {
    return <BudgetDashboard fiscalYear={null} fiscalYears={[]} model={null} licenses={[]} mode="live" />;
  }

  await releaseDueScheduledRoadmapItems(admin, activeFiscalYear.id);
  await syncReleasedRoadmapFormedLinks(admin, activeFiscalYear.id);

  const [
    { data: licenseRows, error: licensesError },
    { data: providerColorRows, error: providerColorError },
    { data: accessRows, error: accessError },
    { data: attentionDismissalRows, error: attentionDismissalsError }
  ] = await Promise.all([
    admin
      .from("content_licenses")
      .select("id,title,provider,installment_cents,cadence,added_fiscal_month,budget_source,minutes,notes")
      .eq("fiscal_year_id", activeFiscalYear.id)
      .order("created_at", { ascending: true }),
    admin
      .from("provider_color_overrides")
      .select("provider,color_key")
      .eq("fiscal_year_id", activeFiscalYear.id),
    admin
      .from("app_access_invites")
      .select("email")
      .order("email", { ascending: true }),
    admin
      .from("attention_dismissals")
      .select("attention_key")
      .eq("fiscal_year_id", activeFiscalYear.id)
  ]);

  if (licensesError) {
    throw new Error(licensesError.message);
  }

  if (providerColorError) {
    throw new Error(providerColorError.message);
  }

  if (accessError) {
    throw new Error(accessError.message);
  }

  if (attentionDismissalsError) {
    throw new Error(attentionDismissalsError.message);
  }

  const licenses: ContentLicense[] = (licenseRows ?? []).map((license) => ({
    id: license.id,
    title: license.title,
    provider: license.provider,
    installmentCents: license.installment_cents,
    cadence: license.cadence as PaymentCadence,
    addedFiscalMonth: license.added_fiscal_month,
    budgetSource: license.budget_source ?? "misc_licensing",
    minutes: license.minutes,
    notes: license.notes
  }));
  const providerColorOverrides: ProviderColorOverrides = Object.fromEntries(
    (providerColorRows ?? []).map((row) => [row.provider, row.color_key as ProviderColorKey])
  );
  const dismissedAttentionKeys = new Set((attentionDismissalRows ?? []).map((row) => row.attention_key));

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
      dismissedAttentionKeys={dismissedAttentionKeys}
      mode="live"
      userEmail={session.email}
      allowedEmails={(accessRows ?? []).map((row) => row.email)}
    />
  );
}
