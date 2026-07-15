import { describe, expect, it, vi } from "vitest";
import { getTodayKey, releaseDueScheduledRoadmapItems } from "./roadmap-auto-release";

describe("roadmap auto release", () => {
  it("formats today's date as an ISO day key", () => {
    expect(getTodayKey(new Date(2026, 6, 14, 9))).toBe("2026-07-14");
  });

  it("only releases scheduled roadmap items with exact dates on or before today", async () => {
    const lte = vi.fn().mockReturnValue({ error: null });
    const like = vi.fn().mockReturnValue({ lte });
    const eqStatus = vi.fn().mockReturnValue({ like });
    const eqFiscalYear = vi.fn().mockReturnValue({ eq: eqStatus });
    const update = vi.fn().mockReturnValue({ eq: eqFiscalYear });
    const from = vi.fn().mockReturnValue({ update });

    await releaseDueScheduledRoadmapItems(
      { from } as unknown as Parameters<typeof releaseDueScheduledRoadmapItems>[0],
      "00000000-0000-0000-0000-000000000028",
      "2026-07-14"
    );

    expect(from).toHaveBeenCalledWith("roadmap_items");
    expect(update).toHaveBeenCalledWith({ status: "released" });
    expect(eqFiscalYear).toHaveBeenCalledWith("fiscal_year_id", "00000000-0000-0000-0000-000000000028");
    expect(eqStatus).toHaveBeenCalledWith("status", "scheduled");
    expect(like).toHaveBeenCalledWith("release_month", "____-__-__");
    expect(lte).toHaveBeenCalledWith("release_month", "2026-07-14");
  });
});
