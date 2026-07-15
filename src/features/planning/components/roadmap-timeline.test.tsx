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
  reorderRoadmapCategories: vi.fn(),
  sendRoadmapItemToBudget: vi.fn(),
  sendRoadmapItemToClickUp: vi.fn(),
  sendRoadmapMonthToClickUp: vi.fn(),
  updateOngoingSeries: vi.fn(),
  updateRoadmapCategory: vi.fn(),
  updateRoadmapItem: vi.fn()
}));

const navigationMocks = vi.hoisted(() => ({
  refresh: vi.fn()
}));

vi.mock("../planning-actions", () => actionMocks);
vi.mock("next/navigation", () => ({
  useRouter: () => ({ refresh: navigationMocks.refresh })
}));

beforeEach(() => {
  vi.clearAllMocks();
  navigationMocks.refresh.mockClear();
});
afterEach(() => vi.useRealTimers());

const categories: RoadmapCategory[] = [
  { id: "cat-parish", name: "Parish", colorKey: "blue", sortOrder: 0, isActive: true },
  { id: "cat-adult", name: "Adult", colorKey: "amber", sortOrder: 1, isActive: true },
  { id: "cat-kids", name: "Kids", colorKey: "green", sortOrder: 2, isActive: true }
];

const roadmapItems: RoadmapItem[] = [
  { id: "road-1", title: "Aquinas 101", provider: "Thomistic", genre: "Scripture", format: "Formation Series", featuredInIndividualMarketing: true, releaseDate: "2027-01-24", status: "planned", notes: null, categoryId: "cat-parish" },
  { id: "road-2", title: "Undated Film", provider: null, releaseDate: null, status: "in_progress", notes: null, categoryId: "cat-adult" },
  { id: "road-3", title: "Future Film", provider: null, releaseDate: "2028-01-01", status: "planned", notes: null, categoryId: null },
  { id: "road-4", title: "Past Film", provider: "Augustine Institute", genre: "Biography", format: "Documentary", releaseDate: "2026-11-12", status: "planned", notes: null, categoryId: null },
  { id: "road-5", title: "Recent Film", provider: "Thomistic", genre: "Scripture", format: "Formation Series", releaseDate: "2026-12-08", status: "released", notes: null, categoryId: "cat-kids" },
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
    expect(within(summary).getAllByText("5 titles").some((element) => element.classList.contains("text-xl"))).toBe(true);
    expect(within(summary).getByText("2 released")).toBeVisible();
    expect(within(summary).getByText("1 unscheduled")).toBeVisible();
    expect(within(summary).getByText("Top audiences")).toBeVisible();
    expect(within(summary).getByText("Kids")).toBeVisible();
    expect(within(summary).getByText("Top provider")).toBeVisible();
    expect(within(summary).getByText("Thomistic")).toBeVisible();
    expect(within(summary).getByText("Top genre")).toBeVisible();
    expect(within(summary).getByText("Top format")).toBeVisible();
    expect(within(summary).getByText("Scripture")).toBeVisible();
    expect(within(summary).getByText("Formation Series")).toBeVisible();

    fireEvent.click(within(summary).getByRole("button", { name: "Open Already Live" }));
    expect(within(screen.getByRole("dialog", { name: "Already Live" })).getByText("Recent Film")).toBeVisible();
    expect(within(screen.getByRole("dialog", { name: "Already Live" })).getByText("Older Film")).toBeVisible();
    fireEvent.click(screen.getByRole("button", { name: "Close Already Live" }));

    fireEvent.click(within(summary).getByRole("button", { name: "Open Being Worked On" }));
    expect(within(screen.getByRole("dialog", { name: "Being Worked On" })).getByText("Undated Film")).toBeVisible();
    fireEvent.click(screen.getByRole("button", { name: "Close Being Worked On" }));

    fireEvent.click(within(summary).getByRole("button", { name: "Open Need A Date" }));
    expect(within(screen.getByRole("dialog", { name: "Need A Date" })).getByText("Undated Film")).toBeVisible();
    expect(within(screen.getByRole("dialog", { name: "Need A Date" })).getByText("Unscheduled")).toBeVisible();
    fireEvent.click(screen.getByRole("button", { name: "Close Need A Date" }));

    fireEvent.click(within(summary).getByRole("button", { name: "Open Top Providers" }));
    const providersDialog = screen.getByRole("dialog", { name: "Top Providers" });
    expect(within(providersDialog).getByRole("img", { name: "Percent breakdown" })).toBeVisible();
    expect(within(providersDialog).getByText("Thomistic")).toBeVisible();
    expect(within(providersDialog).getByText("67%")).toBeVisible();
    expect(within(providersDialog).getByText("2 titles")).toBeVisible();
    expect(screen.queryByTestId("roadmap-pie-tooltip")).not.toBeInTheDocument();
    fireEvent.mouseEnter(within(providersDialog).getByRole("img", { name: "Thomistic: 2 titles, 67%" }));
    expect(screen.getByTestId("roadmap-pie-tooltip")).toHaveTextContent("Thomistic");
    expect(screen.getByTestId("roadmap-pie-tooltip")).toHaveTextContent("2 titles");
    expect(screen.getByTestId("roadmap-pie-tooltip")).toHaveTextContent("67%");
    fireEvent.mouseLeave(within(providersDialog).getByRole("img", { name: "Thomistic: 2 titles, 67%" }));
    expect(screen.queryByTestId("roadmap-pie-tooltip")).not.toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "Close Top Providers" }));

    fireEvent.click(within(summary).getByRole("button", { name: "Open Top Audiences" }));
    const audiencesDialog = screen.getByRole("dialog", { name: "Top Audiences" });
    expect(within(audiencesDialog).getByRole("img", { name: "Percent breakdown" })).toBeVisible();
    expect(within(audiencesDialog).getByText("Kids")).toBeVisible();
    expect(within(audiencesDialog).getByText("50%")).toBeVisible();
    expect(within(audiencesDialog).getByText("2 titles")).toBeVisible();
    fireEvent.click(screen.getByRole("button", { name: "Close Top Audiences" }));

    fireEvent.click(within(summary).getByRole("button", { name: "Open Top Genres" }));
    const genresDialog = screen.getByRole("dialog", { name: "Top Genres" });
    expect(within(genresDialog).getByRole("img", { name: "Percent breakdown" })).toBeVisible();
    expect(within(genresDialog).getByText("Scripture")).toBeVisible();
    expect(within(genresDialog).getByText("67%")).toBeVisible();
    expect(within(genresDialog).getByText("2 titles")).toBeVisible();
    fireEvent.click(screen.getByRole("button", { name: "Close Top Genres" }));

    fireEvent.click(within(summary).getByRole("button", { name: "Open Top Formats" }));
    const formatsDialog = screen.getByRole("dialog", { name: "Top Formats" });
    expect(within(formatsDialog).getByRole("img", { name: "Percent breakdown" })).toBeVisible();
    expect(within(formatsDialog).getByText("Formation Series")).toBeVisible();
    expect(within(formatsDialog).getByText("67%")).toBeVisible();
  });

  it("excludes dated releases outside the fiscal-year window from the at-a-glance summary", () => {
    const items: RoadmapItem[] = [
      { id: "kids-before-fy", title: "June Kids Release", provider: "Provider", releaseDate: "2026-06-03", status: "released", notes: null, categoryId: "cat-kids" },
      { id: "kids-in-fy", title: "August Kids Release", provider: "Provider", releaseDate: "2026-08-05", status: "in_progress", notes: null, categoryId: "cat-kids" },
      { id: "kids-undated", title: "Undated Kids Release", provider: "Provider", releaseDate: null, status: "planned", notes: null, categoryId: "cat-kids" }
    ];

    render(<RoadmapDashboard fiscalYearId="00000000-0000-0000-0000-000000000028" roadmapItems={items} ongoingSeries={series} categories={categories} fiscalYearStartMonth="2026-07" startMonth="2026-07" monthCount={12} isDemo />);

    const summary = screen.getByTestId("roadmap-summary");
    fireEvent.click(within(summary).getByText("Fiscal year at a glance"));

    expect(within(summary).getAllByText("2 titles").some((element) => element.classList.contains("text-xl"))).toBe(true);
    expect(summary).toHaveTextContent("Kids 2");
    expect(within(summary).queryByText("1 released")).not.toBeInTheDocument();
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

  it("marks individual marketing items as spotlighted and keeps genre and format out of the card", () => {
    render(<RoadmapDashboard fiscalYearId="00000000-0000-0000-0000-000000000028" roadmapItems={roadmapItems} ongoingSeries={series} categories={categories} startMonth="2027-01" monthCount={6} isDemo />);

    const card = screen.getByRole("button", { name: "Edit Aquinas 101" });
    expect(within(card).getByText("Spotlight")).toBeVisible();
    expect(within(card).queryByText("Scripture")).not.toBeInTheDocument();
    expect(within(card).queryByText("Formation Series")).not.toBeInTheDocument();

    fireEvent.click(card);

    const dialog = screen.getByRole("dialog", { name: "Edit Roadmap Item" });
    expect(within(dialog).getByLabelText(/Individual marketing campaign/)).toBeChecked();
    expect(within(dialog).getByLabelText("Genre")).toHaveClass("bg-orange-50", "text-orange-900");
    expect(within(dialog).getByLabelText("Format")).toHaveClass("bg-violet-50", "text-violet-800");
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
    expect(within(dialog).getByLabelText("Status")).toHaveClass("min-h-12");
    expect(within(dialog).getByLabelText("Status").closest("div")).toHaveClass("self-start");
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
    fireEvent.click(within(dialog).getByRole("button", { name: "No month yet" }));

    expect(within(dialog).getByLabelText("Release date value")).toHaveValue("TBD");
    expect(within(dialog).queryByLabelText("Release date")).not.toBeInTheDocument();
  });

  it("keeps month-known TBD releases in their month instead of the backlog", () => {
    const tbdItems: RoadmapItem[] = [
      ...roadmapItems,
      { id: "road-month-tbd", title: "February TBD Series", provider: "Thomistic", releaseDate: "2027-02-TBD", status: "planned", notes: null, categoryId: "cat-parish" }
    ];
    render(<RoadmapDashboard fiscalYearId="00000000-0000-0000-0000-000000000028" roadmapItems={tbdItems} ongoingSeries={series} categories={categories} startMonth="2027-01" monthCount={6} />);

    const columns = screen.getAllByTestId("roadmap-month-column");
    const februaryColumn = columns.find((column) => within(column).queryByRole("heading", { name: "February 2027" }));
    expect(februaryColumn).toBeTruthy();
    expect(within(februaryColumn!).getByText("February TBD Series")).toBeVisible();
    expect(within(screen.getByRole("button", { name: "Edit February TBD Series" })).getByText("TBD")).toHaveClass("bg-red-100", "text-red-700");

    fireEvent.click(within(screen.getByTestId("roadmap-backlog")).getByText("Backlog"));
    expect(within(screen.getByTestId("roadmap-backlog")).queryByText("February TBD Series")).not.toBeInTheDocument();
  });

  it("can save a TBD release date with a tentative month", () => {
    render(<RoadmapDashboard fiscalYearId="00000000-0000-0000-0000-000000000028" roadmapItems={roadmapItems} ongoingSeries={series} categories={categories} startMonth="2027-01" monthCount={6} />);

    fireEvent.click(screen.getByRole("button", { name: "Add item to February 2027" }));
    const dialog = screen.getByRole("dialog", { name: "Add Roadmap Item" });
    fireEvent.click(within(dialog).getByRole("button", { name: "Date TBD in this month" }));

    expect(within(dialog).getByLabelText("Release month")).toHaveValue("2027-02");
    expect(within(dialog).getByLabelText("Release date value")).toHaveValue("2027-02-TBD");

    fireEvent.change(within(dialog).getByLabelText("Release month"), { target: { value: "2027-03" } });

    expect(within(dialog).getByLabelText("Release date value")).toHaveValue("2027-03-TBD");
  });

  it("opens and closes a roadmap item editor in a modal dialog", () => {
    render(<RoadmapDashboard fiscalYearId="00000000-0000-0000-0000-000000000028" roadmapItems={roadmapItems} ongoingSeries={series} categories={categories} startMonth="2027-01" monthCount={6} isDemo />);

    const trigger = screen.getByRole("button", { name: "Edit Aquinas 101" });
    fireEvent.click(trigger);

    const dialog = screen.getByRole("dialog", { name: "Edit Roadmap Item" });
    expect(dialog).toHaveAttribute("open");
    expect(within(dialog).getByDisplayValue("Aquinas 101")).toBeVisible();
    const saveButton = within(dialog).getByRole("button", { name: "Save Item" });
    const cancelButton = within(dialog).getByRole("button", { name: "Cancel" });
    expect(saveButton).toBeVisible();
    expect(saveButton.closest("footer")).toBe(cancelButton.closest("footer"));
    expect(saveButton).toBeDisabled();
    expect(within(dialog).getByRole("button", { name: "Delete" })).toBeVisible();

    fireEvent.click(cancelButton);
    expect(screen.queryByRole("dialog", { name: "Edit Roadmap Item" })).not.toBeInTheDocument();
    expect(trigger).toHaveFocus();

    fireEvent.click(trigger);
    const reopenedDialog = screen.getByRole("dialog", { name: "Edit Roadmap Item" });
    fireEvent.keyDown(reopenedDialog, { key: "Escape" });
    expect(screen.queryByRole("dialog", { name: "Edit Roadmap Item" })).not.toBeInTheDocument();
    expect(trigger).toHaveFocus();
  });

  it("replaces the open roadmap item editor when another item is selected", () => {
    const sameMonthItems: RoadmapItem[] = [
      ...roadmapItems,
      { id: "road-jan-2", title: "Second January Item", provider: "Augustine Institute", releaseDate: "2027-01-28", status: "planned", notes: null, categoryId: "cat-kids" }
    ];

    render(<RoadmapDashboard fiscalYearId="00000000-0000-0000-0000-000000000028" roadmapItems={sameMonthItems} ongoingSeries={series} categories={categories} startMonth="2027-01" monthCount={6} isDemo />);

    fireEvent.click(screen.getByRole("button", { name: "Edit Aquinas 101" }));
    expect(within(screen.getByRole("dialog", { name: "Edit Roadmap Item" })).getByDisplayValue("Aquinas 101")).toBeVisible();

    fireEvent.click(screen.getByRole("button", { name: "Edit Second January Item" }));

    const dialogs = screen.getAllByRole("dialog", { name: "Edit Roadmap Item" });
    expect(dialogs).toHaveLength(1);
    expect(within(dialogs[0]).getByDisplayValue("Second January Item")).toBeVisible();
    expect(within(dialogs[0]).queryByDisplayValue("Aquinas 101")).not.toBeInTheDocument();
  });

  it("uses the content review genre and format dropdowns on roadmap items", () => {
    render(<RoadmapDashboard fiscalYearId="00000000-0000-0000-0000-000000000028" roadmapItems={roadmapItems} ongoingSeries={series} categories={categories} startMonth="2027-01" monthCount={6} isDemo />);

    fireEvent.click(screen.getByRole("button", { name: "Edit Aquinas 101" }));
    const dialog = screen.getByRole("dialog", { name: "Edit Roadmap Item" });

    expect(within(dialog).getByLabelText("Genre")).toHaveValue("Scripture");
    expect(within(dialog).getByLabelText("Genre")).toContainHTML("Christian Formation");
    expect(within(dialog).getByLabelText("Format")).toHaveValue("Formation Series");
    expect(within(dialog).getByLabelText("Format")).toContainHTML("Docu-Series");
  });

  it("offers planned, in-progress, blocked, and released statuses in the edit form", () => {
    render(<RoadmapDashboard fiscalYearId="00000000-0000-0000-0000-000000000028" roadmapItems={roadmapItems} ongoingSeries={series} categories={categories} startMonth="2027-01" monthCount={6} />);

    fireEvent.click(screen.getByRole("button", { name: "Edit Aquinas 101" }));
    const dialog = screen.getByRole("dialog", { name: "Edit Roadmap Item" });

    expect(within(dialog).getByText("Core details")).toBeVisible();
    expect(within(dialog).getByLabelText("Status").closest("div")).toHaveClass("self-start");
    expect(within(dialog).getByRole("option", { name: "Planned" })).toBeVisible();
    expect(within(dialog).getByRole("option", { name: "In progress" })).toBeVisible();
    expect(within(dialog).getByRole("option", { name: "Blocked" })).toBeVisible();
    expect(within(dialog).getByRole("option", { name: "Released" })).toBeVisible();
    expect(within(dialog).queryByRole("option", { name: "Ready" })).not.toBeInTheDocument();
  });

  it("lets roadmap items move forward to the dashboard", () => {
    render(<RoadmapDashboard fiscalYearId="00000000-0000-0000-0000-000000000028" roadmapItems={roadmapItems} ongoingSeries={series} categories={categories} startMonth="2027-01" monthCount={6} />);

    fireEvent.click(screen.getByRole("button", { name: "Edit Aquinas 101" }));
    const dialog = screen.getByRole("dialog", { name: "Edit Roadmap Item" });

    expect(within(dialog).getByRole("button", { name: "Push to Dashboard" })).toBeInTheDocument();
    expect(within(dialog).getByRole("button", { name: "Push to ClickUp" })).toBeInTheDocument();
    expect(within(dialog).getByTestId("roadmap-form-actions")).toHaveClass("justify-between", "border-t", "pt-4");
  });

  it("confirms when a roadmap item is pushed to the dashboard", async () => {
    actionMocks.sendRoadmapItemToBudget.mockResolvedValue(undefined);
    render(<RoadmapDashboard fiscalYearId="00000000-0000-0000-0000-000000000028" roadmapItems={roadmapItems} ongoingSeries={series} categories={categories} startMonth="2027-01" monthCount={6} />);

    fireEvent.click(screen.getByRole("button", { name: "Edit Aquinas 101" }));
    const dialog = screen.getByRole("dialog", { name: "Edit Roadmap Item" });
    fireEvent.click(within(dialog).getByRole("button", { name: "Push to Dashboard" }));

    await waitFor(() => expect(actionMocks.sendRoadmapItemToBudget).toHaveBeenCalledTimes(1));
    expect(within(dialog).getByText("Pushed to Dashboard with a $0 yearly placeholder. Update the amount on the Dashboard.")).toBeVisible();
  });

  it("confirms when a roadmap item is pushed to ClickUp", async () => {
    actionMocks.sendRoadmapItemToClickUp.mockResolvedValue({ created: true, replacedMissingTask: false, taskUrl: "https://app.clickup.com/t/task-1" });
    render(<RoadmapDashboard fiscalYearId="00000000-0000-0000-0000-000000000028" roadmapItems={roadmapItems} ongoingSeries={series} categories={categories} startMonth="2027-01" monthCount={6} />);

    fireEvent.click(screen.getByRole("button", { name: "Edit Aquinas 101" }));
    const dialog = screen.getByRole("dialog", { name: "Edit Roadmap Item" });
    fireEvent.click(within(dialog).getByRole("button", { name: "Push to ClickUp" }));

    await waitFor(() => expect(actionMocks.sendRoadmapItemToClickUp).toHaveBeenCalledTimes(1));
    expect(within(dialog).getByText("Pushed to ClickUp Content Upload Calendar.")).toBeVisible();
    expect(within(dialog).getByRole("link", { name: "Open in ClickUp" })).toHaveAttribute("href", "https://app.clickup.com/t/task-1");
  });

  it("can recreate a missing ClickUp task for an already pushed roadmap item", async () => {
    actionMocks.sendRoadmapItemToClickUp.mockResolvedValue({ created: true, replacedMissingTask: true, taskUrl: "https://app.clickup.com/t/task-2" });
    const pushedItems: RoadmapItem[] = [
      { ...roadmapItems[0], clickupTaskId: "deleted-task", clickupTaskUrl: "https://app.clickup.com/t/deleted-task" }
    ];
    render(<RoadmapDashboard fiscalYearId="00000000-0000-0000-0000-000000000028" roadmapItems={pushedItems} ongoingSeries={series} categories={categories} startMonth="2027-01" monthCount={6} />);

    fireEvent.click(screen.getByRole("button", { name: "Edit Aquinas 101" }));
    const dialog = screen.getByRole("dialog", { name: "Edit Roadmap Item" });
    fireEvent.click(within(dialog).getByRole("button", { name: "Check ClickUp" }));

    await waitFor(() => expect(actionMocks.sendRoadmapItemToClickUp).toHaveBeenCalledTimes(1));
    expect(within(dialog).getByText("Original ClickUp task was missing, so a new one was created.")).toBeVisible();
    expect(within(dialog).getByRole("link", { name: "Open in ClickUp" })).toHaveAttribute("href", "https://app.clickup.com/t/task-2");
  });

  it("pushes a whole visible month to ClickUp", async () => {
    actionMocks.sendRoadmapMonthToClickUp.mockResolvedValue({ createdCount: 1, existingCount: 0, replacedMissingCount: 0 });
    render(<RoadmapDashboard fiscalYearId="00000000-0000-0000-0000-000000000028" roadmapItems={roadmapItems} ongoingSeries={series} categories={categories} startMonth="2027-01" monthCount={6} />);

    fireEvent.click(screen.getByRole("button", { name: "Push January 2027 to ClickUp" }));

    await waitFor(() => expect(actionMocks.sendRoadmapMonthToClickUp).toHaveBeenCalledTimes(1));
    expect(screen.getByText("Pushed 1 to ClickUp.")).toBeVisible();
  });

  it("can recreate missing ClickUp tasks for a whole month", async () => {
    actionMocks.sendRoadmapMonthToClickUp.mockResolvedValue({ createdCount: 1, existingCount: 0, replacedMissingCount: 1 });
    const pushedItems: RoadmapItem[] = [
      { ...roadmapItems[0], clickupTaskId: "deleted-task", clickupTaskUrl: "https://app.clickup.com/t/deleted-task" }
    ];
    render(<RoadmapDashboard fiscalYearId="00000000-0000-0000-0000-000000000028" roadmapItems={pushedItems} ongoingSeries={series} categories={categories} startMonth="2027-01" monthCount={6} />);

    fireEvent.click(screen.getByRole("button", { name: "Push January 2027 to ClickUp" }));

    await waitFor(() => expect(actionMocks.sendRoadmapMonthToClickUp).toHaveBeenCalledTimes(1));
    expect(screen.getByText("Recreated 1 missing ClickUp task.")).toBeVisible();
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
    expect(navigationMocks.refresh).toHaveBeenCalledTimes(1);
    expect(nameInput).toHaveValue("Parish Life");
    expect(colorSelect).toHaveValue("green");
  });

  it("saves a dragged Manage Key order", async () => {
    actionMocks.reorderRoadmapCategories.mockResolvedValue(undefined);
    render(<RoadmapDashboard fiscalYearId="00000000-0000-0000-0000-000000000028" roadmapItems={roadmapItems} ongoingSeries={series} categories={categories} startMonth="2027-01" monthCount={6} />);

    fireEvent.click(screen.getByRole("button", { name: "Manage Key" }));

    const dialog = screen.getByRole("dialog", { name: "Manage Key" });
    const dataTransfer = {
      effectAllowed: "",
      getData: vi.fn(() => "cat-parish"),
      setData: vi.fn()
    };

    fireEvent.dragStart(within(dialog).getByRole("button", { name: "Drag Parish" }), { dataTransfer });
    fireEvent.drop(within(dialog).getByLabelText("Category name Kids").closest("form")!, { dataTransfer });

    await waitFor(() => expect(actionMocks.reorderRoadmapCategories).toHaveBeenCalledTimes(1));
    const formData = actionMocks.reorderRoadmapCategories.mock.calls[0][0] as FormData;
    expect(formData.getAll("categoryIds")).toEqual(["cat-adult", "cat-kids", "cat-parish"]);
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
