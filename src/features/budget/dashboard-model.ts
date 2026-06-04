import { calculateLicenseSchedule, getFiscalMonths } from "./budget-math";
import type { ContentLicense, LicensePayment } from "./budget-types";

export type DashboardModel = {
  fiscalYear: number;
  budgetCents: number;
  totalSpentCents: number;
  remainingCents: number;
  cadenceTotals: {
    quarterlyCents: number;
    yearlyCents: number;
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
  payments.forEach((payment) => {
    providerTotals.set(payment.provider, (providerTotals.get(payment.provider) ?? 0) + payment.amountCents);
  });

  const providers = Array.from(providerTotals.entries())
    .map(([provider, totalCents]) => ({ provider, totalCents }))
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

  return {
    fiscalYear,
    budgetCents,
    totalSpentCents,
    remainingCents: budgetCents - totalSpentCents,
    cadenceTotals,
    months,
    providers
  };
}
