export type RoadmapStatus = "planned" | "in_progress" | "ready" | "released";

export type RoadmapItem = {
  id: string;
  title: string;
  provider: string | null;
  releaseMonth: string;
  status: RoadmapStatus;
  notes: string | null;
};

export type OngoingSeries = {
  id: string;
  series: string;
  cadence: string;
  notes: string | null;
};

export type ReviewStage = "new" | "reviewing" | "approved" | "parked" | "rejected";

export type ContentReviewItem = {
  id: string;
  title: string;
  provider: string | null;
  genre: string | null;
  format: string | null;
  stage: ReviewStage;
  notes: string | null;
};
