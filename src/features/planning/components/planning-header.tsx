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
    <header className="relative h-80 overflow-visible rounded-soft bg-augustine-blue p-6 text-white md:h-80 md:p-8">
      <div className="pointer-events-none absolute inset-0 overflow-hidden rounded-soft" aria-hidden="true">
        <div className="absolute right-0 top-0 h-56 w-56 -translate-y-1/3 translate-x-8 rounded-full bg-formed-blue/20" />
        <div className="absolute bottom-0 right-24 h-32 w-32 translate-y-1/3 rounded-full bg-guild-gold/10" />
      </div>
      <div className="relative z-10 grid h-full min-w-0 grid-rows-[minmax(0,1fr)_auto] gap-5">
        <div className="grid min-w-0 gap-5 self-end md:grid-cols-[minmax(0,1fr)_minmax(24rem,32rem)]">
          <div className="min-w-0 self-end">
            <p className="mb-2 text-xs font-semibold uppercase tracking-[0.12em] text-soft-slate">{eyebrow}</p>
            <h1 className="font-display text-4xl leading-[1.05] md:text-6xl">{title}</h1>
          </div>
          <div className="grid min-w-0 max-w-xl self-end gap-4">
            <p className="text-base leading-7 text-soft-slate">{description}</p>
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
