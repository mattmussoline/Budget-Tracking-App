import { render, screen } from "@testing-library/react";
import "@testing-library/jest-dom/vitest";
import React from "react";
import { describe, expect, it, vi } from "vitest";
import { BudgetDashboard } from "./budget-dashboard";
import type { ContentLicense } from "../budget-types";
import { buildDashboardModel } from "../dashboard-model";

vi.mock("../auth-actions", () => ({ logout: vi.fn() }));
vi.mock("../budget-actions", () => ({
  createFiscalYear: vi.fn(),
  updateFiscalYear: vi.fn(),
  addContentLicense: vi.fn(),
  updateContentLicense: vi.fn(),
  deleteContentLicense: vi.fn(),
  updateProviderColor: vi.fn(),
  addCollaborator: vi.fn(),
  removeCollaborator: vi.fn(),
  pinFiscalYear: vi.fn(),
  deleteFiscalYear: vi.fn()
}));
vi.mock("next/navigation", () => ({
  useRouter: () => ({ prefetch: vi.fn() })
}));

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
    title: "Aquinas 101",
    provider: "Thomistic",
    installmentCents: 1200000,
    cadence: "quarterly",
    addedFiscalMonth: 1,
    notes: ""
  },
  {
    id: "license-2",
    title: "Catholic Films",
    provider: "Studio",
    installmentCents: 600000,
    cadence: "yearly",
    addedFiscalMonth: 3,
    notes: ""
  }
];

function renderDashboard() {
  const model = buildDashboardModel({
    fiscalYear: fiscalYear.fiscal_year,
    fiscalYearStartMonth: fiscalYear.fiscal_year_start_month,
    budgetCents: fiscalYear.budget_cents,
    licenses
  });

  return render(
    <BudgetDashboard
      fiscalYear={fiscalYear}
      fiscalYears={[fiscalYear]}
      model={model}
      licenses={licenses}
      mode="live"
      userEmail="matt.mussoline@augustineinstitute.org"
      allowedEmails={["matt.mussoline@augustineinstitute.org", "teammate@augustineinstitute.org"]}
    />
  );
}

describe("BudgetDashboard", () => {
  it("does not stretch the edit content panel to match the sidebar height", () => {
    const { container } = renderDashboard();
    const editContentPanel = Array.from(container.querySelectorAll("div.content-start")).find((element) =>
      element.querySelector("details.group")
    );

    expect(editContentPanel).toBeInTheDocument();
    expect(editContentPanel).toContainElement(container.querySelector("details.group"));
  });

  it("renders dashboard form fields with unique ids", () => {
    const { container } = renderDashboard();
    const ids = Array.from(container.querySelectorAll("[id]"), (element) => element.id).filter(Boolean);
    const duplicateIds = ids.filter((id, index) => ids.indexOf(id) !== index);

    expect(duplicateIds).toEqual([]);
  });

  it("uses the standardized page header scale", () => {
    renderDashboard();

    expect(screen.getByRole("banner")).toHaveClass("h-80", "md:h-80", "p-6", "md:p-8");
    expect(screen.getByRole("heading", { name: "FY2027" })).toHaveClass("text-3xl", "md:text-5xl");
    expect(screen.getByRole("navigation", { name: "Planning sections" }).parentElement).toHaveClass("self-end");
    expect(screen.getByRole("banner")).toContainElement(screen.getByRole("navigation", { name: "Fiscal year budgets" }));
    expect(screen.getByRole("banner")).toContainElement(screen.getByRole("button", { name: "Logout" }).closest("form"));
  });

  it("uses white fields inside the fiscal year and add content forms", () => {
    renderDashboard();

    expect(screen.getByRole("textbox", { name: "Label" })).toHaveClass("bg-white");
    expect(screen.getByRole("spinbutton", { name: "Fiscal year" })).toHaveClass("bg-white");
    expect(screen.getByRole("textbox", { name: "Budget" })).toHaveClass("bg-white");
    expect(screen.getByPlaceholderText("Jesus Thirsts")).toHaveClass("bg-white");
    expect(screen.getByPlaceholderText("Provider name")).toHaveClass("bg-white");
    expect(screen.getByRole("textbox", { name: "Payment amount" })).toHaveClass("bg-white");
  });

  it("uses short placeholder text for add content dropdowns", () => {
    const { container } = renderDashboard();
    const addContentForm = screen.getByText("Add Content").closest("div")?.parentElement?.nextElementSibling;
    const addContentSelectPlaceholders = Array.from(addContentForm?.querySelectorAll("option[value='']") ?? []).map(
      (option) => option.textContent
    );

    expect(addContentSelectPlaceholders).toEqual(["Select", "Select"]);
    expect(container).not.toHaveTextContent("Select cadence");
    expect(container).not.toHaveTextContent("Select month");
  });

  it("shows cadence mix as a top-level dashboard data point", () => {
    const { container } = renderDashboard();

    expect(screen.getByText("Cadence mix")).toBeInTheDocument();
    expect(screen.getByText("$48,000.00 quarterly")).toBeInTheDocument();
    expect(screen.getByText("$6,000.00 yearly")).toBeInTheDocument();
    expect(container.querySelector(".bg-teal-100")).toHaveTextContent("Cadence mix");
    expect(container.querySelector(".bg-rose-100")).not.toBeInTheDocument();
  });
});
