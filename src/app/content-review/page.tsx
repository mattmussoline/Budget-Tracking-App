import { redirect } from "next/navigation";
import { selectFiscalYear } from "@/features/budget/fiscal-year-selection";
import { ContentReviewDashboard } from "@/features/planning/components/content-review-dashboard";
import { PlanningShell } from "@/features/planning/components/planning-shell";
import type { ContentReviewItem, ReviewStatus } from "@/features/planning/planning-types";
import { requireInternalSession } from "@/lib/auth/internal-auth-server";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";

type ContentReviewPageProps = {
  searchParams?: Promise<{
    fy?: string;
  }>;
};

export const metadata = {
  title: "Content Review | Licensing Budget",
  description: "Saved content review queue"
};

export default async function ContentReviewPage({ searchParams }: ContentReviewPageProps) {
  const admin = createSupabaseAdminClient();

  if (!admin) {
    return (
      <PlanningShell
        title="Content Review"
        eyebrow="Internal Licensing"
        description="Add Supabase env vars to save content review changes."
        activeSection="content-review"
      >
        <ContentReviewDashboard fiscalYearId="00000000-0000-0000-0000-000000000000" items={[]} isDemo />
      </PlanningShell>
    );
  }

  const sessionPromise = requireInternalSession();
  const paramsPromise = searchParams;

  const [{ data: fiscalYears, error: fiscalYearsError }, params] = await Promise.all([
    admin
      .from("fiscal_years")
      .select("id,label,fiscal_year,is_pinned")
      .order("fiscal_year", { ascending: false }),
    paramsPromise,
    sessionPromise
  ]);

  if (fiscalYearsError) {
    throw new Error(fiscalYearsError.message);
  }

  const selectedFiscalYearId = params?.fy;
  const activeFiscalYear = selectFiscalYear(fiscalYears ?? [], selectedFiscalYearId);

  if (!activeFiscalYear) {
    redirect("/dashboard");
  }

  const [
    { data: reviewRows, error: reviewError },
    { data: roadmapProviderRows, error: roadmapProviderError }
  ] = await Promise.all([
    admin
      .from("content_review_items")
      .select("id,title,provider,genre,format,review_status,budget_source,notes,proposed_rate_cents,review_link,comparable_content,is_coproduction_opportunity")
      .eq("fiscal_year_id", activeFiscalYear.id)
      .order("created_at", { ascending: false }),
    admin
      .from("roadmap_items")
      .select("provider")
      .eq("fiscal_year_id", activeFiscalYear.id)
  ]);

  if (reviewError) {
    throw new Error(reviewError.message);
  }
  if (roadmapProviderError) {
    throw new Error(roadmapProviderError.message);
  }

  const items: ContentReviewItem[] = (reviewRows ?? []).map((item) => ({
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
    comparableContent: item.comparable_content,
    isCoproductionOpportunity: item.is_coproduction_opportunity
  }));
  const providerOptions = Array.from(new Set([
    ...(reviewRows ?? []).map((item) => item.provider).filter(Boolean),
    ...(roadmapProviderRows ?? []).map((item) => item.provider).filter(Boolean)
  ] as string[])).sort((a, b) => a.localeCompare(b));

  return (
    <PlanningShell
      title="Content Review"
      eyebrow="Internal Licensing"
      description="Track possible titles before they move to the roadmap or budget."
      activeSection="content-review"
    >
      <ContentReviewDashboard fiscalYearId={activeFiscalYear.id} items={items} providerOptions={providerOptions} />
    </PlanningShell>
  );
}
