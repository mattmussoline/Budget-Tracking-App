import { describe, expect, it } from "vitest";
import {
  HOUR_BENCHMARK_CENTS,
  SCORE_RUBRIC,
  benchmarkVerdict,
  buildSlateView,
  costPerFinishedHourCents,
  expectedCostCents,
  finishedHours,
  formatCompactCurrency,
  gradeLetter,
  gradeOpportunity,
  gradeSlate,
  gradeTier,
  matchesSlateFilters,
  sortSlate,
  summarizeSlate,
  weightedScore
} from "./coproduction-model";
import { demoCoproductionOpportunities } from "./demo-coproduction";
import type { CoproductionOpportunity, ScoreDimension } from "./coproduction-types";

function scoresOf(values: Record<ScoreDimension, number>) {
  return {
    mission: { value: values.mission, rationale: "" },
    audience: { value: values.audience, rationale: "" },
    economics: { value: values.economics, rationale: "" },
    partner: { value: values.partner, rationale: "" },
    delivery: { value: values.delivery, rationale: "" }
  };
}

function opportunity(overrides: Partial<CoproductionOpportunity> = {}): CoproductionOpportunity {
  return {
    id: "test-1",
    title: "Test Title",
    partner: "Test Partner",
    format: "Docu-Series",
    genre: "Scripture",
    episodes: "8 × 26 min",
    askCents: 45000000,
    likelihood: 50,
    likelihoodRationale: "",
    stage: "in_review",
    art: { from: "#000000", to: "#111111", motif: "ripples" },
    scores: scoresOf({ mission: 80, audience: 80, economics: 80, partner: 80, delivery: 80 }),
    gradedBy: "Tester",
    gradedAt: "Sep 1, 2026",
    updatedAt: "2026-09-01T00:00:00.000Z",
    notes: [],
    metadata: [],
    updates: [],
    ...overrides
  };
}

describe("score rubric", () => {
  it("splits the grade across five weights that add up to a whole", () => {
    const total = SCORE_RUBRIC.reduce((sum, entry) => sum + entry.weight, 0);

    expect(SCORE_RUBRIC).toHaveLength(5);
    expect(total).toBeCloseTo(1, 10);
  });

  it("documents a standard for every band of every dimension", () => {
    for (const entry of SCORE_RUBRIC) {
      expect(entry.question.length).toBeGreaterThan(10);
      expect(entry.bands).toHaveLength(4);
      for (const band of entry.bands) expect(band.standard.length).toBeGreaterThan(10);
    }
  });
});

describe("weightedScore", () => {
  it("returns the flat score when every dimension agrees", () => {
    expect(weightedScore(scoresOf({ mission: 80, audience: 80, economics: 80, partner: 80, delivery: 80 }))).toBeCloseTo(80);
  });

  it("weights mission fit more heavily than deliverability", () => {
    const strongMission = weightedScore(scoresOf({ mission: 100, audience: 60, economics: 60, partner: 60, delivery: 60 }));
    const strongDelivery = weightedScore(scoresOf({ mission: 60, audience: 60, economics: 60, partner: 60, delivery: 100 }));

    expect(strongMission).toBeGreaterThan(strongDelivery);
  });
});

describe("gradeLetter", () => {
  it("maps each band to its letter", () => {
    expect(gradeLetter(98)).toBe("A+");
    expect(gradeLetter(93)).toBe("A");
    expect(gradeLetter(90)).toBe("A-");
    expect(gradeLetter(87)).toBe("B+");
    expect(gradeLetter(83)).toBe("B");
    expect(gradeLetter(80)).toBe("B-");
    expect(gradeLetter(77)).toBe("C+");
    expect(gradeLetter(73)).toBe("C");
    expect(gradeLetter(70)).toBe("C-");
    expect(gradeLetter(67)).toBe("D+");
    expect(gradeLetter(63)).toBe("D");
    expect(gradeLetter(60)).toBe("D-");
    expect(gradeLetter(41)).toBe("F");
  });

  it("collapses a letter to its tier", () => {
    expect(gradeTier("A+")).toBe("A");
    expect(gradeTier("B-")).toBe("B");
    expect(gradeTier("F")).toBe("F");
  });
});

describe("expectedCostCents", () => {
  it("discounts the asking price by the likelihood of winning it", () => {
    expect(expectedCostCents({ askCents: 100000000, likelihood: 25 })).toBe(25000000);
    expect(expectedCostCents({ askCents: 45000000, likelihood: 72 })).toBe(32400000);
  });

  it("reserves nothing for an opportunity with no chance", () => {
    expect(expectedCostCents({ askCents: 210000000, likelihood: 0 })).toBe(0);
  });
});

describe("cost per finished hour", () => {
  it("reads an episode order back as finished hours", () => {
    expect(finishedHours("8 × 26 min")).toBeCloseTo(3.4667, 3);
    expect(finishedHours("24 × 8 min")).toBeCloseTo(3.2);
    expect(finishedHours("nothing parseable")).toBeNull();
  });

  it("prices the order against the per-hour benchmark", () => {
    const rate = costPerFinishedHourCents({ askCents: 26000000, episodes: "6 × 22 min" });

    expect(rate).not.toBeNull();
    expect(formatCompactCurrency(rate as number)).toBe("$118K");
    // 5.6% below the benchmark still counts as at benchmark; the band is ±10%.
    expect(benchmarkVerdict(rate as number)).toBe("at");
    expect(benchmarkVerdict(costPerFinishedHourCents({ askCents: 9500000, episodes: "24 × 8 min" }) as number)).toBe("under");
  });

  it("labels a rate near the benchmark as at benchmark and a steep one as over", () => {
    expect(benchmarkVerdict(HOUR_BENCHMARK_CENTS)).toBe("at");
    expect(benchmarkVerdict(HOUR_BENCHMARK_CENTS * 1.05)).toBe("at");
    expect(benchmarkVerdict(HOUR_BENCHMARK_CENTS * 0.5)).toBe("under");
    expect(benchmarkVerdict(HOUR_BENCHMARK_CENTS * 3)).toBe("over");
  });
});

describe("formatCompactCurrency", () => {
  it("keeps tiles readable at every magnitude", () => {
    expect(formatCompactCurrency(9500000)).toBe("$95K");
    expect(formatCompactCurrency(332500000)).toBe("$3.33M");
    expect(formatCompactCurrency(1250000000)).toBe("$12.5M");
  });
});

describe("gradeOpportunity", () => {
  it("attaches the roll-up, the letter, and the derived money to the record", () => {
    const graded = gradeOpportunity(opportunity({
      askCents: 26000000,
      likelihood: 61,
      episodes: "6 × 22 min",
      scores: scoresOf({ mission: 93, audience: 88, economics: 92, partner: 90, delivery: 90 })
    }));

    expect(graded.score).toBeCloseTo(90.8, 5);
    expect(graded.letter).toBe("A-");
    expect(graded.tier).toBe("A");
    expect(graded.expectedCents).toBe(15860000);
    expect(graded.costPerHourCents).toBe(11818182);
  });
});

describe("summarizeSlate", () => {
  it("leaves passed titles out of the money but keeps them in the grade spread", () => {
    const totals = summarizeSlate(gradeSlate([
      opportunity({ id: "live-1", askCents: 10000000, likelihood: 50, stage: "in_review" }),
      opportunity({ id: "live-2", askCents: 20000000, likelihood: 25, stage: "negotiating" }),
      opportunity({ id: "gone", askCents: 90000000, likelihood: 5, stage: "passed" })
    ]));

    expect(totals.liveCount).toBe(2);
    expect(totals.passedCount).toBe(1);
    expect(totals.totalAskCents).toBe(30000000);
    expect(totals.expectedCents).toBe(10000000);
    expect(totals.tierCounts.B).toBe(3);
  });

  it("counts the B-or-better titles as the strong end of the slate", () => {
    const totals = summarizeSlate(gradeSlate([
      opportunity({ id: "strong", scores: scoresOf({ mission: 95, audience: 95, economics: 95, partner: 95, delivery: 95 }) }),
      opportunity({ id: "weak", scores: scoresOf({ mission: 50, audience: 50, economics: 50, partner: 50, delivery: 50 }) })
    ]));

    expect(totals.tierCounts.A).toBe(1);
    expect(totals.tierCounts.F).toBe(1);
    expect(totals.strongCount).toBe(1);
  });
});

describe("filtering and sorting", () => {
  const slate = gradeSlate(demoCoproductionOpportunities);

  it("matches on title or partner, case-insensitively", () => {
    const well = slate.find((entry) => entry.title === "The Well");
    if (!well) throw new Error("expected demo slate to include The Well");

    expect(matchesSlateFilters(well, { query: "well", stage: "all" })).toBe(true);
    expect(matchesSlateFilters(well, { query: "NORTHLIGHT", stage: "all" })).toBe(true);
    expect(matchesSlateFilters(well, { query: "kestrel", stage: "all" })).toBe(false);
  });

  it("narrows to one stage without dropping the search", () => {
    const negotiating = slate.filter((entry) => matchesSlateFilters(entry, { query: "", stage: "negotiating" }));

    expect(negotiating.map((entry) => entry.title)).toEqual(["The Well"]);
    expect(slate.filter((entry) => matchesSlateFilters(entry, { query: "well", stage: "greenlit" }))).toHaveLength(0);
  });

  it("orders by each column the toolbar offers", () => {
    expect(sortSlate(slate, "grade")[0].title).toBe("The Well");
    expect(sortSlate(slate, "likelihood")[0].title).toBe("Advent in Assisi");
    expect(sortSlate(slate, "ask-desc")[0].title).toBe("The Ninth Hour");
    expect(sortSlate(slate, "ask-asc")[0].title).toBe("Advent in Assisi");
    expect(sortSlate(slate, "expected")[0].title).toBe("Ember & Ash");
    expect(sortSlate(slate, "updated")[0].title).toBe("Table of Kings");
  });

  it("does not reorder the caller's array in place", () => {
    const before = slate.map((entry) => entry.id);
    sortSlate(slate, "ask-desc");

    expect(slate.map((entry) => entry.id)).toEqual(before);
  });

  it("filters and sorts together for the rendered view", () => {
    const view = buildSlateView(slate, { query: "", stage: "in_review" }, "ask-desc");

    expect(view.map((entry) => entry.title)).toEqual(["Ember & Ash", "Rule of Life", "Table of Kings"]);
  });
});

describe("demo slate", () => {
  it("grades every sample title inside the 0–100 scale", () => {
    for (const graded of gradeSlate(demoCoproductionOpportunities)) {
      expect(graded.score).toBeGreaterThan(0);
      expect(graded.score).toBeLessThanOrEqual(100);
      expect(graded.likelihood).toBeGreaterThanOrEqual(0);
      expect(graded.likelihood).toBeLessThanOrEqual(100);
      expect(graded.letter).not.toBe("");
    }
  });

  it("keeps every update attached to the title it belongs to", () => {
    for (const entry of demoCoproductionOpportunities) {
      for (const update of entry.updates) expect(update.opportunityId).toBe(entry.id);
    }
  });
});
