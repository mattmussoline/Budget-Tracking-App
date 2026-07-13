import { demoContentReviewItems, demoRoadmapItems } from "@/features/budget/demo-data";
import { ContentReviewDashboard } from "@/features/planning/components/content-review-dashboard";
import { PlanningShell } from "@/features/planning/components/planning-shell";

export const metadata = {
  title: "Demo Content Review | Licensing Budget",
  description: "Public sample review queue with dummy content review data"
};

export default function DemoContentReviewPage() {
  const providerOptions = Array.from(new Set([
    ...demoContentReviewItems.map((item) => item.provider).filter(Boolean),
    ...demoRoadmapItems.map((item) => item.provider).filter(Boolean)
  ] as string[])).sort((a, b) => a.localeCompare(b));

  return (
    <PlanningShell
      title="Content Review Demo"
      eyebrow="Public Sample"
      description="Review fake titles, proposed rates, provider fields, approval states, and the handoff flow without exposing real partners."
      activeSection="content-review"
      routePrefix="/demo"
    >
      <ContentReviewDashboard
        fiscalYearId="demo-fy26"
        items={demoContentReviewItems}
        providerOptions={providerOptions}
        isDemo
      />
    </PlanningShell>
  );
}
