import { SCORE_DIMENSIONS, type CoproductionOpportunity, type CoproductionStage, type CoproductionUpdate } from "./coproduction-types";

const SCORE_COLUMN: Record<string, string> = {
  mission: "score_mission",
  audience: "score_audience",
  economics: "score_economics",
  partner: "score_partner",
  delivery: "score_delivery"
};

/** Shared by the CRUD actions (which need only the row just written) and the page loader (which attaches the update log). */
export function mapCoproductionRow(row: Record<string, unknown>, updates: CoproductionUpdate[] = []): CoproductionOpportunity {
  return {
    id: row.id as string,
    title: row.title as string,
    partner: row.partner as string,
    format: (row.format as string) ?? "",
    genre: (row.genre as string) ?? "",
    episodes: (row.episodes as string) ?? "",
    askCents: Number(row.ask_cents ?? 0),
    likelihood: Number(row.likelihood ?? 0),
    likelihoodRationale: (row.likelihood_rationale as string) ?? "",
    stage: row.stage as CoproductionStage,
    art: { from: "#0e3b4a", to: "#14607a", motif: "table" },
    imageUrl: (row.image_url as string | null) ?? null,
    scores: Object.fromEntries(
      SCORE_DIMENSIONS.map((dimension) => [
        dimension,
        {
          value: Number(row[SCORE_COLUMN[dimension]] ?? 0),
          rationale: (row[`${SCORE_COLUMN[dimension]}_rationale`] as string) ?? ""
        }
      ])
    ) as CoproductionOpportunity["scores"],
    gradedBy: (row.graded_by as string) ?? "",
    gradedAt: (row.graded_at as string) ?? "",
    updatedAt: row.updated_at as string,
    notes: row.notes ? [{ kind: "paragraph", body: row.notes as string }] : [],
    metadata: [],
    updates
  };
}
