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

  it("tracks donor-funded titles outside the committed misc budget while keeping them visible", () => {
    const model = buildDashboardModel({
      fiscalYear: 2026,
      fiscalYearStartMonth: 7,
      budgetCents: 3000000,
      licenses: [
        ...licenses,
        {
          id: "donor-special",
          title: "Donor Special",
          provider: "Provider D",
          installmentCents: 500000,
          cadence: "yearly",
          addedFiscalMonth: 1,
          budgetSource: "donor_funded"
        }
      ]
    });

    expect(model.totalSpentCents).toBe(2426667);
    expect(model.otherBudgetSpentCents).toBe(500000);
    expect(model.remainingCents).toBe(573333);
    expect(model.months.find((month) => month.index === 1)?.payments.map((payment) => payment.title)).toContain(
      "Donor Special"
    );
    expect(model.months.find((month) => month.index === 1)?.payments[0]).toMatchObject({
      budgetSource: "donor_funded"
    });
    expect(model.providers.some((provider) => provider.provider === "Provider D")).toBe(true);
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

  it("groups totals by provider and sorts by content pieces added", () => {
    const model = buildDashboardModel({
      fiscalYear: 2026,
      fiscalYearStartMonth: 7,
      budgetCents: 3000000,
      licenses: [
        ...licenses,
        {
          id: "provider-a-series",
          title: "Provider A Series",
          provider: "Provider A",
          installmentCents: 50000,
          cadence: "yearly",
          addedFiscalMonth: 2
        }
      ]
    });

    expect(model.providers).toEqual([
      { provider: "Provider A", totalCents: 616667, licenseCount: 2, licenseSharePercent: 50 },
      { provider: "Provider B", totalCents: 1800000, licenseCount: 1, licenseSharePercent: 25 },
      { provider: "Provider C", totalCents: 60000, licenseCount: 1, licenseSharePercent: 25 }
    ]);
  });

  it("builds high-level dashboard insights", () => {
    const model = buildDashboardModel({
      fiscalYear: 2026,
      fiscalYearStartMonth: 7,
      budgetCents: 3000000,
      licenses
    });

    expect(model.insights).toMatchObject({
      licenseCount: 3,
      providerCount: 3,
      averageInstallmentCents: 276667,
      quarterlyLicenseCount: 2,
      yearlyLicenseCount: 1
    });
  });

  it("identifies the current fiscal quarter from the current fiscal month", () => {
    const model = buildDashboardModel({
      fiscalYear: 2026,
      fiscalYearStartMonth: 7,
      budgetCents: 3000000,
      licenses,
      now: new Date(2025, 9, 15)
    });

    expect(model.currentFiscalMonth).toBe(4);
    expect(model.currentFiscalQuarter).toBe(2);
  });
});
