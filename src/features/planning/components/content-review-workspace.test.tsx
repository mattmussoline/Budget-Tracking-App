import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import "@testing-library/jest-dom/vitest";
import React from "react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { ContentReviewDashboard } from "./content-review-dashboard";
import type { ContentReviewItem } from "../planning-types";

const actionMocks = vi.hoisted(() => ({
  addContentReviewItem: vi.fn(),
  addContentReviewUpdate: vi.fn(),
  deleteContentReviewItem: vi.fn(),
  deleteContentReviewUpdate: vi.fn(),
  reorderContentReviewGroups: vi.fn(),
  reorderContentReviewItems: vi.fn(),
  sendReviewToRoadmap: vi.fn(),
  setContentReviewFocusMembership: vi.fn(),
  updateContentReviewItem: vi.fn()
}));

vi.mock("../planning-actions", () => actionMocks);
vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: vi.fn(), prefetch: vi.fn() })
}));

afterEach(cleanup);
beforeEach(() => vi.clearAllMocks());

const item: ContentReviewItem = {
  id: "review-1",
  title: "Aquinas 101",
  provider: "Thomistic Institute",
  genre: "Scripture",
  format: "Formation Series",
  reviewStatus: "contracted",
  minutes: 92,
  notes: "Strong formation fit.",
  proposedRateCents: 1200000,
  reviewLink: "https://example.com/review",
  comparableContent: null
};

const pinned1: ContentReviewItem = { ...item, id: "pin-1", title: "Zebra Chronicles", reviewStatus: "not_started", inFocus: true, priorityRank: 1 };
const pinned2: ContentReviewItem = { ...item, id: "pin-2", title: "Alpha Mission", reviewStatus: "in_progress", inFocus: true, priorityRank: 2 };
const needsDecision: ContentReviewItem = { ...item, id: "needs-1", title: "Blocked Title", reviewStatus: "blocked", inFocus: false };
const radarItem: ContentReviewItem = { ...item, id: "radar-1", title: "Long Shot Series", reviewStatus: "on_the_radar" };
const acquisitionItem: ContentReviewItem = { ...item, id: "acq-1", title: "Acquisition Candidate", reviewStatus: "acquisition_target", proposedRateCents: 500000 };

/**
 * The All reviews lane opens with every status group collapsed, so tests that
 * assert on rows expand the groups first.
 */
function openAllReviews({ expandGroups = true } = {}) {
  fireEvent.click(screen.getByRole("button", { name: /^All reviews/ }));
  if (!expandGroups) return;
  for (const group of screen.queryAllByTestId(/^content-review-group-/)) {
    const header = group.querySelector("button");
    if (header) fireEvent.click(header);
  }
}

describe("ContentReviewDashboard", () => {
  it("lands on the Priorities lane and renders the three-region layout", () => {
    render(<ContentReviewDashboard fiscalYearId="00000000-0000-0000-0000-000000000028" items={[pinned1, pinned2, needsDecision]} isDemo />);

    expect(screen.getByRole("heading", { name: "Priorities", level: 1 })).toBeVisible();
    expect(screen.getByText("2 reviews you chose to work on next")).toBeVisible();
    expect(screen.getByRole("heading", { name: "Priorities", level: 2 })).toBeVisible();
    expect(screen.getByText("2 of 5")).toBeVisible();
  });

  it("switches lanes from the rail and updates the queue header", () => {
    render(<ContentReviewDashboard fiscalYearId="00000000-0000-0000-0000-000000000028" items={[pinned1, needsDecision, radarItem, item]} isDemo />);

    fireEvent.click(screen.getByRole("button", { name: /Needs a decision/ }));
    expect(screen.getByRole("heading", { name: "Needs a decision", level: 1 })).toBeVisible();

    openAllReviews();
    expect(screen.getByRole("heading", { name: "All reviews", level: 1 })).toBeVisible();
    expect(screen.getByText("4 titles in the FY26 queue")).toBeVisible();
  });

  it("shows the On the Radar rail badge and the Acquisition Targets header summary", () => {
    render(<ContentReviewDashboard fiscalYearId="00000000-0000-0000-0000-000000000028" items={[radarItem, acquisitionItem]} isDemo />);

    expect(screen.getByText("1 to follow up")).toBeVisible();
    expect(screen.getByText("1 · $5,000.00 · no contract")).toBeVisible();
  });

  it("selects a row and opens the fixed detail panel without a draft flow", () => {
    render(<ContentReviewDashboard fiscalYearId="00000000-0000-0000-0000-000000000028" items={[needsDecision]} isDemo />);

    openAllReviews();
    fireEvent.click(screen.getByTestId("content-review-row-needs-1"));

    expect(screen.getByText("Selected review")).toBeVisible();
    expect(screen.getByRole("heading", { name: "Blocked Title" })).toBeVisible();
    expect(screen.getByLabelText("Review Status")).toHaveValue("blocked");
  });

  it("closes the detail panel and expands the queue full width", () => {
    render(<ContentReviewDashboard fiscalYearId="00000000-0000-0000-0000-000000000028" items={[needsDecision]} isDemo />);

    openAllReviews();
    fireEvent.click(screen.getByTestId("content-review-row-needs-1"));
    fireEvent.click(screen.getByRole("button", { name: "Close selected review" }));

    expect(screen.queryByText("Selected review")).not.toBeInTheDocument();
  });

  it("changes status from the detail panel, logs it, and offers an undo toast", async () => {
    actionMocks.updateContentReviewItem.mockResolvedValue(undefined);
    render(<ContentReviewDashboard fiscalYearId="00000000-0000-0000-0000-000000000028" items={[needsDecision]} />);

    openAllReviews();
    fireEvent.click(screen.getByTestId("content-review-row-needs-1"));
    fireEvent.change(screen.getByLabelText("Review Status"), { target: { value: "in_progress" } });

    expect(screen.getByText("Moved to In Progress.")).toBeVisible();
    expect(screen.getByRole("button", { name: "Undo" })).toBeVisible();
    await waitFor(() => expect(actionMocks.updateContentReviewItem).toHaveBeenCalled());

    fireEvent.click(screen.getByRole("button", { name: "Undo" }));
    expect(screen.getByLabelText("Review Status")).toHaveValue("blocked");
  });

  it("pins a review to Priorities from the detail panel and unpins it from the rail", async () => {
    actionMocks.setContentReviewFocusMembership.mockResolvedValue(undefined);
    render(<ContentReviewDashboard fiscalYearId="00000000-0000-0000-0000-000000000028" items={[needsDecision]} />);

    openAllReviews();
    fireEvent.click(screen.getByTestId("content-review-row-needs-1"));
    fireEvent.click(screen.getByRole("button", { name: "Add to Priorities" }));

    await waitFor(() => expect(actionMocks.setContentReviewFocusMembership).toHaveBeenCalledTimes(1));
    expect(screen.getByRole("button", { name: "Remove from Priorities" })).toBeVisible();

    fireEvent.click(screen.getByRole("button", { name: /^Remove Blocked Title from Priorities/ }));
    await waitFor(() => expect(actionMocks.setContentReviewFocusMembership).toHaveBeenCalledTimes(2));
    expect(screen.getByText("Removed from Priorities.")).toBeVisible();
  });

  it("refuses to pin a sixth review once Priorities is full", () => {
    const sixth: ContentReviewItem = { ...needsDecision, id: "needs-6" };
    const many = [pinned1, pinned2, { ...pinned1, id: "pin-3" }, { ...pinned1, id: "pin-4" }, { ...pinned1, id: "pin-5" }, sixth];
    render(<ContentReviewDashboard fiscalYearId="00000000-0000-0000-0000-000000000028" items={many} />);

    openAllReviews();
    fireEvent.click(screen.getByTestId("content-review-row-needs-6"));
    fireEvent.click(screen.getByRole("button", { name: "Add to Priorities" }));

    expect(screen.getByText("Priorities is full — remove something first.")).toBeVisible();
    expect(actionMocks.setContentReviewFocusMembership).not.toHaveBeenCalled();
  });

  it("selects a priority from the rail list", () => {
    render(<ContentReviewDashboard fiscalYearId="00000000-0000-0000-0000-000000000028" items={[pinned1, pinned2]} isDemo />);

    fireEvent.click(screen.getByRole("button", { name: "Alpha Mission" }));
    expect(screen.getByRole("heading", { name: "Alpha Mission" })).toBeVisible();
  });

  it("opens the Add another priority picker and pins the chosen review", async () => {
    actionMocks.setContentReviewFocusMembership.mockResolvedValue(undefined);
    render(<ContentReviewDashboard fiscalYearId="00000000-0000-0000-0000-000000000028" items={[needsDecision]} />);

    fireEvent.click(screen.getByRole("button", { name: "Add another priority" }));
    expect(screen.getByRole("heading", { name: "Add another priority" })).toBeVisible();

    fireEvent.click(screen.getByRole("button", { name: "Add Blocked Title to Priorities" }));
    await waitFor(() => expect(actionMocks.setContentReviewFocusMembership).toHaveBeenCalledTimes(1));
    expect(screen.queryByRole("heading", { name: "Add another priority" })).not.toBeInTheDocument();
  });

  it("searches the queue by title", () => {
    render(<ContentReviewDashboard fiscalYearId="00000000-0000-0000-0000-000000000028" items={[needsDecision, radarItem]} isDemo />);

    openAllReviews();
    fireEvent.change(screen.getByLabelText("Search titles"), { target: { value: "long shot" } });

    expect(screen.getByTestId("content-review-row-radar-1")).toBeVisible();
    expect(screen.queryByTestId("content-review-row-needs-1")).not.toBeInTheDocument();
  });

  it("shows the empty state and clears filters", () => {
    render(<ContentReviewDashboard fiscalYearId="00000000-0000-0000-0000-000000000028" items={[needsDecision]} isDemo />);

    openAllReviews();
    fireEvent.change(screen.getByLabelText("Search titles"), { target: { value: "nothing matches" } });

    expect(screen.getByText("Nothing here — this lane is clear.")).toBeVisible();

    fireEvent.click(screen.getByRole("button", { name: "Clear filters" }));
    expect(screen.getByTestId("content-review-row-needs-1")).toBeVisible();
  });

  it("opens the All reviews lane with every status group collapsed", () => {
    render(<ContentReviewDashboard fiscalYearId="00000000-0000-0000-0000-000000000028" items={[needsDecision, radarItem]} isDemo />);

    openAllReviews({ expandGroups: false });
    expect(screen.getByTestId("content-review-group-blocked")).toBeInTheDocument();
    expect(screen.queryByTestId("content-review-row-needs-1")).not.toBeInTheDocument();
    expect(screen.queryByTestId("content-review-row-radar-1")).not.toBeInTheDocument();
  });

  it("groups the All reviews lane by status and suppresses grouping while searching or sorted", () => {
    render(<ContentReviewDashboard fiscalYearId="00000000-0000-0000-0000-000000000028" items={[needsDecision, radarItem]} isDemo />);

    openAllReviews();
    expect(screen.getByTestId("content-review-group-blocked")).toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: "Sort by Title" }));
    expect(screen.queryByTestId("content-review-group-blocked")).not.toBeInTheDocument();
  });

  it("sorts the queue by column header and cycles back to the manual order", () => {
    const zebra: ContentReviewItem = { ...needsDecision, id: "z", title: "Zebra" };
    const alpha: ContentReviewItem = { ...needsDecision, id: "a", title: "Alpha" };
    render(<ContentReviewDashboard fiscalYearId="00000000-0000-0000-0000-000000000028" items={[zebra, alpha]} isDemo />);

    openAllReviews();
    const titleOrder = () => screen.getAllByText(/Zebra|Alpha/).map((node) => node.textContent);

    expect(titleOrder()).toEqual(["Zebra", "Alpha"]);
    fireEvent.click(screen.getByRole("button", { name: "Sort by Title" }));
    expect(titleOrder()).toEqual(["Alpha", "Zebra"]);
    fireEvent.click(screen.getByRole("button", { name: "Sort by Title" }));
    expect(titleOrder()).toEqual(["Zebra", "Alpha"]);
    fireEvent.click(screen.getByRole("button", { name: "Sort by Title" }));
    expect(titleOrder()).toEqual(["Zebra", "Alpha"]);
  });

  it("opens Add content and validates a title before submitting", async () => {
    actionMocks.addContentReviewItem.mockResolvedValue({ ...item, id: "new-item", title: "New Review", reviewStatus: "not_started" });
    render(<ContentReviewDashboard fiscalYearId="00000000-0000-0000-0000-000000000028" items={[]} />);

    fireEvent.click(screen.getByRole("button", { name: "Add content" }));
    fireEvent.click(screen.getByRole("button", { name: /^Add to/ }));
    expect(screen.getByText("Add a title before saving.")).toBeVisible();
    expect(actionMocks.addContentReviewItem).not.toHaveBeenCalled();

    fireEvent.change(screen.getByLabelText("Title"), { target: { value: "New Review" } });
    fireEvent.click(screen.getByRole("button", { name: /^Add to/ }));

    await waitFor(() => expect(actionMocks.addContentReviewItem).toHaveBeenCalledTimes(1));
    expect(await screen.findByRole("heading", { name: "New Review" })).toBeVisible();
    expect(screen.queryByRole("heading", { name: "Add content" })).not.toBeInTheDocument();
  });

  it("deletes a review from the More fields panel and clears the selection", async () => {
    actionMocks.deleteContentReviewItem.mockResolvedValue(undefined);
    vi.spyOn(window, "confirm").mockReturnValue(true);
    render(<ContentReviewDashboard fiscalYearId="00000000-0000-0000-0000-000000000028" items={[needsDecision]} />);

    openAllReviews();
    fireEvent.click(screen.getByTestId("content-review-row-needs-1"));
    fireEvent.click(screen.getByRole("button", { name: "More fields" }));
    fireEvent.click(screen.getByRole("button", { name: "Delete" }));

    await waitFor(() => expect(actionMocks.deleteContentReviewItem).toHaveBeenCalledTimes(1));
    expect(screen.queryByText("Selected review")).not.toBeInTheDocument();
  });

  it("logs an update from the compose row's Save button", async () => {
    actionMocks.addContentReviewUpdate.mockResolvedValue({
      id: "update-1",
      itemId: "needs-1",
      kind: "note",
      body: "Chased the rights paperwork.",
      fromStatus: null,
      toStatus: null,
      authorEmail: "matt@example.com",
      createdAt: new Date().toISOString()
    });
    render(<ContentReviewDashboard fiscalYearId="00000000-0000-0000-0000-000000000028" items={[needsDecision]} />);

    openAllReviews();
    fireEvent.click(screen.getByTestId("content-review-row-needs-1"));
    fireEvent.change(screen.getByLabelText("Log an update"), { target: { value: "Chased the rights paperwork." } });
    fireEvent.click(screen.getByRole("button", { name: "Save" }));

    await waitFor(() => expect(actionMocks.addContentReviewUpdate).toHaveBeenCalledTimes(1));
    expect(await screen.findByText("Chased the rights paperwork.")).toBeVisible();
  });

  it("opens the weekly recap slide-over with the 7/14/30 day switch", () => {
    render(<ContentReviewDashboard fiscalYearId="00000000-0000-0000-0000-000000000028" items={[needsDecision]} isDemo />);

    fireEvent.click(screen.getByRole("button", { name: "Weekly recap" }));

    expect(screen.getByRole("heading", { name: "Weekly recap" })).toBeVisible();
    expect(screen.getByRole("group", { name: "Recap range" })).toBeVisible();
    fireEvent.click(screen.getByRole("button", { name: "30d" }));
    expect(screen.getByRole("button", { name: "30d" })).toHaveAttribute("aria-pressed", "true");
  });

  it("disables editing controls in demo mode", () => {
    render(<ContentReviewDashboard fiscalYearId="00000000-0000-0000-0000-000000000028" items={[needsDecision]} isDemo />);

    openAllReviews();
    fireEvent.click(screen.getByTestId("content-review-row-needs-1"));

    expect(screen.getByLabelText("Review Status")).toBeDisabled();
    expect(screen.getByLabelText("Log an update")).toBeDisabled();
  });
});
