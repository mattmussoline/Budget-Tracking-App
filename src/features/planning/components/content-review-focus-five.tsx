"use client";

import { GripVertical, Plus, X } from "lucide-react";
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

  return <section data-testid="content-review-focus-five" aria-labelledby="focus-five-heading" className="rounded-soft border border-hairline bg-panel-warm px-5 py-[18px]">
    <div className="mb-3.5 flex flex-wrap items-baseline justify-between gap-x-4 gap-y-2">
      <div className="flex flex-wrap items-baseline gap-x-3 gap-y-1">
        <h2 id="focus-five-heading" className="font-display text-lg">Focus Five</h2>
        <p className="text-xs text-muted [text-wrap:pretty]">The five reviews you are working on next. Pin one from the queue to bring it up here.</p>
      </div>
      <div className="flex shrink-0 items-center gap-2.5">
        <span className="rounded-md bg-formed-blue-soft px-2 py-0.5 text-[11px] font-bold text-formed-blue">{items.length} of {FOCUS_LIMIT}</span>
        <button
          type="button"
          onClick={onAdd}
          disabled={!canAdd}
          title={items.length >= FOCUS_LIMIT ? "Adds a review and drops the last one back to the queue" : undefined}
          className="inline-flex min-h-8 items-center gap-1 rounded-lg border border-hairline bg-panel px-2.5 text-xs font-semibold text-foreground transition-colors hover:border-hairline-strong focus:outline-none focus-visible:ring-2 focus-visible:ring-formed-blue disabled:opacity-40"
        >
          <Plus className="h-3.5 w-3.5" aria-hidden="true" />Add review
        </button>
      </div>
    </div>

    {items.length === 0 ? (
      <div className="grid gap-3 rounded-lg border border-hairline bg-panel p-5">
        <p className="text-sm text-muted">Nothing here yet. Add the reviews you want to work on next.</p>
        <button
          type="button"
          onClick={onAdd}
          disabled={!canAdd}
          className="inline-flex min-h-9 w-fit items-center gap-1 rounded-lg border border-hairline bg-panel-warm px-3 text-xs font-semibold text-foreground transition-colors hover:border-hairline-strong focus:outline-none focus-visible:ring-2 focus-visible:ring-formed-blue disabled:opacity-40"
        >
          <Plus className="h-4 w-4" aria-hidden="true" />Add review
        </button>
      </div>
    ) : (
      <ol className="grid gap-3 sm:grid-cols-2 xl:grid-cols-5">
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
              "grid min-w-0 content-start gap-2 rounded-lg border bg-panel p-3 transition-colors",
              selectedId === item.id ? "border-formed-blue" : "border-hairline",
              draggedItemId === item.id && "opacity-60"
            )}
          >
            <div className="flex min-w-0 items-center gap-2">
              {canReorder ? <span aria-hidden="true" title={`Drag to reorder ${label}`} className="shrink-0 cursor-grab text-faint active:cursor-grabbing"><GripVertical className="h-3.5 w-3.5" /></span> : null}
              <span aria-hidden="true" className={cn("grid h-6 w-6 shrink-0 place-items-center rounded-md font-display text-sm", selectedId === item.id ? "bg-formed-blue text-white" : cn(TONE_CLASSES[status.tone].chip))}>{index + 1}</span>
              <p className="min-w-0 flex-1 text-[13px] font-bold leading-tight">{label}</p>
              <button
                type="button"
                onClick={() => onRelease(item.id)}
                disabled={!canReorder}
                aria-label={`Remove ${label} from the Focus Five`}
                title="Remove from the Focus Five"
                className="shrink-0 rounded p-0.5 text-faint transition-colors hover:bg-panel-warm hover:text-foreground focus:outline-none focus-visible:ring-2 focus-visible:ring-formed-blue disabled:opacity-40"
              >
                <X className="h-3.5 w-3.5" aria-hidden="true" />
              </button>
            </div>
            <span className={cn("w-fit rounded-md px-1.5 py-0.5 text-[10px] font-bold uppercase tracking-wide", TONE_CLASSES[status.tone].chip)}>{status.label}</span>
            {item.provider ? <span className="truncate text-[11px] text-muted">{item.provider}</span> : null}
            {item.proposedRateCents ? <span className="text-sm font-bold tabular-nums">{formatOptionalCurrency(item.proposedRateCents)}</span> : null}
            <div className="flex items-center justify-between gap-2">
              <span className="text-[11px] text-faint">{updateCount} {updateCount === 1 ? "update" : "updates"}</span>
              <button
                type="button"
                onClick={() => onSelect(item.id)}
                aria-label={`Work on ${label}`}
                className="shrink-0 rounded text-[11px] font-bold text-formed-blue transition-colors hover:text-formed-blue-hover focus:outline-none focus-visible:ring-2 focus-visible:ring-formed-blue"
              >
                {selectedId === item.id ? "Selected" : "Work on"}
              </button>
            </div>
          </li>;
        })}
        {Array.from({ length: emptySlots }, (_, index) => (
          <li key={`empty-${index}`}>
            <button
              type="button"
              onClick={onAdd}
              disabled={!canAdd}
              aria-label={`Add a review to Focus Five slot ${items.length + index + 1}`}
              className="grid h-full w-full content-start gap-2 rounded-lg border border-dashed border-hairline-strong p-3 text-left text-xs font-semibold text-muted transition-colors hover:bg-panel hover:text-foreground focus:outline-none focus-visible:ring-2 focus-visible:ring-formed-blue disabled:cursor-default disabled:hover:bg-transparent disabled:hover:text-muted"
            >
              <span className="flex items-center gap-2">
                <span aria-hidden="true" className="grid h-6 w-6 shrink-0 place-items-center rounded-md bg-tone-slate-bg font-display text-sm text-muted">{items.length + index + 1}</span>
                Open slot
              </span>
              <span className="flex items-center gap-1 text-[11px] font-medium text-faint">Add a review<Plus className="h-3 w-3 shrink-0" aria-hidden="true" /></span>
            </button>
          </li>
        ))}
      </ol>
    )}
  </section>;
}
