import { fireEvent, render, screen } from "@testing-library/react";
import "@testing-library/jest-dom/vitest";
import React from "react";
import { describe, expect, it, vi } from "vitest";
import { FiscalYearManager } from "./fiscal-year-manager";

const fiscalYears = [
  {
    id: "00000000-0000-0000-0000-000000000026",
    label: "FY26 Licensing Budget",
    fiscal_year: 2026,
    is_pinned: true
  },
  {
    id: "00000000-0000-0000-0000-000000000025",
    label: "FY25 Licensing Budget",
    fiscal_year: 2025,
    is_pinned: false
  }
];

const noopAction = async () => {};

function renderManager() {
  return render(
    <FiscalYearManager
      fiscalYears={fiscalYears}
      activeFiscalYearId={fiscalYears[0].id}
      pinAction={noopAction}
      deleteAction={noopAction}
      createForm={<div>Create fiscal year form</div>}
    />
  );
}

describe("FiscalYearManager", () => {
  it("opens fiscal-year actions on right click", () => {
    renderManager();

    fireEvent.contextMenu(screen.getByRole("link", { name: /FY25/ }));

    expect(screen.getByRole("menu")).toBeVisible();
    expect(screen.getByRole("menuitem", { name: "Pin as default" })).toBeVisible();
    expect(screen.getByRole("menuitem", { name: "Delete budget" })).toBeVisible();
  });

  it("opens the same actions from the three-dot button", () => {
    renderManager();

    fireEvent.click(screen.getByRole("button", { name: "Open actions for FY25 Licensing Budget" }));

    expect(screen.getByRole("menuitem", { name: "Pin as default" })).toBeVisible();
    expect(screen.getByRole("menuitem", { name: "Delete budget" })).toBeVisible();
  });

  it("marks the shared pinned fiscal year", () => {
    renderManager();

    expect(screen.getByLabelText("Pinned default")).toBeVisible();
  });

  it("opens and closes the add fiscal year form", () => {
    renderManager();

    fireEvent.click(screen.getByRole("button", { name: "Add fiscal year" }));
    expect(screen.getByText("Create fiscal year form")).toBeVisible();

    fireEvent.click(screen.getByRole("button", { name: "Cancel adding fiscal year" }));
    expect(screen.queryByText("Create fiscal year form")).not.toBeInTheDocument();
  });

  it("requires confirmation before deleting a budget", () => {
    const confirm = vi.spyOn(window, "confirm").mockReturnValue(false);
    renderManager();

    fireEvent.contextMenu(screen.getByRole("link", { name: /FY25/ }));
    fireEvent.click(screen.getByRole("menuitem", { name: "Delete budget" }));

    expect(confirm).toHaveBeenCalledWith(expect.stringContaining("FY25 Licensing Budget"));
    expect(confirm).toHaveBeenCalledWith(expect.stringContaining("permanently delete"));
  });
});
