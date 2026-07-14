import type { ReactNode } from "react";
import { PlanningNavigation, type PlanningSection } from "./planning-navigation";

type PlanningHeaderProps = {
  title: string;
  eyebrow: string;
  description: string;
  activeSection: PlanningSection;
  routePrefix?: "" | "/demo";
  footer?: ReactNode;
};

export function PlanningHeader({ title, eyebrow, description, activeSection, routePrefix = "", footer }: PlanningHeaderProps) {
  return (
    <header className="relative h-80 overflow-visible rounded-lg bg-blue-500 p-6 text-white md:h-80 md:p-8">
      <div className="pointer-events-none absolute inset-0 overflow-hidden rounded-lg" aria-hidden="true">
        <div className="absolute right-0 top-0 h-48 w-48 -translate-y-1/2 rounded-full bg-white/10" />
        <div className="absolute bottom-6 right-28 h-20 w-20 rotate-12 bg-white/10" />
      </div>
      <div className="relative z-10 grid h-full min-w-0 grid-rows-[minmax(0,1fr)_auto] gap-5">
        <div className="grid min-w-0 gap-5 self-end md:grid-cols-[minmax(0,1fr)_minmax(24rem,32rem)]">
          <div className="min-w-0 self-end">
            <p className="mb-2 text-sm font-extrabold uppercase tracking-wide text-blue-100">{eyebrow}</p>
            <h1 className="font-display text-3xl font-extrabold tracking-tight md:text-5xl">{title}</h1>
          </div>
          <div className="grid min-w-0 max-w-xl self-end gap-4">
            <p className="text-base font-semibold leading-7 text-blue-50">{description}</p>
            <PlanningNavigation activeSection={activeSection} routePrefix={routePrefix} />
          </div>
        </div>
        <div className="h-20">
          {footer}
        </div>
      </div>
    </header>
  );
}
