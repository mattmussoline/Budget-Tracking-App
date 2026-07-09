import { fireEvent, render, screen } from "@testing-library/react";
import "@testing-library/jest-dom/vitest";
import React from "react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { buildDashboardModel } from "../dashboard-model";
import type { ContentLicense } from "../budget-types";
import { MonthBoard } from "./month-board";

const licenses: ContentLicense[] = [
  {
    id: "license-1",
    title: "Aquinas 101",
    provider: "Thomistic",
    installmentCents: 1200000,
    cadence: "quarterly",
    addedFiscalMonth: 1,
    notes: ""
  },
  {
    id: "license-2",
    title: "Donor Film",
    provider: "Donor Studio",
    installmentCents: 500000,
    cadence: "yearly",
    addedFiscalMonth: 1,
    budgetSource: "donor_funded",
    notes: ""
  }
];

function renderMonthBoardWithEditor() {
  const model = buildDashboardModel({
    fiscalYear: 2027,
    fiscalYearStartMonth: 7,
    budgetCents: 4000000,
    licenses
  });

  return render(
    <>
      <MonthBoard model={model} providerColorOverrides={{}} />
      <details id="edit-content-manager">
        <summary>Edit Content</summary>
        <details id="edit-license-license-1">
          <summary>Aquinas 101</summary>
          <input name="title" aria-label="Title" defaultValue="Aquinas 101" />
        </details>
      </details>
    </>
  );
}

describe("MonthBoard", () => {
  beforeEach(() => {
    Element.prototype.scrollIntoView = vi.fn();
  });

  it("opens the matching edit form from an expanded compact payment row", () => {
    renderMonthBoardWithEditor();

    fireEvent.click(screen.getAllByRole("button", { name: "Expand Aquinas 101 payment details" })[0]);
    fireEvent.click(screen.getAllByRole("button", { name: "Edit Aquinas 101" })[0]);

    expect(document.getElementById("edit-content-manager")).toHaveAttribute("open");
    expect(document.getElementById("edit-license-license-1")).toHaveAttribute("open");
    expect(screen.getByRole("textbox", { name: "Title" })).toHaveFocus();
  });

  it("keeps payment rows compact until they are expanded", () => {
    renderMonthBoardWithEditor();

    expect(screen.getAllByText("Aquinas 101")[0]).toBeVisible();
    expect(screen.getAllByText("$12,000.00")[0]).toBeVisible();
    expect(screen.queryByText("Thomistic")).toBeNull();
    expect(screen.queryByText("Misc licensing budget")).toBeNull();
    expect(screen.getAllByRole("button", { name: "Expand Aquinas 101 payment details" })[0]).toBeVisible();

    fireEvent.click(screen.getAllByRole("button", { name: "Expand Aquinas 101 payment details" })[0]);

    expect(screen.getByText("Thomistic")).toBeVisible();
    expect(screen.getAllByText("Misc licensing budget")[0]).toBeVisible();
    expect(screen.getAllByRole("button", { name: "Edit Aquinas 101" })[0]).toBeVisible();
  });

  it("shows budget-source tags when rows are expanded and renders quarters as collapsible sections", () => {
    renderMonthBoardWithEditor();

    expect(screen.getByTestId("quarter-1")).toHaveAttribute("open");
    expect(screen.getByTestId("quarter-2")).not.toHaveAttribute("open");
    fireEvent.click(screen.getByRole("button", { name: "Expand Donor Film payment details" }));
    expect(screen.getByRole("button", { name: "Edit Donor Film" })).toBeVisible();
    expect(screen.getByText("Donor-funded budget")).toBeVisible();
  });
});
