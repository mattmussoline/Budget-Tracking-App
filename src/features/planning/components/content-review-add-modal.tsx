"use client";

import { X } from "lucide-react";
import { type KeyboardEvent, type MouseEvent, useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { budgetSourceOptions } from "@/features/budget/budget-source";
import { CONTENT_FORMATS, CONTENT_GENRES, REVIEW_STATUSES } from "../planning-constants";
import type { ReviewStatus } from "../planning-types";

export type ContentReviewAddFormValues = {
  title: string;
  provider: string;
  reviewStatus: ReviewStatus;
  genre: string;
  format: string;
  minutes: string;
  proposedRate: string;
  budgetSource: string;
  reviewLink: string;
  notes: string;
  isCoproductionOpportunity: boolean;
  addToPriorities: boolean;
};

const blankAddForm: ContentReviewAddFormValues = {
  title: "",
  provider: "",
  reviewStatus: "not_started",
  genre: "",
  format: "",
  minutes: "",
  proposedRate: "",
  budgetSource: "misc_licensing",
  reviewLink: "",
  notes: "",
  isCoproductionOpportunity: false,
  addToPriorities: false
};

type ContentReviewAddModalProps = {
  isSubmitting: boolean;
  onSubmit: (values: ContentReviewAddFormValues) => void;
  onClose: () => void;
};

const fieldLabelClass = "grid gap-1.5 text-xs font-semibold text-muted";
const fieldControlClass = "min-h-10 w-full border border-hairline bg-panel px-3 text-sm font-medium normal-case tracking-normal text-foreground outline-none focus:ring-2 focus:ring-formed-blue box-border";

/** "Add content": only the title is required — everything else can be filled in while it's screened. */
export function ContentReviewAddModal({ isSubmitting, onSubmit, onClose }: ContentReviewAddModalProps) {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const titleRef = useRef<HTMLInputElement>(null);
  const [values, setValues] = useState<ContentReviewAddFormValues>(blankAddForm);
  const [error, setError] = useState<string | null>(null);
  const titleId = "content-review-add-title";
  const statusLabel = REVIEW_STATUSES.find((option) => option.value === values.reviewStatus)?.label ?? "Not Started";

  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;
    if (typeof dialog.showModal === "function" && !dialog.open) dialog.showModal();
    else dialog.setAttribute("open", "");
    titleRef.current?.focus();
  }, []);

  function closeDialog() {
    const dialog = dialogRef.current;
    if (dialog?.open && typeof dialog.close === "function") dialog.close();
    else dialog?.removeAttribute("open");
    onClose();
  }

  function closeFromBackdrop(event: MouseEvent<HTMLDialogElement>) {
    if (event.target === event.currentTarget) closeDialog();
  }

  function closeFromEscape(event: KeyboardEvent<HTMLDialogElement>) {
    if (event.key !== "Escape") return;
    event.preventDefault();
    closeDialog();
  }

  function set<K extends keyof ContentReviewAddFormValues>(key: K, value: ContentReviewAddFormValues[K]) {
    setValues((current) => ({ ...current, [key]: value }));
  }

  function submit() {
    if (isSubmitting) return;
    if (!values.title.trim()) {
      setError("Add a title before saving.");
      return;
    }
    setError(null);
    onSubmit(values);
  }

  return createPortal(
    <dialog
      ref={dialogRef}
      open
      style={{ display: "block", visibility: "visible", animation: "fadein 150ms ease" }}
      aria-labelledby={titleId}
      onClick={closeFromBackdrop}
      onKeyDown={closeFromEscape}
      onClose={onClose}
      className="fixed left-1/2 top-1/2 z-[70] block max-h-[86vh] w-[calc(100%-2rem)] max-w-[720px] -translate-x-1/2 -translate-y-1/2 bg-panel p-0 text-foreground shadow-2xl backdrop:bg-augustine-blue/40"
    >
      <div className="flex max-h-[86vh] flex-col">
        <header className="shrink-0 border-b border-hairline p-6">
          <div className="flex items-start justify-between gap-4">
            <h2 id={titleId} className="font-display text-[28px] leading-tight">Add content</h2>
            <button type="button" onClick={closeDialog} aria-label="Close add content" className="p-1 text-muted transition hover:text-foreground">
              <X className="h-[17px] w-[17px]" aria-hidden="true" />
            </button>
          </div>
          <p className="mt-1 text-[12.5px] text-muted">Only the title is required — everything else can be filled in while you screen it.</p>
        </header>

        <div className="grid min-h-0 gap-[18px] overflow-y-auto px-[30px] py-[22px]">
          {error ? <p role="alert" className="text-sm font-bold text-danger">{error}</p> : null}

          <label className={fieldLabelClass}>
            Title
            <input ref={titleRef} value={values.title} onChange={(event) => set("title", event.target.value)} className={`${fieldControlClass} font-semibold`} />
          </label>

          <div className="grid gap-3" style={{ gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))" }}>
            <label className={fieldLabelClass}>
              Provider
              <input value={values.provider} onChange={(event) => set("provider", event.target.value)} className={fieldControlClass} />
            </label>
            <label className={fieldLabelClass}>
              Status
              <select value={values.reviewStatus} onChange={(event) => set("reviewStatus", event.target.value as ReviewStatus)} className={fieldControlClass}>
                {REVIEW_STATUSES.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}
              </select>
            </label>
          </div>

          <div className="grid gap-3" style={{ gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))" }}>
            <label className={fieldLabelClass}>
              Genre
              <select value={values.genre} onChange={(event) => set("genre", event.target.value)} className={fieldControlClass}>
                <option value="">Choose genre</option>
                {CONTENT_GENRES.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}
              </select>
            </label>
            <label className={fieldLabelClass}>
              Format
              <select value={values.format} onChange={(event) => set("format", event.target.value)} className={fieldControlClass}>
                <option value="">Choose format</option>
                {CONTENT_FORMATS.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}
              </select>
            </label>
            <label className={fieldLabelClass}>
              Minutes
              <input inputMode="numeric" value={values.minutes} onChange={(event) => set("minutes", event.target.value)} className={fieldControlClass} />
            </label>
          </div>

          <div className="grid gap-3" style={{ gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))" }}>
            <label className={fieldLabelClass}>
              Proposed rate
              <input inputMode="decimal" placeholder="$0.00" value={values.proposedRate} onChange={(event) => set("proposedRate", event.target.value)} className={fieldControlClass} />
            </label>
            <label className={fieldLabelClass}>
              Budget source
              <select value={values.budgetSource} onChange={(event) => set("budgetSource", event.target.value)} className={fieldControlClass}>
                {budgetSourceOptions.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}
              </select>
            </label>
          </div>

          <label className={fieldLabelClass}>
            Screener link
            <input type="url" value={values.reviewLink} onChange={(event) => set("reviewLink", event.target.value)} className={fieldControlClass} />
          </label>

          <label className={fieldLabelClass}>
            Notes
            <textarea rows={3} value={values.notes} onChange={(event) => set("notes", event.target.value)} className={`${fieldControlClass} min-h-20 resize-y py-2`} />
          </label>

          <div className="flex flex-wrap gap-2">
            <CheckboxButton
              label="Potential co-production"
              checked={values.isCoproductionOpportunity}
              onChange={(checked) => set("isCoproductionOpportunity", checked)}
            />
            <CheckboxButton
              label="Add to Priorities"
              checked={values.addToPriorities}
              onChange={(checked) => set("addToPriorities", checked)}
            />
          </div>
        </div>

        <footer className="flex shrink-0 items-center justify-end gap-2 border-t border-hairline bg-panel-warm p-4">
          <button type="button" onClick={closeDialog} className="px-5 py-3 text-sm font-semibold uppercase tracking-wide text-muted hover:bg-panel">Cancel</button>
          <button
            type="button"
            disabled={isSubmitting}
            onClick={submit}
            className="border border-formed-blue bg-formed-blue px-4 py-2.5 text-[13px] font-semibold text-white transition hover:border-formed-blue-hover hover:bg-formed-blue-hover disabled:opacity-60"
          >
            {isSubmitting ? "Adding..." : `Add to ${statusLabel}`}
          </button>
        </footer>
      </div>
    </dialog>,
    document.body
  );
}

function CheckboxButton({ label, checked, onChange }: { label: string; checked: boolean; onChange: (checked: boolean) => void }) {
  return (
    <label className="inline-flex min-h-9 w-fit items-center gap-2 border border-hairline bg-panel-warm px-3 text-xs font-semibold text-muted">
      <input type="checkbox" checked={checked} onChange={(event) => onChange(event.target.checked)} className="h-4 w-4 accent-formed-blue" />
      {label}
    </label>
  );
}
