"use client";

import { ClipboardCheck, Copy, X } from "lucide-react";
import { type KeyboardEvent, type MouseEvent, useEffect, useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { cn } from "@/components/ui/soft-surface";
import { RECAP_RANGES, type RecapRange, buildRecapText, describeRecapEntry, summarizeRecap } from "../content-review-activity";
import { formatOptionalCurrency } from "../planning-model";
import type { ContentReviewItem, ContentReviewUpdate } from "../planning-types";

type ContentReviewRecapPanelProps = {
  items: ContentReviewItem[];
  updates: ContentReviewUpdate[];
  onClose: () => void;
  onSelect: (itemId: string) => void;
};

export function ContentReviewRecapPanel({ items, updates, onClose, onSelect }: ContentReviewRecapPanelProps) {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const [rangeDays, setRangeDays] = useState<RecapRange>(7);
  const [copied, setCopied] = useState(false);
  const summary = useMemo(() => summarizeRecap(updates, items, rangeDays), [updates, items, rangeDays]);
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

  function copyRecap() {
    const text = buildRecapText(summary);
    navigator.clipboard?.writeText(text).then(
      () => {
        setCopied(true);
        window.setTimeout(() => setCopied(false), 2000);
      },
      () => setCopied(false)
    );
  }

  const stats = [
    { label: "Reviews touched", value: String(summary.reviewsTouched) },
    { label: "Updates logged", value: String(summary.notesLogged) },
    { label: "Status changes", value: String(summary.statusChanges) },
    { label: "Reviews added", value: String(summary.reviewsAdded) },
    { label: "Approved", value: summary.approvedCount ? `${summary.approvedCount} · ${formatOptionalCurrency(summary.approvedRateCents)}` : "0" },
    { label: "Rejected", value: String(summary.rejectedCount) }
  ];

  return createPortal(<dialog
    ref={dialogRef}
    open
    style={{ display: "block", visibility: "visible" }}
    aria-labelledby={titleId}
    onClick={closeFromBackdrop}
    onKeyDown={closeFromEscape}
    onClose={onClose}
    className="fixed left-1/2 top-1/2 z-50 block w-[calc(100%-2rem)] max-w-3xl -translate-x-1/2 -translate-y-1/2 rounded-xl bg-white p-0 text-foreground shadow-2xl backdrop:bg-augustine-blue/60"
  >
    <div className="flex max-h-[calc(100vh-2rem)] flex-col">
      <header className="flex shrink-0 items-start justify-between gap-4 border-b border-formed-blue-border bg-formed-blue-soft p-5 sm:p-7">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wide text-formed-blue">Review Activity</p>
          <h2 id={titleId} className="font-display text-3xl">Recap</h2>
          <p className="mt-1 text-sm font-medium text-augustine-blue">What the review work has looked like over the last {summary.rangeDays} days.</p>
        </div>
        <button type="button" onClick={closeDialog} aria-label="Close recap" className="rounded-md bg-white p-3 text-foreground shadow-sm ring-1 ring-hairline transition-colors hover:bg-panel-warm">
          <X className="h-5 w-5" aria-hidden="true" />
        </button>
      </header>

      <div data-testid="content-review-recap-content" className="grid min-h-0 gap-5 overflow-y-auto p-5 sm:p-7">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div role="group" aria-label="Recap range" className="flex gap-1 rounded-md bg-panel-warm p-1">
            {RECAP_RANGES.map((range) => (
              <button
                key={range}
                type="button"
                aria-pressed={rangeDays === range}
                onClick={() => setRangeDays(range)}
                className={cn(
                  "min-h-9 rounded px-3 text-xs font-semibold uppercase tracking-wide transition focus:outline-none focus:ring-2 focus:ring-formed-blue",
                  rangeDays === range ? "bg-white text-foreground shadow-sm" : "text-muted hover:text-foreground"
                )}
              >
                {range} days
              </button>
            ))}
          </div>
          <button
            type="button"
            onClick={copyRecap}
            className="inline-flex min-h-9 items-center gap-2 rounded-md bg-augustine-blue px-3 text-xs font-semibold uppercase tracking-wide text-white transition hover:bg-augustine-blue-raised focus:outline-none focus:ring-2 focus:ring-formed-blue"
          >
            {copied ? <ClipboardCheck className="h-3.5 w-3.5" aria-hidden="true" /> : <Copy className="h-3.5 w-3.5" aria-hidden="true" />}
            {copied ? "Copied" : "Copy recap"}
          </button>
        </div>

        <dl className="grid gap-2 sm:grid-cols-3">
          {stats.map((stat) => (
            <div key={stat.label} className="rounded-lg bg-panel-warm p-3 ring-1 ring-hairline">
              <dt className="text-[10px] font-semibold uppercase tracking-wide text-muted">{stat.label}</dt>
              <dd className="mt-1 font-display text-2xl">{stat.value}</dd>
            </div>
          ))}
        </dl>

        {summary.days.length === 0 ? (
          <p className="rounded-lg bg-panel-warm p-5 font-bold text-muted">No review activity in the last {summary.rangeDays} days.</p>
        ) : (
          <div className="grid gap-4">
            {summary.days.map((day) => (
              <section key={day.key} className="grid gap-2">
                <h3 className="text-xs font-semibold uppercase tracking-wide text-muted">{day.label}</h3>
                <ul className="grid gap-2">
                  {day.entries.map((entry) => (
                    <li key={entry.id}>
                      <button
                        type="button"
                        onClick={() => onSelect(entry.itemId)}
                        className="grid w-full gap-0.5 rounded-md bg-panel-warm p-3 text-left ring-1 ring-hairline transition hover:bg-white hover:shadow-sm focus:outline-none focus:ring-2 focus:ring-formed-blue"
                      >
                        <span className="text-sm font-semibold">{entry.title}</span>
                        <span className="text-sm font-medium text-muted">{describeRecapEntry(entry)}</span>
                      </button>
                    </li>
                  ))}
                </ul>
              </section>
            ))}
          </div>
        )}
      </div>

      <footer className="flex shrink-0 justify-end border-t border-hairline p-4 sm:px-7">
        <button type="button" onClick={closeDialog} className="min-h-12 rounded-md px-5 py-3 text-sm font-semibold uppercase tracking-wide text-muted hover:bg-panel-warm">Close</button>
      </footer>
    </div>
  </dialog>, document.body);
}
