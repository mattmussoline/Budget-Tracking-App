import { describe, expect, it } from "vitest";
import {
  QUEUE_GROUP_ORDER,
  matchesQueueFilters,
  moveGroup,
  moveQueueItem,
  moveQueueItemToGroupEnd,
  moveQueueItemToPosition,
  nextSortState,
  renumberQueue,
  resolveGroupOrder,
  sortQueueItems
} from "./content-review-queue";
import type { ContentReviewItem, ReviewStatus } from "./planning-types";

function makeItem(overrides: Partial<ContentReviewItem> & { id: string }): ContentReviewItem {
  return {
    title: `Title ${overrides.id}`,
    provider: "Provider",
    genre: null,
    format: null,
    reviewStatus: "not_started",
    budgetSource: "misc_licensing",
    notes: null,
    proposedRateCents: 1000,
    reviewLink: null,
    comparableContent: null,
    isCoproductionOpportunity: false,
    priorityRank: 1,
    ...overrides
  };
}

const ids = (items: ContentReviewItem[]) => items.map((item) => item.id);

describe("nextSortState", () => {
  it("cycles ascending, descending, then back to the manual order", () => {
    const ascending = nextSortState(null, "title");
    expect(ascending).toEqual({ column: "title", direction: "asc" });

    const descending = nextSortState(ascending, "title");
    expect(descending).toEqual({ column: "title", direction: "desc" });

    expect(nextSortState(descending, "title")).toBeNull();
  });

  it("restarts at ascending when a different column is clicked", () => {
    expect(nextSortState({ column: "title", direction: "desc" }, "provider")).toEqual({ column: "provider", direction: "asc" });
  });
});

describe("sortQueueItems", () => {
  it("returns the manual order untouched when there is no sort", () => {
    const items = [makeItem({ id: "b" }), makeItem({ id: "a" })];
    expect(sortQueueItems(items, null)).toBe(items);
  });

  it("sorts titles alphabetically in both directions", () => {
    const items = [
      makeItem({ id: "c", title: "Chosen" }),
      makeItem({ id: "a", title: "Augustine" }),
      makeItem({ id: "b", title: "Bakhita" })
    ];

    expect(ids(sortQueueItems(items, { column: "title", direction: "asc" }))).toEqual(["a", "b", "c"]);
    expect(ids(sortQueueItems(items, { column: "title", direction: "desc" }))).toEqual(["c", "b", "a"]);
  });

  it("keeps blank providers last in both directions", () => {
    const items = [
      makeItem({ id: "blank", provider: "" }),
      makeItem({ id: "zed", provider: "Zed" }),
      makeItem({ id: "acme", provider: "Acme" }),
      makeItem({ id: "null", provider: null })
    ];

    expect(ids(sortQueueItems(items, { column: "provider", direction: "asc" }))).toEqual(["acme", "zed", "blank", "null"]);
    expect(ids(sortQueueItems(items, { column: "provider", direction: "desc" }))).toEqual(["zed", "acme", "blank", "null"]);
  });

  it("keeps missing yearly rates last in both directions", () => {
    const items = [
      makeItem({ id: "none", proposedRateCents: null }),
      makeItem({ id: "high", proposedRateCents: 900000 }),
      makeItem({ id: "low", proposedRateCents: 1500 })
    ];

    expect(ids(sortQueueItems(items, { column: "proposedRateCents", direction: "asc" }))).toEqual(["low", "high", "none"]);
    expect(ids(sortQueueItems(items, { column: "proposedRateCents", direction: "desc" }))).toEqual(["high", "low", "none"]);
  });

  it("sorts review status by queue order rather than alphabetically", () => {
    const items = [
      makeItem({ id: "approved", reviewStatus: "approved" }),
      makeItem({ id: "blocked", reviewStatus: "blocked" }),
      makeItem({ id: "not-started", reviewStatus: "not_started" })
    ];

    expect(ids(sortQueueItems(items, { column: "reviewStatus", direction: "asc" }))).toEqual(["not-started", "blocked", "approved"]);
  });

  it("pins the unsaved draft to the top under every sort", () => {
    const items = [
      makeItem({ id: "zed", title: "Zed" }),
      makeItem({ id: "draft", title: "" }),
      makeItem({ id: "acme", title: "Acme" })
    ];

    expect(ids(sortQueueItems(items, { column: "title", direction: "asc" }))[0]).toBe("draft");
    expect(ids(sortQueueItems(items, { column: "title", direction: "desc" }))[0]).toBe("draft");
  });
});

describe("matchesQueueFilters", () => {
  it("always keeps the unsaved draft visible", () => {
    const draft = makeItem({ id: "draft", title: "", provider: "" });
    expect(matchesQueueFilters(draft, { search: "nothing matches", status: "approved", provider: "Acme" })).toBe(true);
  });

  it("filters by title, status, and provider", () => {
    const item = makeItem({ id: "a", title: "The Chosen", provider: "Acme", reviewStatus: "blocked" });
    expect(matchesQueueFilters(item, { search: "chosen", status: "all", provider: "all" })).toBe(true);
    expect(matchesQueueFilters(item, { search: "pilgrim", status: "all", provider: "all" })).toBe(false);
    expect(matchesQueueFilters(item, { search: "", status: "approved", provider: "all" })).toBe(false);
    expect(matchesQueueFilters(item, { search: "", status: "all", provider: "Other" })).toBe(false);
  });
});

describe("resolveGroupOrder", () => {
  it("falls back to the built-in order when nothing is saved", () => {
    expect(resolveGroupOrder(undefined)).toEqual(QUEUE_GROUP_ORDER);
    expect(resolveGroupOrder([])).toEqual(QUEUE_GROUP_ORDER);
  });

  it("honors the saved order and appends statuses that were never saved", () => {
    const order = resolveGroupOrder([
      { reviewStatus: "blocked", sortOrder: 0 },
      { reviewStatus: "approved", sortOrder: 1 }
    ]);

    expect(order.slice(0, 2)).toEqual(["blocked", "approved"]);
    expect([...order].sort()).toEqual([...QUEUE_GROUP_ORDER].sort());
  });

  it("ignores saved rows for statuses that no longer exist", () => {
    const order = resolveGroupOrder([
      { reviewStatus: "retired" as ReviewStatus, sortOrder: 0 },
      { reviewStatus: "blocked", sortOrder: 1 }
    ]);

    expect(order[0]).toBe("blocked");
    expect(order).toHaveLength(QUEUE_GROUP_ORDER.length);
  });
});

describe("moveQueueItem", () => {
  const items = [makeItem({ id: "a" }), makeItem({ id: "b" }), makeItem({ id: "c" }), makeItem({ id: "d" })];

  it("lands the row after the target when dragging down", () => {
    expect(ids(moveQueueItem(items, "a", "c"))).toEqual(["b", "c", "a", "d"]);
  });

  it("lands the row before the target when dragging up", () => {
    expect(ids(moveQueueItem(items, "d", "b"))).toEqual(["a", "d", "b", "c"]);
  });

  it("leaves the list alone for unknown or self drops", () => {
    expect(moveQueueItem(items, "a", "a")).toBe(items);
    expect(moveQueueItem(items, "a", "missing")).toBe(items);
  });
});

describe("moveQueueItemToGroupEnd", () => {
  it("moves the row next to the last member of the target group", () => {
    const items = [
      makeItem({ id: "a", reviewStatus: "not_started" }),
      makeItem({ id: "b", reviewStatus: "in_progress" }),
      makeItem({ id: "c", reviewStatus: "in_progress" }),
      makeItem({ id: "d", reviewStatus: "blocked" })
    ];

    expect(ids(moveQueueItemToGroupEnd(items, "a", "in_progress"))).toEqual(["b", "c", "a", "d"]);
  });

  it("keeps the position when the target group is empty", () => {
    const items = [makeItem({ id: "a", reviewStatus: "not_started" }), makeItem({ id: "b", reviewStatus: "not_started" })];
    expect(moveQueueItemToGroupEnd(items, "a", "approved")).toBe(items);
  });
});

describe("moveQueueItemToPosition", () => {
  const items = [makeItem({ id: "a" }), makeItem({ id: "b" }), makeItem({ id: "c" })];

  it("moves a review to the typed 1-based position", () => {
    expect(ids(moveQueueItemToPosition(items, "c", 1))).toEqual(["c", "a", "b"]);
    expect(ids(moveQueueItemToPosition(items, "a", 2))).toEqual(["b", "a", "c"]);
  });

  it("clamps positions outside the list", () => {
    expect(ids(moveQueueItemToPosition(items, "a", 0))).toEqual(["a", "b", "c"]);
    expect(ids(moveQueueItemToPosition(items, "a", 99))).toEqual(["b", "c", "a"]);
  });
});

describe("moveGroup", () => {
  it("reorders the status groups", () => {
    expect(moveGroup(["a", "b", "c"] as unknown as ReviewStatus[], "c" as ReviewStatus, "a" as ReviewStatus)).toEqual(["c", "a", "b"]);
  });
});

describe("renumberQueue", () => {
  it("writes a dense 1..N ordering key and skips the draft", () => {
    const items = [makeItem({ id: "draft", priorityRank: null }), makeItem({ id: "a", priorityRank: 9 }), makeItem({ id: "b", priorityRank: 4 })];
    const renumbered = renumberQueue(items);

    expect(renumbered[0].priorityRank).toBeNull();
    expect(renumbered[1].priorityRank).toBe(2);
    expect(renumbered[2].priorityRank).toBe(3);
  });
});
