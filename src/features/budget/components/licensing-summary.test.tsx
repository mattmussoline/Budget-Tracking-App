import { fireEvent, render, screen, within } from "@testing-library/react";
import "@testing-library/jest-dom/vitest";
import React from "react";
import { describe, expect, it } from "vitest";
import { vi } from "vitest";
import { LicensingSummary } from "./licensing-summary";
import type { ContentLicense } from "../budget-types";
import { buildDashboardModel } from "../dashboard-model";
import { buildLicensingSummaryView } from "../summary-model";

vi.mock("../auth-actions", () => ({ logout: vi.fn() }));
vi.mock("../budget-actions", () => ({
  addCollaborator: vi.fn(),
  addContentLicense: vi.fn(),
  createFiscalYear: vi.fn(),
  deleteContentLicense: vi.fn(),
  deleteFiscalYear: vi.fn(),
  pinFiscalYear: vi.fn(),
  removeCollaborator: vi.fn(),
  updateContentLicense: vi.fn(),
  updateFiscalYear: vi.fn(),
  updateProviderColor: vi.fn()
}));
vi.mock("next/navigation", () => ({ useRouter: () => ({ prefetch: vi.fn() }) }));

const fiscalYear = {
  id: "00000000-0000-0000-0000-000000000027",
  label: "FY2027",
  fiscal_year: 2027,
  fiscal_year_start_month: 7,
  budget_cents: 4000000,
  is_pinned: true
};

const licenses: ContentLicense[] = [
  {
    id: "license-1",
    title: "Into Great Silence",
    provider: "Philip Gröning",
    installmentCents: 300000,
    cadence: "quarterly",
    addedFiscalMonth: 1,
    budgetSource: "misc_licensing",
    minutes: 169,
    notes: ""
  },
  {
    id: "license-2",
    title: "Cabrini",
    provider: "Angel Studios",
    installmentCents: 600000,
    cadence: "yearly",
    addedFiscalMonth: 8,
    budgetSource: "donor_funded",
    minutes: 145,
    notes: ""
  }
];

function renderSummary(options: { mode?: "demo" | "live" } = {}) {
  const model = buildDashboardModel({
    fiscalYear: fiscalYear.fiscal_year,
    fiscalYearStartMonth: fiscalYear.fiscal_year_start_month,
    budgetCents: fiscalYear.budget_cents,
    licenses,
    now: new Date(2026, 8, 16)
  });

  return render(
    <LicensingSummary
      fiscalYear={fiscalYear}
      fiscalYears={[fiscalYear]}
      view={buildLicensingSummaryView({ model, licenses })}
      licenses={licenses}
      providerColorOverrides={{}}
      mode={options.mode ?? "live"}
      userEmail="matt.mussoline@augustineinstitute.org"
      allowedEmails={["matt.mussoline@augustineinstitute.org", "teammate@augustineinstitute.org"]}
    />
  );
}

describe("LicensingSummary", () => {
  it("puts account controls in the top bar and the fiscal year in the page head", () => {
    renderSummary();

    const topBar = screen.getByRole("banner");

    expect(topBar).toContainElement(screen.getByRole("navigation", { name: "Planning sections" }));
    expect(topBar).toContainElement(screen.getByRole("navigation", { name: "Fiscal year budgets" }));
    expect(topBar).toContainElement(screen.getByRole("button", { name: "Logout" }).closest("form"));
    expect(topBar).not.toContainElement(screen.getByRole("heading", { level: 1, name: "FY2027" }));
    expect(screen.getByText("July 2026 – June 2027")).toBeVisible();
  });

  it("leads the rail with health, attention, and budget lines", () => {
    renderSummary();

    expect(screen.getByText("Fiscal year health")).toBeVisible();
    expect(screen.getByText("On track")).toBeVisible();
    expect(screen.getByText("30% used")).toBeVisible();
    expect(screen.getByText("Needs attention")).toBeVisible();
    expect(screen.getByText("Budget lines")).toBeVisible();
    expect(screen.getByText("2 titles")).toBeVisible();
  });

  it("opens on the current quarter and lists only that quarter's payments", () => {
    renderSummary();

    expect(screen.getByTestId("quarter-1")).toHaveAttribute("aria-pressed", "true");
    expect(screen.getByRole("heading", { name: "Quarter 1" })).toBeVisible();
    expect(screen.getByText("1 payment across Jul, Aug, Sep")).toBeVisible();
    expect(screen.getByRole("button", { name: "Edit Into Great Silence" })).toBeVisible();
    expect(screen.queryByRole("button", { name: "Edit Cabrini" })).not.toBeInTheDocument();
  });

  it("narrows the payment list to one month when a timeline bar is clicked", () => {
    renderSummary();

    fireEvent.click(screen.getByRole("button", { name: "February: $6,000.00" }));

    expect(screen.getByRole("heading", { name: "February" })).toBeVisible();
    expect(screen.getByText("1 payment")).toBeVisible();
    expect(screen.getByRole("button", { name: "Edit Cabrini" })).toBeVisible();
  });

  it("reports an empty period rather than falling back to the whole year", () => {
    renderSummary();

    fireEvent.click(screen.getByRole("button", { name: "March: $0.00" }));

    expect(screen.getByRole("heading", { name: "March" })).toBeVisible();
    expect(screen.getByText("No payments scheduled in this period.")).toBeVisible();
  });

  it("filters All titles by title or provider", () => {
    renderSummary();
    const search = screen.getByRole("searchbox", { name: "Search titles or providers" });
    const allTitles = screen.getByTestId("all-titles");

    fireEvent.change(search, { target: { value: "angel" } });
    expect(within(allTitles).getByText("Cabrini")).toBeVisible();
    expect(within(allTitles).queryByText("Into Great Silence")).not.toBeInTheDocument();

    fireEvent.change(search, { target: { value: "nothing here" } });
    expect(within(allTitles).getByText("No content matches your search.")).toBeVisible();
  });

  it("keeps the search in place when a filtered row is opened", () => {
    renderSummary();
    const search = screen.getByRole("searchbox", { name: "Search titles or providers" }) as HTMLInputElement;
    const allTitles = screen.getByTestId("all-titles");

    fireEvent.change(search, { target: { value: "angel" } });
    fireEvent.click(within(allTitles).getByRole("button", { name: /Cabrini/ }));

    expect(search.value).toBe("angel");
    expect(within(allTitles).queryByText("Into Great Silence")).not.toBeInTheDocument();
  });

  it("edits a title in place instead of making you delete and re-add it", () => {
    renderSummary();

    const allTitles = screen.getByTestId("all-titles");
    fireEvent.click(within(allTitles).getByRole("button", { name: /Into Great Silence/ }));

    const titleField = within(allTitles).getByRole("textbox", { name: "Title" }) as HTMLInputElement;
    expect(titleField.value).toBe("Into Great Silence");
    expect(within(allTitles).getByRole("combobox", { name: "Budget line" })).toHaveValue("misc_licensing");
    expect(within(allTitles).getByRole("textbox", { name: "Runtime (minutes)" })).toHaveValue("169");
    expect(within(allTitles).getByRole("button", { name: "Save" })).toBeVisible();
    expect(within(allTitles).getByRole("button", { name: "Delete" })).toBeVisible();
  });

  it("opens each rail action as a centred modal that closes on Escape", () => {
    renderSummary();

    for (const [button, dialogName] of [
      ["+ Add content", "Add content"],
      ["Add or edit fiscal year", "Add or edit fiscal year"],
      ["Invite a teammate", "Invite a teammate"]
    ] as const) {
      fireEvent.click(screen.getByRole("button", { name: button }));

      const dialog = screen.getByRole("dialog", { name: dialogName });
      expect(dialog).toBeVisible();
      expect(dialog.parentElement).toHaveClass("items-center", "justify-center");

      fireEvent.keyDown(document, { key: "Escape" });
      expect(screen.queryByRole("dialog", { name: dialogName })).not.toBeInTheDocument();
    }
  });

  it("asks for a runtime when adding content, because the schema requires one", () => {
    renderSummary();

    fireEvent.click(screen.getByRole("button", { name: "+ Add content" }));
    const dialog = screen.getByRole("dialog", { name: "Add content" });

    expect(within(dialog).getByRole("textbox", { name: "Runtime (minutes)" })).toBeRequired();
    expect(within(dialog).getByRole("combobox", { name: "Fiscal year" })).toBeVisible();
  });

  it("keeps the provider colour picker reachable now that the pie chart is gone", () => {
    renderSummary();

    expect(screen.getByText("Provider colors")).toBeVisible();
    expect(screen.getByRole("combobox", { name: "Color for Angel Studios", hidden: true })).toBeInTheDocument();
  });

  it("disables every write control on the public demo", () => {
    renderSummary({ mode: "demo" });

    fireEvent.click(screen.getByRole("button", { name: "Invite a teammate" }));
    const dialog = screen.getByRole("dialog", { name: "Invite a teammate" });

    expect(screen.getByText("Public demo. Sample data only.")).toBeVisible();
    expect(within(dialog).getByRole("textbox", { name: "Work email" })).toBeDisabled();
    expect(within(dialog).getByRole("button", { name: "Send invite" })).toBeDisabled();
  });
});
