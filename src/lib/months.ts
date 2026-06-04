export const monthNames = [
  "January",
  "February",
  "March",
  "April",
  "May",
  "June",
  "July",
  "August",
  "September",
  "October",
  "November",
  "December"
] as const;

export function getCalendarMonthForFiscalIndex(fiscalMonth: number, fiscalYearStartMonth: number) {
  return ((fiscalYearStartMonth - 1 + fiscalMonth - 1) % 12) + 1;
}
