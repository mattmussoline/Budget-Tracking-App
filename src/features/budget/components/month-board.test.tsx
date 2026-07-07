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

  it("opens the matching edit form when a payment tile is clicked", () => {
    renderMonthBoardWithEditor();

    fireEvent.click(screen.getAllByRole("button", { name: "Edit Aquinas 101" })[0]);

    expect(document.getElementById("edit-content-manager")).toHaveAttribute("open");
    expect(document.getElementById("edit-license-license-1")).toHaveAttribute("open");
    expect(screen.getByRole("textbox", { name: "Title" })).toHaveFocus();
  });
});
