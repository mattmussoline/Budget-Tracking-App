import { getCalendarMonthForFiscalIndex, monthNames } from "@/lib/months";
import type { ContentLicense, FiscalMonth, LicensePayment } from "./budget-types";

export function getQuarterForFiscalMonth(fiscalMonth: number) {
  assertFiscalMonth(fiscalMonth);
  return Math.floor((fiscalMonth - 1) / 3) + 1;
}

export function getQuarterPaymentFraction(fiscalMonth: number) {
  assertFiscalMonth(fiscalMonth);
  const monthInQuarter = ((fiscalMonth - 1) % 3) + 1;
  return (4 - monthInQuarter) / 3;
}

export function getFiscalMonths(fiscalYear: number, fiscalYearStartMonth: number): FiscalMonth[] {
  if (!Number.isInteger(fiscalYear) || fiscalYear < 1900 || fiscalYear > 2200) {
    throw new Error("Fiscal year must be a reasonable four-digit year.");
  }

  if (!Number.isInteger(fiscalYearStartMonth) || fiscalYearStartMonth < 1 || fiscalYearStartMonth > 12) {
    throw new Error("Fiscal year start month must be between 1 and 12.");
  }

  return Array.from({ length: 12 }, (_, index) => {
    const fiscalMonth = index + 1;
    const calendarMonth = getCalendarMonthForFiscalIndex(fiscalMonth, fiscalYearStartMonth);

    return {
      index: fiscalMonth,
      calendarMonth,
      label: monthNames[calendarMonth - 1],
      quarter: getQuarterForFiscalMonth(fiscalMonth)
    };
  });
}

export function calculateLicenseSchedule(license: ContentLicense): LicensePayment[] {
  assertFiscalMonth(license.addedFiscalMonth);
  const budgetSource = license.budgetSource ?? "misc_licensing";

  if (!Number.isInteger(license.installmentCents) || license.installmentCents < 0) {
    throw new Error("Installment amount must be a positive number of cents.");
  }

  if (license.cadence === "yearly") {
    return [
      {
        licenseId: license.id,
        title: license.title,
        provider: license.provider,
        budgetSource,
        fiscalMonth: license.addedFiscalMonth,
        quarter: getQuarterForFiscalMonth(license.addedFiscalMonth),
        amountCents: license.installmentCents,
        isProrated: false,
        isFirstPayment: true
      }
    ];
  }

  const firstQuarter = getQuarterForFiscalMonth(license.addedFiscalMonth);
  const firstAmount = Math.round(license.installmentCents * getQuarterPaymentFraction(license.addedFiscalMonth));
  const payments: LicensePayment[] = [
    {
      licenseId: license.id,
      title: license.title,
      provider: license.provider,
      budgetSource,
      fiscalMonth: license.addedFiscalMonth,
      quarter: firstQuarter,
      amountCents: firstAmount,
      isProrated: firstAmount !== license.installmentCents,
      isFirstPayment: true
    }
  ];

  for (let quarter = firstQuarter + 1; quarter <= 4; quarter += 1) {
    payments.push({
      licenseId: license.id,
      title: license.title,
      provider: license.provider,
      budgetSource,
      fiscalMonth: (quarter - 1) * 3 + 1,
      quarter,
      amountCents: license.installmentCents,
      isProrated: false,
      isFirstPayment: false
    });
  }

  return payments;
}

export function getCurrentFiscalMonthIndex({
  fiscalYear,
  fiscalYearStartMonth,
  now = new Date()
}: {
  fiscalYear: number;
  fiscalYearStartMonth: number;
  now?: Date;
}) {
  const fiscalYearStart = new Date(fiscalYear - 1, fiscalYearStartMonth - 1, 1);
  const fiscalYearEnd = new Date(fiscalYear, fiscalYearStartMonth - 1, 1);
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);

  if (monthStart < fiscalYearStart || monthStart >= fiscalYearEnd) {
    return null;
  }

  return (now.getFullYear() - fiscalYearStart.getFullYear()) * 12 + now.getMonth() - fiscalYearStart.getMonth() + 1;
}

function assertFiscalMonth(fiscalMonth: number) {
  if (!Number.isInteger(fiscalMonth) || fiscalMonth < 1 || fiscalMonth > 12) {
    throw new Error("Fiscal month must be an integer from 1 to 12.");
  }
}
