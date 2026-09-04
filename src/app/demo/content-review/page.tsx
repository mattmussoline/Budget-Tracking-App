import { demoContentReviewItems, demoContentReviewUpdates, demoRoadmapItems } from "@/features/budget/demo-data";
import { ContentReviewDashboard } from "@/features/planning/components/content-review-dashboard";
import { PlanningShell } from "@/features/planning/components/planning-shell";
import { TopBarChip, TopBarDivider } from "@/features/planning/components/app-top-bar";

export const metadata = {
  title: "Demo Content Review | Licensing Budget",
  description: "Public sample review queue with dummy content review data, radar targets, and expandable status cards"
};

export default function DemoContentReviewPage() {
  const providerOptions = Array.from(new Set([
    ...demoContentReviewItems.map((item) => item.provider).filter(Boolean),
    ...demoRoadmapItems.map((item) => item.provider).filter(Boolean)
  ] as string[])).sort((a, b) => a.localeCompare(b));

  return (
    <PlanningShell
      activeSection="content-review"
      routePrefix="/demo"
      topBarRight={<>
        <TopBarChip>FY26</TopBarChip>
        <TopBarDivider />
        <span className="text-[13px] font-semibold text-formed-blue">Public demo. Sample data only.</span>
      </>}
    >
      <ContentReviewDashboard
        pageTitle="Content Review Demo"
        pageDescription="Review fake titles, proposed rates, provider fields, radar targets, approval states, and expandable status cards without exposing real partners."
        fiscalYearId="demo-fy26"
        items={demoContentReviewItems}
        providerOptions={providerOptions}
        updates={demoContentReviewUpdates}
        isDemo
      />
    </PlanningShell>
  );
}
