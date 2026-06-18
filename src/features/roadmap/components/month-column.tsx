import { ReleaseCard } from "./release-card";
import type { RoadmapMonth } from "../roadmap-types";

type MonthColumnProps = {
  month: RoadmapMonth;
  isFiltered: boolean;
  onEditRelease: (monthId: string, releaseId: string) => void;
};

export function MonthColumn({ month, isFiltered, onEditRelease }: MonthColumnProps) {
  const visibleCount = month.releases.length;
  const launchLabel = isFiltered ? `${visibleCount} of ${month.launchCount} launches` : `${month.launchCount} launches`;

  return (
    <section className="min-w-[220px] rounded-lg bg-gray-100 p-2.5 md:min-w-[238px]">
      <header className="mb-2.5 rounded-lg bg-white p-3">
        <h3 className="font-display text-xl font-extrabold tracking-tight text-gray-950">{month.label}</h3>
        <p className="mt-1 text-[11px] font-extrabold uppercase tracking-wide text-gray-500">{launchLabel}</p>
      </header>
      <div className="grid gap-2.5">
        {month.releases.map((release) => (
          <ReleaseCard key={release.id} release={release} onEdit={() => onEditRelease(month.id, release.id)} />
        ))}
      </div>
    </section>
  );
}
