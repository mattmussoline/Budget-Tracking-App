import { calculateLicenseSchedule, getCurrentFiscalMonthIndex, getFiscalMonths } from "./budget-math";
import type { ContentLicense, LicensePayment } from "./budget-types";

export type DashboardModel = {
  fiscalYear: number;
  budgetCents: number;
  totalSpentCents: number;
  remainingCents: number;
  percentUsed: number;
  remainingPercent: number;
  currentFiscalMonth: number | null;
  cadenceTotals: {
    quarterlyCents: number;
    yearlyCents: number;
  };
  insights: {
    licenseCount: number;
    providerCount: number;
    averageInstallmentCents: number;
    quarterlyLicenseCount: number;
    yearlyLicenseCount: number;
  };
  months: Array<{
    index: number;
    label: string;
    quarter: number;
    totalCents: number;
    payments: LicensePayment[];
  }>;
  providers: Array<{
    provider: string;
    totalCents: number;
    licenseCount: number;
  }>;
};

export function buildDashboardModel({
  fiscalYear,
  fiscalYearStartMonth,
  budgetCents,
  licenses
}: {
  fiscalYear: number;
  fiscalYearStartMonth: number;
  budgetCents: number;
  licenses: ContentLicense[];
}): DashboardModel {
  const schedules = licenses.map((license) => ({
    license,
    payments: calculateLicenseSchedule(license)
  }));
  const payments = schedules.flatMap((schedule) => schedule.payments);
  const totalSpentCents = payments.reduce((total, payment) => total + payment.amountCents, 0);
  const fiscalMonths = getFiscalMonths(fiscalYear, fiscalYearStartMonth);

  const months = fiscalMonths.map((month) => {
    const monthPayments = payments
      .filter((payment) => payment.fiscalMonth === month.index)
      .sort((a, b) => a.title.localeCompare(b.title));

    return {
      index: month.index,
      label: month.label,
      quarter: month.quarter,
      totalCents: monthPayments.reduce((total, payment) => total + payment.amountCents, 0),
      payments: monthPayments
    };
  });

  const providerTotals = new Map<string, number>();
  const providerLicenseCounts = new Map<string, Set<string>>();
  payments.forEach((payment) => {
    providerTotals.set(payment.provider, (providerTotals.get(payment.provider) ?? 0) + payment.amountCents);
    if (!providerLicenseCounts.has(payment.provider)) {
      providerLicenseCounts.set(payment.provider, new Set());
    }
    providerLicenseCounts.get(payment.provider)?.add(payment.licenseId);
  });

  const providers = Array.from(providerTotals.entries())
    .map(([provider, totalCents]) => ({ provider, totalCents, licenseCount: providerLicenseCounts.get(provider)?.size ?? 0 }))
    .sort((a, b) => b.totalCents - a.totalCents);

  const cadenceTotals = schedules.reduce(
    (totals, schedule) => {
      const scheduleTotal = schedule.payments.reduce((total, payment) => total + payment.amountCents, 0);
      if (schedule.license.cadence === "quarterly") {
        totals.quarterlyCents += scheduleTotal;
      } else {
        totals.yearlyCents += scheduleTotal;
      }
      return totals;
    },
    { quarterlyCents: 0, yearlyCents: 0 }
  );

  const percentUsed = budgetCents > 0 ? Math.round((totalSpentCents / budgetCents) * 100) : 0;
  const remainingCents = budgetCents - totalSpentCents;
  const remainingPercent = budgetCents > 0 ? Math.round((remainingCents / budgetCents) * 100) : 0;
  const quarterlyLicenseCount = licenses.filter((license) => license.cadence === "quarterly").length;

  return {
    fiscalYear,
    budgetCents,
    totalSpentCents,
    remainingCents,
    percentUsed,
    remainingPercent,
    currentFiscalMonth: getCurrentFiscalMonthIndex({ fiscalYear, fiscalYearStartMonth }),
    cadenceTotals,
    insights: {
      licenseCount: licenses.length,
      providerCount: providers.length,
      averageInstallmentCents:
        licenses.length > 0
          ? Math.round(licenses.reduce((total, license) => total + license.installmentCents, 0) / licenses.length)
          : 0,
      quarterlyLicenseCount,
      yearlyLicenseCount: licenses.length - quarterlyLicenseCount
    },
    months,
    providers
  };
}
