import { redirect } from "next/navigation";
import { selectFiscalYear } from "@/features/budget/fiscal-year-selection";
import { ContentReviewDashboard } from "@/features/planning/components/content-review-dashboard";
import { PlanningShell } from "@/features/planning/components/planning-shell";
import { TopBarChip } from "@/features/planning/components/app-top-bar";
import type { ContentReviewGroupOrderRow, ContentReviewItem, ContentReviewUpdate, ReviewStatus } from "@/features/planning/planning-types";
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
      <PlanningShell activeSection="content-review">
        <ContentReviewDashboard pageDescription="Add Supabase env vars to save content review changes." fiscalYearId="00000000-0000-0000-0000-000000000000" items={[]} isDemo />
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

  // The recap panel offers 7, 14, and 30 day ranges, so one 30-day read covers
  // every range as well as the per-review log in the editor.
  const recapWindowStart = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString();

  const [
    { data: reviewRows, error: reviewError },
    { data: roadmapProviderRows, error: roadmapProviderError },
    { data: groupOrderRows },
    { data: updateRows }
  ] = await Promise.all([
    admin
      .from("content_review_items")
      .select("id,title,provider,genre,format,review_status,budget_source,notes,proposed_rate_cents,review_link,comparable_content,is_coproduction_opportunity,priority_rank")
      .eq("fiscal_year_id", activeFiscalYear.id)
      .order("priority_rank", { ascending: true, nullsFirst: false })
      .order("created_at", { ascending: false }),
    admin
      .from("roadmap_items")
      .select("provider")
      .eq("fiscal_year_id", activeFiscalYear.id),
    admin
      .from("content_review_group_order")
      .select("review_status,sort_order")
      .eq("fiscal_year_id", activeFiscalYear.id)
      .order("sort_order", { ascending: true }),
    admin
      .from("content_review_updates")
      .select("id,item_id,kind,body,from_status,to_status,author_email,created_at")
      .eq("fiscal_year_id", activeFiscalYear.id)
      .gte("created_at", recapWindowStart)
      .order("created_at", { ascending: false })
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
    isCoproductionOpportunity: item.is_coproduction_opportunity,
    priorityRank: item.priority_rank
  }));
  const groupOrder: ContentReviewGroupOrderRow[] = (groupOrderRows ?? []).map((row) => ({
    reviewStatus: row.review_status as ReviewStatus,
    sortOrder: row.sort_order
  }));
  const updates: ContentReviewUpdate[] = (updateRows ?? []).map((row) => ({
    id: row.id,
    itemId: row.item_id,
    kind: row.kind,
    body: row.body,
    fromStatus: row.from_status as ReviewStatus | null,
    toStatus: row.to_status as ReviewStatus | null,
    authorEmail: row.author_email,
    createdAt: row.created_at
  }));
  const providerOptions = Array.from(new Set([
    ...(reviewRows ?? []).map((item) => item.provider).filter(Boolean),
    ...(roadmapProviderRows ?? []).map((item) => item.provider).filter(Boolean)
  ] as string[])).sort((a, b) => a.localeCompare(b));

  return (
    <PlanningShell
      activeSection="content-review"
      topBarRight={<TopBarChip>FY{String(activeFiscalYear.fiscal_year).slice(-2)}</TopBarChip>}
    >
      <ContentReviewDashboard fiscalYearId={activeFiscalYear.id} items={items} providerOptions={providerOptions} groupOrder={groupOrder} updates={updates} />
    </PlanningShell>
  );
}
