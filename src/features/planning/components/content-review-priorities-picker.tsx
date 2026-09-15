"use client";

import { X } from "lucide-react";
import { type KeyboardEvent, type MouseEvent, useEffect, useRef } from "react";
import { createPortal } from "react-dom";
import { REVIEW_STATUSES, TONE_BORDER_L_CLASSES, TONE_SWATCH_CLASSES } from "../planning-constants";
import type { ContentReviewItem } from "../planning-types";

type ContentReviewPrioritiesPickerProps = {
  candidates: ContentReviewItem[];
  onPick: (itemId: string) => void;
  onClose: () => void;
};

/**
 * "Add another priority": lists up to 12 unpinned reviews that need a
 * decision, so picking a priority does not require hunting for the row first.
 */
export function ContentReviewPrioritiesPicker({ candidates, onPick, onClose }: ContentReviewPrioritiesPickerProps) {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const titleId = "content-review-priorities-picker-title";
  const shown = candidates.slice(0, 12);

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

  return createPortal(
    <dialog
      ref={dialogRef}
      open
      style={{ display: "block", visibility: "visible", animation: "fadein 150ms ease" }}
      aria-labelledby={titleId}
      onClick={closeFromBackdrop}
      onKeyDown={closeFromEscape}
      onClose={onClose}
      className="fixed left-1/2 top-1/2 z-[70] block w-[calc(100%-2rem)] max-w-[540px] -translate-x-1/2 -translate-y-1/2 bg-panel p-0 text-foreground shadow-2xl backdrop:bg-augustine-blue/40"
    >
      <div className="flex max-h-[calc(100vh-2rem)] flex-col">
        <header className="flex shrink-0 items-start justify-between gap-4 border-b border-hairline p-5">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wide text-formed-blue">Priorities</p>
            <h2 id={titleId} className="font-display text-2xl">Add another priority</h2>
            <p className="mt-1 text-sm font-medium text-muted">Pick the title you want to work on next.</p>
          </div>
          <button type="button" onClick={closeDialog} aria-label="Close add another priority" className="p-2 text-muted transition hover:bg-panel-warm hover:text-foreground">
            <X className="h-5 w-5" aria-hidden="true" />
          </button>
        </header>

        <div data-testid="content-review-priorities-picker" className="grid min-h-0 gap-2 overflow-y-auto p-5">
          {shown.length === 0 ? (
            <p className="bg-panel-warm p-5 text-sm font-bold text-muted">Every review that needs a decision is already a priority.</p>
          ) : (
            <ul className="grid gap-1">
              {shown.map((item) => {
                const status = REVIEW_STATUSES.find((option) => option.value === item.reviewStatus) ?? REVIEW_STATUSES[0];
                const label = item.title || "Untitled review";
                return (
                  <li key={item.id}>
                    <button
                      type="button"
                      onClick={() => onPick(item.id)}
                      aria-label={`Add ${label} to Priorities`}
                      className={`flex w-full items-center gap-2.5 border-l-[3px] ${TONE_BORDER_L_CLASSES[status.tone]} bg-panel-warm px-3 py-2.5 text-left transition hover:bg-panel focus:outline-none focus-visible:ring-2 focus-visible:ring-formed-blue`}
                    >
                      <span aria-hidden="true" className={`h-1.5 w-1.5 shrink-0 ${TONE_SWATCH_CLASSES[status.tone]}`} />
                      <span className="min-w-0 flex-1 truncate text-sm font-semibold">{label}</span>
                      <span className="shrink-0 text-xs font-medium text-muted">{status.label}</span>
                    </button>
                  </li>
                );
              })}
            </ul>
          )}
        </div>

        <footer className="flex shrink-0 justify-end border-t border-hairline p-4">
          <button type="button" onClick={closeDialog} className="px-5 py-3 text-sm font-semibold uppercase tracking-wide text-muted hover:bg-panel-warm">Close</button>
        </footer>
      </div>
    </dialog>,
    document.body
  );
}
