import { render } from "@testing-library/react";
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
  it("renders dashboard form fields with unique ids", () => {
    const { container } = renderDashboard();
    const ids = Array.from(container.querySelectorAll("[id]"), (element) => element.id).filter(Boolean);
    const duplicateIds = ids.filter((id, index) => ids.indexOf(id) !== index);

    expect(duplicateIds).toEqual([]);
  });
});
