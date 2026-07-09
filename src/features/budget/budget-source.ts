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
