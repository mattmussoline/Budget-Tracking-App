"use client";

import { Info } from "lucide-react";
import { cn } from "@/components/ui/soft-surface";
import type { ScoreRubricBand } from "../coproduction-model";

type RubricCardProps = {
  id: string;
  question: string;
  bands: ScoreRubricBand[];
};

/** The standard behind a score: the question it answers, and what each band of the 0–100 scale means. */
export function RubricCard({ id, question, bands }: RubricCardProps) {
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

export function RubricToggle({ isOpen, controls, label, onToggle }: RubricToggleProps) {
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
