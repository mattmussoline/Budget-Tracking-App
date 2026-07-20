import { describe, expect, it, vi } from "vitest";
import { extractFormedMatches, findExactFormedLink, findFormedLinkSuggestion, getTodayKey, releaseDueScheduledRoadmapItems, syncReleasedRoadmapFormedLinks } from "./roadmap-auto-release";

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

  it("extracts Formed content links from search markup", () => {
    expect(
      extractFormedMatches(`
        <a href="/sign-in">Sign in</a>
        <a href="/pilgrim-road"><span>Pilgrim Road</span></a>
        <a href="https://watch.formed.org/the-search">The Search</a>
      `)
    ).toEqual([
      { title: "Pilgrim Road", url: "https://watch.formed.org/pilgrim-road" },
      { title: "The Search", url: "https://watch.formed.org/the-search" }
    ]);
  });

  it("fills exact released roadmap Formed links and stores uncertain candidates", async () => {
    const updateIsCandidate = vi.fn().mockReturnValue({ error: null });
    const updateIsFormedUrl = vi.fn().mockReturnValue({ is: updateIsCandidate });
    const updateEqFiscalYear = vi.fn().mockReturnValue({ is: updateIsFormedUrl });
    const updateEqId = vi.fn().mockReturnValue({ eq: updateEqFiscalYear });
    const update = vi.fn().mockReturnValue({ eq: updateEqId });
    const limit = vi.fn().mockResolvedValue({
      data: [
        { id: "road-1", title: "Pilgrim Road" },
        { id: "road-2", title: "Ambiguous Title" }
      ],
      error: null
    });
    const selectIsCandidate = vi.fn().mockReturnValue({ limit });
    const selectIsFormedUrl = vi.fn().mockReturnValue({ is: selectIsCandidate });
    const selectEqStatus = vi.fn().mockReturnValue({ is: selectIsFormedUrl });
    const selectEqFiscalYear = vi.fn().mockReturnValue({ eq: selectEqStatus });
    const select = vi.fn().mockReturnValue({ eq: selectEqFiscalYear });
    const from = vi.fn().mockReturnValue({ select, update });

    await syncReleasedRoadmapFormedLinks(
      { from } as unknown as Parameters<typeof syncReleasedRoadmapFormedLinks>[0],
      "00000000-0000-0000-0000-000000000028",
      async (title) => title === "Pilgrim Road"
        ? { formedUrl: "https://watch.formed.org/pilgrim-road", candidateUrl: null }
        : { formedUrl: null, candidateUrl: "https://watch.formed.org/ambiguous-title" }
    );

    expect(select).toHaveBeenCalledWith("id,title");
    expect(selectEqFiscalYear).toHaveBeenCalledWith("fiscal_year_id", "00000000-0000-0000-0000-000000000028");
    expect(selectEqStatus).toHaveBeenCalledWith("status", "released");
    expect(selectIsFormedUrl).toHaveBeenCalledWith("formed_url", null);
    expect(selectIsCandidate).toHaveBeenCalledWith("formed_url_candidate", null);
    expect(limit).toHaveBeenCalledWith(10);
    expect(update).toHaveBeenCalledTimes(2);
    expect(update).toHaveBeenNthCalledWith(1, { formed_url: "https://watch.formed.org/pilgrim-road", formed_url_candidate: null });
    expect(update).toHaveBeenNthCalledWith(2, { formed_url: null, formed_url_candidate: "https://watch.formed.org/ambiguous-title" });
    expect(updateEqId).toHaveBeenCalledWith("id", "road-1");
    expect(updateEqId).toHaveBeenCalledWith("id", "road-2");
    expect(updateEqFiscalYear).toHaveBeenCalledWith("fiscal_year_id", "00000000-0000-0000-0000-000000000028");
    expect(updateIsFormedUrl).toHaveBeenCalledWith("formed_url", null);
    expect(updateIsCandidate).toHaveBeenCalledWith("formed_url_candidate", null);
  });

  it("only accepts one exact Formed title match", async () => {
    const originalFetch = global.fetch;
    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      text: async () => `
        <a href="/pilgrim-road">Pilgrim Road</a>
        <a href="/pilgrim-road-trailer">Pilgrim Road Trailer</a>
      `
    } as Response);

    await expect(findExactFormedLink("Pilgrim Road")).resolves.toBe("https://watch.formed.org/pilgrim-road");
    await expect(findExactFormedLink("Missing Title")).resolves.toBeNull();

    global.fetch = originalFetch;
  });

  it("returns a candidate URL when the likely Formed slug exists but search has no exact match", async () => {
    const originalFetch = global.fetch;
    global.fetch = vi.fn()
      .mockResolvedValueOnce({
        ok: true,
        text: async () => "<a href=\"/browse\">Home</a>"
      } as Response)
      .mockResolvedValueOnce({
        ok: true,
        status: 200
      } as Response);

    await expect(findFormedLinkSuggestion("Ambiguous Title")).resolves.toEqual({
      formedUrl: null,
      candidateUrl: "https://watch.formed.org/ambiguous-title"
    });

    global.fetch = originalFetch;
  });
});
