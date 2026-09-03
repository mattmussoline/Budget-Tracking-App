"use client";

import { Info } from "lucide-react";
import { useState } from "react";
import { cn } from "@/components/ui/soft-surface";
import { TONE_CLASSES } from "@/features/planning/planning-constants";
import {
  GRADE_TIER_TONE,
  LIKELIHOOD_RUBRIC,
  SCORE_RUBRIC,
  type GradedOpportunity,
  type ScoreRubricBand
} from "../coproduction-model";

type RubricCardProps = {
  id: string;
  question: string;
  bands: ScoreRubricBand[];
};

function RubricCard({ id, question, bands }: RubricCardProps) {
  return (
    <div id={id} className="grid gap-2 rounded-md bg-formed-blue-soft p-3 text-xs font-medium leading-relaxed text-foreground ring-1 ring-formed-blue-border">
      <p className="font-bold">{question}</p>
      <dl className="grid gap-1">
        {bands.map((band) => (
          <div key={band.range} className="grid grid-cols-[4.25rem_minmax(0,1fr)] gap-2">
            <dt className="text-[10px] font-semibold tracking-wide text-formed-blue tabular-nums">{band.range}</dt>
            <dd>{band.standard}</dd>
          </div>
        ))}
      </dl>
    </div>
  );
}

type RubricToggleProps = {
  isOpen: boolean;
  controls: string;
  label: string;
  onToggle: () => void;
};

function RubricToggle({ isOpen, controls, label, onToggle }: RubricToggleProps) {
  return (
    <button
      type="button"
      onClick={onToggle}
      aria-expanded={isOpen}
      aria-controls={controls}
      aria-label={`What we evaluate for ${label}`}
      className={cn(
        "grid h-[18px] w-[18px] shrink-0 place-items-center rounded-full transition focus:outline-none focus-visible:ring-2 focus-visible:ring-formed-blue",
        isOpen ? "bg-formed-blue text-white" : "bg-panel-warm text-muted hover:bg-formed-blue-soft hover:text-formed-blue-hover"
      )}
    >
      <Info className="h-3 w-3" aria-hidden="true" />
    </button>
  );
}

type CoproductionScorecardProps = {
  opportunity: GradedOpportunity;
};

/**
 * The grade with its reasoning attached: every sub-score carries the sentence
 * that justifies it, and the info toggle beside each one opens the standard we
 * grade against, so a letter is never just an opinion.
 */
export function CoproductionScorecard({ opportunity }: CoproductionScorecardProps) {
  const [openRubrics, setOpenRubrics] = useState<string[]>([]);

  function toggleRubric(key: string) {
    setOpenRubrics((current) => current.includes(key) ? current.filter((entry) => entry !== key) : [...current, key]);
  }

  const gradeTone = TONE_CLASSES[GRADE_TIER_TONE[opportunity.tier]];
  const likelihoodKey = "likelihood";
  const likelihoodPanelId = `${opportunity.id}-likelihood-rubric`;

  return (
    <section className="grid content-start gap-4" aria-labelledby={`${opportunity.id}-rating-heading`}>
      <h3
        id={`${opportunity.id}-rating-heading`}
        className="flex items-baseline justify-between gap-3 text-xs font-semibold uppercase tracking-wide text-muted"
      >
        Opportunity rating
        <span className="text-[10px] font-semibold">Weighted roll-up</span>
      </h3>

      <div className="grid gap-5 rounded-lg bg-white p-5 shadow-sm ring-1 ring-hairline">
        {SCORE_RUBRIC.map(({ dimension, label, weight, question, bands }) => {
          const score = opportunity.scores[dimension];
          const panelId = `${opportunity.id}-${dimension}-rubric`;

          return (
            <div key={dimension} className="grid gap-1.5">
              <div className="flex items-center gap-2 text-sm font-bold">
                <span className="flex min-w-0 items-center gap-2">
                  {label}
                  <span className="rounded-full bg-panel-warm px-1.5 py-0.5 text-[9px] font-semibold uppercase tracking-wide text-muted">
                    {Math.round(weight * 100)}%
                  </span>
                  <RubricToggle
                    isOpen={openRubrics.includes(dimension)}
                    controls={panelId}
                    label={label}
                    onToggle={() => toggleRubric(dimension)}
                  />
                </span>
                <b className="ml-auto text-[15px] tabular-nums">{score.value}</b>
              </div>

              <div className="h-1.5 overflow-hidden rounded-full bg-panel-warm">
                <span className="block h-full rounded-full bg-formed-blue" style={{ width: `${score.value}%` }} />
              </div>

              <p className="text-xs font-medium leading-relaxed text-foreground">
                <span className="mr-1.5 text-[9px] font-semibold uppercase tracking-wide text-muted">Why</span>
                {score.rationale}
              </p>

              {openRubrics.includes(dimension) ? <RubricCard id={panelId} question={question} bands={bands} /> : null}
            </div>
          );
        })}

        <div className="flex items-center justify-between gap-4 border-t border-hairline pt-4">
          <div className="grid gap-0.5">
            <span className="text-[9px] font-semibold uppercase tracking-wider text-muted">Weighted score</span>
            <span className="font-display text-2xl tracking-tight tabular-nums">
              {opportunity.score.toFixed(1)}
              <small className="text-[13px] font-bold text-muted"> / 100</small>
            </span>
          </div>
          <div className={cn("grid h-14 w-14 place-items-center rounded-lg font-display text-2xl tracking-tighter", gradeTone.chip)}>
            {opportunity.letter}
            <small className="text-center text-[8px] font-semibold uppercase tracking-widest opacity-75">Rating</small>
          </div>
        </div>

        <p className="text-[11px] font-semibold leading-relaxed text-muted">
          Graded by <b className="font-semibold text-foreground">{opportunity.gradedBy}</b> on {opportunity.gradedAt}.
          Change any sub-score and the letter recomputes — no one sets the grade by hand.
        </p>
      </div>

      <div className="grid gap-2 rounded-lg bg-white p-4 shadow-sm ring-1 ring-hairline">
        <div className="flex items-center gap-2">
          <span className="text-[10px] font-semibold uppercase tracking-wider text-muted">Likelihood</span>
          <RubricToggle
            isOpen={openRubrics.includes(likelihoodKey)}
            controls={likelihoodPanelId}
            label="Likelihood"
            onToggle={() => toggleRubric(likelihoodKey)}
          />
          <b className="ml-auto text-lg font-semibold tabular-nums">{opportunity.likelihood}%</b>
        </div>

        <p className="text-xs font-medium leading-relaxed text-foreground">
          <span className="mr-1.5 text-[9px] font-semibold uppercase tracking-wide text-muted">Why</span>
          {opportunity.likelihoodRationale}
        </p>

        {openRubrics.includes(likelihoodKey) ? (
          <RubricCard id={likelihoodPanelId} question={LIKELIHOOD_RUBRIC.question} bands={LIKELIHOOD_RUBRIC.bands} />
        ) : null}
      </div>
    </section>
  );
}
