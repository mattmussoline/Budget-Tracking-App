"use client";

import { type FormEvent, useRef, useState } from "react";
import { Trash2 } from "lucide-react";
import { SoftButton } from "@/components/ui/soft-button";
import { SoftInput } from "@/components/ui/soft-input";
import { SoftSelect } from "@/components/ui/soft-select";
import { addCoproductionOpportunity, deleteCoproductionOpportunity, updateCoproductionOpportunity } from "../coproduction-actions";
import { SCORE_RUBRIC, STAGE_OPTIONS } from "../coproduction-model";
import type { CoproductionOpportunity } from "../coproduction-types";

type CoproductionFormProps = {
  fiscalYearId: string;
  opportunity?: CoproductionOpportunity;
  onSaved: (opportunity: CoproductionOpportunity) => void;
  onDeleted?: (opportunityId: string) => void;
};

const stageOptions = STAGE_OPTIONS.map((option) => ({ label: option.label, value: option.value }));

/** One field for each score dimension: the number that feeds the grade and the sentence that justifies it. */
function ScoreField({ idPrefix, dimension, label, defaultValue, defaultRationale }: { idPrefix: string; dimension: string; label: string; defaultValue: number; defaultRationale: string }) {
  const [value, setValue] = useState(defaultValue);

  return (
    <div className="grid gap-2 rounded-md bg-panel-warm p-3">
      <div className="flex items-center justify-between gap-3">
        <label className="text-xs font-semibold text-foreground" htmlFor={`${idPrefix}-${dimension}`}>{label}</label>
        <b className="text-sm tabular-nums">{value}</b>
      </div>
      <input
        id={`${idPrefix}-${dimension}`}
        name={`score${dimension.charAt(0).toUpperCase()}${dimension.slice(1)}`}
        type="range"
        min={0}
        max={100}
        value={value}
        onChange={(event) => setValue(Number(event.target.value))}
        className="accent-formed-blue"
      />
      <label className="grid gap-1 text-[11px] font-semibold text-muted" htmlFor={`${idPrefix}-${dimension}-rationale`}>
        Why
        <textarea
          id={`${idPrefix}-${dimension}-rationale`}
          name={`score${dimension.charAt(0).toUpperCase()}${dimension.slice(1)}Rationale`}
          defaultValue={defaultRationale}
          className="min-h-14 w-full resize-y rounded-md border border-hairline bg-white px-2.5 py-2 text-xs font-medium text-foreground focus:border-formed-blue"
        />
      </label>
    </div>
  );
}

export function CoproductionForm({ fiscalYearId, opportunity, onSaved, onDeleted }: CoproductionFormProps) {
  const formRef = useRef<HTMLFormElement>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const idPrefix = opportunity ? `edit-${opportunity.id}` : "add-coproduction";

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setMessage(null);
    setIsSaving(true);

    try {
      const formData = new FormData(event.currentTarget);
      const saved = opportunity ? await updateCoproductionOpportunity(formData) : await addCoproductionOpportunity(formData);
      onSaved(saved);
      setMessage(opportunity ? "Opportunity saved." : "Opportunity added.");
      if (!opportunity) formRef.current?.reset();
    } catch {
      setMessage("Could not save that opportunity.");
    } finally {
      setIsSaving(false);
    }
  }

  async function handleDelete() {
    if (!opportunity) return;
    if (!window.confirm(`Delete ${opportunity.title}? This cannot be undone.`)) return;

    const formData = new FormData();
    formData.set("opportunityId", opportunity.id);
    formData.set("fiscalYearId", fiscalYearId);

    setIsSaving(true);
    try {
      await deleteCoproductionOpportunity(formData);
      onDeleted?.(opportunity.id);
    } catch {
      setMessage("Could not delete that opportunity.");
      setIsSaving(false);
    }
  }

  return (
    <form ref={formRef} onSubmit={handleSubmit} className="grid gap-5 py-5">
      <input type="hidden" name="fiscalYearId" value={fiscalYearId} />
      {opportunity ? <input type="hidden" name="opportunityId" value={opportunity.id} /> : null}
      {message ? <p role="status" className="rounded-md bg-deep-teal-soft px-4 py-3 text-sm font-bold text-deep-teal">{message}</p> : null}

      <section className="grid gap-3">
        <div className="border-b border-hairline pb-2 text-sm font-semibold uppercase tracking-wide text-muted">Core details</div>
        <div className="grid gap-3 md:grid-cols-2">
          <SoftInput id={`${idPrefix}-title`} label="Title" name="title" defaultValue={opportunity?.title} required />
          <SoftInput id={`${idPrefix}-partner`} label="Partner" name="partner" defaultValue={opportunity?.partner} required />
          <SoftInput id={`${idPrefix}-format`} label="Format" name="format" defaultValue={opportunity?.format} placeholder="Docu-Series" />
          <SoftInput id={`${idPrefix}-genre`} label="Genre" name="genre" defaultValue={opportunity?.genre} placeholder="Scripture" />
          <SoftInput id={`${idPrefix}-episodes`} label="Episode order" name="episodes" defaultValue={opportunity?.episodes} placeholder="8 × 26 min" />
          <SoftSelect id={`${idPrefix}-stage`} label="Stage" name="stage" defaultValue={opportunity?.stage ?? "inbound"} options={stageOptions} />
        </div>
      </section>

      <section className="grid gap-3">
        <div className="border-b border-hairline pb-2 text-sm font-semibold uppercase tracking-wide text-muted">Deal terms</div>
        <div className="grid gap-3 md:grid-cols-2">
          <SoftInput id={`${idPrefix}-ask`} label="Asking price ($)" name="ask" type="number" min={0} step="1" defaultValue={opportunity ? opportunity.askCents / 100 : undefined} />
          <SoftInput id={`${idPrefix}-likelihood`} label="Likelihood (%)" name="likelihood" type="number" min={0} max={100} defaultValue={opportunity?.likelihood ?? 50} />
          <label className="grid gap-1.5 text-xs font-semibold text-muted md:col-span-2" htmlFor={`${idPrefix}-likelihood-rationale`}>
            Likelihood rationale
            <textarea
              id={`${idPrefix}-likelihood-rationale`}
              name="likelihoodRationale"
              defaultValue={opportunity?.likelihoodRationale}
              className="min-h-16 w-full resize-y rounded-lg border border-hairline bg-panel-warm px-3 py-2.5 text-sm font-normal text-foreground focus:border-formed-blue"
            />
          </label>
        </div>
      </section>

      <section className="grid gap-3">
        <div className="border-b border-hairline pb-2 text-sm font-semibold uppercase tracking-wide text-muted">Opportunity rating</div>
        <div className="grid gap-3 md:grid-cols-2">
          {SCORE_RUBRIC.map(({ dimension, label, weight }) => (
            <ScoreField
              key={dimension}
              idPrefix={idPrefix}
              dimension={dimension}
              label={`${label} (${Math.round(weight * 100)}%)`}
              defaultValue={opportunity?.scores[dimension].value ?? 50}
              defaultRationale={opportunity?.scores[dimension].rationale ?? ""}
            />
          ))}
        </div>
      </section>

      <section className="grid gap-3">
        <div className="border-b border-hairline pb-2 text-sm font-semibold uppercase tracking-wide text-muted">Notes</div>
        <label className="grid gap-1.5 text-xs font-semibold text-muted" htmlFor={`${idPrefix}-notes`}>
          Summary
          <textarea
            id={`${idPrefix}-notes`}
            name="notes"
            defaultValue={opportunity?.notes[0]?.kind === "paragraph" ? opportunity.notes[0].body : ""}
            className="min-h-24 w-full resize-y rounded-lg border border-hairline bg-panel-warm px-3 py-2.5 text-sm font-normal text-foreground focus:border-formed-blue"
          />
        </label>
      </section>

      <div className="flex flex-wrap items-center justify-between gap-3 border-t border-hairline pt-4">
        {opportunity ? (
          <SoftButton type="button" variant="danger" disabled={isSaving} onClick={handleDelete}>
            <Trash2 className="h-4 w-4" />Delete
          </SoftButton>
        ) : <span />}
        <SoftButton type="submit" variant="primary" disabled={isSaving}>
          {isSaving ? "Saving..." : opportunity ? "Save changes" : "Add opportunity"}
        </SoftButton>
      </div>
    </form>
  );
}
