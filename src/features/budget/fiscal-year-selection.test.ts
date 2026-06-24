import { describe, expect, it } from "vitest";
import { getNextFiscalYear, selectFiscalYear } from "./fiscal-year-selection";

const fiscalYears = [
  { id: "fy-2027", is_pinned: false },
  { id: "fy-2026", is_pinned: true },
  { id: "fy-2025", is_pinned: false }
];

describe("selectFiscalYear", () => {
  it("uses a valid explicitly selected fiscal year", () => {
    expect(selectFiscalYear(fiscalYears, "fy-2025")?.id).toBe("fy-2025");
  });

  it("uses the pinned fiscal year when no valid selection is provided", () => {
    expect(selectFiscalYear(fiscalYears)?.id).toBe("fy-2026");
    expect(selectFiscalYear(fiscalYears, "missing")?.id).toBe("fy-2026");
  });

  it("uses the first fiscal year when none is pinned", () => {
    const unpinnedYears = fiscalYears.map((year) => ({ ...year, is_pinned: false }));

    expect(selectFiscalYear(unpinnedYears)?.id).toBe("fy-2027");
  });

  it("returns null when there are no fiscal years", () => {
    expect(selectFiscalYear([])).toBeNull();
  });
});

describe("getNextFiscalYear", () => {
  it("returns one year after the newest existing fiscal year", () => {
    expect(getNextFiscalYear([{ fiscal_year: 2027 }, { fiscal_year: 2028 }], 2026)).toBe(2029);
  });

  it("uses the fallback when there are no fiscal years", () => {
    expect(getNextFiscalYear([], 2026)).toBe(2026);
  });
});
