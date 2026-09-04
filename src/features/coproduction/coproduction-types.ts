export const COPRODUCTION_STAGES = ["inbound", "in_review", "negotiating", "greenlit", "passed"] as const;

export type CoproductionStage = (typeof COPRODUCTION_STAGES)[number];

export const SCORE_DIMENSIONS = ["mission", "audience", "economics", "partner", "delivery"] as const;

export type ScoreDimension = (typeof SCORE_DIMENSIONS)[number];

export type ArtMotif = "ripples" | "flame" | "table" | "rays" | "path" | "bloom" | "hours";

/** Placeholder key art until a partner sends a logo or thumbnail. */
export type OpportunityArt = {
  from: string;
  to: string;
  motif: ArtMotif;
};

/** One sub-score together with the sentence that justifies it. */
export type OpportunityScore = {
  value: number;
  rationale: string;
};

export type NoteBlock =
  | { kind: "paragraph"; lead?: string; body: string }
  | { kind: "bullets"; items: string[] };

export type MetadataField = {
  label: string;
  value: string;
};

export type CoproductionUpdateKind = "note" | "stage_change" | "created";

export type CoproductionUpdate = {
  id: string;
  opportunityId: string;
  kind: CoproductionUpdateKind;
  body: string | null;
  fromStage: CoproductionStage | null;
  toStage: CoproductionStage | null;
  authorEmail: string | null;
  createdAt: string;
};

export type CoproductionOpportunity = {
  id: string;
  title: string;
  partner: string;
  format: string;
  genre: string;
  /**
   * Order written the way a deal memo writes it, such as "8 × 26 min". The
   * model reads it back to work out cost per finished hour, so the shape
   * matters more than it looks.
   */
  episodes: string;
  askCents: number;
  /** 0–100 read on the chance this lands on terms we would accept. */
  likelihood: number;
  likelihoodRationale: string;
  stage: CoproductionStage;
  art: OpportunityArt;
  /** Uploaded key art or logo, shown in place of the placeholder motif when present. */
  imageUrl?: string | null;
  scores: Record<ScoreDimension, OpportunityScore>;
  gradedBy: string;
  gradedAt: string;
  updatedAt: string;
  notes: NoteBlock[];
  metadata: MetadataField[];
  updates: CoproductionUpdate[];
};
