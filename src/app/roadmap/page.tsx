import { redirect } from "next/navigation";
import { PlanningShell } from "@/features/planning/components/planning-shell";
import { RoadmapDashboard } from "@/features/planning/components/roadmap-dashboard";
import type { OngoingSeries, RoadmapItem, RoadmapStatus } from "@/features/planning/planning-types";
import { requireInternalSession } from "@/lib/auth/internal-auth-server";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";

type RoadmapPageProps = {
  searchParams?: Promise<{
    fy?: string;
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
      >
        <RoadmapDashboard fiscalYearId="00000000-0000-0000-0000-000000000000" roadmapItems={[]} ongoingSeries={[]} isDemo />
      </PlanningShell>
    );
  }

  await requireInternalSession();

  const selectedFiscalYearId = (await searchParams)?.fy;
  const { data: fiscalYears, error: fiscalYearsError } = await admin
    .from("fiscal_years")
    .select("id,label,fiscal_year")
    .order("fiscal_year", { ascending: false });

  if (fiscalYearsError) {
    throw new Error(fiscalYearsError.message);
  }

  const activeFiscalYear =
    fiscalYears?.find((fiscalYear) => fiscalYear.id === selectedFiscalYearId) ?? fiscalYears?.[0] ?? null;

  if (!activeFiscalYear) {
    redirect("/dashboard");
  }

  const [{ data: roadmapRows, error: roadmapError }, { data: seriesRows, error: seriesError }] = await Promise.all([
    admin
      .from("roadmap_items")
      .select("id,title,provider,release_month,status,notes")
      .eq("fiscal_year_id", activeFiscalYear.id)
      .order("release_month", { ascending: true })
      .order("created_at", { ascending: true }),
    admin
      .from("ongoing_series")
      .select("id,series,cadence,notes")
      .eq("fiscal_year_id", activeFiscalYear.id)
      .order("series", { ascending: true })
  ]);

  if (roadmapError) {
    throw new Error(roadmapError.message);
  }

  if (seriesError) {
    throw new Error(seriesError.message);
  }

  const roadmapItems: RoadmapItem[] = (roadmapRows ?? []).map((item) => ({
    id: item.id,
    title: item.title,
    provider: item.provider,
    releaseMonth: item.release_month,
    status: item.status as RoadmapStatus,
    notes: item.notes
  }));

  const ongoingSeries: OngoingSeries[] = (seriesRows ?? []).map((item) => ({
    id: item.id,
    series: item.series,
    cadence: item.cadence,
    notes: item.notes
  }));

  return (
    <PlanningShell
      title="Roadmap"
      eyebrow="Internal Licensing"
      description="Plan upcoming releases and keep ongoing series cadence in shared saved data."
      fiscalYearLabel={activeFiscalYear.label}
    >
      <RoadmapDashboard fiscalYearId={activeFiscalYear.id} roadmapItems={roadmapItems} ongoingSeries={ongoingSeries} />
    </PlanningShell>
  );
}
