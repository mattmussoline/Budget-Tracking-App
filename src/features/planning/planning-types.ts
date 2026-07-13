import type { BudgetSource } from "@/features/budget/budget-source";

export type RoadmapStatus = "planned" | "in_progress" | "blocked" | "released";

export type RoadmapItem = {
  id: string;
  title: string;
  provider: string | null;
  genre?: string | null;
  format?: string | null;
  releaseDate: string | null;
  status: RoadmapStatus;
  budgetSource?: BudgetSource | null;
  notes: string | null;
  categoryId: string | null;
  clickupTaskId?: string | null;
  clickupTaskUrl?: string | null;
  clickupSyncedAt?: string | null;
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

export type ReviewStatus = "not_started" | "in_progress" | "blocked" | "rejected" | "approved";

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
};
