export type MonthWindowItem = { key: string; label: string; date: Date };

export function dollarsToOptionalCents(value: string) {
  const normalized = value.replace(/[$,\s]/g, "");
  if (!normalized) return null;
  const amount = Number(normalized);
  return Number.isFinite(amount) ? Math.round(amount * 100) : null;
}

export function formatOptionalCurrency(value: number | null) {
  if (value === null) return "";
  return new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" }).format(value / 100);
}

export function normalizeMonthRange(value?: string | null): 6 | 9 | 12 {
  return value === "9" ? 9 : value === "12" ? 12 : 6;
}

export function parseMonthAnchor(value: string | null | undefined, fallback = new Date()) {
  if (value && /^\d{4}-(0[1-9]|1[0-2])$/.test(value)) return value;
  return `${fallback.getFullYear()}-${String(fallback.getMonth() + 1).padStart(2, "0")}`;
}

export function shiftMonthAnchor(anchor: string, offset: number) {
  const [year, month] = anchor.split("-").map(Number);
  const date = new Date(year, month - 1 + offset, 1);
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`;
}

export function buildMonthWindow(anchor: string, count: number): MonthWindowItem[] {
  return Array.from({ length: count }, (_, index) => {
    const key = shiftMonthAnchor(anchor, index);
    const [year, month] = key.split("-").map(Number);
    const date = new Date(year, month - 1, 1);
    return { key, date, label: date.toLocaleDateString("en-US", { month: "long", year: "numeric" }) };
  });
}

export function formatRoadmapDate(value: string) {
  const [year, month, day] = value.split("-").map(Number);
  return new Date(year, month - 1, day).toLocaleDateString("en-US", {
    month: "long",
    day: "numeric",
    year: "numeric"
  });
}

export function isExactRoadmapDate(value: string | null | undefined) {
  return /^\d{4}-(0[1-9]|1[0-2])-\d{2}$/.test(value ?? "");
}

export function isMonthTbdRoadmapDate(value: string | null | undefined) {
  return /^\d{4}-(0[1-9]|1[0-2])-TBD$/.test(value ?? "");
}

export function getRoadmapMonthKey(value: string | null | undefined) {
  if (isExactRoadmapDate(value) || isMonthTbdRoadmapDate(value)) return value!.slice(0, 7);
  return null;
}

export function formatRoadmapDateLabel(value: string | null | undefined) {
  if (isExactRoadmapDate(value)) return formatRoadmapDate(value!);
  if (isMonthTbdRoadmapDate(value) || value === "TBD") return "TBD";
  return value?.trim() || "Unscheduled";
}

const monthNumbers: Record<string, string> = {
  january: "01", february: "02", march: "03", april: "04", may: "05", june: "06",
  july: "07", august: "08", september: "09", october: "10", november: "11", december: "12"
};

export function parseLegacyReleaseMonth(value: string | null | undefined) {
  if (!value) return null;
  if (/^\d{4}-(0[1-9]|1[0-2])-01$/.test(value)) return value;
  const match = value.trim().match(/^([A-Za-z]+)\s+(\d{4})$/);
  const month = match ? monthNumbers[match[1].toLowerCase()] : undefined;
  return match && month ? `${match[2]}-${month}-01` : null;
}
