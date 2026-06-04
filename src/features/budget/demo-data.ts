import type { ContentLicense } from "./budget-types";

export const demoFiscalYear = {
  id: "demo-fy26",
  label: "FY26 Licensing Budget",
  fiscal_year: 2026,
  fiscal_year_start_month: 7,
  budget_cents: 3000000
};

export const demoLicenses: ContentLicense[] = [
  {
    id: "frassati",
    title: "Frassati",
    provider: "Saint Films",
    installmentCents: 170000,
    cadence: "quarterly",
    addedFiscalMonth: 3
  },
  {
    id: "ben-cello",
    title: "Ben Cello",
    provider: "Catholic Kids Media",
    installmentCents: 600000,
    cadence: "quarterly",
    addedFiscalMonth: 4
  },
  {
    id: "glorious",
    title: "Glorious Mysteries",
    provider: "Rosary Studios",
    installmentCents: 12500,
    cadence: "quarterly",
    addedFiscalMonth: 6
  },
  {
    id: "ardent-heart",
    title: "An Ardent Heart",
    provider: "Apostolate Films",
    installmentCents: 16667,
    cadence: "yearly",
    addedFiscalMonth: 12
  }
];
