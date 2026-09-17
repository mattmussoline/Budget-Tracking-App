import { formatCurrency, formatCurrencyWholeDollars } from "@/lib/currency";
import { budgetSourceOptions, getBudgetSourceColor, getBudgetSourceLabel, type BudgetSource } from "./budget-source";
import type { ContentLicense, LicensePayment } from "./budget-types";
import type { DashboardModel } from "./dashboard-model";

export type SummaryHealth = {
  label: string;
  color: string;
};

export type SummaryMonth = {
  index: number;
  label: string;
  shortLabel: string;
  quarter: number;
  miscCents: number;
  otherCents: number;
  totalCents: number;
  isCurrent: boolean;
  payments: LicensePayment[];
};

export type SummaryQuarter = {
  quarter: number;
  label: string;
  rangeLabel: string;
  totalCents: number;
  isCurrent: boolean;
};

export type SummaryAttentionItem = {
  id: string;
  title: string;
  detail: string;
  color: string;
  /** The rows this item is about, so the rail can filter the table down to them. */
  licenseIds: string[];
  /** What clicking the item is for, shown as the chip label once the filter is on. */
  actionLabel: string;
};

export type SummaryBudgetLine = {
  source: BudgetSource;
  label: string;
  color: string;
  amountCents: number;
  count: number;
  barPercent: number;
};

export type SummaryProvider = {
  provider: string;
  amountCents: number;
  barPercent: number;
};

export type SummaryCadenceRow = {
  label: string;
  amountCents: number;
  barPercent: number;
  detail: string;
  color: string;
};

export type LicensingSummaryView = {
  health: SummaryHealth;
  percentUsed: number;
  committedPercent: number;
  budgetCents: number;
  committedCents: number;
  remainingCents: number;
  otherBudgetCents: number;
  statLine: string;
  months: SummaryMonth[];
  maxMonthCents: number;
  quarters: SummaryQuarter[];
  attention: SummaryAttentionItem[];
  budgetLines: SummaryBudgetLine[];
  titleCount: number;
  providers: SummaryProvider[];
  providerTailLine: string;
  cadence: SummaryCadenceRow[];
  proratedLine: string;
};

/**
 * Health is read off what is *left*, not what is spent, because the question the
 * page answers is "can we still say yes to something".
 */
export function getFiscalYearHealth(remainingPercent: number): SummaryHealth {
  if (remainingPercent < 0) return { label: "Over budget", color: "var(--danger)" };
  if (remainingPercent < 30) return { label: "Watch closely", color: "var(--guild-gold-ink)" };
  return { label: "On track", color: "var(--deep-teal)" };
}

/** The dismissal key for "this title's $0 rate is confirmed, not just unset." */
export function zeroRateAttentionKey(licenseId: string): string {
  return `zero-rate:${licenseId}`;
}

/**
 * The dismissal key for "this title's outlier amount is verified correct."
 * The amount is baked into the key so a later change to the installment makes
 * the old dismissal stop matching and the flag reappears on its own.
 */
export function outlierAttentionKey(licenseId: string, installmentCents: number): string {
  return `outlier:${licenseId}:${installmentCents}`;
}

/**
 * The two things about a licensing year that are almost always worth a second
 * look: titles nobody has priced yet, and the one deal big enough to distort
 * the whole budget. Either can be dismissed once confirmed, so a title already
 * cleared via `dismissedKeys` drops out here rather than reappearing forever.
 */
export function buildSummaryAttention(
  licenses: ContentLicense[],
  averageInstallmentCents: number,
  dismissedKeys: ReadonlySet<string> = new Set()
): SummaryAttentionItem[] {
  const items: SummaryAttentionItem[] = [];

  const unpriced = licenses.filter(
    (license) => license.installmentCents === 0 && !dismissedKeys.has(zeroRateAttentionKey(license.id))
  );
  if (unpriced.length > 0) {
    const named = unpriced.slice(0, 3).map((license) => license.title).join(", ");
    items.push({
      id: "zero-rate",
      title: `${unpriced.length} ${unpriced.length === 1 ? "title has" : "titles have"} no confirmed rate`,
      detail: unpriced.length > 3 ? `${named}, …` : named,
      color: "var(--tone-amber-line)",
      licenseIds: unpriced.map((license) => license.id),
      actionLabel: `${unpriced.length} ${unpriced.length === 1 ? "title" : "titles"} with no confirmed rate`
    });
  }

  const outlier = licenses
    .filter(
      (license) =>
        averageInstallmentCents > 0 &&
        license.installmentCents > averageInstallmentCents * 4 &&
        !dismissedKeys.has(outlierAttentionKey(license.id, license.installmentCents))
    )
    .sort((a, b) => b.installmentCents - a.installmentCents)[0];

  if (outlier) {
    items.push({
      id: `outlier-${outlier.id}`,
      title: `${outlier.title} is ${Math.round(outlier.installmentCents / averageInstallmentCents)}x the average installment`,
      detail: `${formatCurrency(outlier.installmentCents)} on ${getBudgetSourceLabel(outlier.budgetSource).toLowerCase()}.`,
      color: "var(--danger)",
      licenseIds: [outlier.id],
      actionLabel: outlier.title
    });
  }

  return items;
}

export function buildLicensingSummaryView({
  model,
  licenses,
  dismissedAttentionKeys = new Set()
}: {
  model: DashboardModel;
  licenses: ContentLicense[];
  dismissedAttentionKeys?: ReadonlySet<string>;
}): LicensingSummaryView {
  const payments = model.months.flatMap((month) => month.payments);

  const months: SummaryMonth[] = model.months.map((month) => {
    const miscCents = month.payments
      .filter((payment) => payment.budgetSource === "misc_licensing")
      .reduce((total, payment) => total + payment.amountCents, 0);

    return {
      index: month.index,
      label: month.label,
      shortLabel: month.label.slice(0, 3),
      quarter: month.quarter,
      miscCents,
      otherCents: month.totalCents - miscCents,
      totalCents: month.totalCents,
      isCurrent: model.currentFiscalMonth === month.index,
      payments: month.payments
    };
  });

  const quarters: SummaryQuarter[] = [1, 2, 3, 4].map((quarter) => {
    const quarterMonths = months.filter((month) => month.quarter === quarter);
    const isCurrent = model.currentFiscalQuarter === quarter;

    return {
      quarter,
      label: isCurrent ? `Q${quarter} · now` : `Q${quarter}`,
      rangeLabel: `${quarterMonths[0].shortLabel}–${quarterMonths[2].shortLabel}`,
      totalCents: quarterMonths.reduce((total, month) => total + month.totalCents, 0),
      isCurrent
    };
  });

  const budgetLineTotals = budgetSourceOptions.map((option) => ({
    source: option.value,
    label: option.label,
    color: getBudgetSourceColor(option.value),
    amountCents: payments
      .filter((payment) => payment.budgetSource === option.value)
      .reduce((total, payment) => total + payment.amountCents, 0),
    count: licenses.filter((license) => (license.budgetSource ?? "misc_licensing") === option.value).length
  }));
  const largestBudgetLineCents = Math.max(1, ...budgetLineTotals.map((line) => line.amountCents));
  const budgetLines: SummaryBudgetLine[] = budgetLineTotals
    .filter((line) => line.count > 0)
    .map((line) => ({ ...line, barPercent: barPercent(line.amountCents, largestBudgetLineCents) }));

  const rankedProviders = [...model.providers].sort(
    (a, b) => b.totalCents - a.totalCents || a.provider.localeCompare(b.provider)
  );
  const topProviderCents = Math.max(1, rankedProviders[0]?.totalCents ?? 0);
  const providers: SummaryProvider[] = rankedProviders.slice(0, 5).map((provider) => ({
    provider: provider.provider,
    amountCents: provider.totalCents,
    barPercent: barPercent(provider.totalCents, topProviderCents)
  }));
  const tailProviders = rankedProviders.slice(5);
  const providerTailLine = tailProviders.length
    ? `${tailProviders.length} more ${tailProviders.length === 1 ? "provider" : "providers"} at ${formatCurrencyWholeDollars(
        tailProviders.reduce((total, provider) => total + provider.totalCents, 0)
      )} combined`
    : `${rankedProviders.length} ${rankedProviders.length === 1 ? "provider" : "providers"} in total`;

  const { quarterlyCents, yearlyCents } = model.cadenceTotals;
  const { quarterlyLicenseCount, yearlyLicenseCount, licenseCount, averageInstallmentCents } = model.insights;
  const cadenceMax = Math.max(1, quarterlyCents, yearlyCents);
  const cadence: SummaryCadenceRow[] = [
    {
      label: "Quarterly",
      amountCents: quarterlyCents,
      barPercent: barPercent(quarterlyCents, cadenceMax),
      detail: `${quarterlyLicenseCount} ${quarterlyLicenseCount === 1 ? "title" : "titles"} billed every quarter`,
      color: "var(--deep-teal)"
    },
    {
      label: "Yearly",
      amountCents: yearlyCents,
      barPercent: barPercent(yearlyCents, cadenceMax),
      detail: `${yearlyLicenseCount} ${yearlyLicenseCount === 1 ? "title" : "titles"} billed once`,
      color: "var(--tone-slate-line)"
    }
  ];

  const proratedPayments = payments.filter((payment) => payment.isProrated);
  const proratedLine = proratedPayments.length
    ? `${proratedPayments.length} · ${formatCurrency(proratedPayments.reduce((total, payment) => total + payment.amountCents, 0))}`
    : "None this year";

  return {
    health: getFiscalYearHealth(model.remainingPercent),
    percentUsed: model.percentUsed,
    committedPercent: Math.min(100, Math.max(0, model.percentUsed)),
    budgetCents: model.budgetCents,
    committedCents: model.totalSpentCents,
    remainingCents: model.remainingCents,
    otherBudgetCents: model.otherBudgetSpentCents,
    statLine: `${licenseCount} ${licenseCount === 1 ? "title" : "titles"} · ${quarterlyLicenseCount} quarterly / ${yearlyLicenseCount} yearly · ${formatCurrency(
      averageInstallmentCents
    )} average installment`,
    months,
    maxMonthCents: Math.max(1, ...months.map((month) => month.totalCents)),
    quarters,
    attention: buildSummaryAttention(licenses, averageInstallmentCents, dismissedAttentionKeys),
    budgetLines,
    titleCount: licenseCount,
    providers,
    providerTailLine,
    cadence,
    proratedLine
  };
}

/** Bars never disappear entirely — a 2% stub still says "this line exists". */
function barPercent(amountCents: number, maxCents: number) {
  if (amountCents <= 0) return 0;
  return Math.max(2, Math.round((amountCents / maxCents) * 100));
}
