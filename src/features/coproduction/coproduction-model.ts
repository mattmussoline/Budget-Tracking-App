import type { PlanningTone } from "@/features/planning/planning-constants";
import type {
  CoproductionOpportunity,
  CoproductionStage,
  ScoreDimension
} from "./coproduction-types";

/**
 * What we treat as a fair co-production buy-in for one finished hour. Every
 * card compares its own cost per hour against this, so the number on screen
 * means something instead of floating on its own.
 */
export const HOUR_BENCHMARK_CENTS = 12_500_000;

export type ScoreRubricBand = {
  range: string;
  standard: string;
};

export type ScoreRubric = {
  dimension: ScoreDimension;
  label: string;
  /** Share of the final grade. The five weights add up to 1. */
  weight: number;
  question: string;
  bands: ScoreRubricBand[];
};

export const SCORE_RUBRIC: ScoreRubric[] = [
  {
    dimension: "mission",
    label: "Mission fit",
    weight: 0.3,
    question: "Does this advance Catholic formation, and does it fill a gap we actually have?",
    bands: [
      { range: "90–100", standard: "Lands on a named fiscal-year pillar we are thin on, and is catechetically sound with no review risk." },
      { range: "75–89", standard: "Clearly on-mission, but overlaps content already in the catalog." },
      { range: "60–74", standard: "Adjacent to the mission. Needs a host or framing to make the connection land." },
      { range: "Under 60", standard: "Faith-adjacent at best, or it raises doctrinal review concerns." }
    ]
  },
  {
    dimension: "audience",
    label: "Audience demand",
    weight: 0.25,
    question: "Is there evidence our subscribers will actually watch this?",
    bands: [
      { range: "90–100", standard: "Comparable titles sit in our top decile for first-week views and completion." },
      { range: "75–89", standard: "Solid comparables. Predictable mid-tier performance." },
      { range: "60–74", standard: "The format performs modestly for us — steady accumulation, no launch spike." },
      { range: "Under 60", standard: "No comparable has worked for us, or the audience sits outside our base." }
    ]
  },
  {
    dimension: "economics",
    label: "Economics",
    weight: 0.2,
    question: "Is the price right for what we get — measured per finished hour, against the rights term and our share?",
    bands: [
      { range: "90–100", standard: "At or below the $125K per-finished-hour benchmark, long or perpetual rights, partner carrying real cost." },
      { range: "75–89", standard: "Fair price. Term or revenue share slightly worse than benchmark." },
      { range: "60–74", standard: "Above benchmark, or a theatrical window defers our value by a year or more." },
      { range: "Under 60", standard: "The ask is a material share of the whole line for a minority position." }
    ]
  },
  {
    dimension: "partner",
    label: "Partner strength",
    weight: 0.15,
    question: "Can we rely on this partner to deliver, and do we want the relationship after this title?",
    bands: [
      { range: "90–100", standard: "Delivered for us before, on time, clean paperwork. We want their next one." },
      { range: "75–89", standard: "Established shop with good references, but first time working with us." },
      { range: "60–74", standard: "Credible, but unproven at this scale or this volume." },
      { range: "Under 60", standard: "No track record, or a prior delivery went badly." }
    ]
  },
  {
    dimension: "delivery",
    label: "Deliverability",
    weight: 0.1,
    question: "Will it actually arrive, in the window, at spec?",
    bands: [
      { range: "90–100", standard: "Locked schedule, crew and locations secured, pilot or footage already in hand." },
      { range: "75–89", standard: "Realistic schedule carrying normal production risk." },
      { range: "60–74", standard: "Optimistic for the partner's capacity, or key permits and talent still open." },
      { range: "Under 60", standard: "No credible path to the delivery date." }
    ]
  }
];

export const LIKELIHOOD_RUBRIC = {
  question: "The chance this title ends up in the catalog on terms we would accept.",
  bands: [
    { range: "70–100", standard: "Terms substantially agreed. What is left is paperwork or a delivery date." },
    { range: "40–69", standard: "Real negotiation still open on price, length, rights, or window." },
    { range: "10–39", standard: "We are far apart on something structural, or waiting on the partner's financing." },
    { range: "Under 10", standard: "Effectively closed. Kept on the slate as the record of the decision." }
  ]
} satisfies { question: string; bands: ScoreRubricBand[] };

export type StageOption = {
  value: CoproductionStage;
  label: string;
  tone: PlanningTone;
};

export const STAGE_OPTIONS: StageOption[] = [
  { value: "inbound", label: "Inbound", tone: "cyan" },
  { value: "in_review", label: "In Review", tone: "purple" },
  { value: "negotiating", label: "Negotiating", tone: "amber" },
  { value: "greenlit", label: "Greenlit", tone: "green" },
  { value: "passed", label: "Passed", tone: "slate" }
];

export function stageOption(stage: CoproductionStage | null) {
  return STAGE_OPTIONS.find((option) => option.value === stage) ?? STAGE_OPTIONS[0];
}

export function stageLabel(stage: CoproductionStage | null) {
  return stage ? stageOption(stage).label : "";
}

const GRADE_LADDER = [
  { min: 97, letter: "A+" },
  { min: 93, letter: "A" },
  { min: 90, letter: "A-" },
  { min: 87, letter: "B+" },
  { min: 83, letter: "B" },
  { min: 80, letter: "B-" },
  { min: 77, letter: "C+" },
  { min: 73, letter: "C" },
  { min: 70, letter: "C-" },
  { min: 67, letter: "D+" },
  { min: 63, letter: "D" },
  { min: 60, letter: "D-" },
  { min: Number.NEGATIVE_INFINITY, letter: "F" }
] as const;

export type GradeTier = "A" | "B" | "C" | "D" | "F";

export const GRADE_TIER_ORDER: GradeTier[] = ["A", "B", "C", "D", "F"];

export const GRADE_TIER_TONE: Record<GradeTier, PlanningTone> = {
  A: "green",
  B: "blue",
  C: "amber",
  D: "orange",
  F: "red"
};

/** Weighted roll-up of the five sub-scores, on the same 0–100 scale. */
export function weightedScore(scores: Record<ScoreDimension, { value: number }>) {
  return SCORE_RUBRIC.reduce((total, { dimension, weight }) => total + scores[dimension].value * weight, 0);
}

export function gradeLetter(score: number) {
  return GRADE_LADDER.find((step) => score >= step.min)?.letter ?? "F";
}

export function gradeTier(letter: string): GradeTier {
  const tier = letter.charAt(0);
  return GRADE_TIER_ORDER.includes(tier as GradeTier) ? (tier as GradeTier) : "F";
}

/**
 * Asking price discounted by how likely we are to win it. Summed across the
 * slate this is the number worth reserving, since the full asking total would
 * lock up money we never spend.
 */
export function expectedCostCents(opportunity: Pick<CoproductionOpportunity, "askCents" | "likelihood">) {
  return Math.round(opportunity.askCents * (opportunity.likelihood / 100));
}

/** Reads "8 × 26 min" back as 3.47 finished hours. */
export function finishedHours(episodes: string) {
  const parts = episodes.match(/(\d+)\s*(?:×|x)\s*(\d+)/);
  if (!parts) return null;
  const hours = (Number(parts[1]) * Number(parts[2])) / 60;
  return hours > 0 ? hours : null;
}

export function costPerFinishedHourCents(opportunity: Pick<CoproductionOpportunity, "askCents" | "episodes">) {
  const hours = finishedHours(opportunity.episodes);
  return hours ? Math.round(opportunity.askCents / hours) : null;
}

export type BenchmarkVerdict = "under" | "at" | "over";

export function benchmarkVerdict(rateCents: number): BenchmarkVerdict {
  const ratio = rateCents / HOUR_BENCHMARK_CENTS;
  if (ratio <= 0.9) return "under";
  if (ratio <= 1.1) return "at";
  return "over";
}

export const BENCHMARK_VERDICT_LABEL: Record<BenchmarkVerdict, string> = {
  under: "under benchmark",
  at: "at benchmark",
  over: "over benchmark"
};

/** Short form for tiles and dense lines: $95K, $3.33M, $12.5M. */
export function formatCompactCurrency(cents: number) {
  const dollars = cents / 100;
  if (dollars >= 1_000_000) {
    const millions = dollars / 1_000_000;
    return `$${millions.toFixed(millions >= 10 ? 1 : 2)}M`;
  }
  if (dollars >= 1_000) return `$${Math.round(dollars / 1_000)}K`;
  return `$${Math.round(dollars)}`;
}

export type GradedOpportunity = CoproductionOpportunity & {
  score: number;
  letter: string;
  tier: GradeTier;
  expectedCents: number;
  costPerHourCents: number | null;
};

export function gradeOpportunity(opportunity: CoproductionOpportunity): GradedOpportunity {
  const score = weightedScore(opportunity.scores);
  const letter = gradeLetter(score);

  return {
    ...opportunity,
    score,
    letter,
    tier: gradeTier(letter),
    expectedCents: expectedCostCents(opportunity),
    costPerHourCents: costPerFinishedHourCents(opportunity)
  };
}

export function gradeSlate(opportunities: CoproductionOpportunity[]) {
  return opportunities.map(gradeOpportunity);
}

export type SlateTotals = {
  liveCount: number;
  passedCount: number;
  totalAskCents: number;
  expectedCents: number;
  tierCounts: Record<GradeTier, number>;
  strongCount: number;
};

/**
 * Totals for the summary tiles. Passed titles stay on the slate as the record
 * of a decision, so they are counted separately and left out of the money.
 */
export function summarizeSlate(opportunities: GradedOpportunity[]): SlateTotals {
  const live = opportunities.filter((opportunity) => opportunity.stage !== "passed");

  const tierCounts = GRADE_TIER_ORDER.reduce((counts, tier) => {
    counts[tier] = opportunities.filter((opportunity) => opportunity.tier === tier).length;
    return counts;
  }, {} as Record<GradeTier, number>);

  return {
    liveCount: live.length,
    passedCount: opportunities.length - live.length,
    totalAskCents: live.reduce((total, opportunity) => total + opportunity.askCents, 0),
    expectedCents: live.reduce((total, opportunity) => total + opportunity.expectedCents, 0),
    tierCounts,
    strongCount: tierCounts.A + tierCounts.B
  };
}

export const SLATE_SORTS = [
  { value: "grade", label: "Opportunity rating" },
  { value: "likelihood", label: "Likelihood" },
  { value: "ask-desc", label: "Asking price, high to low" },
  { value: "ask-asc", label: "Asking price, low to high" },
  { value: "expected", label: "Expected cost" },
  { value: "updated", label: "Recently updated" }
] as const;

export type SlateSort = (typeof SLATE_SORTS)[number]["value"];

export type SlateFilters = {
  query: string;
  stage: CoproductionStage | "all";
};

export const emptySlateFilters: SlateFilters = { query: "", stage: "all" };

export function matchesSlateFilters(opportunity: GradedOpportunity, filters: SlateFilters) {
  if (filters.stage !== "all" && opportunity.stage !== filters.stage) return false;

  const query = filters.query.trim().toLowerCase();
  if (!query) return true;

  return opportunity.title.toLowerCase().includes(query) || opportunity.partner.toLowerCase().includes(query);
}

export function sortSlate(opportunities: GradedOpportunity[], sort: SlateSort) {
  const ordered = [...opportunities];

  switch (sort) {
    case "likelihood":
      return ordered.sort((a, b) => b.likelihood - a.likelihood);
    case "ask-desc":
      return ordered.sort((a, b) => b.askCents - a.askCents);
    case "ask-asc":
      return ordered.sort((a, b) => a.askCents - b.askCents);
    case "expected":
      return ordered.sort((a, b) => b.expectedCents - a.expectedCents);
    case "updated":
      return ordered.sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime());
    default:
      return ordered.sort((a, b) => b.score - a.score);
  }
}

export function buildSlateView(opportunities: GradedOpportunity[], filters: SlateFilters, sort: SlateSort) {
  return sortSlate(opportunities.filter((opportunity) => matchesSlateFilters(opportunity, filters)), sort);
}
