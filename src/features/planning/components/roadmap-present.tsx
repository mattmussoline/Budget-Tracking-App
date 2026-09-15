"use client";

import { useEffect, useRef } from "react";
import { Star, X } from "lucide-react";
import { cn } from "@/components/ui/soft-surface";
import type { buildMinutesByBudgetSourceSummary } from "@/features/budget/budget-source";
import { ROADMAP_STATUS_META, TONE_BORDER_L_CLASSES, TONE_CLASSES, TONE_SWATCH_CLASSES, type PlanningTone } from "../planning-constants";
import { formatRoadmapDateShortLabel } from "../planning-model";
import type { RoadmapCategory, RoadmapItem } from "../planning-types";

export type PresentMonth = { key: string; label: string; items: RoadmapItem[] };

type RoadmapPresentProps = {
  fiscalYearLabel?: string;
  rangeLabel: string;
  months: PresentMonth[];
  /** Columns shown side by side; the design caps a 9- or 12-month window at six. */
  columns: number;
  minutes: ReturnType<typeof buildMinutesByBudgetSourceSummary>;
  categories: RoadmapCategory[];
  categoryMap: Map<string, RoadmapCategory>;
  stats: { total: number; released: number; inProgress: number; needsDate: number };
  onExit: () => void;
};

const toneOf = (category?: RoadmapCategory): PlanningTone =>
  (category?.colorKey && category.colorKey in TONE_CLASSES ? category.colorKey : "slate") as PlanningTone;

export function RoadmapPresent({ fiscalYearLabel, rangeLabel, months, columns, minutes, categories, categoryMap, stats, onExit }: RoadmapPresentProps) {
  const exitRef = useRef<HTMLButtonElement>(null);
  const totalMinutes = minutes.reduce((sum, line) => sum + line.minutes, 0);

  // Escape leaves the room-facing view without hunting for the button.
  useEffect(() => {
    exitRef.current?.focus();
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") onExit();
    };
    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, [onExit]);

  return (
    <div
      data-testid="roadmap-present"
      role="dialog"
      aria-modal="true"
      aria-label="Roadmap present mode"
      className="fixed inset-0 z-50 grid content-start gap-7 overflow-auto bg-augustine-blue px-12 pb-12 pt-10"
    >
      <header className="flex flex-wrap items-end justify-between gap-8">
        <div className="grid gap-2">
          <span className="text-[11px] font-semibold uppercase tracking-[0.14em] text-accent-light">
            {fiscalYearLabel ? `${fiscalYearLabel} · ` : ""}Content roadmap
          </span>
          <h1 className="font-display text-[clamp(2.5rem,5vw,58px)] leading-none text-white">{rangeLabel}</h1>
          <p className="text-[15px] text-white/60">
            {stats.total} {stats.total === 1 ? "title" : "titles"} · {stats.released} live · {stats.inProgress} in progress · {stats.needsDate} awaiting a date
          </p>
        </div>

        <div className="flex flex-wrap gap-px bg-white/15">
          {minutes.map((line) => (
            <div key={line.source} className="grid min-w-[128px] gap-1 bg-white/[0.06] px-5 py-4">
              <span className="text-[10px] font-semibold uppercase tracking-[0.08em] text-white/60">{line.label}</span>
              <span className="font-display text-4xl leading-none text-white">{line.minutes.toLocaleString()}</span>
            </div>
          ))}
          <div className="grid min-w-[128px] gap-1 bg-deep-teal px-5 py-4">
            <span className="text-[10px] font-semibold uppercase tracking-[0.08em] text-white/80">Total</span>
            <span className="font-display text-4xl leading-none text-white">{totalMinutes.toLocaleString()}</span>
          </div>
        </div>
      </header>

      <div className="grid gap-px bg-white/15" style={{ gridTemplateColumns: `repeat(${columns}, minmax(0, 1fr))` }}>
        {months.map((month) => (
          <div key={month.key} data-testid="roadmap-present-column" className="grid min-h-[380px] content-start gap-3 bg-white/[0.04] px-4 py-4">
            <div className="grid gap-1 border-b border-white/20 pb-2.5">
              <span className="font-display text-2xl leading-tight text-white">{month.label}</span>
              <span className="text-[11px] font-semibold text-white/50">
                {month.items.length} {month.items.length === 1 ? "release" : "releases"} · {month.items.reduce((sum, item) => sum + (Number(item.minutes) || 0), 0)} min
              </span>
            </div>
            {month.items.map((item) => {
              const tone = toneOf(item.categoryId ? categoryMap.get(item.categoryId) : undefined);
              const status = ROADMAP_STATUS_META[item.status] ?? ROADMAP_STATUS_META.planned;
              return (
                <div key={item.id} className={cn("grid gap-1.5 border-l-[3px] pl-3", TONE_BORDER_L_CLASSES[tone])}>
                  <span className="flex items-start gap-1.5">
                    <span className="min-w-0 flex-1 text-base font-semibold leading-tight text-white">{item.title}</span>
                    {item.featuredInIndividualMarketing ? <Star className="mt-1 h-3.5 w-3.5 shrink-0 fill-guild-gold text-guild-gold" aria-label="Individual marketing campaign" /> : null}
                  </span>
                  <span className="flex flex-wrap items-center gap-2">
                    <span className="text-xs text-white/70">{formatRoadmapDateShortLabel(item.releaseDate)}</span>
                    <span className={cn("h-1.5 w-1.5 rounded-full", TONE_SWATCH_CLASSES[status.tone])} />
                    <span className="text-[11px] text-white/55">{status.label}</span>
                  </span>
                </div>
              );
            })}
          </div>
        ))}
      </div>

      <footer className="flex flex-wrap items-center gap-5">
        {categories.map((category) => (
          <span key={category.id} className="inline-flex items-center gap-2 text-[13px] text-white/75">
            <span className={cn("h-2.5 w-2.5", TONE_SWATCH_CLASSES[toneOf(category)])} />
            {category.name}
          </span>
        ))}
        <span className="inline-flex items-center gap-2 text-[13px] text-white/75">
          <Star className="h-3.5 w-3.5 fill-guild-gold text-guild-gold" aria-hidden="true" />
          Individual marketing campaign
        </span>
        <button
          ref={exitRef}
          type="button"
          onClick={onExit}
          className="ml-auto inline-flex min-h-10 items-center gap-2 rounded-md border border-white/30 bg-white/10 px-4 py-2 text-[13px] font-semibold text-white transition-colors hover:bg-white/20"
        >
          <X className="h-4 w-4" aria-hidden="true" />
          Exit present mode
        </button>
      </footer>
    </div>
  );
}
