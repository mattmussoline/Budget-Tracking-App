export const budgetSourceOptions = [
  { label: "Misc licensing budget", value: "misc_licensing" },
  { label: "Internal production", value: "internal" },
  { label: "Donor-funded budget", value: "donor_funded" },
  { label: "Other budget", value: "other" }
] as const;

export type BudgetSource = (typeof budgetSourceOptions)[number]["value"];

export function getBudgetSourceLabel(value: string | null | undefined) {
  return budgetSourceOptions.find((option) => option.value === value)?.label ?? "Misc licensing budget";
}

export type BudgetSourceSummaryItem = {
  source: BudgetSource;
  label: string;
  count: number;
};

export function buildBudgetSourceSummary(items: Array<{ budgetSource?: BudgetSource | null }>): BudgetSourceSummaryItem[] {
  const counts = new Map<BudgetSource, number>(budgetSourceOptions.map((option) => [option.value, 0]));

  for (const item of items) {
    const source = budgetSourceOptions.some((option) => option.value === item.budgetSource) ? item.budgetSource! : "misc_licensing";
    counts.set(source, (counts.get(source) ?? 0) + 1);
  }

  return budgetSourceOptions.map((option) => ({
    source: option.value,
    label: option.label,
    count: counts.get(option.value) ?? 0
  }));
}

export type MinutesByBudgetSourceItem = {
  source: BudgetSource;
  label: string;
  minutes: number;
};

/**
 * Sums total runtime minutes per budget line across every roadmap item,
 * scheduled or not, plus every ongoing series — the roadmap is the one
 * place that should account for everything, not just what already has a
 * release date.
 */
export function buildMinutesByBudgetSourceSummary(items: Array<{ budgetSource?: BudgetSource | null; minutes?: number | null }>): MinutesByBudgetSourceItem[] {
  const totals = new Map<BudgetSource, number>(budgetSourceOptions.map((option) => [option.value, 0]));

  for (const item of items) {
    const source = budgetSourceOptions.some((option) => option.value === item.budgetSource) ? item.budgetSource! : "misc_licensing";
    totals.set(source, (totals.get(source) ?? 0) + (item.minutes ?? 0));
  }

  return budgetSourceOptions.map((option) => ({
    source: option.value,
    label: option.label,
    minutes: totals.get(option.value) ?? 0
  }));
}

/**
 * One colour per budget line, so the rail bars, the timeline stack, the payment
 * rows and the title rows all say "misc licensing" in the same ink. These are
 * the warm-palette tones from globals.css, not new colours.
 */
export const budgetSourceColors: Record<BudgetSource, string> = {
  misc_licensing: "var(--deep-teal)",
  internal: "var(--ink-muted)",
  donor_funded: "var(--guild-gold-ink)",
  other: "var(--tone-slate-line)"
};

export function getBudgetSourceColor(value: string | null | undefined) {
  return budgetSourceColors[(value ?? "misc_licensing") as BudgetSource] ?? budgetSourceColors.other;
}
