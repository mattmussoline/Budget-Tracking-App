import type { ReactNode } from "react";
import { PlanningHeader } from "./planning-header";
import type { PlanningSection } from "./planning-navigation";

type PlanningShellProps = {
  title: string;
  eyebrow: string;
  description: string;
  activeSection: PlanningSection;
  children: ReactNode;
};

export function PlanningShell({ title, eyebrow, description, activeSection, children }: PlanningShellProps) {
  return (
    <main className="min-h-screen bg-white px-5 py-6 md:px-8 lg:px-10">
      <div className="mx-auto grid max-w-7xl gap-8">
        <PlanningHeader title={title} eyebrow={eyebrow} description={description} activeSection={activeSection} />
        {children}
      </div>
    </main>
  );
}
