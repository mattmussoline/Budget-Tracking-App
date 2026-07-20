import { redirect } from "next/navigation";
import { selectFiscalYear } from "@/features/budget/fiscal-year-selection";
import { PlanningShell } from "@/features/planning/components/planning-shell";
import { RoadmapDashboard } from "@/features/planning/components/roadmap-dashboard";
import { normalizeMonthRange, parseMonthAnchor } from "@/features/planning/planning-model";
import type { OngoingSeries, RoadmapCategory, RoadmapItem, RoadmapStatus } from "@/features/planning/planning-types";
import { releaseDueScheduledRoadmapItems, syncReleasedRoadmapFormedLinks } from "@/features/planning/roadmap-auto-release";
import { requireInternalSession } from "@/lib/auth/internal-auth-server";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";

type RoadmapPageProps = {
  searchParams?: Promise<{
    fy?: string;
    start?: string;
    months?: string;
  }>;
};

export const metadata = {
  title: "Roadmap | Licensing Budget",
  description: "Saved content roadmap and ongoing series cadence"
};

export default async function RoadmapPage({ searchParams }: RoadmapPageProps) {
  const admin = createSupabaseAdminClient();

  if (!admin) {
    return (
      <PlanningShell
        title="Roadmap"
        eyebrow="Internal Licensing"
        description="Add Supabase env vars to save roadmap and ongoing series changes."
        activeSection="roadmap"
      >
        <RoadmapDashboard fiscalYearId="00000000-0000-0000-0000-000000000000" roadmapItems={[]} ongoingSeries={[]} categories={[]} fiscalYearStartMonth={parseMonthAnchor(null)} startMonth={parseMonthAnchor(null)} monthCount={6} isDemo />
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
  const startMonth = parseMonthAnchor(params?.start);
  const monthCount = normalizeMonthRange(params?.months);
  const activeFiscalYear = selectFiscalYear(fiscalYears ?? [], selectedFiscalYearId);

  if (!activeFiscalYear) {
    redirect("/dashboard");
  }

  await releaseDueScheduledRoadmapItems(admin, activeFiscalYear.id);
  await syncReleasedRoadmapFormedLinks(admin, activeFiscalYear.id);

  const [{ data: roadmapRows, error: roadmapError }, { data: seriesRows, error: seriesError }, { data: categoryRows, error: categoryError }] = await Promise.all([
    admin
      .from("roadmap_items")
      .select("id,title,provider,genre,format,featured_in_individual_marketing,release_month,status,budget_source,notes,category_id,clickup_task_id,clickup_task_url,clickup_synced_at,formed_url,formed_url_candidate")
      .eq("fiscal_year_id", activeFiscalYear.id)
      .order("release_month", { ascending: true })
      .order("created_at", { ascending: true }),
    admin
      .from("ongoing_series")
      .select("id,series,cadence,notes")
      .eq("fiscal_year_id", activeFiscalYear.id)
      .order("series", { ascending: true }),
    admin
      .from("roadmap_categories")
      .select("id,name,color_key,sort_order,is_active")
      .eq("fiscal_year_id", activeFiscalYear.id)
      .order("sort_order", { ascending: true })
  ]);

  if (roadmapError) {
    throw new Error(roadmapError.message);
  }

  if (seriesError) {
    throw new Error(seriesError.message);
  }
  if (categoryError) throw new Error(categoryError.message);

  const roadmapItems: RoadmapItem[] = (roadmapRows ?? []).map((item) => ({
    id: item.id,
    title: item.title,
    provider: item.provider,
    genre: item.genre,
    format: item.format,
    featuredInIndividualMarketing: item.featured_in_individual_marketing,
    releaseDate: item.release_month,
    status: (item.status === "ready" ? "in_progress" : item.status) as RoadmapStatus,
    budgetSource: item.budget_source ?? "misc_licensing",
    notes: item.notes,
    categoryId: item.category_id,
    clickupTaskId: item.clickup_task_id,
    clickupTaskUrl: item.clickup_task_url,
    clickupSyncedAt: item.clickup_synced_at,
    formedUrl: item.formed_url,
    formedUrlCandidate: item.formed_url_candidate
  }));

  const ongoingSeries: OngoingSeries[] = (seriesRows ?? []).map((item) => ({
    id: item.id,
    series: item.series,
    cadence: item.cadence,
    notes: item.notes
  }));
  const categories: RoadmapCategory[] = (categoryRows ?? []).map((category) => ({
    id: category.id,
    name: category.name,
    colorKey: category.color_key,
    sortOrder: category.sort_order,
    isActive: category.is_active
  }));

  return (
    <PlanningShell
      title="Roadmap"
      eyebrow="Internal Licensing"
      description="Plan upcoming releases and keep ongoing series cadence in shared saved data."
      activeSection="roadmap"
    >
      <RoadmapDashboard fiscalYearId={activeFiscalYear.id} roadmapItems={roadmapItems} ongoingSeries={ongoingSeries} categories={categories} fiscalYearStartMonth={getFiscalYearStartMonth(activeFiscalYear.fiscal_year)} startMonth={startMonth} monthCount={monthCount} />
    </PlanningShell>
  );
}

function getFiscalYearStartMonth(fiscalYear: number) {
  return `${fiscalYear - 1}-07`;
}
