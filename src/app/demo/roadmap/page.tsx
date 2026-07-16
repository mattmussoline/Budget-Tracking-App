import { demoRoadmapCategories, demoRoadmapItems, demoOngoingSeries } from "@/features/budget/demo-data";
import { PlanningShell } from "@/features/planning/components/planning-shell";
import { RoadmapDashboard } from "@/features/planning/components/roadmap-dashboard";
import { normalizeMonthRange, parseMonthAnchor } from "@/features/planning/planning-model";

type DemoRoadmapPageProps = {
  searchParams?: Promise<{
    start?: string;
    months?: string;
  }>;
};

export const metadata = {
  title: "Demo Roadmap | Licensing Budget",
  description: "Public sample roadmap with expandable summary rankings, genre and format fields, and licensing summary handoff controls"
};

export default async function DemoRoadmapPage({ searchParams }: DemoRoadmapPageProps) {
  const params = await searchParams;
  const startMonth = parseMonthAnchor(params?.start, new Date(2026, 6, 1));
  const monthCount = normalizeMonthRange(params?.months);

  return (
    <PlanningShell
      title="Roadmap Demo"
      eyebrow="Public Sample"
      description="Explore a fake content roadmap with expandable summary rankings for audiences, providers, genres, formats, plus Licensing Summary and ClickUp handoff controls."
      activeSection="roadmap"
      routePrefix="/demo"
    >
      <RoadmapDashboard
        fiscalYearId="demo-fy26"
        roadmapItems={demoRoadmapItems}
        ongoingSeries={demoOngoingSeries}
        categories={demoRoadmapCategories}
        fiscalYearStartMonth="2026-07"
        startMonth={startMonth}
        monthCount={monthCount}
        routeBasePath="/demo/roadmap"
        isDemo
      />
    </PlanningShell>
  );
}
