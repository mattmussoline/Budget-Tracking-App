import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { CONTENT_FORMATS, CONTENT_GENRES, REVIEW_STATUSES } from "./planning-constants";
import {
  buildMonthWindow,
  dollarsToOptionalCents,
  formatOptionalCurrency,
  formatRoadmapDate,
  formatRoadmapDateLabel,
  getRoadmapMonthKey,
  isMonthTbdRoadmapDate,
  normalizeMonthRange,
  parseLegacyReleaseMonth,
  parseMonthAnchor,
  shiftMonthAnchor
} from "./planning-model";

describe("planning taxonomies", () => {
  it("uses the approved review statuses", () => {
    expect(REVIEW_STATUSES.map((item) => item.label)).toEqual([
      "Not Started",
      "On the Radar",
      "In Progress",
      "Blocked",
      "Rejected",
      "Approved"
    ]);
  });

  it("uses all approved genres and formats", () => {
    expect(CONTENT_GENRES).toHaveLength(13);
    expect(CONTENT_GENRES.map((item) => item.label)).toContain("Christian Formation");
    expect(CONTENT_FORMATS).toHaveLength(15);
    expect(CONTENT_FORMATS.map((item) => item.label)).toContain("Docu-Series");
    expect(CONTENT_FORMATS.map((item) => item.label)).toContain("Sacramental Prep");
  });
});

describe("planning currency", () => {
  it("stores formatted dollar values as cents", () => {
    expect(dollarsToOptionalCents("$12,000.50")).toBe(1200050);
    expect(dollarsToOptionalCents("")).toBeNull();
    expect(formatOptionalCurrency(1200050)).toBe("$12,000.50");
  });
});

describe("roadmap month windows", () => {
  it("formats an exact roadmap date without timezone drift", () => {
    expect(formatRoadmapDate("2027-01-24")).toBe("January 24, 2027");
  });

  it("supports month-known TBD roadmap dates", () => {
    expect(isMonthTbdRoadmapDate("2027-02-TBD")).toBe(true);
    expect(getRoadmapMonthKey("2027-02-TBD")).toBe("2027-02");
    expect(formatRoadmapDateLabel("2027-02-TBD")).toBe("TBD");
  });

  it("normalizes supported month ranges", () => {
    expect(normalizeMonthRange("9")).toBe(9);
    expect(normalizeMonthRange("3")).toBe(6);
  });

  it("builds and shifts month anchors", () => {
    expect(parseMonthAnchor("2027-01", new Date(2026, 5, 1))).toBe("2027-01");
    expect(shiftMonthAnchor("2027-01", -6)).toBe("2026-07");
    expect(buildMonthWindow("2027-01", 6).map((month) => month.key)).toEqual([
      "2027-01",
      "2027-02",
      "2027-03",
      "2027-04",
      "2027-05",
      "2027-06"
    ]);
  });

  it("parses recognized legacy months and sends invalid values to backlog", () => {
    expect(parseLegacyReleaseMonth("August 2026")).toBe("2026-08-01");
    expect(parseLegacyReleaseMonth("sometime later")).toBeNull();
  });
});

describe("planning workspace migration", () => {
  it("adds review fields, roadmap dates, categories, indexes, and RLS", () => {
    const migrationPath = resolve("supabase/migrations/20260623213000_planning_workspace_redesign.sql");
    const sql = readFileSync(migrationPath, "utf8");

    expect(sql).toContain("proposed_rate_cents");
    expect(sql).toContain("review_status");
    expect(sql).toContain("create table if not exists public.roadmap_categories");
    expect(sql).toContain("category_id");
    expect(sql).toContain("enable row level security");
    expect(sql).toContain("roadmap_categories_fiscal_year_id_idx");
  });

  it("keeps roadmap release dates as text so TBD can be saved", () => {
    const schemaPath = resolve("supabase/schema.sql");
    const sql = readFileSync(schemaPath, "utf8");

    expect(sql).toContain("release_month text");
  });

  it("allows blocked roadmap items and no longer allows ready as a new status", () => {
    const schemaPath = resolve("supabase/schema.sql");
    const sql = readFileSync(schemaPath, "utf8");

    expect(sql).toContain("status in ('planned', 'in_progress', 'blocked', 'released')");
    expect(sql).not.toContain("status in ('planned', 'in_progress', 'ready', 'released')");
  });

  it("allows on-the-radar content review items", () => {
    const schemaPath = resolve("supabase/schema.sql");
    const sql = readFileSync(schemaPath, "utf8");

    expect(sql).toContain("review_status in ('not_started', 'on_the_radar', 'in_progress', 'blocked', 'rejected', 'approved')");
  });
});
