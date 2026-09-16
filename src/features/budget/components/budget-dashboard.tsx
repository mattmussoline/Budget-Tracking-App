import { FiscalYearSettings } from "./fiscal-year-settings";
import { LicensingSummary } from "./licensing-summary";
import type { FiscalYearRow } from "./summary-modals";
import type { ContentLicense } from "../budget-types";
import type { DashboardModel } from "../dashboard-model";
import type { ProviderColorOverrides } from "../provider-colors";
import { buildLicensingSummaryView } from "../summary-model";
import { PlanningShell } from "@/features/planning/components/planning-shell";

type BudgetDashboardProps = {
  fiscalYear: FiscalYearRow | null;
  fiscalYears: FiscalYearRow[];
  model: DashboardModel | null;
  licenses: ContentLicense[];
  providerColorOverrides?: ProviderColorOverrides;
  mode: "demo" | "live";
  userEmail?: string;
  allowedEmails?: string[];
};

/**
 * The Licensing Summary route. Everything on the page is derived here, once,
 * from the dashboard model; the client component below only decides which
 * quarter, month, title row or modal is open.
 */
export function BudgetDashboard({
  fiscalYear,
  fiscalYears,
  model,
  licenses,
  providerColorOverrides = {},
  mode,
  userEmail,
  allowedEmails = []
}: BudgetDashboardProps) {
  if (!fiscalYear || !model) {
    return (
      <PlanningShell
        title="Licensing Budget"
        description="Titles, providers, payment cadence, quarter proration, committed spend, and remaining budget in one place."
        activeSection="dashboard"
        routePrefix={mode === "demo" ? "/demo" : ""}
      >
        <FiscalYearSettings isDemo={mode === "demo"} />
      </PlanningShell>
    );
  }

  return (
    <LicensingSummary
      fiscalYear={fiscalYear}
      fiscalYears={fiscalYears}
      view={buildLicensingSummaryView({ model, licenses })}
      licenses={licenses}
      providerColorOverrides={providerColorOverrides}
      mode={mode}
      userEmail={userEmail}
      allowedEmails={allowedEmails}
    />
  );
}
