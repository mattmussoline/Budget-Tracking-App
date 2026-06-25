import { cleanup, fireEvent, render, screen, within } from "@testing-library/react";
import "@testing-library/jest-dom/vitest";
import React from "react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { ContentReviewDashboard } from "./content-review-dashboard";
import type { ContentReviewItem } from "../planning-types";

const actionMocks = vi.hoisted(() => ({
  addContentReviewItem: vi.fn(),
  deleteContentReviewItem: vi.fn(),
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
  title: "Active Review",
  reviewStatus: "in_progress"
};

const approvedItem: ContentReviewItem = {
  ...item,
  id: "review-approved",
  title: "Approved Review",
  reviewStatus: "approved"
};

const rejectedItem: ContentReviewItem = {
  ...item,
  id: "review-rejected",
  title: "Rejected Review",
  reviewStatus: "rejected"
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
    expect(screen.getByLabelText("Comparable Content")).toHaveValue("Symbolon");
  });

  it("opens a blank unsaved draft from Add Content", () => {
    render(<ContentReviewDashboard fiscalYearId="00000000-0000-0000-0000-000000000028" items={[item]} isDemo />);

    fireEvent.click(screen.getByRole("button", { name: "Add Content" }));

    expect(screen.getByRole("heading", { name: "New Content Review" })).toBeVisible();
    expect(screen.getByLabelText("Detail Title")).toHaveValue("");
  });

  it("offers the exact approved controlled options", () => {
    render(<ContentReviewDashboard fiscalYearId="00000000-0000-0000-0000-000000000028" items={[item]} isDemo />);

    expect(screen.getByLabelText("Review Status")).toContainHTML("Not Started");
    expect(screen.getByLabelText("Genre")).toContainHTML("Christian Formation");
    expect(screen.getByLabelText("Format")).toContainHTML("Docu-Series");
    expect(screen.getByLabelText("Format")).toContainHTML("Ministry Resource");
  });

  it("keeps approved and rejected items out of the active decision queue", () => {
    render(<ContentReviewDashboard fiscalYearId="00000000-0000-0000-0000-000000000028" items={[activeItem, approvedItem, rejectedItem]} isDemo />);

    const activeQueue = screen.getByTestId("active-review-queue");
    expect(within(activeQueue).getByDisplayValue("Active Review")).toBeVisible();
    expect(within(activeQueue).queryByDisplayValue("Approved Review")).not.toBeInTheDocument();
    expect(within(activeQueue).queryByDisplayValue("Rejected Review")).not.toBeInTheDocument();

    expect(screen.getByRole("button", { name: "Approved 1" })).toBeVisible();
    expect(screen.getByRole("button", { name: "Rejected 1" })).toBeVisible();
  });

  it("expands archive sections and lets users select archived items", () => {
    render(<ContentReviewDashboard fiscalYearId="00000000-0000-0000-0000-000000000028" items={[activeItem, approvedItem, rejectedItem]} isDemo />);

    fireEvent.click(screen.getByRole("button", { name: "Approved 1" }));
    const approvedSection = screen.getByRole("button", { name: "Approved 1" }).closest("details");
    expect(approvedSection).not.toBeNull();
    fireEvent.click(within(approvedSection as HTMLElement).getByDisplayValue("Approved Review"));

    expect(screen.getByLabelText("Detail Title")).toHaveValue("Approved Review");

    fireEvent.click(screen.getByRole("button", { name: "Rejected 1" }));
    const rejectedSection = screen.getByRole("button", { name: "Rejected 1" }).closest("details");
    expect(rejectedSection).not.toBeNull();
    fireEvent.click(within(rejectedSection as HTMLElement).getByDisplayValue("Rejected Review"));

    expect(screen.getByLabelText("Detail Title")).toHaveValue("Rejected Review");
  });

  it("moves items between active and archive sections when review status changes", () => {
    render(<ContentReviewDashboard fiscalYearId="00000000-0000-0000-0000-000000000028" items={[activeItem, approvedItem]} />);

    fireEvent.change(screen.getAllByDisplayValue("In Progress")[0], { target: { value: "approved" } });

    expect(screen.getByTestId("active-review-queue")).not.toHaveTextContent("Active Review");
    expect(screen.getByRole("button", { name: "Approved 2" })).toBeVisible();

    fireEvent.click(screen.getByRole("button", { name: "Approved 2" }));
    const approvedSection = screen.getByRole("button", { name: "Approved 2" }).closest("details");
    expect(approvedSection).not.toBeNull();
    const approvedReviewRow = within(approvedSection as HTMLElement).getByDisplayValue("Approved Review").closest('[role="button"]');
    expect(approvedReviewRow).not.toBeNull();
    fireEvent.change(within(approvedReviewRow as HTMLElement).getByLabelText("Summary Review Status"), { target: { value: "blocked" } });

    expect(within(screen.getByTestId("active-review-queue")).getByDisplayValue("Approved Review")).toBeVisible();
    expect(screen.getByRole("button", { name: "Approved 1" })).toBeVisible();
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
});
