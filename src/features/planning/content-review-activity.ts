import { REVIEW_STATUSES } from "./planning-constants";
import { formatOptionalCurrency } from "./planning-model";
import type { ContentReviewItem, ContentReviewUpdate, ReviewStatus } from "./planning-types";

export const RECAP_RANGES = [7, 14, 30] as const;
export type RecapRange = (typeof RECAP_RANGES)[number];

const DAY_MS = 24 * 60 * 60 * 1000;

export function reviewStatusLabel(status: ReviewStatus | null) {
  if (!status) return "";
  return REVIEW_STATUSES.find((option) => option.value === status)?.label ?? status;
}

export function formatRelativeTime(iso: string, now: Date = new Date()) {
  const then = new Date(iso).getTime();
  if (Number.isNaN(then)) return "";
  const minutes = Math.round((now.getTime() - then) / 60000);
  if (minutes < 1) return "Just now";
  if (minutes < 60) return `${minutes} minute${minutes === 1 ? "" : "s"} ago`;
  const hours = Math.round(minutes / 60);
  if (hours < 24) return `${hours} hour${hours === 1 ? "" : "s"} ago`;
  const days = Math.round(hours / 24);
  if (days < 30) return `${days} day${days === 1 ? "" : "s"} ago`;
  return new Date(iso).toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

function dayKey(date: Date) {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
}

export function formatDayLabel(iso: string, now: Date = new Date()) {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return "";
  if (dayKey(date) === dayKey(now)) return "Today";
  if (dayKey(date) === dayKey(new Date(now.getTime() - DAY_MS))) return "Yesterday";
  return date.toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric" });
}

export type RecapEntry = ContentReviewUpdate & { title: string };
export type RecapDay = { key: string; label: string; entries: RecapEntry[] };

export type RecapSummary = {
  rangeDays: RecapRange;
  reviewsTouched: number;
  notesLogged: number;
  statusChanges: number;
  reviewsAdded: number;
  approvedCount: number;
  approvedRateCents: number;
  rejectedCount: number;
  days: RecapDay[];
};

/**
 * Rolls the activity log into the numbers and day-by-day timeline the recap
 * panel shows. Entries whose review has since been deleted still count toward
 * the totals, so the recap does not quietly shrink after a cleanup.
 */
export function summarizeRecap(
  updates: ContentReviewUpdate[],
  items: ContentReviewItem[],
  rangeDays: RecapRange,
  now: Date = new Date()
): RecapSummary {
  const cutoff = now.getTime() - rangeDays * DAY_MS;
  const titleById = new Map(items.map((item) => [item.id, item.title]));
  const rateById = new Map(items.map((item) => [item.id, item.proposedRateCents ?? 0]));

  const inRange = updates
    .filter((update) => {
      const time = new Date(update.createdAt).getTime();
      return !Number.isNaN(time) && time >= cutoff;
    })
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

  const approvals = inRange.filter((update) => update.kind === "status_change" && update.toStatus === "approved");
  const approvedItemIds = new Set(approvals.map((update) => update.itemId));

  const days: RecapDay[] = [];
  for (const update of inRange) {
    const key = dayKey(new Date(update.createdAt));
    const entry: RecapEntry = { ...update, title: titleById.get(update.itemId) ?? "Deleted review" };
    const existing = days.find((day) => day.key === key);
    if (existing) existing.entries.push(entry);
    else days.push({ key, label: formatDayLabel(update.createdAt, now), entries: [entry] });
  }

  return {
    rangeDays,
    reviewsTouched: new Set(inRange.map((update) => update.itemId)).size,
    notesLogged: inRange.filter((update) => update.kind === "note").length,
    statusChanges: inRange.filter((update) => update.kind === "status_change").length,
    reviewsAdded: inRange.filter((update) => update.kind === "created").length,
    approvedCount: approvals.length,
    approvedRateCents: [...approvedItemIds].reduce((total, id) => total + (rateById.get(id) ?? 0), 0),
    rejectedCount: inRange.filter((update) => update.kind === "status_change" && update.toStatus === "rejected").length,
    days
  };
}

export function describeRecapEntry(entry: RecapEntry) {
  if (entry.kind === "status_change") return `${reviewStatusLabel(entry.fromStatus)} → ${reviewStatusLabel(entry.toStatus)}`;
  if (entry.kind === "created") return "Added to the review queue";
  return entry.body ?? "";
}

/** Plain text version of the recap, for pasting into a status email. */
export function buildRecapText(summary: RecapSummary) {
  const lines = [
    `Content review recap — last ${summary.rangeDays} days`,
    "",
    `Reviews touched: ${summary.reviewsTouched}`,
    `Updates logged: ${summary.notesLogged}`,
    `Status changes: ${summary.statusChanges}`,
    `Reviews added: ${summary.reviewsAdded}`,
    `Approved: ${summary.approvedCount}${summary.approvedRateCents ? ` (${formatOptionalCurrency(summary.approvedRateCents)} yearly)` : ""}`,
    `Rejected: ${summary.rejectedCount}`,
    ""
  ];

  if (summary.days.length === 0) {
    lines.push("No review activity in this window.");
    return lines.join("\n");
  }

  for (const day of summary.days) {
    lines.push(day.label);
    for (const entry of day.entries) {
      lines.push(`  - ${entry.title}: ${describeRecapEntry(entry)}`);
    }
    lines.push("");
  }

  return lines.join("\n").trimEnd();
}
