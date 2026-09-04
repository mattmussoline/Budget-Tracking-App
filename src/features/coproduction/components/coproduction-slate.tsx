"use client";

import { Info, Search } from "lucide-react";
import { useMemo, useState } from "react";
import { cn } from "@/components/ui/soft-surface";
import {
  GRADE_TIER_ORDER,
  SLATE_SORTS,
  STAGE_OPTIONS,
  buildSlateView,
  emptySlateFilters,
  formatCompactCurrency,
  gradeSlate,
  summarizeSlate,
  type SlateFilters,
  type SlateSort
} from "../coproduction-model";
import type { CoproductionOpportunity, CoproductionStage, CoproductionUpdate } from "../coproduction-types";
import { CoproductionCard } from "./coproduction-card";
import { CoproductionDetailModal } from "./coproduction-detail-modal";
import { CoproductionForm } from "./coproduction-form";
import { CoproductionFormModal } from "./coproduction-form-modal";

const TIER_BAR_CLASS: Record<string, string> = {
  A: "bg-tone-green-line",
  B: "bg-tone-blue-line",
  C: "bg-tone-amber-line",
  D: "bg-tone-orange-line",
  F: "bg-tone-red-line"
};

type CoproductionSlateProps = {
  opportunities: CoproductionOpportunity[];
  fiscalYearId?: string;
  isDemo?: boolean;
};

/**
 * The co-production slate: summary tiles, the filter bar, and the card grid.
 * Clicking a card opens the detail as a pop-out over the slate, so the grid
 * behind keeps its position instead of reflowing around an expanded row.
 */
export function CoproductionSlate({ opportunities: initialOpportunities, fiscalYearId, isDemo }: CoproductionSlateProps) {
  const [opportunities, setOpportunities] = useState(initialOpportunities);
  const [filters, setFilters] = useState<SlateFilters>(emptySlateFilters);
  const [sort, setSort] = useState<SlateSort>("grade");
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [isReserveOpen, setIsReserveOpen] = useState(false);

  const graded = useMemo(() => gradeSlate(opportunities), [opportunities]);
  const totals = useMemo(() => summarizeSlate(graded), [graded]);
  const visible = useMemo(() => buildSlateView(graded, filters, sort), [graded, filters, sort]);
  const selected = graded.find((opportunity) => opportunity.id === selectedId) ?? null;
  const peakTier = Math.max(1, ...GRADE_TIER_ORDER.map((tier) => totals.tierCounts[tier]));

  function setStage(stage: CoproductionStage | "all") {
    setFilters((current) => ({ ...current, stage }));
  }

  function handleAdded(opportunity: CoproductionOpportunity) {
    setOpportunities((current) => [opportunity, ...current]);
  }

  function handleUpdated(opportunity: CoproductionOpportunity) {
    setOpportunities((current) => current.map((existing) => existing.id === opportunity.id ? { ...opportunity, updates: existing.updates } : existing));
  }

  function handleUpdatesChanged(opportunityId: string, updates: CoproductionUpdate[]) {
    setOpportunities((current) => current.map((existing) => existing.id === opportunityId ? { ...existing, updates } : existing));
  }

  function handleDeleted(opportunityId: string) {
    setOpportunities((current) => current.filter((existing) => existing.id !== opportunityId));
    setSelectedId((current) => current === opportunityId ? null : current);
  }

  return (
    <div className="grid gap-8">
      {fiscalYearId && !isDemo ? (
        <div className="flex justify-end">
          <CoproductionFormModal eyebrow="Co-Production" heading="Add opportunity" triggerLabel="Add opportunity">
            <CoproductionForm fiscalYearId={fiscalYearId} onSaved={handleAdded} />
          </CoproductionFormModal>
        </div>
      ) : null}

      <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4" aria-label="Pipeline summary">
        <div className="grid content-start gap-1.5 rounded-lg bg-white p-5 shadow-sm ring-1 ring-hairline">
          <span className="text-[10px] font-semibold uppercase tracking-wider text-muted">Live opportunities</span>
          <span className="font-display text-3xl tracking-tight tabular-nums">{totals.liveCount}</span>
          <span className="text-xs font-semibold leading-relaxed text-muted">
            {totals.passedCount} passed, kept for the record
          </span>
        </div>

        <div className="grid content-start gap-1.5 rounded-lg bg-white p-5 shadow-sm ring-1 ring-hairline">
          <span className="text-[10px] font-semibold uppercase tracking-wider text-muted">If we said yes to everything</span>
          <span className="font-display text-3xl tracking-tight tabular-nums">
            {formatCompactCurrency(totals.totalAskCents)}
          </span>
          <span className="text-xs font-semibold leading-relaxed text-muted">
            Every asking price added up, passed titles excluded
          </span>
        </div>

        <div className="grid content-start gap-1.5 rounded-lg bg-formed-blue-soft p-5 ring-1 ring-formed-blue-border">
          <div className="flex items-center gap-2">
            <span className="text-[10px] font-semibold uppercase tracking-wider text-muted">What to actually reserve</span>
            <button
              type="button"
              onClick={() => setIsReserveOpen((open) => !open)}
              aria-expanded={isReserveOpen}
              aria-controls="coproduction-reserve-explainer"
              aria-label="How the reserve figure is calculated"
              className={cn(
                "grid h-[18px] w-[18px] shrink-0 place-items-center rounded-full transition focus:outline-none focus-visible:ring-2 focus-visible:ring-formed-blue",
                isReserveOpen ? "bg-formed-blue text-white" : "bg-white text-muted hover:bg-formed-blue-soft hover:text-formed-blue-hover"
              )}
            >
              <Info className="h-3 w-3" aria-hidden="true" />
            </button>
          </div>
          <span className="font-display text-3xl tracking-tight text-formed-blue tabular-nums">
            {formatCompactCurrency(totals.expectedCents)}
          </span>
          <span className="text-xs font-semibold leading-relaxed text-muted">
            Each asking price × its likelihood, added up
          </span>
          {isReserveOpen ? (
            <div id="coproduction-reserve-explainer" className="mt-1 grid gap-2 rounded-md bg-white p-3 text-xs font-medium leading-relaxed text-foreground ring-1 ring-formed-blue-border">
              <p className="font-bold">Expected cost, not committed cost.</p>
              <p>
                We will not win every one of these, so reserving the full asking total would lock up money we never
                spend. Multiplying each asking price by its likelihood and adding the results gives a realistic
                number: a $1M title at 25% contributes $250,000 to the reserve.
              </p>
              <p>It is a planning figure for the budget line, never a number to quote to a partner.</p>
            </div>
          ) : null}
        </div>

        <div className="grid content-start gap-1.5 rounded-lg bg-white p-5 shadow-sm ring-1 ring-hairline">
          <span className="text-[10px] font-semibold uppercase tracking-wider text-muted">Grade spread</span>
          <div className="flex items-end gap-1.5 pt-1" role="img" aria-label={GRADE_TIER_ORDER.map((tier) => `${tier}: ${totals.tierCounts[tier]}`).join(", ")}>
            {GRADE_TIER_ORDER.map((tier) => {
              const count = totals.tierCounts[tier];
              return (
                <div key={tier} className="grid flex-1 justify-items-center gap-1.5">
                  <span
                    className={cn("w-full rounded-sm", count ? TIER_BAR_CLASS[tier] : "bg-hairline")}
                    style={{ height: `${Math.max(2.5 * (count / peakTier), 0.15)}rem` }}
                  />
                  <span className="text-[9px] font-semibold tracking-wide text-muted">{tier}</span>
                </div>
              );
            })}
          </div>
          <span className="text-xs font-semibold leading-relaxed text-muted">
            {totals.strongCount} of {graded.length} rated B− or better
          </span>
        </div>
      </section>

      <section className="grid gap-4 lg:grid-cols-[minmax(0,19rem)_minmax(0,1fr)_auto] lg:items-center lg:gap-5" aria-label="Slate controls">
        <label className="relative flex items-center">
          <Search className="pointer-events-none absolute left-3 h-4 w-4 text-muted" aria-hidden="true" />
          <input
            type="search"
            value={filters.query}
            onChange={(event) => setFilters((current) => ({ ...current, query: event.target.value }))}
            aria-label="Search opportunities"
            placeholder="Search title or partner"
            className="min-h-11 w-full rounded-md border-0 bg-panel-warm pl-9 pr-3 text-sm font-semibold outline-none focus:ring-2 focus:ring-formed-blue"
          />
        </label>

        <div className="flex flex-wrap gap-2" role="group" aria-label="Filter by stage">
          <button
            type="button"
            onClick={() => setStage("all")}
            aria-pressed={filters.stage === "all"}
            className={cn(
              "rounded-full px-3 py-1.5 text-[11px] font-semibold uppercase tracking-wide transition",
              filters.stage === "all" ? "bg-augustine-blue text-white" : "bg-panel-warm text-muted hover:bg-hairline hover:text-foreground"
            )}
          >
            All<span className="ml-1.5 opacity-70">{graded.length}</span>
          </button>

          {STAGE_OPTIONS.map((option) => (
            <button
              key={option.value}
              type="button"
              onClick={() => setStage(option.value)}
              aria-pressed={filters.stage === option.value}
              className={cn(
                "rounded-full px-3 py-1.5 text-[11px] font-semibold uppercase tracking-wide transition",
                filters.stage === option.value ? "bg-augustine-blue text-white" : "bg-panel-warm text-muted hover:bg-hairline hover:text-foreground"
              )}
            >
              {option.label}
              <span className="ml-1.5 opacity-70">
                {graded.filter((opportunity) => opportunity.stage === option.value).length}
              </span>
            </button>
          ))}
        </div>

        <label className="inline-flex items-center gap-2.5 text-[10px] font-semibold uppercase tracking-wider text-muted">
          Sort
          <select
            value={sort}
            onChange={(event) => setSort(event.target.value as SlateSort)}
            aria-label="Sort opportunities"
            className="min-h-10 rounded-md border-0 bg-panel-warm px-2.5 text-[13px] font-bold normal-case tracking-normal text-foreground outline-none focus:ring-2 focus:ring-formed-blue"
          >
            {SLATE_SORTS.map((option) => (
              <option key={option.value} value={option.value}>{option.label}</option>
            ))}
          </select>
        </label>
      </section>

      {visible.length === 0 ? (
        <p className="rounded-lg bg-panel-warm p-10 text-center font-bold text-muted">
          Nothing matches that filter. Clear the search or pick another stage.
        </p>
      ) : (
        <section className="grid items-start gap-6 md:grid-cols-2 xl:grid-cols-3" aria-label="Co-production slate">
          {visible.map((opportunity) => (
            <CoproductionCard
              key={opportunity.id}
              opportunity={opportunity}
              onOpen={() => setSelectedId(opportunity.id)}
            />
          ))}
        </section>
      )}

      {selected ? (
        <CoproductionDetailModal
          opportunity={selected}
          fiscalYearId={fiscalYearId}
          isDemo={isDemo}
          onClose={() => setSelectedId(null)}
          onUpdated={handleUpdated}
          onUpdatesChanged={handleUpdatesChanged}
          onDeleted={handleDeleted}
        />
      ) : null}
    </div>
  );
}
