"use client";

import type { ReactNode } from "react";
import { cn } from "@/components/ui/soft-surface";
import type { buildMinutesByBudgetSourceSummary } from "@/features/budget/budget-source";
import { TONE_CLASSES, TONE_SWATCH_CLASSES, type PlanningTone } from "../planning-constants";
import { formatRoadmapDate } from "../planning-model";
import type { RoadmapCategory } from "../planning-types";

type RoadmapRailProps = {
  minutes: ReturnType<typeof buildMinutesByBudgetSourceSummary>;
  categories: RoadmapCategory[];
  categoryCounts: Map<string, number>;
  activeCategoryId: string | null;
  onToggleCategory: (category: RoadmapCategory) => void;
  hasFilter: boolean;
  onClearFilter: () => void;
  nextRelease: { id: string; title: string; date: string } | null;
  onOpenNextRelease: (id: string) => void;
  stats: { released: number; inProgress: number; needsDate: number; backlog: number };
  onJumpToBacklog: () => void;
  /** The "Manage key" text link, rendered directly under the category key. */
  manageKey?: ReactNode;
  actions?: ReactNode;
};

export function RoadmapRail({
  minutes,
  categories,
  categoryCounts,
  activeCategoryId,
  onToggleCategory,
  hasFilter,
  onClearFilter,
  nextRelease,
  onOpenNextRelease,
  stats,
  onJumpToBacklog,
  manageKey,
  actions
}: RoadmapRailProps) {
  const totalMinutes = minutes.reduce((sum, line) => sum + line.minutes, 0);
  const topLine = Math.max(...minutes.map((line) => line.minutes), 1);

  return (
    <aside
      data-testid="roadmap-rail"
      className="roadmap-scroll grid content-start gap-6 border-r border-hairline bg-panel-warm px-6 py-6 xl:sticky xl:top-[62px] xl:max-h-[calc(100vh-62px)] xl:overflow-y-auto"
    >
      {nextRelease ? (
        <button
          type="button"
          onClick={() => onOpenNextRelease(nextRelease.id)}
          aria-label={`Open ${nextRelease.title}`}
          className="grid gap-1 border border-formed-blue-border bg-formed-blue-soft px-3.5 py-3 text-left transition-colors hover:border-formed-blue"
        >
          <span className="text-[10px] font-semibold uppercase tracking-[0.09em] text-formed-blue">Next up</span>
          <span className="text-sm font-semibold leading-snug">{nextRelease.title}</span>
          <span className="text-xs text-muted">{formatRoadmapDate(nextRelease.date)}</span>
        </button>
      ) : null}

      <section className="grid gap-3">
        <RailLabel>Minutes by budget line</RailLabel>
        <div className="grid gap-3">
          {minutes.map((line) => (
            <div key={line.source} className="grid gap-1.5">
              <div className="flex items-baseline justify-between gap-2">
                <span className="text-[13px] font-semibold">{line.label}</span>
                <span className="font-display text-[21px] leading-none text-deep-teal">{line.minutes.toLocaleString()}</span>
              </div>
              <div className="h-[3px] bg-tone-slate-bg" role="img" aria-label={`${line.label}: ${line.minutes} minutes`}>
                <div className="h-[3px] bg-deep-teal" style={{ width: `${Math.round((line.minutes / topLine) * 100)}%` }} />
              </div>
            </div>
          ))}
        </div>
        <div className="flex items-baseline justify-between gap-2 border-t border-hairline pt-3">
          <span className="text-[13px] font-bold">Total secured</span>
          <span className="font-display text-[26px] leading-none text-deep-teal">{totalMinutes.toLocaleString()}</span>
        </div>
      </section>

      <section className="grid gap-2" aria-label="Roadmap filters">
        <div className="flex items-center justify-between gap-2">
          <RailLabel>Key — click to filter</RailLabel>
          {hasFilter ? (
            <button type="button" onClick={onClearFilter} className="text-[11px] font-semibold text-formed-blue transition-colors hover:text-formed-blue-hover">
              Clear
            </button>
          ) : null}
        </div>
        {categories.map((category) => {
          const tone = (category.colorKey in TONE_CLASSES ? category.colorKey : "slate") as PlanningTone;
          const isActive = activeCategoryId === category.id;
          return (
            <button
              key={category.id}
              type="button"
              aria-pressed={isActive}
              aria-label={isActive ? `Clear ${category.name} filter` : `Filter ${category.name}`}
              onClick={() => onToggleCategory(category)}
              className={cn(
                "flex w-full items-center gap-3 border px-3 py-2.5 text-left transition-colors",
                isActive ? cn(TONE_CLASSES[tone].field, "border-current") : "border-hairline bg-panel hover:border-hairline-strong"
              )}
            >
              <span className={cn("h-2.5 w-2.5 shrink-0 rounded-full", TONE_SWATCH_CLASSES[tone])} />
              <span className="min-w-0 flex-1 text-[13.5px] font-semibold">{category.name}</span>
              <span className="text-xs font-semibold text-faint">{categoryCounts.get(category.id) ?? 0}</span>
            </button>
          );
        })}
        {manageKey ? <div className="pt-0.5">{manageKey}</div> : null}
      </section>

      <section className="grid gap-2.5">
        <RailLabel>Status</RailLabel>
        <div className="grid gap-2">
          <StatusRow tone="green" label="Already live" count={stats.released} />
          <StatusRow tone="purple" label="In progress" count={stats.inProgress} />
          <StatusRow tone="red" label="Need a date" count={stats.needsDate} />
          <button type="button" onClick={onJumpToBacklog} className="flex w-full items-center gap-3 text-left text-[13px]">
            <span className={cn("h-2 w-2 shrink-0 rounded-full", TONE_SWATCH_CLASSES.slate)} />
            <span className="flex-1 font-semibold text-formed-blue">Backlog</span>
            <b className="font-semibold">{stats.backlog}</b>
          </button>
        </div>
      </section>

      {actions ? <div className="grid gap-2.5 border-t border-hairline pt-5">{actions}</div> : null}
    </aside>
  );
}

function RailLabel({ children }: { children: ReactNode }) {
  return <span className="text-[10.5px] font-semibold uppercase tracking-[0.1em] text-faint">{children}</span>;
}

function StatusRow({ tone, label, count }: { tone: PlanningTone; label: string; count: number }) {
  return (
    <div className="flex items-center gap-3 text-[13px]">
      <span className={cn("h-2 w-2 shrink-0 rounded-full", TONE_SWATCH_CLASSES[tone])} />
      <span className="flex-1">{label}</span>
      <b className="font-semibold">{count}</b>
    </div>
  );
}
