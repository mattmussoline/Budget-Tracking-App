import { describe, expect, it } from "vitest";
import { buildNeedsAttentionItems } from "./attention-model";
import type { ContentLicense } from "./budget-types";
import type { ContentReviewItem, RoadmapItem } from "@/features/planning/planning-types";

const licenses: ContentLicense[] = [
  {
    id: "license-1",
    title: "Already Budgeted",
    provider: "Augustine Institute",
    installmentCents: 100000,
    cadence: "yearly",
    addedFiscalMonth: 1,
    notes: null
  }
];

const reviewItems: ContentReviewItem[] = [
  {
    id: "review-1",
    title: "Approved Review",
    provider: "Thomistic Institute",
    genre: null,
    format: null,
    reviewStatus: "approved",
    notes: null,
    proposedRateCents: 1200000,
    reviewLink: null,
    comparableContent: null
  },
  {
    id: "review-2",
    title: "Blocked Review",
    provider: "Studio",
    genre: null,
    format: null,
    reviewStatus: "blocked",
    notes: null,
    proposedRateCents: null,
    reviewLink: null,
    comparableContent: null
  }
];

const roadmapItems: RoadmapItem[] = [
  {
    id: "road-1",
    title: "Released Roadmap",
    provider: "Partner",
    releaseDate: "2027-01-01",
    status: "released",
    notes: null,
    categoryId: null
  },
  {
    id: "road-2",
    title: "Unscheduled Roadmap",
    provider: "Partner",
    releaseDate: "TBD",
    status: "planned",
    notes: null,
    categoryId: null
  },
  {
    id: "road-3",
    title: "Blocked Roadmap",
    provider: "Partner",
    releaseDate: "2027-02-01",
    status: "blocked",
    notes: null,
    categoryId: null
  }
];

describe("buildNeedsAttentionItems", () => {
  it("flags stalled planning items and titles that need to move forward", () => {
    const items = buildNeedsAttentionItems({
      licenses,
      reviewItems,
      roadmapItems,
      remainingBudgetCents: 900000
    });

    expect(items.map((item) => item.title)).toEqual([
      "Approved Review",
      "Released Roadmap",
      "Released Roadmap",
      "Unscheduled Roadmap",
      "Blocked Review",
      "Blocked Roadmap"
    ]);
    expect(items.map((item) => item.detail)).toContain("Released roadmap item needs a Formed link.");
  });

  it("flags low remaining budget", () => {
    const items = buildNeedsAttentionItems({
      licenses,
      reviewItems: [],
      roadmapItems: [],
      remainingBudgetCents: 250000
    });

    expect(items).toEqual([
      expect.objectContaining({
        title: "Budget is getting tight",
        detail: "$2,500.00 remaining"
      })
    ]);
  });

  it("does not flag released roadmap items already in the budget", () => {
    const items = buildNeedsAttentionItems({
      licenses,
      reviewItems: [],
      roadmapItems: [
        {
          id: "road-budgeted",
          title: "Already Budgeted",
          provider: "Augustine Institute",
          releaseDate: "2027-03-01",
          status: "released",
          notes: null,
          categoryId: null,
          formedUrl: "https://watch.formed.org/already-budgeted"
        }
      ],
      remainingBudgetCents: 900000
    });

    expect(items).toEqual([]);
  });

  it("does not flag approved reviews already on the roadmap", () => {
    const items = buildNeedsAttentionItems({
      licenses,
      reviewItems: [reviewItems[0]],
      roadmapItems: [
        {
          id: "road-approved",
          title: "Approved Review",
          provider: "Thomistic Institute",
          releaseDate: "2027-04-01",
          status: "planned",
          notes: null,
          categoryId: null
        }
      ],
      remainingBudgetCents: 900000
    });

    expect(items).toEqual([]);
  });

  it("does not flag released roadmap items that already have Formed links", () => {
    const items = buildNeedsAttentionItems({
      licenses,
      reviewItems: [],
      roadmapItems: [
        {
          id: "road-formed",
          title: "Released With Link",
          provider: "Augustine Institute",
          releaseDate: "2027-05-01",
          status: "released",
          notes: null,
          categoryId: null,
          formedUrl: "https://watch.formed.org/released-with-link"
        }
      ],
      remainingBudgetCents: 900000
    });

    expect(items).toEqual([
      expect.objectContaining({
        id: "roadmap-released-road-formed",
        detail: "Released roadmap item is not in the budget yet."
      })
    ]);
  });

  it("flags suggested Formed links as confirmation work", () => {
    const items = buildNeedsAttentionItems({
      licenses,
      reviewItems: [],
      roadmapItems: [
        {
          id: "road-candidate",
          title: "Released With Candidate",
          provider: "Augustine Institute",
          releaseDate: "2027-06-01",
          status: "released",
          notes: null,
          categoryId: null,
          formedUrlCandidate: "https://watch.formed.org/released-with-candidate"
        }
      ],
      remainingBudgetCents: 900000
    });

    expect(items).toEqual([
      expect.objectContaining({
        id: "roadmap-released-road-candidate",
        detail: "Released roadmap item is not in the budget yet."
      }),
      expect.objectContaining({
        id: "roadmap-formed-link-road-candidate",
        detail: "Released roadmap item has a suggested Formed link to confirm."
      })
    ]);
  });
});
