"use client";

import { Search, X } from "lucide-react";
import { type KeyboardEvent, type MouseEvent, useEffect, useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { cn } from "@/components/ui/soft-surface";
import { REVIEW_STATUSES, TONE_CLASSES } from "../planning-constants";
import { formatOptionalCurrency } from "../planning-model";
import type { ContentReviewItem } from "../planning-types";

type ContentReviewFocusPickerProps = {
  candidates: ContentReviewItem[];
  onPick: (itemId: string) => void;
  onClose: () => void;
};

/**
 * Chooses a specific review for the Focus Five by name. The pin on a queue row
 * is the quick path; this is the one that does not require finding the row
 * first, which matters once the queue runs to dozens of titles inside
 * collapsed groups.
 */
export function ContentReviewFocusPicker({ candidates, onPick, onClose }: ContentReviewFocusPickerProps) {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const searchRef = useRef<HTMLInputElement>(null);
  const [search, setSearch] = useState("");
  const titleId = "content-review-focus-picker-title";

  const matches = useMemo(() => {
    const term = search.trim().toLowerCase();
    if (!term) return candidates;
    return candidates.filter((item) =>
      (item.title ?? "").toLowerCase().includes(term) || (item.provider ?? "").toLowerCase().includes(term)
    );
  }, [candidates, search]);

  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;

    if (typeof dialog.showModal === "function" && !dialog.open) dialog.showModal();
    else dialog.setAttribute("open", "");
    searchRef.current?.focus();
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

  return createPortal(<dialog
    ref={dialogRef}
    open
    style={{ display: "block", visibility: "visible" }}
    aria-labelledby={titleId}
    onClick={closeFromBackdrop}
    onKeyDown={closeFromEscape}
    onClose={onClose}
    className="fixed left-1/2 top-1/2 z-50 block w-[calc(100%-2rem)] max-w-2xl -translate-x-1/2 -translate-y-1/2 rounded-xl bg-white p-0 text-foreground shadow-2xl backdrop:bg-augustine-blue/60"
  >
    <div className="flex max-h-[calc(100vh-2rem)] flex-col">
      <header className="flex shrink-0 items-start justify-between gap-4 border-b border-guild-gold bg-guild-gold-soft p-5 sm:p-7">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wide text-guild-gold-ink">Focus Five</p>
          <h2 id={titleId} className="font-display text-2xl">Add a review</h2>
          <p className="mt-1 text-sm font-medium text-guild-gold-ink">Pick the title you want to work on next.</p>
        </div>
        <button type="button" onClick={closeDialog} aria-label="Close add to Focus Five" className="rounded-md bg-white p-3 text-foreground shadow-sm ring-1 ring-hairline transition-colors hover:bg-panel-warm">
          <X className="h-5 w-5" aria-hidden="true" />
        </button>
      </header>

      <div data-testid="content-review-focus-picker" className="grid min-h-0 gap-3 overflow-y-auto p-5 sm:p-7">
        <div className="relative">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted" aria-hidden="true" />
          <input
            ref={searchRef}
            aria-label="Search reviews to add"
            type="search"
            placeholder="Search by title or provider"
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            className="min-h-11 w-full rounded-md border-0 bg-panel-warm pl-9 pr-3 text-sm font-medium normal-case tracking-normal outline-none focus:ring-2 focus:ring-formed-blue"
          />
        </div>

        {matches.length === 0 ? (
          <p className="rounded-lg bg-panel-warm p-5 font-bold text-muted">
            {candidates.length === 0 ? "Every review is already in the Focus Five." : "No reviews match that search."}
          </p>
        ) : (
          <ul className="grid gap-2">
            {matches.map((item) => {
              const status = REVIEW_STATUSES.find((option) => option.value === item.reviewStatus) ?? REVIEW_STATUSES[0];
              const label = item.title || "Untitled review";
              return <li key={item.id}>
                <button
                  type="button"
                  onClick={() => onPick(item.id)}
                  aria-label={`Add ${label} to the Focus Five`}
                  className="flex w-full items-center gap-3 rounded-lg bg-panel-warm p-3 text-left ring-1 ring-hairline transition hover:bg-white hover:shadow-sm focus:outline-none focus:ring-2 focus:ring-formed-blue"
                >
                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-sm font-semibold">{label}</span>
                    <span className="flex flex-wrap items-center gap-2 text-xs font-bold text-muted">
                      <span className={cn("rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide", TONE_CLASSES[status.tone].chip)}>{status.label}</span>
                      {item.provider ? <span className="truncate">{item.provider}</span> : null}
                      {item.proposedRateCents ? <span>{formatOptionalCurrency(item.proposedRateCents)}</span> : null}
                    </span>
                  </span>
                  <span aria-hidden="true" className="shrink-0 rounded-md bg-guild-gold-soft px-3 py-1 text-[10px] font-semibold uppercase tracking-wide text-guild-gold-ink">Add</span>
                </button>
              </li>;
            })}
          </ul>
        )}
      </div>

      <footer className="flex shrink-0 justify-end border-t border-hairline p-4 sm:px-7">
        <button type="button" onClick={closeDialog} className="min-h-12 rounded-md px-5 py-3 text-sm font-semibold uppercase tracking-wide text-muted hover:bg-panel-warm">Close</button>
      </footer>
    </div>
  </dialog>, document.body);
}
