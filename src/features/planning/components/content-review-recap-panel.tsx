"use client";

import { X } from "lucide-react";
import { type KeyboardEvent, type MouseEvent, useEffect, useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { cn } from "@/components/ui/soft-surface";
import { RECAP_RANGES, type RecapRange, describeRecapEntry, summarizeRecap } from "../content-review-activity";
import { REVIEW_STATUSES, TONE_SWATCH_CLASSES } from "../planning-constants";
import { formatOptionalCurrency } from "../planning-model";
import type { ContentReviewItem, ContentReviewUpdate } from "../planning-types";

type ContentReviewRecapPanelProps = {
  items: ContentReviewItem[];
  updates: ContentReviewUpdate[];
  currentUserEmail?: string | null;
  onClose: () => void;
  onSelect: (itemId: string) => void;
};

/** Weekly recap: a right-hand slide-over with a 7/14/30 day switch, a one-line summary, and recent activity. */
export function ContentReviewRecapPanel({ items, updates, onClose, onSelect }: ContentReviewRecapPanelProps) {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const [rangeDays, setRangeDays] = useState<RecapRange>(7);
  const summary = useMemo(() => summarizeRecap(updates, items, rangeDays), [updates, items, rangeDays]);
  const statusToneByStatus = useMemo(() => new Map(REVIEW_STATUSES.map((option) => [option.value, option.tone])), []);
  const titleId = "content-review-recap-title";

  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;
    if (typeof dialog.showModal === "function" && !dialog.open) dialog.showModal();
    else dialog.setAttribute("open", "");
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

  const summaryLine = `${summary.reviewsTouched} ${summary.reviewsTouched === 1 ? "review" : "reviews"} touched, ${summary.statusChanges} status ${summary.statusChanges === 1 ? "change" : "changes"}, ${summary.notesLogged} ${summary.notesLogged === 1 ? "update" : "updates"} logged` +
    (summary.contractedCount ? `, ${summary.contractedCount} contracted (${formatOptionalCurrency(summary.contractedRateCents)})` : "");

  return createPortal(
    <dialog
      ref={dialogRef}
      open
      style={{ display: "block", visibility: "visible", animation: "fadein 150ms ease" }}
      aria-labelledby={titleId}
      onClick={closeFromBackdrop}
      onKeyDown={closeFromEscape}
      onClose={onClose}
      className="fixed inset-y-0 right-0 z-[70] m-0 block h-full w-[calc(100%-2rem)] max-w-[420px] bg-panel p-0 text-foreground shadow-2xl backdrop:bg-augustine-blue/40"
    >
      <div className="flex h-full flex-col">
        <header className="flex shrink-0 items-start justify-between gap-4 border-b border-hairline p-6">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wide text-formed-blue">Review activity</p>
            <h2 id={titleId} className="font-display text-2xl">Weekly recap</h2>
          </div>
          <button type="button" onClick={closeDialog} aria-label="Close recap" className="p-2 text-muted transition hover:bg-panel-warm hover:text-foreground">
            <X className="h-5 w-5" aria-hidden="true" />
          </button>
        </header>

        <div data-testid="content-review-recap-content" className="grid min-h-0 flex-1 gap-4 overflow-y-auto p-6">
          <div role="group" aria-label="Recap range" className="flex w-fit gap-1 bg-panel-warm p-1">
            {RECAP_RANGES.map((range) => (
              <button
                key={range}
                type="button"
                aria-pressed={rangeDays === range}
                onClick={() => setRangeDays(range)}
                className={cn(
                  "min-h-8 px-3 text-xs font-semibold uppercase tracking-wide transition",
                  rangeDays === range ? "bg-augustine-blue text-white" : "text-muted hover:text-foreground"
                )}
              >
                {range}d
              </button>
            ))}
          </div>

          <p className="text-sm font-medium leading-relaxed">{summaryLine}.</p>

          {summary.days.length === 0 ? (
            <p className="bg-panel-warm p-4 text-sm font-bold text-muted">No review activity in the last {summary.rangeDays} days.</p>
          ) : (
            <div className="grid gap-4">
              {summary.days.map((day) => (
                <section key={day.key} className="grid gap-2">
                  <h3 className="text-xs font-semibold uppercase tracking-wide text-muted">{day.label}</h3>
                  <ul className="grid gap-1.5">
                    {day.entries.map((entry) => {
                      const swatchTone = statusToneByStatus.get(entry.toStatus ?? entry.fromStatus ?? "not_started") ?? "slate";
                      return (
                        <li key={entry.id}>
                          <button
                            type="button"
                            onClick={() => onSelect(entry.itemId)}
                            className="flex w-full items-center gap-2 bg-panel-warm px-3 py-2 text-left transition hover:bg-panel focus:outline-none focus-visible:ring-2 focus-visible:ring-formed-blue"
                          >
                            <span aria-hidden="true" className={cn("h-1.5 w-1.5 shrink-0", TONE_SWATCH_CLASSES[swatchTone])} />
                            <span className="min-w-0 flex-1">
                              <span className="block truncate text-sm font-semibold">{entry.title}</span>
                              <span className="block truncate text-xs font-medium text-muted">{describeRecapEntry(entry)}</span>
                            </span>
                          </button>
                        </li>
                      );
                    })}
                  </ul>
                </section>
              ))}
            </div>
          )}
        </div>
      </div>
    </dialog>,
    document.body
  );
}
