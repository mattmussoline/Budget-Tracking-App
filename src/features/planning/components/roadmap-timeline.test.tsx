import { fireEvent, render, screen, within } from "@testing-library/react";
import "@testing-library/jest-dom/vitest";
import React from "react";
import { describe, expect, it } from "vitest";
import { RoadmapDashboard } from "./roadmap-dashboard";
import type { OngoingSeries, RoadmapCategory, RoadmapItem } from "../planning-types";

const categories: RoadmapCategory[] = [
  { id: "cat-parish", name: "Parish", colorKey: "blue", sortOrder: 0, isActive: true },
  { id: "cat-adult", name: "Adult", colorKey: "amber", sortOrder: 1, isActive: true }
];

const roadmapItems: RoadmapItem[] = [
  { id: "road-1", title: "Aquinas 101", provider: "Thomistic", releaseDate: "2027-01-24", status: "planned", notes: null, categoryId: "cat-parish" },
  { id: "road-2", title: "Undated Film", provider: null, releaseDate: null, status: "in_progress", notes: null, categoryId: "cat-adult" },
  { id: "road-3", title: "Future Film", provider: null, releaseDate: "2028-01-01", status: "planned", notes: null, categoryId: null }
];

const series: OngoingSeries[] = [{ id: "series-1", series: "Practicing Catholic", cadence: "1/week", notes: "Weekly placeholders" }];

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
    expect(screen.getByText("Undated Film")).toBeVisible();
    expect(screen.getByText("Future Film")).toBeVisible();
    expect(screen.getAllByText("Parish").some((element) => element.classList.contains("bg-blue-100"))).toBe(true);
  });

  it("shows and edits the exact release date", () => {
    render(<RoadmapDashboard fiscalYearId="00000000-0000-0000-0000-000000000028" roadmapItems={roadmapItems} ongoingSeries={series} categories={categories} startMonth="2027-01" monthCount={6} isDemo />);

    expect(screen.getByText("January 24, 2027")).toBeVisible();
    const dateInput = screen.getByLabelText("Release date", { selector: "#road-1-date" });
    expect(dateInput).toHaveAttribute("type", "date");
    expect(dateInput).toHaveValue("2027-01-24");
  });

  it("renders category management and ongoing series", () => {
    render(<RoadmapDashboard fiscalYearId="00000000-0000-0000-0000-000000000028" roadmapItems={roadmapItems} ongoingSeries={series} categories={categories} startMonth="2027-01" monthCount={6} isDemo />);

    expect(screen.getByText("Manage Key")).toBeVisible();
    expect(screen.getByRole("heading", { name: "Ongoing Series Cadence" })).toBeVisible();
    expect(screen.getByText("Practicing Catholic")).toBeVisible();
  });

  it("opens the add-roadmap form in a modal dialog", () => {
    render(<RoadmapDashboard fiscalYearId="00000000-0000-0000-0000-000000000028" roadmapItems={roadmapItems} ongoingSeries={series} categories={categories} startMonth="2027-01" monthCount={6} isDemo />);

    const trigger = screen.getByRole("button", { name: "Add Roadmap Item" });
    const dialog = screen.getAllByRole("dialog", { hidden: true }).find((element) => element.getAttribute("aria-labelledby") === "add-roadmap-title");

    expect(dialog).toBeDefined();
    expect(dialog).not.toHaveAttribute("open");

    fireEvent.click(trigger);

    expect(dialog).toHaveAttribute("open");
    expect(screen.getByRole("heading", { name: "Add Roadmap Item" })).toBeVisible();

    fireEvent.click(screen.getByRole("button", { name: "Cancel" }));

    expect(dialog).not.toHaveAttribute("open");
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
    expect(dialog).not.toHaveAttribute("open");
    expect(trigger).toHaveFocus();

    fireEvent.click(trigger);
    fireEvent.keyDown(dialog, { key: "Escape" });
    expect(dialog).not.toHaveAttribute("open");
    expect(trigger).toHaveFocus();
  });
});
