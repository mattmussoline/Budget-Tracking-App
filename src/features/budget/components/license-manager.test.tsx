import { fireEvent, render, screen } from "@testing-library/react";
import "@testing-library/jest-dom/vitest";
import React from "react";
import { describe, expect, it, vi } from "vitest";
import { LicenseManager } from "./license-manager";
import type { ContentLicense } from "../budget-types";

vi.mock("../budget-actions", () => ({
  updateContentLicense: vi.fn(),
  deleteContentLicense: vi.fn()
}));

const license: ContentLicense = {
  id: "license-1",
  title: "Aquinas 101",
  provider: "Thomistic",
  installmentCents: 1200000,
  cadence: "quarterly",
  addedFiscalMonth: 1,
  notes: ""
};

describe("LicenseManager", () => {
  it("keeps the edit content area compact", () => {
    const { container } = render(
      <LicenseManager
        fiscalYearId="00000000-0000-0000-0000-000000000027"
        fiscalYear={2027}
        fiscalYearStartMonth={7}
        licenses={[license]}
        providerOptions={["Thomistic"]}
        providerColorOverrides={{}}
      />
    );

    const editContentSummary = screen.getByText("Edit Content").closest("summary");
    expect(editContentSummary).toHaveClass("px-4", "py-3");
    expect(container.querySelectorAll("details")).toHaveLength(2);
    expect(screen.getByRole("combobox", { name: "Cadence" })).toHaveClass("min-h-9", "text-sm");
    expect(screen.getByRole("combobox", { name: "Added month" })).toHaveClass("min-h-9", "text-sm");
    expect(screen.getByRole("button", { name: "Save" })).toHaveClass("min-h-9", "text-xs");
  });

  it("shows a formatted payment amount in the content preview row", () => {
    render(
      <LicenseManager
        fiscalYearId="00000000-0000-0000-0000-000000000027"
        fiscalYear={2027}
        fiscalYearStartMonth={7}
        licenses={[license]}
        providerOptions={["Thomistic"]}
        providerColorOverrides={{}}
      />
    );

    expect(screen.getByText((_, element) => element?.textContent === "Thomistic - $12,000.00")).toBeInTheDocument();
  });

  it("uses short select placeholder text in the edit form", () => {
    const unselectedLicense = { ...license, cadence: "", addedFiscalMonth: 0 } as unknown as ContentLicense;

    render(
      <LicenseManager
        fiscalYearId="00000000-0000-0000-0000-000000000027"
        fiscalYear={2027}
        fiscalYearStartMonth={7}
        licenses={[unselectedLicense]}
        providerOptions={["Thomistic"]}
        providerColorOverrides={{}}
      />
    );

    expect(screen.getAllByText("Select")).toHaveLength(2);
    expect(screen.queryByText("Select cadence")).not.toBeInTheDocument();
    expect(screen.queryByText("Select month")).not.toBeInTheDocument();
  });

  it("asks for confirmation before deleting a content title", () => {
    const confirm = vi.spyOn(window, "confirm").mockReturnValue(false);
    render(
      <LicenseManager
        fiscalYearId="00000000-0000-0000-0000-000000000027"
        fiscalYear={2027}
        fiscalYearStartMonth={7}
        licenses={[license]}
        providerOptions={["Thomistic"]}
        providerColorOverrides={{}}
      />
    );

    fireEvent.click(screen.getByRole("button", { name: "Delete" }));

    expect(confirm).toHaveBeenCalledWith("Delete Aquinas 101? This cannot be undone.");
  });
});
