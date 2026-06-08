import { describe, expect, it } from "vitest";
import { filterRoadmapMonths } from "./roadmap-filter";
import type { RoadmapMonth } from "./roadmap-types";

const months: RoadmapMonth[] = [
  {
    id: "march-26",
    label: "March 26",
    monthStart: "2026-03-01",
    launchCount: 2,
    releases: [
      {
        id: "wcb-fasting",
        title: "Fasting | What Catholics Believe",
        audience: "Adult",
        format: "Formation",
        releaseDate: "March 4",
        status: "Scheduled",
        genre: "adult",
        notes: "Lenten formation",
        series: "What Catholics Believe"
      },
      {
        id: "ben-cell",
        title: "Ben Cell Ep. 5 & 6",
        audience: "Kids",
        format: "Series",
        releaseDate: "March 18",
        status: "Scheduled",
        genre: "kids",
        notes: "Family release",
        series: "Ben Cell"
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
        id: "cabrini",
        title: "Cabrini",
        audience: "Adult",
        format: "Film",
        releaseDate: "Needs date",
        status: "Strategic Need",
        genre: "risk",
        notes: "Needs decision before launch window"
      }
    ]
  }
];

describe("filterRoadmapMonths", () => {
  it("keeps only releases matching the active roadmap filter", () => {
    const result = filterRoadmapMonths(months, "Kids", "");

    expect(result).toHaveLength(1);
    expect(result[0]?.label).toBe("March 26");
    expect(result[0]?.releases).toHaveLength(1);
    expect(result[0]?.releases[0]?.title).toBe("Ben Cell Ep. 5 & 6");
  });

  it("searches title, series, genre, format, and notes", () => {
    expect(filterRoadmapMonths(months, "All", "adult")[0]?.releases[0]?.title).toContain("Fasting");
    expect(filterRoadmapMonths(months, "All", "ben cell")[0]?.releases[0]?.title).toContain("Ben Cell");
    expect(filterRoadmapMonths(months, "All", "film")[0]?.releases[0]?.title).toBe("Cabrini");
    expect(filterRoadmapMonths(months, "All", "decision")[0]?.releases[0]?.title).toBe("Cabrini");
  });
});
