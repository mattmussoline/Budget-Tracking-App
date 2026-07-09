import { BudgetDashboard } from "@/features/budget/components/budget-dashboard";
import { demoFiscalYear, demoLicenses } from "@/features/budget/demo-data";
import { buildNeedsAttentionItems } from "@/features/budget/attention-model";
import { buildBudgetSourceSummary } from "@/features/budget/budget-source";
import { buildDashboardModel } from "@/features/budget/dashboard-model";
import { selectFiscalYear } from "@/features/budget/fiscal-year-selection";
import type { ContentLicense, PaymentCadence } from "@/features/budget/budget-types";
import type { ProviderColorKey, ProviderColorOverrides } from "@/features/budget/provider-colors";
import type { ContentReviewItem, ReviewStatus, RoadmapItem, RoadmapStatus } from "@/features/planning/planning-types";
import { requireInternalSession } from "@/lib/auth/internal-auth-server";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";

type DashboardPageProps = {
  searchParams?: Promise<{
    fy?: string;
  }>;
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
      budgetSourceSummary={buildBudgetSourceSummary(demoLicenses)}
      />
    );
  }

  const sessionPromise = requireInternalSession();

  const [{ data: fiscalYears, error: fiscalYearsError }, session, params] = await Promise.all([
    admin
      .from("fiscal_years")
      .select("id,label,fiscal_year,fiscal_year_start_month,budget_cents,is_pinned")
      .order("fiscal_year", { ascending: false }),
    sessionPromise,
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

  const [
    { data: licenseRows, error: licensesError },
    { data: providerColorRows, error: providerColorError },
    { data: accessRows, error: accessError },
    { data: roadmapRows, error: roadmapError },
    { data: reviewRows, error: reviewError },
    { data: attentionDismissalRows, error: attentionDismissalError }
  ] = await Promise.all([
    admin
      .from("content_licenses")
      .select("id,title,provider,installment_cents,cadence,added_fiscal_month,budget_source,notes")
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
      .from("roadmap_items")
      .select("id,title,provider,release_month,status,budget_source,notes,category_id")
      .eq("fiscal_year_id", activeFiscalYear.id)
      .order("created_at", { ascending: true }),
    admin
      .from("content_review_items")
      .select("id,title,provider,genre,format,review_status,budget_source,notes,proposed_rate_cents,review_link,comparable_content")
      .eq("fiscal_year_id", activeFiscalYear.id)
      .order("created_at", { ascending: true }),
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
  if (roadmapError) {
    throw new Error(roadmapError.message);
  }
  if (reviewError) {
    throw new Error(reviewError.message);
  }
  if (attentionDismissalError) {
    throw new Error(attentionDismissalError.message);
  }

  const licenses: ContentLicense[] = (licenseRows ?? []).map((license) => ({
    id: license.id,
    title: license.title,
    provider: license.provider,
    installmentCents: license.installment_cents,
    cadence: license.cadence as PaymentCadence,
    addedFiscalMonth: license.added_fiscal_month,
    budgetSource: license.budget_source ?? "misc_licensing",
    notes: license.notes
  }));
  const providerColorOverrides: ProviderColorOverrides = Object.fromEntries(
    (providerColorRows ?? []).map((row) => [row.provider, row.color_key as ProviderColorKey])
  );
  const roadmapItems: RoadmapItem[] = (roadmapRows ?? []).map((item) => ({
    id: item.id,
    title: item.title,
    provider: item.provider,
    releaseDate: item.release_month,
    status: item.status as RoadmapStatus,
    budgetSource: item.budget_source ?? "misc_licensing",
    notes: item.notes,
    categoryId: item.category_id
  }));
  const reviewItems: ContentReviewItem[] = (reviewRows ?? []).map((item) => ({
    id: item.id,
    title: item.title,
    provider: item.provider,
    genre: item.genre,
    format: item.format,
    reviewStatus: item.review_status as ReviewStatus,
    budgetSource: item.budget_source ?? "misc_licensing",
    notes: item.notes,
    proposedRateCents: item.proposed_rate_cents,
    reviewLink: item.review_link,
    comparableContent: item.comparable_content
  }));

  const model = buildDashboardModel({
    fiscalYear: activeFiscalYear.fiscal_year,
    fiscalYearStartMonth: activeFiscalYear.fiscal_year_start_month,
    budgetCents: activeFiscalYear.budget_cents,
    licenses
  });
  const dismissedAttentionKeys = new Set((attentionDismissalRows ?? []).map((row) => row.attention_key));
  const needsAttention = buildNeedsAttentionItems({
    licenses,
    reviewItems,
    roadmapItems,
    remainingBudgetCents: model.remainingCents
  }).filter((item) => !dismissedAttentionKeys.has(item.id));
  const budgetSourceSummary = buildBudgetSourceSummary([...licenses, ...roadmapItems, ...reviewItems]);

  return (
    <BudgetDashboard
      fiscalYear={activeFiscalYear}
      fiscalYears={fiscalYears ?? []}
      model={model}
      licenses={licenses}
      providerColorOverrides={providerColorOverrides}
      mode="live"
      userEmail={session.email}
      allowedEmails={(accessRows ?? []).map((row) => row.email)}
      needsAttention={needsAttention}
      budgetSourceSummary={budgetSourceSummary}
    />
  );
}
