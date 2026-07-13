import { cleanup, fireEvent, render, screen, waitFor, within } from "@testing-library/react";
import "@testing-library/jest-dom/vitest";
import React from "react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { ContentReviewDashboard } from "./content-review-dashboard";
import type { ContentReviewItem } from "../planning-types";

const actionMocks = vi.hoisted(() => ({
  addContentReviewItem: vi.fn(),
  deleteContentReviewItem: vi.fn(),
  sendReviewToRoadmap: vi.fn(),
  updateContentReviewItem: vi.fn()
}));

vi.mock("../planning-actions", () => actionMocks);

afterEach(cleanup);
beforeEach(() => vi.clearAllMocks());

const item: ContentReviewItem = {
  id: "review-1",
  title: "Aquinas 101",
  provider: "Thomistic Institute",
  genre: "Scripture",
  format: "Formation Series",
  reviewStatus: "approved",
  notes: "Strong formation fit.",
  proposedRateCents: 1200000,
  reviewLink: "https://example.com/review",
  comparableContent: "Symbolon"
};

const activeItem: ContentReviewItem = {
  ...item,
  id: "review-active",
  title: "Catholic Basics",
  reviewStatus: "in_progress"
};

const rejectedItem: ContentReviewItem = {
  ...item,
  id: "review-rejected",
  title: "Archive Candidate",
  reviewStatus: "rejected"
};

const radarItem: ContentReviewItem = {
  ...item,
  id: "review-radar",
  title: "Long Shot Series",
  reviewStatus: "on_the_radar"
};

describe("ContentReviewDashboard", () => {
  it("renders the compact decision queue and selected detail editor", () => {
    render(<ContentReviewDashboard fiscalYearId="00000000-0000-0000-0000-000000000028" items={[item]} isDemo />);

    expect(screen.getByRole("heading", { name: "Decision Queue" })).toBeVisible();
    expect(screen.getByLabelText("Detail Title")).toHaveValue("Aquinas 101");
    expect(screen.getByLabelText("Review Status")).toHaveValue("approved");
    expect(screen.getByLabelText("Proposed Rate")).toHaveValue("$12,000.00");
    expect(screen.getByLabelText("Genre")).toHaveValue("Scripture");
    expect(screen.getByLabelText("Format")).toHaveValue("Formation Series");
    expect(screen.getByLabelText("Review Link")).toHaveValue("https://example.com/review");
    expect(screen.getByRole("link", { name: "Open" })).toHaveAttribute("href", "https://example.com/review");
    expect(screen.getByLabelText("Comparable Content")).toHaveValue("Symbolon");
  });

  it("makes links in review notes and comparable content clickable", () => {
    render(<ContentReviewDashboard fiscalYearId="00000000-0000-0000-0000-000000000028" items={[{ ...item, notes: "Watch https://example.com/notes", comparableContent: "Compare https://example.com/compare" }]} isDemo />);

    expect(screen.getAllByRole("link", { name: "Open link" }).map((link) => link.getAttribute("href"))).toEqual([
      "https://example.com/notes",
      "https://example.com/compare"
    ]);
  });

  it("uses the roadmap provider picker for review details", () => {
    render(
      <ContentReviewDashboard
        fiscalYearId="00000000-0000-0000-0000-000000000028"
        items={[item]}
        providerOptions={["Thomistic Institute", "Wonderborn"]}
      />
    );

    const providerInput = screen.getByLabelText("Provider");
    fireEvent.change(providerInput, { target: { value: "Won" } });

    expect(screen.getByRole("button", { name: "Wonderborn" })).toBeVisible();

    fireEvent.click(screen.getByRole("button", { name: "Wonderborn" }));

    expect(providerInput).toHaveValue("Wonderborn");
    expect(screen.queryByRole("button", { name: "Wonderborn" })).not.toBeInTheDocument();
  });

  it("keeps decision queue column headers aligned with row columns", () => {
    render(<ContentReviewDashboard fiscalYearId="00000000-0000-0000-0000-000000000028" items={[activeItem]} isDemo />);

    const header = screen.getByText("Title").parentElement;

    expect(header?.children).toHaveLength(5);
    expect(header).toHaveClass("text-center");
    expect(header?.children[0]).toHaveAttribute("aria-hidden", "true");
    expect(header?.children[1]).toHaveTextContent("Title");
    expect(header?.children[2]).toHaveTextContent("Review Status");
    expect(header?.children[3]).toHaveTextContent("Proposed Rate");
    expect(header?.children[4]).toHaveTextContent("Provider");
  });

  it("opens a blank unsaved draft from Add Content", () => {
    render(<ContentReviewDashboard fiscalYearId="00000000-0000-0000-0000-000000000028" items={[item]} isDemo />);

    fireEvent.click(screen.getByRole("button", { name: "Add Content" }));

    expect(screen.getByRole("heading", { name: "New Content Review" })).toBeVisible();
    expect(screen.getByLabelText("Detail Title")).toHaveValue("");
  });

  it("moves radar, approved, and rejected reviews into separate decision spaces", () => {
    render(<ContentReviewDashboard fiscalYearId="00000000-0000-0000-0000-000000000028" items={[activeItem, radarItem, item, rejectedItem]} isDemo />);

    const decisionQueue = screen.getByTestId("content-review-active-queue");
    expect(within(decisionQueue).getByDisplayValue("Catholic Basics")).toBeVisible();
    expect(within(decisionQueue).queryByDisplayValue("Long Shot Series")).not.toBeInTheDocument();
    expect(within(decisionQueue).queryByDisplayValue("Aquinas 101")).not.toBeInTheDocument();
    expect(within(decisionQueue).queryByDisplayValue("Archive Candidate")).not.toBeInTheDocument();

    const radarGroup = screen.getByTestId("content-review-radar-content");
    const approvedGroup = screen.getByTestId("content-review-approved-content");
    const rejectedGroup = screen.getByTestId("content-review-rejected-content");
    fireEvent.click(within(radarGroup).getByText("Radar Targets"));
    fireEvent.click(within(approvedGroup).getByText("Approved Content"));
    fireEvent.click(within(rejectedGroup).getByText("Rejected Content"));

    expect(within(radarGroup).getByDisplayValue("Long Shot Series")).toBeVisible();
    expect(within(approvedGroup).getByDisplayValue("Aquinas 101")).toBeVisible();
    expect(within(rejectedGroup).getByDisplayValue("Archive Candidate")).toBeVisible();

    fireEvent.click(within(rejectedGroup).getByRole("button", { name: "Select Archive Candidate" }));
    expect(screen.getByLabelText("Detail Title")).toHaveValue("Archive Candidate");
  });

  it("uses explicit row selection instead of making the editable row itself a button", () => {
    render(<ContentReviewDashboard fiscalYearId="00000000-0000-0000-0000-000000000028" items={[activeItem]} />);

    expect(screen.getByRole("button", { name: "Select Catholic Basics" })).toBeVisible();
    expect(screen.getByLabelText("Summary Title").closest("[role='button']")).toBeNull();
  });

  it("marks edited review details as unsaved until the user saves", () => {
    render(<ContentReviewDashboard fiscalYearId="00000000-0000-0000-0000-000000000028" items={[item]} />);

    fireEvent.change(screen.getByLabelText("Detail Title"), { target: { value: "Aquinas 102" } });

    expect(screen.getByText("unsaved")).toBeVisible();
  });

  it("offers the exact approved controlled options", () => {
    render(<ContentReviewDashboard fiscalYearId="00000000-0000-0000-0000-000000000028" items={[item]} isDemo />);

    expect(screen.getByLabelText("Review Status")).toContainHTML("Not Started");
    expect(screen.getByLabelText("Review Status")).toContainHTML("On the Radar");
    expect(screen.getByLabelText("Genre")).toContainHTML("Christian Formation");
    expect(screen.getByLabelText("Format")).toContainHTML("Docu-Series");
    expect(screen.getByLabelText("Format")).toContainHTML("Ministry Resource");
  });

  it("lets users type a multi-digit proposed rate before formatting it", () => {
    render(<ContentReviewDashboard fiscalYearId="00000000-0000-0000-0000-000000000028" items={[item]} />);

    const proposedRate = screen.getByLabelText("Summary Proposed Rate");
    fireEvent.focus(proposedRate);
    fireEvent.change(proposedRate, { target: { value: "1" } });
    fireEvent.change(proposedRate, { target: { value: "12" } });
    fireEvent.change(proposedRate, { target: { value: "123" } });

    expect(proposedRate).toHaveValue("123");

    fireEvent.blur(proposedRate);
    expect(proposedRate).toHaveValue("$123.00");
  });

  it("creates a draft only once from the explicit save button", async () => {
    let resolveSave: ((saved: ContentReviewItem) => void) | undefined;
    actionMocks.addContentReviewItem.mockReturnValue(new Promise<ContentReviewItem>((resolve) => {
      resolveSave = resolve;
    }));

    render(<ContentReviewDashboard fiscalYearId="00000000-0000-0000-0000-000000000028" items={[]} />);

    fireEvent.click(screen.getByRole("button", { name: "Add Content" }));
    fireEvent.change(screen.getByLabelText("Summary Title"), { target: { value: "New Review" } });
    fireEvent.blur(screen.getByLabelText("Summary Title"));

    expect(actionMocks.addContentReviewItem).not.toHaveBeenCalled();

    const saveButton = screen.getByRole("button", { name: "Save Changes" });
    fireEvent.click(saveButton);
    fireEvent.click(saveButton);

    expect(actionMocks.addContentReviewItem).toHaveBeenCalledTimes(1);

    resolveSave?.({ ...item, id: "review-saved", title: "New Review" });

    expect(await screen.findByRole("heading", { name: "New Review" })).toBeVisible();
    expect(screen.queryByRole("heading", { name: "New Content Review" })).not.toBeInTheDocument();
  });

  it("lets approved reviews move forward to the roadmap", () => {
    render(<ContentReviewDashboard fiscalYearId="00000000-0000-0000-0000-000000000028" items={[item]} />);

    expect(screen.getByRole("button", { name: "Send to Roadmap" })).toBeVisible();
  });

  it("confirms when an approved review is sent to the roadmap", async () => {
    actionMocks.sendReviewToRoadmap.mockResolvedValue(undefined);
    render(<ContentReviewDashboard fiscalYearId="00000000-0000-0000-0000-000000000028" items={[item]} />);

    fireEvent.click(screen.getByRole("button", { name: "Send to Roadmap" }));

    await waitFor(() => expect(actionMocks.sendReviewToRoadmap).toHaveBeenCalledTimes(1));
    expect(screen.getByText("Sent to Roadmap as TBD. Open the Roadmap backlog to schedule it.")).toBeVisible();
  });

  it("does not offer roadmap sending for reviews that are not approved", () => {
    render(<ContentReviewDashboard fiscalYearId="00000000-0000-0000-0000-000000000028" items={[activeItem]} />);

    expect(screen.queryByRole("button", { name: "Send to Roadmap" })).not.toBeInTheDocument();
  });
});
