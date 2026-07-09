import { fireEvent, render, screen, waitFor, within } from "@testing-library/react";
import "@testing-library/jest-dom/vitest";
import React from "react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { RoadmapDashboard } from "./roadmap-dashboard";
import type { OngoingSeries, RoadmapCategory, RoadmapItem } from "../planning-types";

const actionMocks = vi.hoisted(() => ({
  addOngoingSeries: vi.fn(),
  addRoadmapCategory: vi.fn(),
  addRoadmapItem: vi.fn(),
  deleteOngoingSeries: vi.fn(),
  deleteRoadmapCategory: vi.fn(),
  deleteRoadmapItem: vi.fn(),
  sendRoadmapItemToBudget: vi.fn(),
  updateOngoingSeries: vi.fn(),
  updateRoadmapCategory: vi.fn(),
  updateRoadmapItem: vi.fn()
}));

vi.mock("../planning-actions", () => actionMocks);

beforeEach(() => vi.clearAllMocks());
afterEach(() => vi.useRealTimers());

const categories: RoadmapCategory[] = [
  { id: "cat-parish", name: "Parish", colorKey: "blue", sortOrder: 0, isActive: true },
  { id: "cat-adult", name: "Adult", colorKey: "amber", sortOrder: 1, isActive: true },
  { id: "cat-kids", name: "Kids", colorKey: "green", sortOrder: 2, isActive: true }
];

const roadmapItems: RoadmapItem[] = [
  { id: "road-1", title: "Aquinas 101", provider: "Thomistic", releaseDate: "2027-01-24", status: "planned", notes: null, categoryId: "cat-parish" },
  { id: "road-2", title: "Undated Film", provider: null, releaseDate: null, status: "in_progress", notes: null, categoryId: "cat-adult" },
  { id: "road-3", title: "Future Film", provider: null, releaseDate: "2028-01-01", status: "planned", notes: null, categoryId: null },
  { id: "road-4", title: "Past Film", provider: null, releaseDate: "2026-11-12", status: "planned", notes: null, categoryId: null },
  { id: "road-5", title: "Recent Film", provider: null, releaseDate: "2026-12-08", status: "released", notes: null, categoryId: "cat-kids" },
  { id: "road-6", title: "Older Film", provider: null, releaseDate: "2026-12-01", status: "released", notes: null, categoryId: "cat-kids" }
];

const series: OngoingSeries[] = [
  { id: "series-1", series: "Practicing Catholic", cadence: "1/week", notes: "Weekly placeholders" },
  { id: "series-2", series: "What Catholics Believe", cadence: "2/month", notes: "Alternating weeks" }
];

describe("RoadmapDashboard", () => {
  it("renders a six-month timeline with navigation and range controls", () => {
    render(<RoadmapDashboard fiscalYearId="00000000-0000-0000-0000-000000000028" roadmapItems={roadmapItems} ongoingSeries={series} categories={categories} startMonth="2027-01" monthCount={6} isDemo />);

    expect(screen.getByRole("heading", { name: "January 2027" })).toBeVisible();
    expect(screen.getByRole("heading", { name: "June 2027" })).toBeVisible();
    expect(screen.getByRole("link", { name: "Previous" })).toHaveAttribute("href", expect.stringContaining("start=2026-07"));
    expect(screen.getByRole("link", { name: "9 months" })).toHaveAttribute("href", expect.stringContaining("months=9"));
    expect(screen.getByRole("link", { name: "12 months" })).toHaveAttribute("href", expect.stringContaining("months=12"));
  });

  it("groups visible items and sends undated or outside items to Backlog", () => {
    render(<RoadmapDashboard fiscalYearId="00000000-0000-0000-0000-000000000028" roadmapItems={roadmapItems} ongoingSeries={series} categories={categories} startMonth="2027-01" monthCount={6} isDemo />);

    expect(screen.getByText("Aquinas 101")).toBeVisible();
    expect(screen.getByRole("heading", { name: "Backlog" })).toBeVisible();
    const backlog = screen.getByTestId("roadmap-backlog");
    const backlogSummary = within(backlog).getByText("Backlog").closest("summary");

    expect(backlog).not.toHaveAttribute("open");
    expect(backlog).toHaveClass("self-start");
    expect(backlogSummary).toHaveClass("py-3");
    expect(backlogSummary).not.toHaveClass("min-h-16");
    expect(within(backlogSummary!).getByText("Expand Backlog section")).toBeInTheDocument();
    expect(within(backlog).queryByText(/^\d+ items?$/)).not.toBeInTheDocument();

    fireEvent.click(within(backlog).getByText("Backlog"));
    fireEvent.click(within(screen.getByTestId("backlog-other-content")).getByText("In progress"));
    expect(screen.getByText("Undated Film")).toBeVisible();
    expect(screen.getByText("Future Film")).toBeVisible();
    expect(screen.getAllByText("Parish").some((element) => element.classList.contains("bg-blue-100"))).toBe(true);
  });

  it("summarizes fiscal-year roadmap progress at a glance", () => {
    render(<RoadmapDashboard fiscalYearId="00000000-0000-0000-0000-000000000028" roadmapItems={roadmapItems} ongoingSeries={series} categories={categories} startMonth="2027-01" monthCount={6} isDemo />);

    const summary = screen.getByTestId("roadmap-summary");

    expect(summary).not.toHaveAttribute("open");
    expect(summary).toHaveClass("bg-blue-50");
    expect(within(summary).getByRole("heading", { name: "Fiscal year at a glance" })).toBeVisible();
    expect(within(summary).getByText("2 released")).not.toBeVisible();

    fireEvent.click(within(summary).getByText("Fiscal year at a glance"));

    expect(summary).toHaveAttribute("open");
    expect(within(summary).getAllByText("6 titles").some((element) => element.classList.contains("text-xl"))).toBe(true);
    expect(within(summary).getByText("2 released")).toBeVisible();
    expect(within(summary).getByText("1 unscheduled")).toBeVisible();
    expect(within(summary).getByText("Top audience")).toBeVisible();
    expect(within(summary).getByText("Kids")).toBeVisible();
    expect(within(summary).getByText("Top provider")).toBeVisible();
    expect(within(summary).getByText("Thomistic")).toBeVisible();
  });

  it("uses the next future exact date for Next up", () => {
    vi.setSystemTime(new Date(2026, 6, 7, 12));
    const julyItems: RoadmapItem[] = [
      { id: "road-past-july", title: "GK Chesterton", provider: "Augustine Institute", releaseDate: "2026-07-01", status: "planned", notes: null, categoryId: null },
      { id: "road-future-july", title: "Future July Release", provider: "Augustine Institute", releaseDate: "2026-07-15", status: "planned", notes: null, categoryId: null }
    ];

    render(<RoadmapDashboard fiscalYearId="00000000-0000-0000-0000-000000000028" roadmapItems={julyItems} ongoingSeries={series} categories={categories} startMonth="2026-07" monthCount={6} isDemo />);

    const summary = screen.getByTestId("roadmap-summary");
    fireEvent.click(within(summary).getByText("Fiscal year at a glance"));

    expect(within(summary).getByText("Future July Release")).toBeVisible();
    expect(within(summary).queryByText("GK Chesterton")).not.toBeInTheDocument();
  });

  it("filters the roadmap when key chips are clicked", () => {
    render(<RoadmapDashboard fiscalYearId="00000000-0000-0000-0000-000000000028" roadmapItems={roadmapItems} ongoingSeries={series} categories={categories} startMonth="2027-01" monthCount={6} isDemo />);

    fireEvent.click(screen.getByRole("button", { name: "Filter Adult" }));
    fireEvent.click(within(screen.getByTestId("roadmap-backlog")).getByText("Backlog"));
    fireEvent.click(within(screen.getByTestId("backlog-other-content")).getByText("In progress"));

    expect(screen.getByText("Undated Film")).toBeVisible();
    expect(screen.queryByText("Aquinas 101")).not.toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Clear Adult filter" })).toBeVisible();

    fireEvent.click(screen.getByRole("button", { name: "Clear Adult filter" }));

    expect(screen.getByText("Aquinas 101")).toBeVisible();
  });

  it("splits backlog into in-progress and released groups with released months sorted newest first", () => {
    vi.setSystemTime(new Date("2027-03-15T12:00:00Z"));

    render(<RoadmapDashboard fiscalYearId="00000000-0000-0000-0000-000000000028" roadmapItems={roadmapItems} ongoingSeries={series} categories={categories} startMonth="2027-01" monthCount={6} isDemo />);

    const releasedGroup = screen.getByTestId("backlog-released-content");
    const otherGroup = screen.getByTestId("backlog-other-content");
    const backlog = screen.getByTestId("roadmap-backlog");

    fireEvent.click(within(backlog).getByText("Backlog"));

    expect(releasedGroup).not.toHaveAttribute("open");
    expect(otherGroup).not.toHaveAttribute("open");

    expect(backlog.textContent).toMatch(/In progress2.*Already released content3/);

    fireEvent.click(within(releasedGroup).getByText("Already released content"));
    fireEvent.click(within(otherGroup).getByText("In progress"));

    const decemberGroup = within(releasedGroup).getByTestId("released-month-2026-12");
    const novemberGroup = within(releasedGroup).getByTestId("released-month-2026-11");
    fireEvent.click(within(decemberGroup).getByText("December 2026"));
    fireEvent.click(within(novemberGroup).getByText("November 2026"));

    expect(within(decemberGroup).getAllByRole("button").map((button) => button.textContent)).toEqual(expect.arrayContaining([
      expect.stringContaining("Recent Film"),
      expect.stringContaining("Older Film")
    ]));
    expect(within(decemberGroup).getAllByRole("button").map((button) => button.textContent).join(" ")).toMatch(/Recent Film.*Older Film/);
    expect(within(novemberGroup).getByText("Past Film")).toBeVisible();
    expect(within(releasedGroup).queryByText("Future Film")).not.toBeInTheDocument();
    expect(within(releasedGroup).queryByText("Undated Film")).not.toBeInTheDocument();
    expect(within(otherGroup).getByText("Future Film")).toBeVisible();
    expect(within(otherGroup).getByText("Undated Film")).toBeVisible();
  });

  it("shows and edits the exact release date", () => {
    render(<RoadmapDashboard fiscalYearId="00000000-0000-0000-0000-000000000028" roadmapItems={roadmapItems} ongoingSeries={series} categories={categories} startMonth="2027-01" monthCount={6} isDemo />);

    expect(screen.getByText("January 24, 2027")).toBeVisible();
    fireEvent.click(screen.getByRole("button", { name: "Edit Aquinas 101" }));

    const dialog = screen.getByRole("dialog", { name: "Edit Roadmap Item" });
    const dateInput = within(dialog).getByLabelText("Release date", { selector: "#road-1-date" });
    expect(dateInput).toHaveAttribute("type", "date");
    expect(dateInput).toHaveValue("2027-01-24");
  });

  it("renders category management and ongoing series", () => {
    render(<RoadmapDashboard fiscalYearId="00000000-0000-0000-0000-000000000028" roadmapItems={roadmapItems} ongoingSeries={series} categories={categories} startMonth="2027-01" monthCount={6} isDemo />);

    expect(screen.getByRole("button", { name: "Manage Key" })).toBeVisible();
    expect(screen.getByRole("heading", { name: "Ongoing Series Cadence" })).toBeVisible();
    expect(screen.getByText("Practicing Catholic")).toBeVisible();
  });

  it("opens the add-roadmap form in a modal dialog", () => {
    render(<RoadmapDashboard fiscalYearId="00000000-0000-0000-0000-000000000028" roadmapItems={roadmapItems} ongoingSeries={series} categories={categories} startMonth="2027-01" monthCount={6} isDemo />);

    const trigger = screen.getByRole("button", { name: "Add Roadmap Item" });

    expect(screen.queryByRole("dialog", { name: "Add Roadmap Item" })).not.toBeInTheDocument();

    fireEvent.click(trigger);

    const dialog = screen.getByRole("dialog", { name: "Add Roadmap Item" });
    expect(dialog).toHaveAttribute("open");
    expect(screen.getByRole("heading", { name: "Add Roadmap Item" })).toBeVisible();

    fireEvent.click(screen.getByRole("button", { name: "Cancel" }));

    expect(screen.queryByRole("dialog", { name: "Add Roadmap Item" })).not.toBeInTheDocument();
  });

  it("does not mount every closed roadmap dialog at once", () => {
    render(<RoadmapDashboard fiscalYearId="00000000-0000-0000-0000-000000000028" roadmapItems={roadmapItems} ongoingSeries={series} categories={categories} startMonth="2027-01" monthCount={6} isDemo />);

    expect(screen.getAllByRole("dialog", { hidden: true })).toHaveLength(1);
  });

  it("opens an add-roadmap form from a month with that month prefilled", () => {
    render(<RoadmapDashboard fiscalYearId="00000000-0000-0000-0000-000000000028" roadmapItems={roadmapItems} ongoingSeries={series} categories={categories} startMonth="2027-01" monthCount={6} isDemo />);

    const januaryAddButton = screen.getByRole("button", { name: "Add item to January 2027" });
    expect(januaryAddButton).toHaveTextContent("Add item");
    expect(januaryAddButton).toHaveClass("!text-blue-700");

    fireEvent.click(januaryAddButton);

    const dialog = screen.getByRole("dialog", { name: "Add Roadmap Item" });
    expect(dialog).toHaveAttribute("open");
    expect(within(dialog).getByLabelText("Release date")).toHaveValue("2027-01-01");
    expect(within(dialog).getByLabelText("Status")).toHaveClass("min-h-12", "self-start");
    expect(within(dialog).queryByLabelText("Release date option")).not.toBeInTheDocument();
  });

  it("closes provider suggestions after choosing one in the add-roadmap form", () => {
    render(<RoadmapDashboard fiscalYearId="00000000-0000-0000-0000-000000000028" roadmapItems={roadmapItems} ongoingSeries={series} categories={categories} startMonth="2027-01" monthCount={6} />);

    fireEvent.click(screen.getByRole("button", { name: "Add Roadmap Item" }));
    const dialog = screen.getByRole("dialog", { name: "Add Roadmap Item" });
    const providerInput = within(dialog).getByLabelText("Provider");

    fireEvent.change(providerInput, { target: { value: "Tho" } });
    expect(within(dialog).getByRole("button", { name: "Thomistic" })).toBeVisible();

    fireEvent.click(within(dialog).getByRole("button", { name: "Thomistic" }));

    expect(providerInput).toHaveValue("Thomistic");
    expect(within(dialog).queryByRole("button", { name: "Thomistic" })).not.toBeInTheDocument();
  });

  it("confirms and resets the add-roadmap form after adding an item", async () => {
    actionMocks.addRoadmapItem.mockResolvedValue(undefined);
    render(<RoadmapDashboard fiscalYearId="00000000-0000-0000-0000-000000000028" roadmapItems={roadmapItems} ongoingSeries={series} categories={categories} startMonth="2027-01" monthCount={6} />);

    fireEvent.click(screen.getByRole("button", { name: "Add Roadmap Item" }));
    const dialog = screen.getByRole("dialog", { name: "Add Roadmap Item" });
    const titleInput = within(dialog).getByLabelText("Title");
    const providerInput = within(dialog).getByLabelText("Provider");
    const releaseDateInput = within(dialog).getByLabelText("Release date");
    const statusSelect = within(dialog).getByLabelText("Status");
    const categorySelect = within(dialog).getByLabelText("Color category");
    const notesInput = within(dialog).getByLabelText("Notes");

    fireEvent.change(titleInput, { target: { value: "New Catechesis" } });
    fireEvent.change(providerInput, { target: { value: "Augustine Institute" } });
    fireEvent.change(releaseDateInput, { target: { value: "2027-02-14" } });
    fireEvent.change(statusSelect, { target: { value: "blocked" } });
    fireEvent.change(categorySelect, { target: { value: "cat-adult" } });
    fireEvent.change(notesInput, { target: { value: "Launch notes" } });
    fireEvent.click(within(dialog).getByRole("button", { name: "Add Item" }));

    await waitFor(() => expect(actionMocks.addRoadmapItem).toHaveBeenCalledTimes(1));

    expect(within(dialog).getByText("Roadmap item added.")).toBeVisible();
    expect(within(dialog).getByLabelText("Title")).toHaveValue("");
    expect(within(dialog).getByLabelText("Provider")).toHaveValue("");
    expect(within(dialog).getByLabelText("Release date")).toHaveValue("");
    expect(within(dialog).getByLabelText("Status")).toHaveValue("planned");
    expect(within(dialog).getByLabelText("Color category")).toHaveValue("");
    expect(within(dialog).getByLabelText("Notes")).toHaveValue("");
  });

  it("supports TBD release dates and shows TBD in red", () => {
    const tbdItems: RoadmapItem[] = [
      ...roadmapItems,
      { id: "road-tbd", title: "Mystery Series", provider: "Thomistic", releaseDate: "TBD", status: "planned", notes: null, categoryId: null }
    ];
    render(<RoadmapDashboard fiscalYearId="00000000-0000-0000-0000-000000000028" roadmapItems={tbdItems} ongoingSeries={series} categories={categories} startMonth="2027-01" monthCount={6} />);

    expect(within(screen.getByRole("button", { name: "Edit Mystery Series" })).getByText("TBD")).toHaveClass("bg-red-100", "text-red-700");

    fireEvent.click(screen.getByRole("button", { name: "Add Roadmap Item" }));
    const dialog = screen.getByRole("dialog", { name: "Add Roadmap Item" });
    fireEvent.click(within(dialog).getByRole("button", { name: "Mark release date TBD" }));

    expect(within(dialog).getByLabelText("Release date value")).toHaveValue("TBD");
    expect(within(dialog).queryByLabelText("Release date")).not.toBeInTheDocument();
  });

  it("opens and closes a roadmap item editor in a modal dialog", () => {
    render(<RoadmapDashboard fiscalYearId="00000000-0000-0000-0000-000000000028" roadmapItems={roadmapItems} ongoingSeries={series} categories={categories} startMonth="2027-01" monthCount={6} isDemo />);

    const trigger = screen.getByRole("button", { name: "Edit Aquinas 101" });
    fireEvent.click(trigger);

    const dialog = screen.getByRole("dialog", { name: "Edit Roadmap Item" });
    expect(dialog).toHaveAttribute("open");
    expect(within(dialog).getByDisplayValue("Aquinas 101")).toBeVisible();
    expect(within(dialog).getByRole("button", { name: "Save Item" })).toBeVisible();
    expect(within(dialog).getByRole("button", { name: "Delete" })).toBeVisible();

    fireEvent.click(within(dialog).getByRole("button", { name: "Cancel" }));
    expect(screen.queryByRole("dialog", { name: "Edit Roadmap Item" })).not.toBeInTheDocument();
    expect(trigger).toHaveFocus();

    fireEvent.click(trigger);
    const reopenedDialog = screen.getByRole("dialog", { name: "Edit Roadmap Item" });
    fireEvent.keyDown(reopenedDialog, { key: "Escape" });
    expect(screen.queryByRole("dialog", { name: "Edit Roadmap Item" })).not.toBeInTheDocument();
    expect(trigger).toHaveFocus();
  });

  it("offers planned, in-progress, blocked, and released statuses in the edit form", () => {
    render(<RoadmapDashboard fiscalYearId="00000000-0000-0000-0000-000000000028" roadmapItems={roadmapItems} ongoingSeries={series} categories={categories} startMonth="2027-01" monthCount={6} />);

    fireEvent.click(screen.getByRole("button", { name: "Edit Aquinas 101" }));
    const dialog = screen.getByRole("dialog", { name: "Edit Roadmap Item" });

    expect(within(dialog).getByLabelText("Status")).toHaveClass("self-start");
    expect(within(dialog).getByRole("option", { name: "Planned" })).toBeVisible();
    expect(within(dialog).getByRole("option", { name: "In progress" })).toBeVisible();
    expect(within(dialog).getByRole("option", { name: "Blocked" })).toBeVisible();
    expect(within(dialog).getByRole("option", { name: "Released" })).toBeVisible();
    expect(within(dialog).queryByRole("option", { name: "Ready" })).not.toBeInTheDocument();
  });

  it("lets released roadmap items move forward to the budget", () => {
    render(<RoadmapDashboard fiscalYearId="00000000-0000-0000-0000-000000000028" roadmapItems={roadmapItems} ongoingSeries={series} categories={categories} startMonth="2027-01" monthCount={6} />);

    fireEvent.click(screen.getByRole("button", { name: "Edit Recent Film" }));

    expect(within(screen.getByRole("dialog", { name: "Edit Roadmap Item" })).getByRole("button", { name: "Add to Budget" })).toBeInTheDocument();
  });

  it("confirms when a released roadmap item is added to the budget", async () => {
    actionMocks.sendRoadmapItemToBudget.mockResolvedValue(undefined);
    render(<RoadmapDashboard fiscalYearId="00000000-0000-0000-0000-000000000028" roadmapItems={roadmapItems} ongoingSeries={series} categories={categories} startMonth="2027-01" monthCount={6} />);

    fireEvent.click(screen.getByRole("button", { name: "Edit Recent Film" }));
    const dialog = screen.getByRole("dialog", { name: "Edit Roadmap Item" });
    fireEvent.click(within(dialog).getByRole("button", { name: "Add to Budget" }));

    await waitFor(() => expect(actionMocks.sendRoadmapItemToBudget).toHaveBeenCalledTimes(1));
    expect(within(dialog).getByText("Added to Budget with a $0 yearly placeholder. Update the amount on the Dashboard.")).toBeVisible();
  });

  it("does not offer budget sending for roadmap items that are not released", () => {
    render(<RoadmapDashboard fiscalYearId="00000000-0000-0000-0000-000000000028" roadmapItems={roadmapItems} ongoingSeries={series} categories={categories} startMonth="2027-01" monthCount={6} />);

    fireEvent.click(screen.getByRole("button", { name: "Edit Aquinas 101" }));

    expect(within(screen.getByRole("dialog", { name: "Edit Roadmap Item" })).queryByRole("button", { name: "Add to Budget" })).not.toBeInTheDocument();
  });

  it("keeps an edited roadmap status visible after saving", async () => {
    actionMocks.updateRoadmapItem.mockResolvedValue(undefined);
    render(<RoadmapDashboard fiscalYearId="00000000-0000-0000-0000-000000000028" roadmapItems={roadmapItems} ongoingSeries={series} categories={categories} startMonth="2027-01" monthCount={6} />);

    fireEvent.click(screen.getByRole("button", { name: "Edit Aquinas 101" }));
    const dialog = screen.getByRole("dialog", { name: "Edit Roadmap Item" });
    const statusSelect = within(dialog).getByLabelText("Status");

    fireEvent.change(statusSelect, { target: { value: "blocked" } });
    fireEvent.click(within(dialog).getByRole("button", { name: "Save Item" }));

    await waitFor(() => expect(actionMocks.updateRoadmapItem).toHaveBeenCalledTimes(1));
    expect(statusSelect).toHaveValue("blocked");
  });

  it("asks for confirmation before deleting roadmap items and ongoing series", () => {
    const confirm = vi.spyOn(window, "confirm").mockReturnValue(false);
    render(<RoadmapDashboard fiscalYearId="00000000-0000-0000-0000-000000000028" roadmapItems={roadmapItems} ongoingSeries={series} categories={categories} startMonth="2027-01" monthCount={6} />);

    fireEvent.click(screen.getByRole("button", { name: "Edit Aquinas 101" }));
    fireEvent.click(within(screen.getByRole("dialog", { name: "Edit Roadmap Item" })).getByRole("button", { name: "Delete" }));

    const seriesRow = screen.getByTestId("series-row-series-1");
    fireEvent.click(within(seriesRow).getByText("Edit"));
    fireEvent.click(within(seriesRow).getByRole("button", { name: "Delete" }));

    expect(confirm).toHaveBeenCalledWith("Delete Aquinas 101? This cannot be undone.");
    expect(confirm).toHaveBeenCalledWith("Delete Practicing Catholic? This cannot be undone.");
  });

  it("lets long month lists grow and opens a roadmap focus view", () => {
    render(<RoadmapDashboard fiscalYearId="00000000-0000-0000-0000-000000000028" roadmapItems={roadmapItems} ongoingSeries={series} categories={categories} startMonth="2027-01" monthCount={6} isDemo />);

    const timeline = screen.getByTestId("roadmap-month-scroll");
    expect(timeline).toHaveClass("overflow-x-auto");
    expect(timeline).not.toHaveClass("h-[70vh]", "md:h-[600px]");
    expect(screen.getAllByTestId("roadmap-month-column")[0]).toHaveClass("w-[320px]");

    fireEvent.click(screen.getByRole("button", { name: "Expand roadmap" }));

    expect(screen.getByRole("heading", { name: "January 2027" })).toBeVisible();
    expect(screen.getByRole("heading", { name: "February 2027" })).toBeVisible();
    expect(screen.queryByRole("heading", { name: "Ongoing Series Cadence" })).not.toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Exit focus view" })).toBeVisible();

    fireEvent.click(screen.getByRole("button", { name: "Exit focus view" }));

    expect(screen.getByRole("heading", { name: "Ongoing Series Cadence" })).toBeVisible();
  });

  it("alternates ongoing series rows between white and light orange", () => {
    render(<RoadmapDashboard fiscalYearId="00000000-0000-0000-0000-000000000028" roadmapItems={roadmapItems} ongoingSeries={series} categories={categories} startMonth="2027-01" monthCount={6} isDemo />);

    expect(screen.getByTestId("series-row-series-1")).toHaveClass("bg-white");
    expect(screen.getByTestId("series-row-series-2")).toHaveClass("bg-orange-50");
  });

  it("opens Manage Key as a modal with stable name and color fields only", async () => {
    actionMocks.updateRoadmapCategory.mockResolvedValue(undefined);
    render(<RoadmapDashboard fiscalYearId="00000000-0000-0000-0000-000000000028" roadmapItems={roadmapItems} ongoingSeries={series} categories={categories} startMonth="2027-01" monthCount={6} />);

    fireEvent.click(screen.getByRole("button", { name: "Manage Key" }));

    const dialog = screen.getByRole("dialog", { name: "Manage Key" });
    const nameInput = within(dialog).getByLabelText("Category name Parish");
    const colorSelect = within(dialog).getByLabelText("Category color Parish");
    expect(within(dialog).queryByLabelText("Category status Parish")).not.toBeInTheDocument();
    expect(within(dialog).queryByLabelText("Category order Parish")).not.toBeInTheDocument();

    fireEvent.change(nameInput, { target: { value: "Parish Life" } });
    fireEvent.change(colorSelect, { target: { value: "green" } });
    fireEvent.click(within(dialog).getByRole("button", { name: "Save Parish" }));

    await waitFor(() => expect(actionMocks.updateRoadmapCategory).toHaveBeenCalledTimes(1));
    expect(nameInput).toHaveValue("Parish Life");
    expect(colorSelect).toHaveValue("green");
  });

  it("warns before deleting a key and preserves cancellation", async () => {
    const confirm = vi.spyOn(window, "confirm").mockReturnValueOnce(false).mockReturnValueOnce(true);
    actionMocks.deleteRoadmapCategory.mockResolvedValue(undefined);
    render(<RoadmapDashboard fiscalYearId="00000000-0000-0000-0000-000000000028" roadmapItems={roadmapItems} ongoingSeries={series} categories={categories} startMonth="2027-01" monthCount={6} />);

    fireEvent.click(screen.getByRole("button", { name: "Manage Key" }));
    const deleteButton = within(screen.getByRole("dialog", { name: "Manage Key" })).getByRole("button", { name: "Delete Parish" });

    fireEvent.click(deleteButton);
    expect(actionMocks.deleteRoadmapCategory).not.toHaveBeenCalled();

    fireEvent.click(deleteButton);
    await waitFor(() => expect(actionMocks.deleteRoadmapCategory).toHaveBeenCalledTimes(1));
    expect(confirm).toHaveBeenCalledWith("Delete this key? Roadmap items will remain, but they will lose this key and color.");
  });
});
