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
