"use client";

import { ArrowRight, GripVertical, ListChecks, Plus, X } from "lucide-react";
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
  canAdd: boolean;
  onAdd: () => void;
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
export function ContentReviewFocusFive({ items, selectedId, canReorder, draggedItemId, updateCountById, canAdd, onAdd, onSelect, onRelease, onDragStart, onDragEnd, onDrop }: ContentReviewFocusFiveProps) {
  const emptySlots = Math.max(0, FOCUS_LIMIT - items.length);

  return <section data-testid="content-review-focus-five" aria-labelledby="focus-five-heading" className="rounded-lg bg-gradient-to-br from-guild-gold-soft to-white p-4 ring-1 ring-guild-gold md:p-6">
    <div className="mb-4 flex flex-wrap items-start justify-between gap-3">
      <div className="flex items-start gap-3">
        <span className="grid h-9 w-9 shrink-0 place-items-center rounded-md bg-guild-gold-soft text-guild-gold-ink">
          <ListChecks className="h-4 w-4" aria-hidden="true" />
        </span>
        <div>
          <h2 id="focus-five-heading" className="font-display text-2xl">Focus Five</h2>
          <p className="text-sm text-muted">The five reviews you are working on next. Add one by name, pin one from the queue, or drag to reorder.</p>
        </div>
      </div>
      <div className="flex items-center gap-2">
        <span className="rounded-full bg-guild-gold-soft px-3 py-1 text-xs font-semibold uppercase tracking-wide text-guild-gold-ink">{items.length} of {FOCUS_LIMIT}</span>
        <button
          type="button"
          onClick={onAdd}
          disabled={!canAdd}
          title={items.length >= FOCUS_LIMIT ? "Adds a review and drops the last one back to the queue" : undefined}
          className="inline-flex min-h-9 items-center gap-1 rounded-md bg-augustine-blue px-3 text-xs font-semibold uppercase tracking-wide text-white transition hover:bg-augustine-blue-raised focus:outline-none focus:ring-2 focus:ring-formed-blue disabled:opacity-40"
        >
          <Plus className="h-3.5 w-3.5" aria-hidden="true" />Add review
        </button>
      </div>
    </div>

    {items.length === 0 ? (
      <div className="grid gap-3 rounded-lg bg-white p-5">
        <p className="font-bold text-muted">Nothing here yet. Add the reviews you want to work on next.</p>
        <button
          type="button"
          onClick={onAdd}
          disabled={!canAdd}
          className="inline-flex min-h-10 w-fit items-center gap-1 rounded-md bg-augustine-blue px-4 text-xs font-semibold uppercase tracking-wide text-white transition hover:bg-augustine-blue-raised focus:outline-none focus:ring-2 focus:ring-formed-blue disabled:opacity-40"
        >
          <Plus className="h-4 w-4" aria-hidden="true" />Add review
        </button>
      </div>
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
              "flex items-center gap-3 rounded-lg border-l-4 bg-white p-3 shadow-sm ring-1 ring-hairline transition",
              TONE_CLASSES[status.tone].accent,
              selectedId === item.id && "ring-2 ring-formed-blue",
              draggedItemId === item.id && "opacity-60"
            )}
          >
            {canReorder ? <span aria-hidden="true" title={`Drag to reorder ${label}`} className="cursor-grab text-muted active:cursor-grabbing"><GripVertical className="h-4 w-4" /></span> : null}
            <span aria-hidden="true" className="grid h-7 w-7 shrink-0 place-items-center rounded-full bg-guild-gold-soft font-display text-sm text-guild-gold-ink">{index + 1}</span>
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-semibold">{label}</p>
              <p className="flex flex-wrap items-center gap-2 text-xs font-bold text-muted">
                <span className={cn("rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide", TONE_CLASSES[status.tone].chip)}>{status.label}</span>
                {item.provider ? <span className="truncate">{item.provider}</span> : null}
                {item.proposedRateCents ? <span>{formatOptionalCurrency(item.proposedRateCents)}</span> : null}
                {updateCount ? <span>{updateCount} {updateCount === 1 ? "update" : "updates"}</span> : null}
              </p>
            </div>
            <button
              type="button"
              onClick={() => onSelect(item.id)}
              aria-label={`Work on ${label}`}
              className="inline-flex min-h-9 shrink-0 items-center gap-1 rounded-md bg-augustine-blue px-3 text-xs font-semibold uppercase tracking-wide text-white transition hover:bg-augustine-blue-raised focus:outline-none focus:ring-2 focus:ring-formed-blue"
            >
              Work on<ArrowRight className="h-3.5 w-3.5" aria-hidden="true" />
            </button>
            <button
              type="button"
              onClick={() => onRelease(item.id)}
              disabled={!canReorder}
              aria-label={`Remove ${label} from the Focus Five`}
              title="Remove from the Focus Five"
              className="shrink-0 rounded p-1 text-muted transition hover:bg-panel-warm hover:text-foreground focus:outline-none focus:ring-2 focus:ring-formed-blue disabled:opacity-40"
            >
              <X className="h-4 w-4" aria-hidden="true" />
            </button>
          </li>;
        })}
        {Array.from({ length: emptySlots }, (_, index) => (
          <li key={`empty-${index}`}>
            <button
              type="button"
              onClick={onAdd}
              disabled={!canAdd}
              aria-label={`Add a review to Focus Five slot ${items.length + index + 1}`}
              className="flex w-full items-center gap-3 rounded-lg border border-dashed border-guild-gold p-3 text-left text-sm font-bold text-muted transition hover:border-guild-gold hover:bg-guild-gold-soft/60 hover:text-foreground focus:outline-none focus:ring-2 focus:ring-formed-blue disabled:cursor-default disabled:hover:border-amber-300 disabled:hover:bg-transparent disabled:hover:text-muted"
            >
              <span aria-hidden="true" className="grid h-7 w-7 shrink-0 place-items-center rounded-full bg-guild-gold-soft font-display text-sm text-guild-gold-ink">{items.length + index + 1}</span>
              Open slot — add a review.
              <Plus className="ml-auto h-4 w-4 shrink-0" aria-hidden="true" />
            </button>
          </li>
        ))}
      </ol>
    )}
  </section>;
}
