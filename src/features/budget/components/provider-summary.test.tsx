import React from "react";
import { render, screen, within } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { ProviderSummary } from "./provider-summary";
import type { DashboardModel } from "../dashboard-model";

vi.mock("../budget-actions", () => ({
  updateProviderColor: vi.fn()
}));

const model = {
  providers: [
    { provider: "Ignatius Press", totalCents: 752001, licenseCount: 6, licenseSharePercent: 75 },
    { provider: "Paradisus Dei", totalCents: 33333, licenseCount: 1, licenseSharePercent: 25 }
  ]
} as DashboardModel;

describe("ProviderSummary", () => {
  it("defaults provider color controls to collapsed summary rows", () => {
    render(<ProviderSummary model={model} fiscalYearId="fy-2026" providerColorOverrides={{}} />);

    const details = screen.getAllByTestId("provider-color-details");
    expect(details).toHaveLength(2);

    for (const row of details) {
      expect(row.hasAttribute("open")).toBe(false);
    }

    const ignatiusSummary = within(details[0]).getByText("Ignatius Press").closest("summary");

    expect(ignatiusSummary).not.toBeNull();
    expect(within(ignatiusSummary as HTMLElement).getByText("6 titles")).toBeTruthy();
    expect(within(ignatiusSummary as HTMLElement).getByText("$7,520.01")).toBeTruthy();
    expect(within(ignatiusSummary as HTMLElement).queryByText("Color key")).toBeNull();
    expect(within(ignatiusSummary as HTMLElement).queryByText("Save")).toBeNull();
  });
});
