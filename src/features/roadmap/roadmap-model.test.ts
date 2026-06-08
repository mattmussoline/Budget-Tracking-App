import { describe, expect, it } from "vitest";
import { buildFiscalYearStats, getCurrentFiscalYear, getVisibleRoadmapMonths } from "./roadmap-model";
import type { RoadmapMonth } from "./roadmap-types";

const months: RoadmapMonth[] = [
  {
    id: "may-26",
    label: "May 26",
    monthStart: "2026-05-01",
    launchCount: 1,
    releases: [
      {
        id: "kids-may",
        title: "Kids May",
        audience: "Kids / Family",
        format: "Show",
        releaseDate: "5/3",
        status: "Scheduled",
        genre: "kids",
        notes: "Kids release"
      }
    ]
  },
  {
    id: "june-26",
    label: "June 26",
    monthStart: "2026-06-01",
    launchCount: 2,
    releases: [
      {
        id: "adult-june",
        title: "Adult June",
        audience: "Adult",
        format: "Formation",
        releaseDate: "6/3",
        status: "Needs Date",
        genre: "adult",
        notes: "Needs launch timing"
      },
      {
        id: "risk-june",
        title: "Risk June",
        audience: "Parish",
        format: "Film",
        releaseDate: "Needs date",
        status: "Strategic Need",
        genre: "risk",
        notes: "At risk"
      }
    ]
  },
  {
    id: "july-26",
    label: "July 26",
    monthStart: "2026-07-01",
    launchCount: 1,
    releases: [
      {
        id: "adult-july",
        title: "Adult July",
        audience: "Adult",
        format: "Formation",
        releaseDate: "7/3",
        status: "Scheduled",
        genre: "adult",
        notes: "Next fiscal year"
      }
    ]
  }
];

describe("roadmap model", () => {
  it("uses July through June as the current fiscal year", () => {
    expect(getCurrentFiscalYear(new Date("2026-06-05T12:00:00Z"))).toEqual({
      label: "FY26",
      start: "2025-07-01",
      end: "2026-06-30"
    });

    expect(getCurrentFiscalYear(new Date("2026-07-01T12:00:00Z"))).toEqual({
      label: "FY27",
      start: "2026-07-01",
      end: "2027-06-30"
    });
  });

  it("builds top stats from releases inside the current fiscal year only", () => {
    const stats = buildFiscalYearStats(months, new Date("2026-06-05T12:00:00Z"));

    expect(stats.map((stat) => [stat.label, stat.value])).toEqual([
      ["Planned Releases", "3"],
      ["Kids / Family", "1"],
      ["Strategic Needs", "1"],
      ["At Risk / TBD", "2"]
    ]);
  });

  it("hides past months unless explicitly included", () => {
    expect(getVisibleRoadmapMonths(months, new Date("2026-06-05T12:00:00Z"), false).map((month) => month.id)).toEqual([
      "june-26",
      "july-26"
    ]);
    expect(getVisibleRoadmapMonths(months, new Date("2026-06-05T12:00:00Z"), true).map((month) => month.id)).toEqual([
      "may-26",
      "june-26",
      "july-26"
    ]);
  });
});
