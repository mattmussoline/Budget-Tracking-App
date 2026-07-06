import type { ReactNode } from "react";
import { PlanningNavigation, type PlanningSection } from "./planning-navigation";

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
        <header className="rounded-lg bg-blue-500 p-6 text-white md:p-8">
          <div className="flex flex-col gap-5 md:flex-row md:items-end md:justify-between">
            <div>
              <p className="mb-2 text-sm font-extrabold uppercase tracking-wide text-blue-100">{eyebrow}</p>
              <h1 className="font-display text-3xl font-extrabold tracking-tight md:text-5xl">{title}</h1>
            </div>
            <div className="grid max-w-xl gap-4">
              <p className="text-base font-semibold leading-7 text-blue-50">{description}</p>
              <PlanningNavigation activeSection={activeSection} />
            </div>
          </div>
        </header>
        {children}
      </div>
    </main>
  );
}
