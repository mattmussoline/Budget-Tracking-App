import { describe, expect, it } from "vitest";
import { buildDashboardModel } from "./dashboard-model";
import type { ContentLicense } from "./budget-types";

const licenses: ContentLicense[] = [
  {
    id: "frassati",
    title: "Frassati",
    provider: "Provider A",
    installmentCents: 170000,
    cadence: "quarterly",
    addedFiscalMonth: 3
  },
  {
    id: "ben",
    title: "Ben Cello",
    provider: "Provider B",
    installmentCents: 600000,
    cadence: "quarterly",
    addedFiscalMonth: 4
  },
  {
    id: "heart",
    title: "A Father's Heart",
    provider: "Provider C",
    installmentCents: 60000,
    cadence: "yearly",
    addedFiscalMonth: 11
  }
];

describe("buildDashboardModel", () => {
  it("calculates budget totals and remaining amount", () => {
    const model = buildDashboardModel({
      fiscalYear: 2026,
      fiscalYearStartMonth: 7,
      budgetCents: 3000000,
      licenses
    });

    expect(model.totalSpentCents).toBe(2426667);
    expect(model.remainingCents).toBe(573333);
  });

  it("groups payment rows by fiscal month", () => {
    const model = buildDashboardModel({
      fiscalYear: 2026,
      fiscalYearStartMonth: 7,
      budgetCents: 3000000,
      licenses
    });

    expect(model.months.find((month) => month.index === 3)?.payments).toHaveLength(1);
    expect(model.months.find((month) => month.index === 4)?.payments.map((payment) => payment.title)).toEqual([
      "Ben Cello",
      "Frassati"
    ]);
  });

  it("groups totals by provider", () => {
    const model = buildDashboardModel({
      fiscalYear: 2026,
      fiscalYearStartMonth: 7,
      budgetCents: 3000000,
      licenses
    });

    expect(model.providers).toEqual([
      { provider: "Provider B", totalCents: 1800000 },
      { provider: "Provider A", totalCents: 566667 },
      { provider: "Provider C", totalCents: 60000 }
    ]);
  });
});
