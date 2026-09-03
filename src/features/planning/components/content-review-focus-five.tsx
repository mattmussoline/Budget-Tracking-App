"use client";

import { ArrowRight, GripVertical, ListChecks, X } from "lucide-react";
import { type DragEvent } from "react";
import { cn } from "@/components/ui/soft-surface";
import { FOCUS_LIMIT } from "../content-review-queue";
import { REVIEW_STATUSES, TONE_CLASSES } from "../planning-constants";
import { formatOptionalCurrency } from "../planning-model";
import type { ContentReviewItem } from "../planning-types";

type ContentReviewFocusFiveProps = {
  items: ContentReviewItem[];
  selectedId: string;
  canReorder: boolean;
  draggedItemId: string | null;
  updateCountById: Map<string, number>;
  onSelect: (id: string) => void;
  onRelease: (id: string) => void;
  onDragStart: (event: DragEvent<HTMLElement>, id: string) => void;
  onDragEnd: () => void;
  onDrop: (event: DragEvent<HTMLElement>, id: string) => void;
};

/**
 * The short working list: the five reviews at the top of the manual order,
 * shown as the thing to actually do next rather than as five more rows in a
 * seventy-row queue. Membership is just the top of the queue order, so pinning,
 * dragging, and typing a number all move a review in and out of it.
 */
export function ContentReviewFocusFive({ items, selectedId, canReorder, draggedItemId, updateCountById, onSelect, onRelease, onDragStart, onDragEnd, onDrop }: ContentReviewFocusFiveProps) {
  const emptySlots = Math.max(0, FOCUS_LIMIT - items.length);

  return <section data-testid="content-review-focus-five" aria-labelledby="focus-five-heading" className="rounded-lg bg-gradient-to-br from-amber-50 to-white p-4 ring-1 ring-amber-200 md:p-6">
    <div className="mb-4 flex flex-wrap items-start justify-between gap-3">
      <div className="flex items-start gap-3">
        <span className="grid h-9 w-9 shrink-0 place-items-center rounded-md bg-amber-100 text-amber-800">
          <ListChecks className="h-4 w-4" aria-hidden="true" />
        </span>
        <div>
          <h2 id="focus-five-heading" className="font-display text-2xl font-extrabold">Focus Five</h2>
          <p className="text-sm text-muted">The five reviews you are working on next. Pin one from the queue to bring it up here.</p>
        </div>
      </div>
      <span className="rounded-full bg-amber-100 px-3 py-1 text-xs font-extrabold uppercase tracking-wide text-amber-900">{items.length} of {FOCUS_LIMIT}</span>
    </div>

    {items.length === 0 ? (
      <p className="rounded-lg bg-white p-5 font-bold text-muted">Nothing pinned yet. Use the pin on a queue row to start your five.</p>
    ) : (
      <ol className="grid gap-2">
        {items.map((item, index) => {
          const status = REVIEW_STATUSES.find((option) => option.value === item.reviewStatus) ?? REVIEW_STATUSES[0];
          const label = item.title || "Untitled review";
          const updateCount = updateCountById.get(item.id) ?? 0;
          return <li
            key={item.id}
            data-testid={`content-review-focus-row-${item.id}`}
            draggable={canReorder}
            onDragStart={canReorder ? (event) => onDragStart(event, item.id) : undefined}
            onDragEnd={onDragEnd}
            onDragOver={(event) => { event.preventDefault(); if (event.dataTransfer) event.dataTransfer.dropEffect = "move"; }}
            onDrop={(event) => onDrop(event, item.id)}
            className={cn(
              "flex items-center gap-3 rounded-lg border-l-4 bg-white p-3 shadow-sm ring-1 ring-gray-200 transition",
              TONE_CLASSES[status.tone].accent,
              selectedId === item.id && "ring-2 ring-blue-500",
              draggedItemId === item.id && "opacity-60"
            )}
          >
            {canReorder ? <span aria-hidden="true" title={`Drag to reorder ${label}`} className="cursor-grab text-muted active:cursor-grabbing"><GripVertical className="h-4 w-4" /></span> : null}
            <span aria-hidden="true" className="grid h-7 w-7 shrink-0 place-items-center rounded-full bg-amber-200 font-display text-sm font-extrabold text-amber-950">{index + 1}</span>
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-extrabold">{label}</p>
              <p className="flex flex-wrap items-center gap-2 text-xs font-bold text-muted">
                <span className={cn("rounded-full px-2 py-0.5 text-[10px] font-extrabold uppercase tracking-wide", TONE_CLASSES[status.tone].chip)}>{status.label}</span>
                {item.provider ? <span className="truncate">{item.provider}</span> : null}
                {item.proposedRateCents ? <span>{formatOptionalCurrency(item.proposedRateCents)}</span> : null}
                {updateCount ? <span>{updateCount} {updateCount === 1 ? "update" : "updates"}</span> : null}
              </p>
            </div>
            <button
              type="button"
              onClick={() => onSelect(item.id)}
              aria-label={`Work on ${label}`}
              className="inline-flex min-h-9 shrink-0 items-center gap-1 rounded-md bg-gray-900 px-3 text-xs font-extrabold uppercase tracking-wide text-white transition hover:bg-gray-800 focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              Work on<ArrowRight className="h-3.5 w-3.5" aria-hidden="true" />
            </button>
            <button
              type="button"
              onClick={() => onRelease(item.id)}
              disabled={!canReorder}
              aria-label={`Remove ${label} from the Focus Five`}
              title="Remove from the Focus Five"
              className="shrink-0 rounded p-1 text-muted transition hover:bg-gray-100 hover:text-foreground focus:outline-none focus:ring-2 focus:ring-blue-400 disabled:opacity-40"
            >
              <X className="h-4 w-4" aria-hidden="true" />
            </button>
          </li>;
        })}
        {Array.from({ length: emptySlots }, (_, index) => (
          <li key={`empty-${index}`} className="flex items-center gap-3 rounded-lg border border-dashed border-amber-300 p-3 text-sm font-bold text-muted">
            <span aria-hidden="true" className="grid h-7 w-7 shrink-0 place-items-center rounded-full bg-amber-100 font-display text-sm font-extrabold text-amber-700">{items.length + index + 1}</span>
            Open slot — pin a review from the queue.
          </li>
        ))}
      </ol>
    )}
  </section>;
}
