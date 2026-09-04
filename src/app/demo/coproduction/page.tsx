import { CoproductionSlate } from "@/features/coproduction/components/coproduction-slate";
import { demoCoproductionOpportunities } from "@/features/coproduction/demo-coproduction";
import { PlanningShell } from "@/features/planning/components/planning-shell";

export const metadata = {
  title: "Demo Co-Production | Licensing Budget",
  description: "Public sample co-production slate with graded opportunities, asking prices, likelihood, and pop-out detail cards"
};

export default function DemoCoproductionPage() {
  return (
    <PlanningShell
      title="Co-Production Demo"
      description="Grade fake co-production opportunities on mission fit, audience, economics, partner strength, and deliverability, then open any card for the reasoning, update log, and deal metadata."
      activeSection="coproduction"
      routePrefix="/demo"
    >
      <CoproductionSlate opportunities={demoCoproductionOpportunities} isDemo />
    </PlanningShell>
  );
}
