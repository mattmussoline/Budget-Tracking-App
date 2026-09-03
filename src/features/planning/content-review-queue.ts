import { REVIEW_STATUSES } from "./planning-constants";
import type { ContentReviewGroupOrderRow, ContentReviewItem, ReviewStatus } from "./planning-types";

// Approved and rejected keep their original test ids so the completed-review selectors stay stable.
export const QUEUE_GROUP_ORDER: ReviewStatus[] = ["not_started", "on_the_radar", "in_progress", "blocked", "approved", "rejected"];

export const QUEUE_GROUP_TEST_IDS: Record<ReviewStatus, string> = {
  not_started: "content-review-group-not-started",
  on_the_radar: "content-review-group-on-the-radar",
  in_progress: "content-review-group-in-progress",
  blocked: "content-review-group-blocked",
  approved: "content-review-approved-content",
  rejected: "content-review-rejected-content"
};

export type QueueSortColumn = "priority" | "title" | "reviewStatus" | "proposedRateCents" | "provider";
export type QueueSort = { column: QueueSortColumn; direction: "asc" | "desc" } | null;
export type QueueFilters = { search: string; status: ReviewStatus | "all"; provider: string };
export type QueueView = "grouped" | "priority";

export const emptyQueueFilters: QueueFilters = { search: "", status: "all", provider: "all" };

/**
 * How many reviews carry a priority number. Everything past this is simply "in
 * the queue" — the point of the ranking is a short, honest working list, not a
 * number on all seventy titles.
 */
export const FOCUS_LIMIT = 5;

export function focusFiveItems(items: ContentReviewItem[]) {
  return items.filter((item) => item.id !== "draft").slice(0, FOCUS_LIMIT);
}

export function isInFocusFive(position: number | null) {
  return position !== null && position >= 1 && position <= FOCUS_LIMIT;
}

export const QUEUE_SORT_LABELS: Record<QueueSortColumn, string> = {
  priority: "Priority",
  title: "Title",
  reviewStatus: "Review Status",
  proposedRateCents: "Yearly Rate",
  provider: "Provider"
};

/** Header clicks cycle ascending, then descending, then back to the manual order. */
export function nextSortState(current: QueueSort, column: QueueSortColumn): QueueSort {
  if (!current || current.column !== column) return { column, direction: "asc" };
  if (current.direction === "asc") return { column, direction: "desc" };
  return null;
}

function statusRank(status: ReviewStatus) {
  const index = QUEUE_GROUP_ORDER.indexOf(status);
  return index === -1 ? QUEUE_GROUP_ORDER.length : index;
}

/**
 * Blank providers and missing rates always land at the bottom, in both
 * directions, so flipping the sort never buries the rows that have data.
 */
function compareOptional<T>(a: T | null, b: T | null, compare: (a: T, b: T) => number, direction: "asc" | "desc") {
  const aEmpty = a === null || a === undefined || a === "";
  const bEmpty = b === null || b === undefined || b === "";
  if (aEmpty && bEmpty) return 0;
  if (aEmpty) return 1;
  if (bEmpty) return -1;
  const result = compare(a as T, b as T);
  return direction === "asc" ? result : -result;
}

export function compareQueueItems(a: ContentReviewItem, b: ContentReviewItem, sort: NonNullable<QueueSort>) {
  const { column, direction } = sort;
  const flip = direction === "asc" ? 1 : -1;

  if (column === "title") {
    return compareOptional(a.title || null, b.title || null, (left, right) => left.localeCompare(right), direction);
  }
  if (column === "provider") {
    return compareOptional((a.provider ?? "").trim() || null, (b.provider ?? "").trim() || null, (left, right) => left.localeCompare(right), direction);
  }
  if (column === "proposedRateCents") {
    return compareOptional(a.proposedRateCents ?? null, b.proposedRateCents ?? null, (left, right) => left - right, direction);
  }
  if (column === "reviewStatus") {
    return (statusRank(a.reviewStatus) - statusRank(b.reviewStatus)) * flip;
  }
  return 0;
}

/**
 * Sorts a list for display. The unsaved draft stays pinned to the top under
 * every sort because it has no database row behind it yet.
 */
export function sortQueueItems(items: ContentReviewItem[], sort: QueueSort) {
  if (!sort || sort.column === "priority") {
    if (!sort) return items;
    return sort.direction === "asc" ? items : [...items].reverse();
  }
  const drafts = items.filter((item) => item.id === "draft");
  const rest = items.filter((item) => item.id !== "draft");
  return [...drafts, ...[...rest].sort((a, b) => compareQueueItems(a, b, sort))];
}

export function matchesQueueFilters(item: ContentReviewItem, filters: QueueFilters) {
  // An unsaved draft always stays visible so it cannot disappear mid-edit behind a filter.
  if (item.id === "draft") return true;

  const search = filters.search.trim().toLowerCase();
  if (search && !(item.title ?? "").toLowerCase().includes(search)) return false;
  if (filters.status !== "all" && item.reviewStatus !== filters.status) return false;
  if (filters.provider !== "all" && (item.provider ?? "").trim() !== filters.provider) return false;
  return true;
}

/**
 * Merges the saved group arrangement with the built-in default, tolerating rows
 * for statuses that no longer exist and statuses that were never saved.
 */
export function resolveGroupOrder(stored: ContentReviewGroupOrderRow[] | undefined): ReviewStatus[] {
  const known = new Set(QUEUE_GROUP_ORDER);
  const saved = [...(stored ?? [])]
    .sort((a, b) => a.sortOrder - b.sortOrder)
    .map((row) => row.reviewStatus)
    .filter((status) => known.has(status));
  const seen = new Set<ReviewStatus>();
  const order: ReviewStatus[] = [];
  for (const status of [...saved, ...QUEUE_GROUP_ORDER]) {
    if (seen.has(status)) continue;
    seen.add(status);
    order.push(status);
  }
  return order;
}

/** Splice-out then splice-in, matching the roadmap category reorder behavior. */
function move<T>(list: T[], sourceIndex: number, targetIndex: number) {
  const next = [...list];
  const [moved] = next.splice(sourceIndex, 1);
  next.splice(targetIndex, 0, moved);
  return next;
}

/**
 * Moves one review to the position of another in the flat priority list.
 * Dragging down lands the row after the target, dragging up lands it before —
 * the position the target occupies once the dragged row is lifted out.
 */
export function moveQueueItem(items: ContentReviewItem[], draggedId: string, targetId: string) {
  if (draggedId === targetId) return items;
  const sourceIndex = items.findIndex((item) => item.id === draggedId);
  const targetIndex = items.findIndex((item) => item.id === targetId);
  if (sourceIndex < 0 || targetIndex < 0) return items;
  return move(items, sourceIndex, targetIndex);
}

/**
 * Dropping onto a group header (or an empty group) keeps the row where it sits
 * in the priority list and only changes which group it belongs to.
 */
export function moveQueueItemToGroupEnd(items: ContentReviewItem[], draggedId: string, status: ReviewStatus) {
  const sourceIndex = items.findIndex((item) => item.id === draggedId);
  if (sourceIndex < 0) return items;
  const lastInGroup = items.reduce((last, item, index) => (item.reviewStatus === status && item.id !== draggedId ? index : last), -1);
  if (lastInGroup < 0) return items;
  return move(items, sourceIndex, lastInGroup);
}

export function moveGroup(order: ReviewStatus[], draggedStatus: ReviewStatus, targetStatus: ReviewStatus) {
  if (draggedStatus === targetStatus) return order;
  const sourceIndex = order.indexOf(draggedStatus);
  const targetIndex = order.indexOf(targetStatus);
  if (sourceIndex < 0 || targetIndex < 0) return order;
  return move(order, sourceIndex, targetIndex);
}

/** Moves a review to a 1-based position typed into its priority badge. */
export function moveQueueItemToPosition(items: ContentReviewItem[], draggedId: string, position: number) {
  const sourceIndex = items.findIndex((item) => item.id === draggedId);
  if (sourceIndex < 0) return items;
  const targetIndex = Math.min(Math.max(Math.round(position) - 1, 0), items.length - 1);
  if (targetIndex === sourceIndex) return items;
  return move(items, sourceIndex, targetIndex);
}

/**
 * Rewrites `priorityRank` to a dense 1..N so the local array order and the
 * saved ordering key stay in step after a reorder.
 */
export function renumberQueue(items: ContentReviewItem[]) {
  return items.map((item, index) => (item.id === "draft" ? item : { ...item, priorityRank: index + 1 }));
}

export function groupQueueItems(items: ContentReviewItem[], order: ReviewStatus[]) {
  return order.map((value) => {
    const status = REVIEW_STATUSES.find((option) => option.value === value) ?? REVIEW_STATUSES[0];
    return { status, items: items.filter((item) => item.reviewStatus === value) };
  });
}

export function isFinalReviewStatus(status: ReviewStatus) {
  return status === "approved" || status === "rejected";
}

export function isDecisionQueueStatus(status: ReviewStatus) {
  return !isFinalReviewStatus(status) && status !== "on_the_radar";
}
