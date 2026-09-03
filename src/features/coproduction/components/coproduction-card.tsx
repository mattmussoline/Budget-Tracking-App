"use client";

import { ChevronRight } from "lucide-react";
import type { KeyboardEvent } from "react";
import { cn } from "@/components/ui/soft-surface";
import { formatRelativeTime } from "@/features/planning/content-review-activity";
import { TONE_CLASSES } from "@/features/planning/planning-constants";
import { formatCurrencyWholeDollars } from "@/lib/currency";
import {
  BENCHMARK_VERDICT_LABEL,
  GRADE_TIER_TONE,
  SCORE_RUBRIC,
  benchmarkVerdict,
  formatCompactCurrency,
  stageOption,
  type GradedOpportunity
} from "../coproduction-model";
import { LikelihoodDial } from "./likelihood-dial";
import { OpportunityArtPanel } from "./opportunity-art";

const verdictClass = {
  under: "text-tone-green-ink",
  at: "text-tone-amber-ink",
  over: "text-tone-orange-ink"
} as const;

function initials(name: string) {
  return name
    .split(/\s+/)
    .filter((word) => /[A-Za-z]/.test(word))
    .slice(0, 2)
    .map((word) => word.charAt(0).toUpperCase())
    .join("");
}

type CoproductionCardProps = {
  opportunity: GradedOpportunity;
  onOpen: () => void;
};

/**
 * One opportunity at a glance: the grade, the asking price against our
 * per-hour benchmark, the likelihood ring, and a comb of the five sub-scores so
 * a lopsided project reads as lopsided before anyone opens it.
 */
export function CoproductionCard({ opportunity, onOpen }: CoproductionCardProps) {
  const stage = stageOption(opportunity.stage);
  const gradeTone = TONE_CLASSES[GRADE_TIER_TONE[opportunity.tier]];
  const rate = opportunity.costPerHourCents;

  function openFromKeyboard(event: KeyboardEvent<HTMLDivElement>) {
    if (event.key !== "Enter" && event.key !== " ") return;
    event.preventDefault();
    onOpen();
  }

  return (
    <article
      data-testid={`coproduction-card-${opportunity.id}`}
      className={cn(
        "overflow-hidden rounded-lg border-l-4 bg-white shadow-sm ring-1 ring-hairline transition hover:shadow-md",
        stage.tone === "slate" ? "border-hairline-strong" : TONE_CLASSES[stage.tone].accent
      )}
    >
      <div
        role="button"
        tabIndex={0}
        aria-haspopup="dialog"
        onClick={onOpen}
        onKeyDown={openFromKeyboard}
        aria-label={`Open details for ${opportunity.title}`}
        className="group grid cursor-pointer text-left focus:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-formed-blue"
      >
        <OpportunityArtPanel
          art={opportunity.art}
          title={opportunity.title}
          isMuted={opportunity.stage === "passed"}
        />

        <div className="grid gap-4 p-5">
          <div className="flex items-start justify-between gap-4">
            <div className="grid min-w-0 gap-2">
              <div className="flex min-w-0 items-center gap-2">
                <span aria-hidden="true" className="grid h-7 w-7 shrink-0 place-items-center rounded-md bg-panel-warm text-[10px] font-semibold text-muted">
                  {initials(opportunity.partner)}
                </span>
                <span className="truncate text-xs font-semibold text-muted">{opportunity.partner}</span>
              </div>
              <span className={cn("justify-self-start rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide", TONE_CLASSES[stage.tone].chip)}>
                {stage.label}
              </span>
            </div>

            <div className={cn("grid h-14 w-14 shrink-0 place-items-center rounded-lg font-display text-[1.625rem] tracking-tighter", gradeTone.chip)}>
              {opportunity.letter}
              <small className="text-center text-[8px] font-semibold uppercase tracking-widest opacity-75">Rating</small>
            </div>
          </div>

          <div>
            <h3 className="font-display text-xl tracking-tight">{opportunity.title}</h3>
            <p className="mt-1 text-xs font-bold text-muted">
              {opportunity.format} · {opportunity.genre} · {opportunity.episodes}
            </p>
          </div>

          <div className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-5 border-y border-hairline py-4">
            <div className="grid gap-0.5">
              <span className="text-[9px] font-semibold uppercase tracking-wider text-muted">Asking price</span>
              <span className="font-display text-[1.625rem] leading-tight tracking-tight tabular-nums">
                {formatCurrencyWholeDollars(opportunity.askCents)}
              </span>
              {rate ? (
                <span className="text-[11px] font-bold text-muted tabular-nums">
                  <b className="font-semibold">{formatCompactCurrency(rate)}</b> per finished hour ·{" "}
                  <span className={verdictClass[benchmarkVerdict(rate)]}>{BENCHMARK_VERDICT_LABEL[benchmarkVerdict(rate)]}</span>
                </span>
              ) : null}
            </div>

            <LikelihoodDial value={opportunity.likelihood} />
          </div>

          <div className="grid gap-1.5">
            <div
              className="flex h-10 items-end gap-1"
              role="img"
              aria-label={`Sub-scores: ${SCORE_RUBRIC.map(({ dimension, label }) => `${label} ${opportunity.scores[dimension].value}`).join(", ")}`}
            >
              {SCORE_RUBRIC.map(({ dimension, label }, index) => (
                <div
                  key={dimension}
                  title={`${label}: ${opportunity.scores[dimension].value}`}
                  className="flex h-full flex-1 items-end overflow-hidden rounded-sm bg-panel-warm"
                >
                  <span
                    className={cn("block w-full rounded-sm", index === 0 ? "bg-formed-blue" : "bg-formed-blue")}
                    style={{ height: `${opportunity.scores[dimension].value}%` }}
                  />
                </div>
              ))}
            </div>
            <div className="flex justify-between gap-3 text-[9px] font-semibold uppercase tracking-wide text-muted">
              <span>Mission · Audience · Econ · Partner · Delivery</span>
              <span>
                <b className="text-foreground tabular-nums">{opportunity.score.toFixed(1)}</b>/100
              </span>
            </div>
          </div>

          <div className="flex items-center justify-between gap-3 text-[11px] font-bold text-muted">
            <span>
              Updated {formatRelativeTime(opportunity.updatedAt).toLowerCase()} · {opportunity.updates.length} log{" "}
              {opportunity.updates.length === 1 ? "entry" : "entries"}
            </span>
            <span className="inline-flex items-center gap-1 text-[10px] font-semibold uppercase tracking-wide text-formed-blue">
              Open details
              <ChevronRight className="h-3.5 w-3.5 transition group-hover:translate-x-0.5" aria-hidden="true" />
            </span>
          </div>
        </div>
      </div>
    </article>
  );
}
