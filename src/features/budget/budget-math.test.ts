import { describe, expect, it } from "vitest";
import {
  calculateLicenseSchedule,
  getCurrentFiscalMonthIndex,
  getFiscalMonths,
  getQuarterPaymentFraction
} from "./budget-math";

describe("getFiscalMonths", () => {
  it("starts FY26 in July and ends in June", () => {
    expect(getFiscalMonths(2026, 7).map((month) => month.label)).toEqual([
      "July",
      "August",
      "September",
      "October",
      "November",
      "December",
      "January",
      "February",
      "March",
      "April",
      "May",
      "June"
    ]);
  });
});

describe("getQuarterPaymentFraction", () => {
  it("pays full installment in the first month of a quarter", () => {
    expect(getQuarterPaymentFraction(1)).toBe(1);
    expect(getQuarterPaymentFraction(4)).toBe(1);
  });

  it("pays two thirds in the second month of a quarter", () => {
    expect(getQuarterPaymentFraction(2)).toBeCloseTo(2 / 3);
    expect(getQuarterPaymentFraction(5)).toBeCloseTo(2 / 3);
  });

  it("pays one third in the third month of a quarter", () => {
    expect(getQuarterPaymentFraction(3)).toBeCloseTo(1 / 3);
    expect(getQuarterPaymentFraction(12)).toBeCloseTo(1 / 3);
  });
});

describe("calculateLicenseSchedule", () => {
  it("prorates third-month quarterly additions, then repeats full installments", () => {
    const schedule = calculateLicenseSchedule({
      id: "frassati",
      title: "Frassati",
      provider: "Example Provider",
      installmentCents: 170000,
      cadence: "quarterly",
      addedFiscalMonth: 3
    });

    expect(schedule.map((payment) => payment.amountCents)).toEqual([
      56667,
      170000,
      170000,
      170000
    ]);
  });

  it("prorates second-month quarterly additions, then repeats full installments", () => {
    const schedule = calculateLicenseSchedule({
      id: "glorious",
      title: "Glorious Mysteries",
      provider: "Example Provider",
      installmentCents: 12500,
      cadence: "quarterly",
      addedFiscalMonth: 5
    });

    expect(schedule.map((payment) => payment.amountCents)).toEqual([8333, 12500, 12500]);
  });

  it("prorates third-month quarterly additions, then repeats full installments", () => {
    const schedule = calculateLicenseSchedule({
      id: "december",
      title: "December License",
      provider: "Example Provider",
      installmentCents: 12500,
      cadence: "quarterly",
      addedFiscalMonth: 6
    });

    expect(schedule.map((payment) => payment.amountCents)).toEqual([4167, 12500, 12500]);
  });

  it("charges yearly cadence once in the added month", () => {
    const schedule = calculateLicenseSchedule({
      id: "yearly",
      title: "Annual License",
      provider: "Example Provider",
      installmentCents: 240000,
      cadence: "yearly",
      addedFiscalMonth: 10
    });

    expect(schedule).toEqual([
      {
        licenseId: "yearly",
        title: "Annual License",
        provider: "Example Provider",
        fiscalMonth: 10,
        quarter: 4,
        amountCents: 240000,
        isProrated: false,
        isFirstPayment: true
      }
    ]);
  });
});

describe("getCurrentFiscalMonthIndex", () => {
  it("returns the current fiscal month for a July-start FY26", () => {
    expect(
      getCurrentFiscalMonthIndex({
        fiscalYear: 2026,
        fiscalYearStartMonth: 7,
        now: new Date(2026, 5, 4)
      })
    ).toBe(12);
  });

  it("returns null when today is outside that fiscal year", () => {
    expect(
      getCurrentFiscalMonthIndex({
        fiscalYear: 2026,
        fiscalYearStartMonth: 7,
        now: new Date(2026, 6, 1)
      })
    ).toBeNull();
  });
});
