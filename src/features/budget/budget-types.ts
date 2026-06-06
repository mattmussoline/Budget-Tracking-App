export type PaymentCadence = "quarterly" | "yearly";
export type ContentType = "standalone" | "series";

export type ContentLicense = {
  id: string;
  title: string;
  provider: string;
  contentType: ContentType;
  episodeCount?: number | null;
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
