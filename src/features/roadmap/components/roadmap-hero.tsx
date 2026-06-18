import { CalendarDays, Download, Plus } from "lucide-react";

type RoadmapHeroProps = {
  onAddRelease: () => void;
  viewMode: "board" | "timeline";
  onToggleView: () => void;
};

export function RoadmapHero({ onAddRelease, viewMode, onToggleView }: RoadmapHeroProps) {
  const buttonClass =
    "inline-flex min-h-10 items-center justify-center gap-2 rounded-md px-4 py-2 text-xs font-extrabold uppercase tracking-wide transition-all duration-200 hover:scale-[1.03] active:scale-[0.98]";

  return (
    <section className="relative overflow-hidden rounded-lg bg-blue-500 p-5 text-white md:p-7">
      <div className="absolute -right-20 top-0 h-20 w-56 rotate-6 bg-white/10" aria-hidden="true" />
      <div className="absolute bottom-0 right-56 hidden h-14 w-28 -rotate-12 bg-white/10 md:block" aria-hidden="true" />
      <div className="relative z-10 flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
        <div className="max-w-2xl">
          <h1 className="font-display text-3xl font-extrabold leading-none tracking-tight md:text-5xl">
            Roadmap Command Center
          </h1>
          <p className="mt-3 max-w-xl text-sm font-semibold leading-6 text-blue-50 md:text-base">
            Track Formed content releases, ongoing series, strategic needs, and upcoming launch timing in a cleaner monthly planning dashboard.
          </p>
        </div>
        <div className="flex flex-wrap gap-2 lg:min-w-[420px] lg:justify-end">
          <button type="button" className={`${buttonClass} bg-white text-blue-700 hover:bg-blue-50`} onClick={onAddRelease}>
            <Plus className="h-4 w-4" aria-hidden="true" />
            Add Release
          </button>
          <button
            type="button"
            className={`${buttonClass} border-2 border-white text-white hover:bg-white/15`}
            onClick={onToggleView}
            aria-pressed={viewMode === "timeline"}
          >
            <CalendarDays className="h-4 w-4" aria-hidden="true" />
            {viewMode === "timeline" ? "Board View" : "Timeline View"}
          </button>
          <button type="button" className={`${buttonClass} bg-gray-950 text-white hover:bg-gray-800`}>
            <Download className="h-4 w-4" aria-hidden="true" />
            Export
          </button>
        </div>
      </div>
    </section>
  );
}
