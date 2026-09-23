"use client";

import { PanelLeftClose, SlidersHorizontal, X } from "lucide-react";
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
  /** Wide screens only: the rail is hidden and the summary strip stands in for it. */
  collapsed: boolean;
  onCollapse: () => void;
  /** Below xl the rail is a slide-in drawer rather than a column. */
  drawerOpen: boolean;
  onCloseDrawer: () => void;
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
  actions,
  collapsed,
  onCollapse,
  drawerOpen,
  onCloseDrawer
}: RoadmapRailProps) {
  const totalMinutes = minutes.reduce((sum, line) => sum + line.minutes, 0);
  const topLine = Math.max(...minutes.map((line) => line.minutes), 1);

  return (<>
    {drawerOpen ? <div aria-hidden="true" onClick={onCloseDrawer} className="fixed inset-0 z-40 bg-black/30 xl:hidden" /> : null}
    <aside
      data-testid="roadmap-rail"
      aria-label="Roadmap overview"
      className={cn(
        // Below xl: an off-canvas drawer. At xl: the sticky left column it has always been.
        "roadmap-scroll fixed inset-y-0 left-0 z-50 grid w-[320px] max-w-[85vw] content-start gap-6 overflow-y-auto border-r border-hairline bg-panel-warm px-6 py-6 shadow-2xl transition-[transform,visibility] duration-200",
        drawerOpen ? "visible translate-x-0" : "invisible -translate-x-full",
        "xl:visible xl:sticky xl:top-[62px] xl:z-auto xl:max-h-[calc(100vh-62px)] xl:w-auto xl:max-w-none xl:translate-x-0 xl:shadow-none xl:transition-none",
        collapsed && "xl:hidden"
      )}
    >
      <div className="-mb-2 flex items-center justify-between gap-2">
        <RailLabel>Overview</RailLabel>
        <button type="button" onClick={onCloseDrawer} aria-label="Close overview" className="p-1 text-muted transition-colors hover:text-foreground xl:hidden">
          <X className="h-4 w-4" aria-hidden="true" />
        </button>
        <button type="button" onClick={onCollapse} aria-label="Hide overview" title="Hide overview" className="hidden p-1 text-muted transition-colors hover:text-foreground xl:inline-flex">
          <PanelLeftClose className="h-4 w-4" aria-hidden="true" />
        </button>
      </div>

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
  </>);
}

type RoadmapRailStripProps = {
  nextRelease: { id: string; title: string; date: string } | null;
  onOpenNextRelease: (id: string) => void;
  totalMinutes: number;
  filterLabel: string;
  onClearFilter: () => void;
  onOpenRail: () => void;
  /** At xl the strip only shows while the rail is collapsed; below xl it always stands in for the rail. */
  railCollapsed: boolean;
};

/** One-line stand-in for the rail: the next release and total minutes stay in view, the rest is one click away. */
export function RoadmapRailStrip({ nextRelease, onOpenNextRelease, totalMinutes, filterLabel, onClearFilter, onOpenRail, railCollapsed }: RoadmapRailStripProps) {
  return (
    <div
      data-testid="roadmap-rail-strip"
      className={cn("flex flex-wrap items-center gap-x-5 gap-y-2 border-b border-hairline bg-panel-warm px-6 py-2.5 text-[13px] md:px-8", !railCollapsed && "xl:hidden")}
    >
      {nextRelease ? (
        <button type="button" onClick={() => onOpenNextRelease(nextRelease.id)} aria-label={`Open next up: ${nextRelease.title}`} className="flex min-w-0 items-baseline gap-2 text-left">
          <span className="text-[10px] font-semibold uppercase tracking-[0.09em] text-formed-blue">Next up</span>
          <span className="truncate font-semibold hover:text-formed-blue">{nextRelease.title}</span>
          <span className="shrink-0 text-xs text-muted">{formatRoadmapDate(nextRelease.date)}</span>
        </button>
      ) : null}
      <span className="flex items-baseline gap-1.5">
        <span className="font-display text-[19px] leading-none text-deep-teal">{totalMinutes.toLocaleString()}</span>
        <span className="text-muted">min secured</span>
      </span>
      {filterLabel ? (
        <span className="inline-flex items-center gap-1.5 border border-formed-blue-border bg-formed-blue-soft px-2 py-0.5 text-xs font-semibold text-formed-blue">
          {filterLabel}
          <button type="button" onClick={onClearFilter} aria-label="Clear filter" className="hover:text-formed-blue-hover">
            <X className="h-3 w-3" aria-hidden="true" />
          </button>
        </span>
      ) : null}
      <button
        type="button"
        onClick={onOpenRail}
        className="ml-auto inline-flex items-center gap-1.5 border border-hairline-strong bg-panel px-3 py-1.5 text-[12.5px] font-semibold transition-colors hover:border-formed-blue hover:text-formed-blue"
      >
        <SlidersHorizontal className="h-3.5 w-3.5" aria-hidden="true" />
        Filters &amp; details
      </button>
    </div>
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
