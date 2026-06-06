import type { RoadmapStat } from "../roadmap-types";

type RoadmapStatsProps = {
  stats: RoadmapStat[];
  fiscalYearLabel: string;
};

export function RoadmapStats({ stats, fiscalYearLabel }: RoadmapStatsProps) {
  return (
    <section className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4" aria-label={`${fiscalYearLabel} roadmap summary`}>
      {stats.map((stat) => (
        <article key={stat.label} className="rounded-lg bg-gray-100 p-4 transition-all duration-200 hover:scale-[1.01]">
          <div className="flex items-start justify-between gap-3">
            <p className={`font-display text-3xl font-extrabold leading-none tracking-tight ${stat.colorClass}`}>{stat.value}</p>
            <span className="rounded-md bg-white px-2 py-1 text-[10px] font-extrabold uppercase tracking-wide text-gray-500">{fiscalYearLabel}</span>
          </div>
          <p className="mt-3 text-xs font-extrabold uppercase tracking-wide text-gray-600">{stat.label}</p>
        </article>
      ))}
    </section>
  );
}
