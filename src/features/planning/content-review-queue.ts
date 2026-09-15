import { REVIEW_STATUSES } from "./planning-constants";
import type { ContentReviewGroupOrderRow, ContentReviewItem, ReviewStatus } from "./planning-types";

// Rejected keeps its original test id so the completed-review selectors stay stable.
// Acquisition Target sits right before Contracted: approved-by-the-team-but-no-contract-yet,
// then a signed deal.
export const QUEUE_GROUP_ORDER: ReviewStatus[] = ["not_started", "on_the_radar", "in_progress", "blocked", "acquisition_target", "rejected", "contracted"];

export const QUEUE_GROUP_TEST_IDS: Record<ReviewStatus, string> = {
  not_started: "content-review-group-not-started",
  on_the_radar: "content-review-group-on-the-radar",
  in_progress: "content-review-group-in-progress",
  blocked: "content-review-group-blocked",
  acquisition_target: "content-review-group-acquisition-target",
  contracted: "content-review-contracted-content",
  rejected: "content-review-rejected-content"
};

export type QueueSortColumn = "priority" | "title" | "reviewStatus" | "proposedRateCents" | "provider";
export type QueueSort = { column: QueueSortColumn; direction: "asc" | "desc" } | null;
export type QueueFilters = { search: string; status: ReviewStatus | "all"; provider: string };
export type QueueView = "grouped" | "priority";

export const emptyQueueFilters: QueueFilters = { search: "", status: "all", provider: "all" };

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
  return status === "contracted" || status === "rejected";
}

export function isDecisionQueueStatus(status: ReviewStatus) {
  return !isFinalReviewStatus(status) && status !== "on_the_radar";
}

/**
 * The Content Review redesign's rail: three fixed lanes above the seven
 * status lanes. "needs" mirrors {@link isDecisionQueueStatus}; "priorities"
 * is the pinned rail list; "all" is the whole queue.
 */
export type QueueLane = "needs" | "priorities" | "all" | ReviewStatus;

/**
 * How many reviews carry a priority slot (1-5) in the rail. Kept short and
 * honest on purpose — the point is a working list, not a rank on every title.
 */
export const PRIORITY_LIMIT = 5;

/**
 * Priorities rail membership is its own flag (`inFocus`), not a slice of the
 * priority order — removing a review is a deliberate choice, not a position
 * change, so a freed slot never auto-backfills from the queue below it.
 */
export function priorityItems(items: ContentReviewItem[]) {
  return items.filter((item) => item.id !== "draft" && item.inFocus).slice(0, PRIORITY_LIMIT);
}

export function isPriorityListFull(items: ContentReviewItem[]) {
  return priorityItems(items).length >= PRIORITY_LIMIT;
}

/** The next-ranked review not already pinned — offered by the picker first. */
export function recommendedPriorityCandidate(items: ContentReviewItem[]) {
  return items.find((item) => item.id !== "draft" && !item.inFocus) ?? null;
}

/**
 * An Acquisition Target is pending a deal, not a decision to actively rank —
 * moving a pinned review to that status drops it out of Priorities rather
 * than leaving it there.
 */
export function shouldClearPriorityOnStatusChange(item: ContentReviewItem, nextStatus: ReviewStatus) {
  return nextStatus === "acquisition_target" && Boolean(item.inFocus);
}

export function needsDecisionItems(items: ContentReviewItem[]) {
  return items.filter((item) => item.id !== "draft" && isDecisionQueueStatus(item.reviewStatus));
}

/** The On the Radar rail badge: how many reviews are waiting for a next touch. */
export function radarFollowUpCount(items: ContentReviewItem[]) {
  return items.filter((item) => item.reviewStatus === "on_the_radar").length;
}

/** The Acquisition Target rail badge: total proposed value with no contract yet. */
export function acquisitionTargetTotalCents(items: ContentReviewItem[]) {
  return items
    .filter((item) => item.reviewStatus === "acquisition_target")
    .reduce((total, item) => total + (item.proposedRateCents ?? 0), 0);
}

/** Selects the reviews that belong to one rail lane, before search/status/provider filters apply. */
export function laneItems(items: ContentReviewItem[], lane: QueueLane, priorities: ContentReviewItem[]) {
  if (lane === "needs") return needsDecisionItems(items);
  if (lane === "priorities") return priorities;
  if (lane === "all") return items.filter((item) => item.id !== "draft");
  return items.filter((item) => item.reviewStatus === lane);
}

export const LANE_LABELS: Record<"needs" | "priorities" | "all", string> = {
  needs: "Needs a decision",
  priorities: "Priorities",
  all: "All reviews"
};

/** The queue header's serif title + muted subline for the active lane. */
export function laneHeading(lane: QueueLane, laneCount: number, totalCount: number): { title: string; subline: string } {
  if (lane === "priorities") return { title: "Priorities", subline: `${laneCount} ${laneCount === 1 ? "review" : "reviews"} you chose to work on next` };
  if (lane === "needs") return { title: "Needs a decision", subline: `${laneCount} of ${totalCount} reviews are waiting on a call from your team` };
  if (lane === "all") return { title: "All reviews", subline: `${totalCount} titles in the FY26 queue` };
  const status = REVIEW_STATUSES.find((option) => option.value === lane);
  return { title: status?.label ?? lane, subline: `${laneCount} reviews in this status` };
}
