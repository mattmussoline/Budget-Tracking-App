import { formatCurrency } from "@/lib/currency";
import type { ContentReviewItem, RoadmapItem } from "@/features/planning/planning-types";
import type { ContentLicense } from "./budget-types";

type AttentionHref = "/dashboard" | "/roadmap" | "/content-review";

export type NeedsAttentionItem = {
  id: string;
  title: string;
  detail: string;
  tone: "amber" | "blue" | "red";
  href: AttentionHref;
};

type NeedsAttentionInput = {
  licenses: ContentLicense[];
  reviewItems: ContentReviewItem[];
  roadmapItems: RoadmapItem[];
  remainingBudgetCents: number;
};

const LOW_BUDGET_THRESHOLD_CENTS = 500000;

export function buildNeedsAttentionItems({
  licenses,
  reviewItems,
  roadmapItems,
  remainingBudgetCents
}: NeedsAttentionInput): NeedsAttentionItem[] {
  const budgetedTitles = new Set(licenses.map((license) => normalizeTitle(license.title)));
  const roadmapTitles = new Set(roadmapItems.map((roadmap) => normalizeTitle(roadmap.title)));
  const items: NeedsAttentionItem[] = [];

  for (const review of reviewItems) {
    if (review.reviewStatus === "approved" && !roadmapTitles.has(normalizeTitle(review.title))) {
      items.push({
        id: `review-approved-${review.id}`,
        title: review.title,
        detail: "Approved review is ready to send to the roadmap.",
        tone: "blue",
        href: "/content-review"
      });
    }
  }

  for (const roadmap of roadmapItems) {
    if (roadmap.status === "released" && !budgetedTitles.has(normalizeTitle(roadmap.title))) {
      items.push({
        id: `roadmap-released-${roadmap.id}`,
        title: roadmap.title,
        detail: "Released roadmap item is not in the budget yet.",
        tone: "blue",
        href: "/roadmap"
      });
    }
  }

  for (const roadmap of roadmapItems) {
    if (roadmap.status === "released" && !roadmap.formedUrl) {
      items.push({
        id: `roadmap-formed-link-${roadmap.id}`,
        title: roadmap.title,
        detail: roadmap.formedUrlCandidate ? "Released roadmap item has a suggested Formed link to confirm." : "Released roadmap item needs a Formed link.",
        tone: "amber",
        href: "/roadmap"
      });
    }
  }

  for (const roadmap of roadmapItems) {
    if (!roadmap.releaseDate || roadmap.releaseDate === "TBD") {
      items.push({
        id: `roadmap-unscheduled-${roadmap.id}`,
        title: roadmap.title,
        detail: "Roadmap item needs a release date.",
        tone: "amber",
        href: "/roadmap"
      });
    }
  }

  for (const review of reviewItems) {
    if (review.reviewStatus === "blocked") {
      items.push({
        id: `review-blocked-${review.id}`,
        title: review.title,
        detail: "Content review is blocked.",
        tone: "red",
        href: "/content-review"
      });
    }
  }

  for (const roadmap of roadmapItems) {
    if (roadmap.status === "blocked") {
      items.push({
        id: `roadmap-blocked-${roadmap.id}`,
        title: roadmap.title,
        detail: "Roadmap item is blocked.",
        tone: "red",
        href: "/roadmap"
      });
    }
  }

  if (remainingBudgetCents <= LOW_BUDGET_THRESHOLD_CENTS) {
    items.push({
      id: "budget-low",
      title: "Budget is getting tight",
      detail: `${formatCurrency(remainingBudgetCents)} remaining`,
      tone: "amber",
      href: "/dashboard"
    });
  }

  return items;
}

function normalizeTitle(title: string) {
  return title.trim().toLowerCase();
}
