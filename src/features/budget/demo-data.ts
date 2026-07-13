import type { ContentLicense } from "./budget-types";
import type { ProviderColorOverrides } from "./provider-colors";
import type { ContentReviewItem, OngoingSeries, RoadmapCategory, RoadmapItem } from "@/features/planning/planning-types";

export const demoFiscalYear = {
  id: "demo-fy26",
  label: "FY26 Licensing Budget Demo",
  fiscal_year: 2026,
  fiscal_year_start_month: 7,
  budget_cents: 8400000,
  is_pinned: true
};

export const demoLicenses: ContentLicense[] = [
  {
    id: "demo-license-1",
    title: "The Carpenter's Table",
    provider: "Harbor Light Media",
    installmentCents: 425000,
    cadence: "quarterly",
    addedFiscalMonth: 1,
    budgetSource: "misc_licensing",
    notes: "Quarterly licensing deal with first payment in July."
  },
  {
    id: "demo-license-2",
    title: "Saints in the City",
    provider: "Lantern House",
    installmentCents: 950000,
    cadence: "yearly",
    addedFiscalMonth: 2,
    budgetSource: "donor_funded",
    notes: "Funded through a sample donor campaign."
  },
  {
    id: "demo-license-3",
    title: "Little Way Adventures",
    provider: "Bluebird Learning",
    installmentCents: 315000,
    cadence: "quarterly",
    addedFiscalMonth: 4,
    budgetSource: "internal",
    notes: "Kids series used to show the dashboard's cadence math."
  },
  {
    id: "demo-license-4",
    title: "Desert Fathers",
    provider: "Harbor Light Media",
    installmentCents: 260000,
    cadence: "quarterly",
    addedFiscalMonth: 6,
    budgetSource: "misc_licensing",
    notes: "Shared provider to show grouped provider reporting."
  },
  {
    id: "demo-license-5",
    title: "Parish Kitchen",
    provider: "Northstar Studios",
    installmentCents: 720000,
    cadence: "yearly",
    addedFiscalMonth: 8,
    budgetSource: "other",
    notes: "Sample yearly purchase in the spring."
  }
];

export const demoProviderColorOverrides: ProviderColorOverrides = {
  "Harbor Light Media": "blue",
  "Lantern House": "amber",
  "Bluebird Learning": "green",
  "Northstar Studios": "violet"
};

export const demoRoadmapCategories: RoadmapCategory[] = [
  { id: "demo-cat-adult", name: "Adult Faith", colorKey: "blue", sortOrder: 1, isActive: true },
  { id: "demo-cat-family", name: "Family", colorKey: "green", sortOrder: 2, isActive: true },
  { id: "demo-cat-youth", name: "Youth", colorKey: "violet", sortOrder: 3, isActive: true },
  { id: "demo-cat-seasonal", name: "Seasonal", colorKey: "amber", sortOrder: 4, isActive: true }
];

export const demoRoadmapItems: RoadmapItem[] = [
  {
    id: "demo-roadmap-1",
    title: "Pilgrim Road",
    provider: "Lantern House",
    releaseDate: "2026-07-21",
    status: "released",
    budgetSource: "donor_funded",
    notes: "Released title that demonstrates the budget handoff reminder.",
    categoryId: "demo-cat-adult"
  },
  {
    id: "demo-roadmap-2",
    title: "The Quiet Chapel",
    provider: "Harbor Light Media",
    releaseDate: "2026-08-18",
    status: "in_progress",
    budgetSource: "misc_licensing",
    notes: "In editorial review with artwork still pending.",
    categoryId: "demo-cat-adult"
  },
  {
    id: "demo-roadmap-3",
    title: "Story Time Saints",
    provider: "Bluebird Learning",
    releaseDate: "2026-09-08",
    status: "planned",
    budgetSource: "internal",
    notes: "Family release for early fall.",
    categoryId: "demo-cat-family"
  },
  {
    id: "demo-roadmap-4",
    title: "Advent Workshop",
    provider: "Northstar Studios",
    releaseDate: "2026-11-17",
    status: "planned",
    budgetSource: "other",
    notes: "Seasonal campaign sample.",
    categoryId: "demo-cat-seasonal"
  },
  {
    id: "demo-roadmap-5",
    title: "Campus Conversations",
    provider: "Summit Room",
    releaseDate: "TBD",
    status: "blocked",
    budgetSource: "misc_licensing",
    notes: "Blocked sample item so the Needs Attention panel has something useful to show.",
    categoryId: "demo-cat-youth"
  }
];

export const demoOngoingSeries: OngoingSeries[] = [
  { id: "demo-series-1", series: "Weekly Witness", cadence: "Every Friday", notes: "Short-form release cadence." },
  { id: "demo-series-2", series: "Family Feature Night", cadence: "Monthly", notes: "Monthly family programming block." },
  { id: "demo-series-3", series: "Seasonal Retreats", cadence: "Quarterly", notes: "Tied to liturgical seasons." }
];

export const demoContentReviewItems: ContentReviewItem[] = [
  {
    id: "demo-review-1",
    title: "Mystics and Makers",
    provider: "Harbor Light Media",
    genre: "Documentary",
    format: "Series",
    reviewStatus: "approved",
    budgetSource: "misc_licensing",
    notes: "Approved sample waiting to move into the roadmap.",
    proposedRateCents: 385000,
    reviewLink: "https://example.com/review/mystics-and-makers",
    comparableContent: "Comparable to a short adult faith formation series."
  },
  {
    id: "demo-review-2",
    title: "The Sacristy Tour",
    provider: "Bluebird Learning",
    genre: "Kids",
    format: "Short",
    reviewStatus: "in_progress",
    budgetSource: "internal",
    notes: "Needs a final content review score.",
    proposedRateCents: 125000,
    reviewLink: "https://example.com/review/sacristy-tour",
    comparableContent: "Similar to a short children's explainer."
  },
  {
    id: "demo-review-3",
    title: "Old Stone Abbey",
    provider: "Northstar Studios",
    genre: "History",
    format: "Feature",
    reviewStatus: "blocked",
    budgetSource: "other",
    notes: "Blocked because sample rights paperwork is incomplete.",
    proposedRateCents: 640000,
    reviewLink: "",
    comparableContent: "Feature documentary benchmark."
  },
  {
    id: "demo-review-4",
    title: "Tiny Disciples",
    provider: "Lantern House",
    genre: "Kids",
    format: "Series",
    reviewStatus: "rejected",
    budgetSource: "donor_funded",
    notes: "Rejected sample kept in completed reviews.",
    proposedRateCents: 290000,
    reviewLink: "https://example.com/review/tiny-disciples",
    comparableContent: "Rejected due to sample audience mismatch."
  }
];
