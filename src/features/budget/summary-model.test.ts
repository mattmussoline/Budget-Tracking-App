import { describe, expect, it } from "vitest";
import type { ContentLicense } from "./budget-types";
import { buildDashboardModel } from "./dashboard-model";
import {
  buildLicensingSummaryView,
  buildSummaryAttention,
  getFiscalYearHealth,
  outlierAttentionKey,
  zeroRateAttentionKey
} from "./summary-model";

const licenses: ContentLicense[] = [
  {
    id: "l1",
    title: "Into Great Silence",
    provider: "Philip Gröning",
    installmentCents: 2250000,
    cadence: "yearly",
    addedFiscalMonth: 1,
    budgetSource: "misc_licensing"
  },
  {
    id: "l2",
    title: "The Ulmas",
    provider: "Ignatius Press",
    installmentCents: 25000,
    cadence: "quarterly",
    addedFiscalMonth: 2,
    budgetSource: "misc_licensing"
  },
  {
    id: "l3",
    title: "Cabrini",
    provider: "Angel Studios",
    installmentCents: 20000000,
    cadence: "yearly",
    addedFiscalMonth: 3,
    budgetSource: "donor_funded"
  },
  {
    id: "l4",
    title: "Chesterton",
    provider: "Ave Maria University",
    installmentCents: 0,
    cadence: "yearly",
    addedFiscalMonth: 1,
    budgetSource: "other"
  }
];

function buildView(overrides: { budgetCents?: number; licenses?: ContentLicense[] } = {}) {
  const list = overrides.licenses ?? licenses;
  const model = buildDashboardModel({
    fiscalYear: 2027,
    fiscalYearStartMonth: 7,
    budgetCents: overrides.budgetCents ?? 4000000,
    licenses: list,
    now: new Date(2026, 8, 16)
  });

  return buildLicensingSummaryView({ model, licenses: list });
}

describe("getFiscalYearHealth", () => {
  it("reads health off what is left, not what is spent", () => {
    expect(getFiscalYearHealth(60).label).toBe("On track");
    expect(getFiscalYearHealth(12).label).toBe("Watch closely");
    expect(getFiscalYearHealth(-5).label).toBe("Over budget");
  });
});

describe("buildSummaryAttention", () => {
  it("flags unpriced titles", () => {
    const items = buildSummaryAttention(licenses, 5568750);

    expect(items.map((item) => item.id)).toEqual(["zero-rate"]);
    expect(items[0].title).toBe("1 title has no confirmed rate");
    expect(items[0].detail).toBe("Chesterton");
  });

  it("flags the one deal that distorts the budget", () => {
    const evenSlate: ContentLicense[] = ["a", "b", "c", "d", "e"].map((id) => ({
      id,
      title: `Title ${id}`,
      provider: "Provider",
      installmentCents: 100000,
      cadence: "yearly" as const,
      addedFiscalMonth: 1
    }));
    const slate = [
      ...evenSlate,
      {
        id: "cabrini",
        title: "Cabrini",
        provider: "Angel Studios",
        installmentCents: 2000000,
        cadence: "yearly" as const,
        addedFiscalMonth: 3,
        budgetSource: "donor_funded" as const
      }
    ];

    const items = buildSummaryAttention(slate, 416667);

    expect(items.map((item) => item.id)).toEqual(["outlier-cabrini"]);
    expect(items[0].title).toBe("Cabrini is 5x the average installment");
    expect(items[0].detail).toBe("$20,000.00 on donor-funded budget.");
  });

  it("names at most three unpriced titles and pluralises the heading", () => {
    const unpriced = ["a", "b", "c", "d"].map((id, index) => ({
      id,
      title: `Title ${index + 1}`,
      provider: "Provider",
      installmentCents: 0,
      cadence: "yearly" as const,
      addedFiscalMonth: 1
    }));

    const [item] = buildSummaryAttention(unpriced, 0);

    expect(item.title).toBe("4 titles have no confirmed rate");
    expect(item.detail).toBe("Title 1, Title 2, Title 3, …");
  });

  it("says nothing when every title is priced and none is an outlier", () => {
    expect(buildSummaryAttention([licenses[0], licenses[1]], 1137500)).toEqual([]);
  });

  it("drops a title once its $0 rate is confirmed", () => {
    const dismissed = new Set([zeroRateAttentionKey("l4")]);

    expect(buildSummaryAttention(licenses, 5568750, dismissed)).toEqual([]);
  });

  it("drops the outlier once its amount is verified", () => {
    const evenSlate: ContentLicense[] = ["a", "b", "c", "d", "e"].map((id) => ({
      id,
      title: `Title ${id}`,
      provider: "Provider",
      installmentCents: 100000,
      cadence: "yearly" as const,
      addedFiscalMonth: 1
    }));
    const cabrini: ContentLicense = {
      id: "cabrini",
      title: "Cabrini",
      provider: "Angel Studios",
      installmentCents: 2000000,
      cadence: "yearly",
      addedFiscalMonth: 3,
      budgetSource: "donor_funded"
    };
    const dismissed = new Set([outlierAttentionKey("cabrini", cabrini.installmentCents)]);

    expect(buildSummaryAttention([...evenSlate, cabrini], 416667, dismissed)).toEqual([]);
  });

  it("re-flags a verified outlier if its amount changes afterward", () => {
    const evenSlate: ContentLicense[] = ["a", "b", "c", "d", "e"].map((id) => ({
      id,
      title: `Title ${id}`,
      provider: "Provider",
      installmentCents: 100000,
      cadence: "yearly" as const,
      addedFiscalMonth: 1
    }));
    const cabrini: ContentLicense = {
      id: "cabrini",
      title: "Cabrini",
      provider: "Angel Studios",
      installmentCents: 2000000,
      cadence: "yearly",
      addedFiscalMonth: 3,
      budgetSource: "donor_funded"
    };
    const staleDismissal = new Set([outlierAttentionKey("cabrini", cabrini.installmentCents - 1)]);

    const items = buildSummaryAttention([...evenSlate, cabrini], 416667, staleDismissal);

    expect(items.map((item) => item.id)).toEqual(["outlier-cabrini"]);
  });
});

describe("buildLicensingSummaryView", () => {
  it("splits each month into this budget and the other budget lines", () => {
    const view = buildView();
    const september = view.months.find((month) => month.label === "September");

    // Cabrini is donor-funded, so it lands in "other" and never touches the misc bar.
    expect(september?.miscCents).toBe(0);
    expect(september?.otherCents).toBe(20000000);
    expect(view.months[0].miscCents).toBe(2250000);
  });

  it("counts only misc licensing against the budget", () => {
    const view = buildView();

    // The Ulmas is quarterly from month 2, so its first payment is prorated to 2/3.
    expect(view.committedCents).toBe(2250000 + 16667 + 25000 * 3);
    expect(view.otherBudgetCents).toBe(20000000);
    expect(view.remainingCents).toBe(4000000 - 2341667);
    expect(view.health.label).toBe("On track");
  });

  it("marks the quarter the fiscal calendar is currently in", () => {
    const view = buildView();
    const current = view.quarters.filter((quarter) => quarter.isCurrent);

    expect(current).toHaveLength(1);
    expect(current[0].label).toBe("Q1 · now");
    expect(view.quarters[0].rangeLabel).toBe("Jul–Sep");
  });

  it("ranks providers by spend and summarises the tail", () => {
    const view = buildView();

    expect(view.providers.map((provider) => provider.provider)).toEqual([
      "Angel Studios",
      "Philip Gröning",
      "Ignatius Press",
      "Ave Maria University"
    ]);
    expect(view.providers[0].barPercent).toBe(100);
    expect(view.providerTailLine).toBe("4 providers in total");
  });

  it("drops budget lines that hold no titles", () => {
    const view = buildView();

    expect(view.budgetLines.map((line) => line.source)).toEqual(["misc_licensing", "donor_funded", "other"]);
    expect(view.titleCount).toBe(4);
  });

  it("reports the prorated first payments the quarterly math creates", () => {
    const view = buildView();

    expect(view.proratedLine).toBe("1 · $166.67");
  });

  it("keeps a visible stub for a line that has spend but is dwarfed by another", () => {
    const view = buildView();
    const misc = view.budgetLines.find((line) => line.source === "misc_licensing");

    expect(misc?.amountCents).toBe(2341667);
    expect(misc?.barPercent).toBeGreaterThanOrEqual(2);
  });
});
