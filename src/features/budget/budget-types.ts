export type PaymentCadence = "quarterly" | "yearly";

export type ContentLicense = {
  id: string;
  title: string;
  provider: string;
  installmentCents: number;
  cadence: PaymentCadence;
  addedFiscalMonth: number;
  notes?: string | null;
};

export type LicensePayment = {
  licenseId: string;
  title: string;
  provider: string;
  fiscalMonth: number;
  quarter: number;
  amountCents: number;
  isProrated: boolean;
  isFirstPayment: boolean;
};

export type FiscalMonth = {
  index: number;
  calendarMonth: number;
  label: string;
  quarter: number;
};
