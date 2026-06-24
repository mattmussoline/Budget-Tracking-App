export function selectFiscalYear<T extends { id: string; is_pinned: boolean }>(
  fiscalYears: T[],
  selectedFiscalYearId?: string
): T | null {
  return (
    fiscalYears.find((fiscalYear) => fiscalYear.id === selectedFiscalYearId) ??
    fiscalYears.find((fiscalYear) => fiscalYear.is_pinned) ??
    fiscalYears[0] ??
    null
  );
}

export function getNextFiscalYear<T extends { fiscal_year: number }>(fiscalYears: T[], fallbackYear: number) {
  if (fiscalYears.length === 0) {
    return fallbackYear;
  }

  return Math.max(...fiscalYears.map((fiscalYear) => fiscalYear.fiscal_year)) + 1;
}
