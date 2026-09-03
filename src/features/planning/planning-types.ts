import type { BudgetSource } from "@/features/budget/budget-source";

export const ROADMAP_STATUSES = ["planned", "scheduled", "in_progress", "blocked", "released"] as const;

export type RoadmapStatus = (typeof ROADMAP_STATUSES)[number];

export type RoadmapItem = {
  id: string;
  title: string;
  provider: string | null;
  genre?: string | null;
  format?: string | null;
  featuredInIndividualMarketing?: boolean | null;
  releaseDate: string | null;
  status: RoadmapStatus;
  budgetSource?: BudgetSource | null;
  notes: string | null;
  categoryId: string | null;
  clickupTaskId?: string | null;
  clickupTaskUrl?: string | null;
  clickupSyncedAt?: string | null;
  formedUrl?: string | null;
  formedUrlCandidate?: string | null;
};

export type RoadmapCategory = {
  id: string;
  name: string;
  colorKey: string;
  sortOrder: number;
  isActive: boolean;
};

export type OngoingSeries = {
  id: string;
  series: string;
  cadence: string;
  notes: string | null;
};

export type ReviewStatus = "not_started" | "on_the_radar" | "in_progress" | "blocked" | "rejected" | "approved";

export type ContentReviewItem = {
  id: string;
  title: string;
  provider: string | null;
  genre: string | null;
  format: string | null;
  reviewStatus: ReviewStatus;
  budgetSource?: BudgetSource | null;
  notes: string | null;
  proposedRateCents: number | null;
  reviewLink: string | null;
  comparableContent: string | null;
  isCoproductionOpportunity?: boolean | null;
  /**
   * Ordering key for the manual review order, not the number shown on screen.
   * The queue displays each item's 1-based position after sorting by this
   * column, so adding a review only has to write one row instead of renumbering
   * the whole list.
   */
  priorityRank?: number | null;
};

export type ContentReviewUpdateKind = "note" | "status_change" | "created";

export type ContentReviewUpdate = {
  id: string;
  itemId: string;
  kind: ContentReviewUpdateKind;
  body: string | null;
  fromStatus: ReviewStatus | null;
  toStatus: ReviewStatus | null;
  authorEmail: string | null;
  createdAt: string;
};

export type ContentReviewGroupOrderRow = {
  reviewStatus: ReviewStatus;
  sortOrder: number;
};
