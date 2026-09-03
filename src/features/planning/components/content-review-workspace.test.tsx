import { cleanup, fireEvent, render, screen, waitFor, within } from "@testing-library/react";
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

const zebraItem: ContentReviewItem = {
  ...item,
  id: "review-zebra",
  title: "Zebra Chronicles",
  provider: "Zed Media",
  reviewStatus: "not_started",
  proposedRateCents: 500000,
  priorityRank: 1
};

const alphaItem: ContentReviewItem = {
  ...item,
  id: "review-alpha",
  title: "Alpha Mission",
  provider: "Acme Films",
  reviewStatus: "not_started",
  proposedRateCents: 100000,
  priorityRank: 2
};

const betaItem: ContentReviewItem = {
  ...item,
  id: "review-beta",
  title: "Beta Signal",
  provider: "Bravo House",
  reviewStatus: "not_started",
  proposedRateCents: 300000,
  priorityRank: 3
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

    const header = screen.getByTestId("content-review-queue-header");

    expect(header.children).toHaveLength(6);
    expect(header).toHaveClass("text-center");
    expect(header.children[0]).toHaveTextContent("Priority");
    expect(header.children[1]).toHaveAttribute("aria-hidden", "true");
    expect(header.children[2]).toHaveTextContent("Title");
    expect(header.children[3]).toHaveTextContent("Review Status");
    expect(header.children[4]).toHaveTextContent("Yearly Rate");
    expect(header.children[5]).toHaveTextContent("Provider");

    const row = screen.getByTestId("content-review-row-review-active");
    expect(row.className).toContain("md:grid-cols-[4.25rem_4.5rem_1.3fr_1fr_0.9fr_1fr]");
    expect(header.className).toContain("md:grid-cols-[4.25rem_4.5rem_1.3fr_1fr_0.9fr_1fr]");
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

    expect(within(inProgressGroup).getByDisplayValue("Catholic Basics")).toBeInTheDocument();
    expect(within(radarGroup).getByDisplayValue("Long Shot Series")).toBeInTheDocument();
    expect(within(approvedGroup).getByDisplayValue("Aquinas 101")).toBeInTheDocument();
    expect(within(rejectedGroup).getByDisplayValue("Archive Candidate")).toBeInTheDocument();

    // Every status group starts collapsed until opened.
    expect(inProgressGroup).not.toHaveAttribute("open");
    expect(radarGroup).not.toHaveAttribute("open");
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
    expect(approvedGroup.querySelector("details")).toHaveAttribute("open");
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
    expect(within(screen.getByTestId("content-review-active-queue")).getByDisplayValue("Catholic Basics")).toBeInTheDocument();
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

    fireEvent.click(screen.getByTestId("content-review-group-in-progress").querySelector("summary")!);

    expect(screen.getByRole("button", { name: "Select Catholic Basics" })).toBeVisible();
    expect(screen.getByLabelText("Summary Title").closest("[role='button']")).toBeNull();
  });

  it("marks co-production opportunities with a small queue signal and compact editor field", () => {
    render(<ContentReviewDashboard fiscalYearId="00000000-0000-0000-0000-000000000028" items={[activeItem]} />);

    fireEvent.click(screen.getByTestId("content-review-group-in-progress").querySelector("summary")!);

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

  it("sorts the queue by a column header and returns to the manual order", () => {
    render(<ContentReviewDashboard fiscalYearId="00000000-0000-0000-0000-000000000028" items={[zebraItem, alphaItem, betaItem]} />);

    const titles = () => screen.getAllByLabelText("Summary Title").map((input) => (input as HTMLInputElement).value);
    expect(titles()).toEqual(["Zebra Chronicles", "Alpha Mission", "Beta Signal"]);

    fireEvent.click(screen.getByRole("button", { name: "Sort by Title" }));
    expect(titles()).toEqual(["Alpha Mission", "Beta Signal", "Zebra Chronicles"]);

    fireEvent.click(screen.getByRole("button", { name: "Sort by Title" }));
    expect(titles()).toEqual(["Zebra Chronicles", "Beta Signal", "Alpha Mission"]);

    fireEvent.click(screen.getByRole("button", { name: "Sort by Title" }));
    expect(titles()).toEqual(["Zebra Chronicles", "Alpha Mission", "Beta Signal"]);
  });

  it("offers a chip that clears an active sort", () => {
    render(<ContentReviewDashboard fiscalYearId="00000000-0000-0000-0000-000000000028" items={[zebraItem, alphaItem]} />);

    fireEvent.click(screen.getByRole("button", { name: "Sort by Yearly Rate" }));
    const chip = screen.getByRole("button", { name: /Sorted by Yearly Rate/ });

    fireEvent.click(chip);

    expect(screen.queryByRole("button", { name: /Sorted by Yearly Rate/ })).not.toBeInTheDocument();
  });

  it("saves a dragged review order", async () => {
    actionMocks.reorderContentReviewItems.mockResolvedValue(undefined);
    render(<ContentReviewDashboard fiscalYearId="00000000-0000-0000-0000-000000000028" items={[zebraItem, alphaItem, betaItem]} />);

    const dataTransfer = { effectAllowed: "", getData: vi.fn(() => "review-zebra"), setData: vi.fn() };
    fireEvent.dragStart(screen.getByTestId("content-review-row-review-zebra"), { dataTransfer });
    fireEvent.drop(screen.getByTestId("content-review-row-review-beta"), { dataTransfer });

    await waitFor(() => expect(actionMocks.reorderContentReviewItems).toHaveBeenCalledTimes(1));
    const formData = actionMocks.reorderContentReviewItems.mock.calls[0][0] as FormData;
    expect(formData.getAll("itemIds")).toEqual(["review-alpha", "review-beta", "review-zebra"]);
    expect(formData.get("movedToStatus")).toBeNull();
  });

  it("changes the review status when a row is dragged into another group", async () => {
    actionMocks.reorderContentReviewItems.mockResolvedValue(undefined);
    render(<ContentReviewDashboard fiscalYearId="00000000-0000-0000-0000-000000000028" items={[activeItem, item]} />);

    const dataTransfer = { effectAllowed: "", getData: vi.fn(() => "review-active"), setData: vi.fn() };
    fireEvent.dragStart(screen.getByTestId("content-review-row-review-active"), { dataTransfer });
    fireEvent.drop(screen.getByTestId("content-review-row-review-1"), { dataTransfer });

    await waitFor(() => expect(actionMocks.reorderContentReviewItems).toHaveBeenCalledTimes(1));
    const formData = actionMocks.reorderContentReviewItems.mock.calls[0][0] as FormData;
    expect(formData.get("movedItemId")).toBe("review-active");
    expect(formData.get("movedToStatus")).toBe("approved");
  });

  it("saves a dragged group order", async () => {
    actionMocks.reorderContentReviewGroups.mockResolvedValue(undefined);
    render(<ContentReviewDashboard fiscalYearId="00000000-0000-0000-0000-000000000028" items={[activeItem, item]} />);

    const dataTransfer = { effectAllowed: "", getData: vi.fn(() => "in_progress"), setData: vi.fn() };
    fireEvent.dragStart(screen.getByRole("button", { name: /Drag the In Progress group/ }), { dataTransfer });
    fireEvent.drop(screen.getByTestId("content-review-group-not-started"), { dataTransfer });

    await waitFor(() => expect(actionMocks.reorderContentReviewGroups).toHaveBeenCalledTimes(1));
    const formData = actionMocks.reorderContentReviewGroups.mock.calls[0][0] as FormData;
    expect(formData.getAll("reviewStatuses")[0]).toBe("in_progress");
  });

  it("moves a review to a priority typed into its badge", async () => {
    actionMocks.reorderContentReviewItems.mockResolvedValue(undefined);
    render(<ContentReviewDashboard fiscalYearId="00000000-0000-0000-0000-000000000028" items={[zebraItem, alphaItem, betaItem]} />);

    const badge = screen.getByLabelText("Priority for Beta Signal");
    expect(badge).toHaveValue("3");

    fireEvent.change(badge, { target: { value: "1" } });
    fireEvent.keyDown(badge, { key: "Enter" });

    await waitFor(() => expect(actionMocks.reorderContentReviewItems).toHaveBeenCalledTimes(1));
    const formData = actionMocks.reorderContentReviewItems.mock.calls[0][0] as FormData;
    expect(formData.getAll("itemIds")).toEqual(["review-beta", "review-zebra", "review-alpha"]);
  });

  it("logs an update when Enter is pressed in the update field", async () => {
    actionMocks.addContentReviewUpdate.mockResolvedValue({
      id: "update-1",
      itemId: "review-1",
      kind: "note",
      body: "Chased the rights paperwork.",
      fromStatus: null,
      toStatus: null,
      authorEmail: "matt@example.com",
      createdAt: new Date().toISOString()
    });
    render(<ContentReviewDashboard fiscalYearId="00000000-0000-0000-0000-000000000028" items={[item]} />);

    const field = screen.getByLabelText("Log an update");
    fireEvent.change(field, { target: { value: "Chased the rights paperwork." } });
    fireEvent.keyDown(field, { key: "Enter" });

    await waitFor(() => expect(actionMocks.addContentReviewUpdate).toHaveBeenCalledTimes(1));
    const formData = actionMocks.addContentReviewUpdate.mock.calls[0][0] as FormData;
    expect(formData.get("body")).toBe("Chased the rights paperwork.");
    expect(formData.get("itemId")).toBe("review-1");
    expect(await screen.findByText("Chased the rights paperwork.")).toBeVisible();
    expect(field).toHaveValue("");
  });

  it("ignores an empty update submission", () => {
    render(<ContentReviewDashboard fiscalYearId="00000000-0000-0000-0000-000000000028" items={[item]} />);

    const field = screen.getByLabelText("Log an update");
    fireEvent.change(field, { target: { value: "   " } });
    fireEvent.keyDown(field, { key: "Enter" });

    expect(actionMocks.addContentReviewUpdate).not.toHaveBeenCalled();
  });

  it("summarizes recent review work in the recap panel", () => {
    const now = new Date().toISOString();
    render(<ContentReviewDashboard
      fiscalYearId="00000000-0000-0000-0000-000000000028"
      items={[item, activeItem]}
      updates={[
        { id: "u1", itemId: "review-1", kind: "note", body: "Watched the sample.", fromStatus: null, toStatus: null, authorEmail: "matt@example.com", createdAt: now },
        { id: "u2", itemId: "review-active", kind: "status_change", body: null, fromStatus: "not_started", toStatus: "in_progress", authorEmail: "matt@example.com", createdAt: now }
      ]}
    />);

    fireEvent.click(screen.getByRole("button", { name: "Weekly Recap" }));

    const recap = screen.getByTestId("content-review-recap-content");
    expect(within(recap).getByText("Reviews touched").nextSibling).toHaveTextContent("2");
    expect(within(recap).getByText("Updates logged").nextSibling).toHaveTextContent("1");
    expect(within(recap).getByText("Status changes").nextSibling).toHaveTextContent("1");
    expect(within(recap).getByText("Watched the sample.")).toBeVisible();
    expect(within(recap).getByText("Not Started → In Progress")).toBeVisible();
  });

  it("disables reordering in demo mode", () => {
    render(<ContentReviewDashboard fiscalYearId="00000000-0000-0000-0000-000000000028" items={[zebraItem, alphaItem]} isDemo />);

    expect(screen.getByTestId("content-review-row-review-zebra")).not.toHaveAttribute("draggable", "true");
    expect(screen.getByLabelText("Priority for Zebra Chronicles")).toBeDisabled();
    expect(screen.getByLabelText("Log an update")).toBeDisabled();
    expect(screen.queryByRole("button", { name: /Drag the .* group/ })).not.toBeInTheDocument();
  });

  it("never makes a group summary the drag source", () => {
    // A drag begun inside a <summary> fires dragstart but never completes a
    // drop, so the handle must live outside it or group reordering silently
    // does nothing.
    render(<ContentReviewDashboard fiscalYearId="00000000-0000-0000-0000-000000000028" items={[activeItem, item]} />);

    const group = screen.getByTestId("content-review-group-in-progress");
    const summary = group.querySelector("summary")!;

    expect(summary).not.toHaveAttribute("draggable", "true");
    expect(summary.querySelector("[draggable=\"true\"]")).toBeNull();

    const handle = screen.getByRole("button", { name: /Drag the In Progress group/ });
    expect(handle).toHaveAttribute("draggable", "true");
    // A <button> swallows the drop the same way a <summary> does, so the handle
    // must stay a focusable span.
    expect(handle.tagName).toBe("SPAN");
    expect(handle).toHaveAttribute("tabindex", "0");
  });

  it("reorders groups from the handle with the arrow keys", async () => {
    actionMocks.reorderContentReviewGroups.mockResolvedValue(undefined);
    render(<ContentReviewDashboard fiscalYearId="00000000-0000-0000-0000-000000000028" items={[activeItem, item]} />);

    fireEvent.keyDown(screen.getByRole("button", { name: /Drag the In Progress group/ }), { key: "ArrowUp" });

    await waitFor(() => expect(actionMocks.reorderContentReviewGroups).toHaveBeenCalledTimes(1));
    const formData = actionMocks.reorderContentReviewGroups.mock.calls[0][0] as FormData;
    const order = formData.getAll("reviewStatuses");
    expect(order.indexOf("in_progress")).toBeLessThan(order.indexOf("on_the_radar"));
  });

  it("numbers only the top five and offers a pin below them", () => {
    const many = Array.from({ length: 7 }, (_, index) => ({
      ...item,
      id: `review-${index + 1}`,
      title: `Review ${index + 1}`,
      reviewStatus: "not_started" as const,
      priorityRank: index + 1
    }));
    render(<ContentReviewDashboard fiscalYearId="00000000-0000-0000-0000-000000000028" items={many} />);

    expect(screen.getByLabelText("Priority for Review 5")).toHaveValue("5");
    expect(screen.queryByLabelText("Priority for Review 6")).not.toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Add Review 6 to the Focus Five" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Add Review 7 to the Focus Five" })).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Add Review 5 to the Focus Five" })).not.toBeInTheDocument();
  });

  it("pins a queue review into the Focus Five", async () => {
    actionMocks.reorderContentReviewItems.mockResolvedValue(undefined);
    const many = Array.from({ length: 7 }, (_, index) => ({
      ...item,
      id: `review-${index + 1}`,
      title: `Review ${index + 1}`,
      reviewStatus: "not_started" as const,
      priorityRank: index + 1
    }));
    render(<ContentReviewDashboard fiscalYearId="00000000-0000-0000-0000-000000000028" items={many} />);

    fireEvent.click(screen.getByRole("button", { name: "Add Review 7 to the Focus Five" }));

    await waitFor(() => expect(actionMocks.reorderContentReviewItems).toHaveBeenCalledTimes(1));
    const formData = actionMocks.reorderContentReviewItems.mock.calls[0][0] as FormData;
    expect(formData.getAll("itemIds").slice(0, 5)).toEqual(["review-1", "review-2", "review-3", "review-4", "review-7"]);
  });

  it("lists the Focus Five with open slots and releases one back to the queue", async () => {
    actionMocks.reorderContentReviewItems.mockResolvedValue(undefined);
    render(<ContentReviewDashboard fiscalYearId="00000000-0000-0000-0000-000000000028" items={[zebraItem, alphaItem, betaItem]} />);

    const focus = screen.getByTestId("content-review-focus-five");
    expect(within(focus).getByText("3 of 5")).toBeVisible();
    expect(within(focus).getAllByText(/Open slot/)).toHaveLength(2);
    expect(within(focus).getByText("Zebra Chronicles")).toBeVisible();

    fireEvent.click(within(focus).getByRole("button", { name: "Remove Zebra Chronicles from the Focus Five" }));

    await waitFor(() => expect(actionMocks.reorderContentReviewItems).toHaveBeenCalledTimes(1));
    const formData = actionMocks.reorderContentReviewItems.mock.calls[0][0] as FormData;
    expect(formData.getAll("itemIds")).toEqual(["review-alpha", "review-beta", "review-zebra"]);
  });

  it("reorders within the Focus Five by dragging", async () => {
    actionMocks.reorderContentReviewItems.mockResolvedValue(undefined);
    render(<ContentReviewDashboard fiscalYearId="00000000-0000-0000-0000-000000000028" items={[zebraItem, alphaItem, betaItem]} />);

    const focus = screen.getByTestId("content-review-focus-five");
    const dataTransfer = { effectAllowed: "", getData: vi.fn(() => "review-beta"), setData: vi.fn() };
    fireEvent.dragStart(within(focus).getByTestId("content-review-focus-row-review-beta"), { dataTransfer });
    fireEvent.drop(within(focus).getByTestId("content-review-focus-row-review-zebra"), { dataTransfer });

    await waitFor(() => expect(actionMocks.reorderContentReviewItems).toHaveBeenCalledTimes(1));
    const formData = actionMocks.reorderContentReviewItems.mock.calls[0][0] as FormData;
    expect(formData.getAll("itemIds")).toEqual(["review-beta", "review-zebra", "review-alpha"]);
  });
});
