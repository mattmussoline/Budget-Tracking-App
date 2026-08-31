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
  reviewStatus: "in_progress",
  isCoproductionOpportunity: true
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
    expect(screen.getByLabelText("Proposed Yearly Rate")).toHaveValue("$12,000.00");
    expect(screen.getByLabelText("Genre")).toHaveValue("Scripture");
    expect(screen.getByLabelText("Format")).toHaveValue("Formation Series");
    expect(screen.getByLabelText("Review Link")).toHaveValue("https://example.com/review");
    expect(screen.getByRole("link", { name: "Open" })).toHaveAttribute("href", "https://example.com/review");
    expect(screen.getByRole("textbox", { name: "Notes" })).toHaveTextContent("Strong formation fit.");
    expect(screen.getByRole("textbox", { name: "Notes" })).toHaveTextContent("Symbolon");
  });

  it("makes links in the combined notes field clickable", () => {
    render(<ContentReviewDashboard fiscalYearId="00000000-0000-0000-0000-000000000028" items={[{ ...item, notes: "Watch https://example.com/notes", comparableContent: "Compare https://example.com/compare" }]} isDemo />);

    const notesLink = screen.getByRole("link", { name: "https://example.com/notes" });
    const comparableLink = screen.getByRole("link", { name: "https://example.com/compare" });

    expect(notesLink).toHaveAttribute("href", "https://example.com/notes");
    expect(comparableLink).toHaveAttribute("href", "https://example.com/compare");
    expect(notesLink.closest("[role='textbox']")).toHaveAttribute("aria-label", "Notes");
    expect(comparableLink.closest("[role='textbox']")).toHaveAttribute("aria-label", "Notes");
  });

  it("turns newly typed review-note URLs into links after editing", () => {
    render(<ContentReviewDashboard fiscalYearId="00000000-0000-0000-0000-000000000028" items={[item]} />);

    const notesBox = screen.getByRole("textbox", { name: "Notes" });
    notesBox.focus();
    notesBox.textContent = "Watch https://example.com/new-note";
    fireEvent.input(notesBox);
    expect(screen.queryByRole("link", { name: "https://example.com/new-note" })).not.toBeInTheDocument();

    fireEvent.blur(notesBox);

    const newLink = screen.getByRole("link", { name: "https://example.com/new-note" });
    expect(newLink).toHaveAttribute("href", "https://example.com/new-note");
    expect(newLink.closest("[role='textbox']")).toBe(notesBox);
  });

  it("keeps newly typed review notes visible while editing", () => {
    render(<ContentReviewDashboard fiscalYearId="00000000-0000-0000-0000-000000000028" items={[item]} />);

    const notesBox = screen.getByRole("textbox", { name: "Notes" });
    notesBox.focus();
    notesBox.textContent = "Fresh decision queue notes";
    fireEvent.input(notesBox);

    expect(notesBox).toHaveTextContent("Fresh decision queue notes");
    expect(notesBox).not.toHaveTextContent("Strong formation fit.");
  });

  it("saves paragraph breaks and rich formatting from the notes editor", async () => {
    actionMocks.updateContentReviewItem.mockResolvedValue(undefined);
    render(<ContentReviewDashboard fiscalYearId="00000000-0000-0000-0000-000000000028" items={[item]} />);

    const notesBox = screen.getByRole("textbox", { name: "Notes" });
    notesBox.focus();
    notesBox.innerHTML = "<p>First note</p><p><strong>Second</strong> note</p><ul><li>Watch https://example.com/spacing</li></ul>";
    fireEvent.input(notesBox);
    fireEvent.blur(notesBox);
    fireEvent.click(screen.getByRole("button", { name: "Save Changes" }));

    await waitFor(() => expect(actionMocks.updateContentReviewItem).toHaveBeenCalledTimes(1));
    const saved = String(actionMocks.updateContentReviewItem.mock.calls[0][0].get("notes"));
    expect(saved).toContain("<p>First note</p>");
    expect(saved).toContain("<strong>Second</strong> note");
    expect(saved).toContain("<ul><li>");
    expect(screen.getByRole("link", { name: "https://example.com/spacing" })).toHaveAttribute("href", "https://example.com/spacing");
  });

  it("renders legacy plain-text notes as paragraphs", () => {
    render(<ContentReviewDashboard fiscalYearId="00000000-0000-0000-0000-000000000028" items={[{ ...item, notes: "Line one\n\nLine two", comparableContent: null }]} />);

    const notesBox = screen.getByRole("textbox", { name: "Notes" });

    expect(notesBox.innerHTML).toBe("<p>Line one</p><p>Line two</p>");
  });

  it("strips unsafe markup that arrives in the notes editor", async () => {
    actionMocks.updateContentReviewItem.mockResolvedValue(undefined);
    render(<ContentReviewDashboard fiscalYearId="00000000-0000-0000-0000-000000000028" items={[item]} />);

    const notesBox = screen.getByRole("textbox", { name: "Notes" });
    notesBox.focus();
    notesBox.innerHTML = '<p onclick="steal()">Keep this</p><img src="x" onerror="steal()"><a href="javascript:steal()">bad link</a>';
    fireEvent.input(notesBox);
    fireEvent.blur(notesBox);
    fireEvent.click(screen.getByRole("button", { name: "Save Changes" }));

    await waitFor(() => expect(actionMocks.updateContentReviewItem).toHaveBeenCalledTimes(1));
    const saved = String(actionMocks.updateContentReviewItem.mock.calls[0][0].get("notes"));
    expect(saved).toContain("<p>Keep this</p>");
    expect(saved).not.toContain("onclick");
    expect(saved).not.toContain("onerror");
    expect(saved).not.toContain("javascript:");
    expect(saved).not.toContain("<img");
  });

  it("offers formatting controls for the notes editor", () => {
    render(<ContentReviewDashboard fiscalYearId="00000000-0000-0000-0000-000000000028" items={[item]} />);

    const toolbar = screen.getByRole("group", { name: "Notes formatting" });

    expect(within(toolbar).getByRole("button", { name: "Bold (Cmd+B)" })).toBeVisible();
    expect(within(toolbar).getByRole("button", { name: "Italic (Cmd+I)" })).toBeVisible();
    expect(within(toolbar).getByRole("button", { name: "Underline (Cmd+U)" })).toBeVisible();
    expect(within(toolbar).getByRole("button", { name: "Bulleted list" })).toBeVisible();
    expect(within(toolbar).getByRole("button", { name: "Numbered list" })).toBeVisible();
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
    expect(header?.children[3]).toHaveTextContent("Yearly Rate");
    expect(header?.children[4]).toHaveTextContent("Provider");
  });

  it("opens a blank unsaved draft from Add Content", () => {
    render(<ContentReviewDashboard fiscalYearId="00000000-0000-0000-0000-000000000028" items={[item]} isDemo />);

    fireEvent.click(screen.getByRole("button", { name: "Add Content" }));

    expect(screen.getByRole("heading", { name: "New Content Review" })).toBeVisible();
    expect(screen.getByLabelText("Detail Title")).toHaveValue("");
  });

  it("groups every review by status inside one decision queue", () => {
    render(<ContentReviewDashboard fiscalYearId="00000000-0000-0000-0000-000000000028" items={[activeItem, radarItem, item, rejectedItem]} isDemo />);

    const decisionQueue = screen.getByTestId("content-review-active-queue");
    const inProgressGroup = within(decisionQueue).getByTestId("content-review-group-in-progress");
    const radarGroup = within(decisionQueue).getByTestId("content-review-group-on-the-radar");
    const approvedGroup = within(decisionQueue).getByTestId("content-review-approved-content");
    const rejectedGroup = within(decisionQueue).getByTestId("content-review-rejected-content");

    expect(within(inProgressGroup).getByDisplayValue("Catholic Basics")).toBeVisible();
    expect(within(radarGroup).getByDisplayValue("Long Shot Series")).toBeVisible();
    expect(within(approvedGroup).getByDisplayValue("Aquinas 101")).toBeInTheDocument();
    expect(within(rejectedGroup).getByDisplayValue("Archive Candidate")).toBeInTheDocument();

    // Active statuses start expanded; the two final statuses stay collapsed until opened.
    expect(inProgressGroup).toHaveAttribute("open");
    expect(radarGroup).toHaveAttribute("open");
    expect(approvedGroup).not.toHaveAttribute("open");
    expect(rejectedGroup).not.toHaveAttribute("open");

    expect(inProgressGroup.querySelector("summary")).toHaveTextContent("In Progress");
    expect(approvedGroup.querySelector("summary")).toHaveTextContent("Approved");

    fireEvent.click(within(rejectedGroup).getByRole("button", { name: "Select Archive Candidate" }));
    expect(screen.getByLabelText("Detail Title")).toHaveValue("Archive Candidate");
  });

  it("keeps the status summary cards and modals working alongside the grouped queue", () => {
    render(<ContentReviewDashboard fiscalYearId="00000000-0000-0000-0000-000000000028" items={[activeItem, radarItem, item, rejectedItem]} isDemo />);

    expect(screen.getByText("1 On the Radar piece is waiting for follow-up. Open the list and decide who gets a next touch.")).toBeVisible();
    fireEvent.click(screen.getByRole("button", { name: "View Items" }));
    const radarDialog = screen.getByRole("dialog", { name: "On the Radar" });
    expect(within(within(radarDialog).getByTestId("content-review-radar-content")).getByDisplayValue("Long Shot Series")).toBeVisible();
    fireEvent.click(within(radarDialog).getByRole("button", { name: "Close On the Radar reviews" }));

    fireEvent.click(screen.getByRole("button", { name: /Active Decisions: 1/ }));
    const activeDialog = screen.getByRole("dialog", { name: "Active Decisions" });
    expect(within(activeDialog).getByDisplayValue("Catholic Basics")).toBeVisible();
    fireEvent.click(within(activeDialog).getByRole("button", { name: "Close Active Decisions reviews" }));

    fireEvent.click(screen.getByRole("button", { name: /Approved: 1/ }));
    const approvedDialog = screen.getByRole("dialog", { name: "Approved" });
    expect(within(approvedDialog).getByDisplayValue("Aquinas 101")).toBeVisible();
    fireEvent.click(within(approvedDialog).getByRole("button", { name: "Close Approved reviews" }));

    fireEvent.click(screen.getByRole("button", { name: /Rejected: 1/ }));
    const rejectedDialog = screen.getByRole("dialog", { name: "Rejected" });
    expect(within(rejectedDialog).getByDisplayValue("Archive Candidate")).toBeVisible();
  });

  it("filters the decision queue by title", () => {
    render(<ContentReviewDashboard fiscalYearId="00000000-0000-0000-0000-000000000028" items={[activeItem, radarItem, item, rejectedItem]} isDemo />);

    expect(screen.getByText("4 reviews")).toBeVisible();

    fireEvent.change(screen.getByLabelText("Filter by title"), { target: { value: "long shot" } });

    const decisionQueue = screen.getByTestId("content-review-active-queue");
    expect(within(decisionQueue).getByDisplayValue("Long Shot Series")).toBeVisible();
    expect(within(decisionQueue).queryByDisplayValue("Catholic Basics")).not.toBeInTheDocument();
    expect(within(decisionQueue).queryByDisplayValue("Aquinas 101")).not.toBeInTheDocument();
    expect(screen.getByText("Showing 1 of 4")).toBeVisible();
    // Statuses with no match drop out of the list entirely while a filter is on.
    expect(within(decisionQueue).queryByTestId("content-review-group-in-progress")).not.toBeInTheDocument();
  });

  it("filters the decision queue by review status", () => {
    render(<ContentReviewDashboard fiscalYearId="00000000-0000-0000-0000-000000000028" items={[activeItem, radarItem, item, rejectedItem]} isDemo />);

    fireEvent.change(screen.getByLabelText("Filter by review status"), { target: { value: "approved" } });

    const decisionQueue = screen.getByTestId("content-review-active-queue");
    const approvedGroup = within(decisionQueue).getByTestId("content-review-approved-content");
    expect(within(approvedGroup).getByDisplayValue("Aquinas 101")).toBeVisible();
    // Filtering opens the matching group even when it is a normally collapsed final status.
    expect(approvedGroup).toHaveAttribute("open");
    expect(within(decisionQueue).queryByDisplayValue("Archive Candidate")).not.toBeInTheDocument();
  });

  it("filters the decision queue by provider", () => {
    const otherProvider: ContentReviewItem = { ...activeItem, id: "review-other", title: "Other Provider Series", provider: "Word on Fire" };
    render(<ContentReviewDashboard fiscalYearId="00000000-0000-0000-0000-000000000028" items={[activeItem, otherProvider]} isDemo />);

    const providerFilter = screen.getByLabelText("Filter by provider");
    expect(within(providerFilter).getByRole("option", { name: "Thomistic Institute" })).toBeInTheDocument();
    expect(within(providerFilter).getByRole("option", { name: "Word on Fire" })).toBeInTheDocument();

    fireEvent.change(providerFilter, { target: { value: "Word on Fire" } });

    const decisionQueue = screen.getByTestId("content-review-active-queue");
    expect(within(decisionQueue).getByDisplayValue("Other Provider Series")).toBeVisible();
    expect(within(decisionQueue).queryByDisplayValue("Catholic Basics")).not.toBeInTheDocument();
  });

  it("reports and clears a filter that matches nothing", () => {
    render(<ContentReviewDashboard fiscalYearId="00000000-0000-0000-0000-000000000028" items={[activeItem]} isDemo />);

    fireEvent.change(screen.getByLabelText("Filter by title"), { target: { value: "nothing matches this" } });

    expect(screen.getByTestId("content-review-no-matches")).toBeVisible();

    fireEvent.click(screen.getByRole("button", { name: "Clear filters" }));

    expect(screen.queryByTestId("content-review-no-matches")).not.toBeInTheDocument();
    expect(within(screen.getByTestId("content-review-active-queue")).getByDisplayValue("Catholic Basics")).toBeVisible();
  });

  it("keeps an unsaved draft visible even when it does not match the filters", () => {
    render(<ContentReviewDashboard fiscalYearId="00000000-0000-0000-0000-000000000028" items={[activeItem]} />);

    fireEvent.change(screen.getByLabelText("Filter by title"), { target: { value: "catholic" } });
    fireEvent.click(screen.getByRole("button", { name: "Add Content" }));

    const notStartedGroup = within(screen.getByTestId("content-review-active-queue")).getByTestId("content-review-group-not-started");
    expect(within(notStartedGroup).getByLabelText("Summary Title")).toHaveValue("");
  });

  it("uses explicit row selection instead of making the editable row itself a button", () => {
    render(<ContentReviewDashboard fiscalYearId="00000000-0000-0000-0000-000000000028" items={[activeItem]} />);

    expect(screen.getByRole("button", { name: "Select Catholic Basics" })).toBeVisible();
    expect(screen.getByLabelText("Summary Title").closest("[role='button']")).toBeNull();
  });

  it("marks co-production opportunities with a small queue signal and compact editor field", () => {
    render(<ContentReviewDashboard fiscalYearId="00000000-0000-0000-0000-000000000028" items={[activeItem]} />);

    expect(screen.getByRole("button", { name: /Co-productions: 1/ })).toBeVisible();
    expect(screen.getAllByLabelText("Potential co-production opportunity")).toHaveLength(2);
    expect(screen.getByText("Co-prod")).toBeVisible();
    expect(screen.getAllByText("Potential co-production").length).toBeGreaterThan(0);

    fireEvent.click(screen.getAllByLabelText("Potential co-production opportunity")[1]);

    expect(screen.getByText("unsaved")).toBeVisible();
  });

  it("opens a top-level co-productions summary", () => {
    render(<ContentReviewDashboard fiscalYearId="00000000-0000-0000-0000-000000000028" items={[activeItem, item]} isDemo />);

    fireEvent.click(screen.getByRole("button", { name: /Co-productions: 1/ }));

    const dialog = screen.getByRole("dialog", { name: "Co-productions" });
    expect(within(dialog).getByDisplayValue("Catholic Basics")).toBeVisible();
    expect(within(dialog).queryByDisplayValue("Aquinas 101")).not.toBeInTheDocument();
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

    const proposedRate = screen.getByLabelText("Summary Proposed Yearly Rate");
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
