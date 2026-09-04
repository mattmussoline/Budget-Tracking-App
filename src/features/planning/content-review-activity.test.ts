import { describe, expect, it } from "vitest";
import { buildRecapText, describeRecapEntry, formatDayLabel, formatRelativeTime, summarizeMyNotes, summarizeRecap } from "./content-review-activity";
import type { ContentReviewItem, ContentReviewUpdate } from "./planning-types";

const now = new Date("2026-09-03T12:00:00.000Z");
const hoursAgo = (hours: number) => new Date(now.getTime() - hours * 60 * 60 * 1000).toISOString();

const items: ContentReviewItem[] = [
  { id: "a", title: "The Chosen", provider: "Acme", genre: null, format: null, reviewStatus: "approved", notes: null, proposedRateCents: 385000, reviewLink: null, comparableContent: null },
  { id: "b", title: "Old Stone Abbey", provider: "Northstar", genre: null, format: null, reviewStatus: "blocked", notes: null, proposedRateCents: 120000, reviewLink: null, comparableContent: null }
];

const updates: ContentReviewUpdate[] = [
  { id: "u1", itemId: "a", kind: "note", body: "Watched two episodes.", fromStatus: null, toStatus: null, authorEmail: "matt@example.com", createdAt: hoursAgo(2) },
  { id: "u2", itemId: "a", kind: "status_change", body: null, fromStatus: "in_progress", toStatus: "approved", authorEmail: "matt@example.com", createdAt: hoursAgo(30) },
  { id: "u3", itemId: "b", kind: "created", body: null, fromStatus: null, toStatus: "not_started", authorEmail: "matt@example.com", createdAt: hoursAgo(100) },
  { id: "u4", itemId: "b", kind: "status_change", body: null, fromStatus: "in_progress", toStatus: "rejected", authorEmail: "matt@example.com", createdAt: hoursAgo(120) },
  { id: "u5", itemId: "gone", kind: "note", body: "Old note.", fromStatus: null, toStatus: null, authorEmail: "matt@example.com", createdAt: hoursAgo(20 * 24) }
];

describe("summarizeRecap", () => {
  it("counts only activity inside the range", () => {
    const week = summarizeRecap(updates, items, 7, now);
    expect(week.reviewsTouched).toBe(2);
    expect(week.notesLogged).toBe(1);
    expect(week.statusChanges).toBe(2);
    expect(week.reviewsAdded).toBe(1);

    const month = summarizeRecap(updates, items, 30, now);
    expect(month.notesLogged).toBe(2);
    expect(month.reviewsTouched).toBe(3);
  });

  it("totals the yearly rate of approvals without double counting a review", () => {
    const summary = summarizeRecap(updates, items, 7, now);
    expect(summary.approvedCount).toBe(1);
    expect(summary.approvedRateCents).toBe(385000);
    expect(summary.rejectedCount).toBe(1);
  });

  it("groups entries by day, newest first", () => {
    const summary = summarizeRecap(updates, items, 7, now);
    expect(summary.days[0].label).toBe("Today");
    expect(summary.days[0].entries[0].id).toBe("u1");
    expect(summary.days.map((day) => day.entries.length).reduce((a, b) => a + b, 0)).toBe(4);
  });

  it("keeps entries whose review was deleted", () => {
    const summary = summarizeRecap(updates, items, 30, now);
    const orphan = summary.days.flatMap((day) => day.entries).find((entry) => entry.id === "u5");
    expect(orphan?.title).toBe("Deleted review");
  });

  it("reports an empty window", () => {
    const summary = summarizeRecap([], items, 7, now);
    expect(summary.days).toEqual([]);
    expect(summary.reviewsTouched).toBe(0);
  });
});

describe("describeRecapEntry", () => {
  it("renders status transitions with readable labels", () => {
    const summary = summarizeRecap(updates, items, 7, now);
    const change = summary.days.flatMap((day) => day.entries).find((entry) => entry.id === "u2");
    expect(describeRecapEntry(change!)).toBe("In Progress → Approved");
  });
});

describe("formatting helpers", () => {
  it("labels today and yesterday", () => {
    expect(formatDayLabel(hoursAgo(1), now)).toBe("Today");
    expect(formatDayLabel(hoursAgo(26), now)).toBe("Yesterday");
  });

  it("describes relative times", () => {
    expect(formatRelativeTime(hoursAgo(0), now)).toBe("Just now");
    expect(formatRelativeTime(hoursAgo(2), now)).toBe("2 hours ago");
    expect(formatRelativeTime(hoursAgo(48), now)).toBe("2 days ago");
  });
});

describe("summarizeMyNotes", () => {
  const myNotes: ContentReviewUpdate[] = [
    { id: "n1", itemId: "a", kind: "note", body: "Negotiating the rate, waiting on their reply.", fromStatus: null, toStatus: null, authorEmail: "matt@example.com", createdAt: hoursAgo(1) },
    { id: "n2", itemId: "a", kind: "note", body: "Sent a follow-up email about the contract terms.", fromStatus: null, toStatus: null, authorEmail: "matt@example.com", createdAt: hoursAgo(3) },
    { id: "n3", itemId: "b", kind: "note", body: "Watched the pilot episode, quality looks strong.", fromStatus: null, toStatus: null, authorEmail: "matt@example.com", createdAt: hoursAgo(5) },
    { id: "n4", itemId: "a", kind: "note", body: "Someone else's note.", fromStatus: null, toStatus: null, authorEmail: "someone.else@example.com", createdAt: hoursAgo(2) },
    { id: "n5", itemId: "b", kind: "note", body: "Old note from a month ago.", fromStatus: null, toStatus: null, authorEmail: "matt@example.com", createdAt: hoursAgo(30 * 24) }
  ];

  it("only counts the given author's notes in range", () => {
    const overview = summarizeMyNotes(myNotes, items, 7, "matt@example.com", now);
    expect(overview.noteCount).toBe(3);
    expect(overview.itemsTouched).toBe(2);
  });

  it("surfaces the titles with the most notes", () => {
    const overview = summarizeMyNotes(myNotes, items, 7, "matt@example.com", now);
    expect(overview.topItems[0]).toEqual({ title: "The Chosen", count: 2 });
  });

  it("classifies notes into themes for the narrative overview", () => {
    const overview = summarizeMyNotes(myNotes, items, 7, "matt@example.com", now);
    const labels = overview.themes.map((theme) => theme.label);
    expect(labels).toContain("rate & budget");
    expect(labels).toContain("follow-up");
    expect(labels).toContain("contract & legal");
    expect(labels).toContain("content quality");
    expect(overview.overviewText).toContain("3 notes across 2 titles");
  });

  it("says so when there is no matching author or no notes", () => {
    expect(summarizeMyNotes(myNotes, items, 7, null, now).overviewText).toContain("You didn't log any notes");
    expect(summarizeMyNotes(myNotes, items, 7, "nobody@example.com", now).noteCount).toBe(0);
  });
});

describe("buildRecapText", () => {
  it("produces a pasteable summary", () => {
    const text = buildRecapText(summarizeRecap(updates, items, 7, now));
    expect(text).toContain("Content review recap — last 7 days");
    expect(text).toContain("Approved: 1 ($3,850.00 yearly)");
    expect(text).toContain("The Chosen: Watched two episodes.");
  });

  it("says so when nothing happened", () => {
    expect(buildRecapText(summarizeRecap([], items, 7, now))).toContain("No review activity in this window.");
  });
});
