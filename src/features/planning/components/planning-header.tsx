import { PlanningNavigation, type PlanningSection } from "./planning-navigation";

type PlanningHeaderProps = {
  title: string;
  eyebrow: string;
  description: string;
  activeSection: PlanningSection;
};

export function PlanningHeader({ title, eyebrow, description, activeSection }: PlanningHeaderProps) {
  return (
    <header className="relative h-64 overflow-hidden rounded-lg bg-blue-500 p-6 text-white md:h-60 md:p-8">
      <div className="absolute right-0 top-0 h-48 w-48 -translate-y-1/2 rounded-full bg-white/10" aria-hidden="true" />
      <div className="absolute bottom-6 right-28 h-20 w-20 rotate-12 bg-white/10" aria-hidden="true" />
      <div className="relative z-10 grid h-full min-w-0 gap-5 md:grid-cols-[minmax(0,1fr)_minmax(24rem,32rem)]">
        <div className="min-w-0 self-end">
          <p className="mb-2 text-sm font-extrabold uppercase tracking-wide text-blue-100">{eyebrow}</p>
          <h1 className="font-display text-3xl font-extrabold tracking-tight md:text-5xl">{title}</h1>
        </div>
        <div className="grid min-w-0 max-w-xl self-end gap-4">
          <p className="text-base font-semibold leading-7 text-blue-50">{description}</p>
          <PlanningNavigation activeSection={activeSection} />
        </div>
      </div>
    </header>
  );
}
