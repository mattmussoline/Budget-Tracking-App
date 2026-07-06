import { ContentLicenseForm } from "./content-license-form";
import { DashboardInsights } from "./dashboard-insights";
import { FiscalYearSettings } from "./fiscal-year-settings";
import { FiscalYearManager } from "./fiscal-year-manager";
import { LicenseManager } from "./license-manager";
import { MonthBoard } from "./month-board";
import { ProviderSummary } from "./provider-summary";
import { SharePanel } from "./share-panel";
import { SummaryMetrics } from "./summary-metrics";
import { logout } from "../auth-actions";
import { deleteFiscalYear, pinFiscalYear } from "../budget-actions";
import type { ContentLicense } from "../budget-types";
import type { DashboardModel } from "../dashboard-model";
import { getNextFiscalYear } from "../fiscal-year-selection";
import type { ProviderColorOverrides } from "../provider-colors";
import { PlanningHeader } from "@/features/planning/components/planning-header";

type FiscalYearRow = {
  id: string;
  label: string;
  fiscal_year: number;
  fiscal_year_start_month: number;
  budget_cents: number;
  is_pinned: boolean;
};

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
  const isDemo = mode === "demo";
  const nextFiscalYear = getNextFiscalYear(fiscalYears, new Date().getFullYear());
  const providerOptions = Array.from(new Set(licenses.map((license) => license.provider).filter(Boolean))).sort((a, b) =>
    a.localeCompare(b)
  );

  return (
    <main className="min-h-screen bg-white px-4 py-6 sm:px-5 md:px-8 lg:px-10">
      <div className="mx-auto grid min-w-0 max-w-7xl gap-8">
        <PlanningHeader
          title={fiscalYear?.label ?? "Licensing Budget"}
          eyebrow="Internal Licensing"
          description="Track titles, providers, payment cadence, quarter proration, committed spend, and remaining budget in one place."
          activeSection="dashboard"
          footer={(fiscalYears.length > 0 || userEmail || isDemo) ? (
            <div className="flex flex-wrap items-end justify-between gap-3 border-t border-white/15 pt-4">
              <div className="min-w-0 -mt-5">
                {fiscalYears.length > 0 ? (
                  <FiscalYearManager
                    fiscalYears={fiscalYears}
                    activeFiscalYearId={fiscalYear?.id}
                    pinAction={pinFiscalYear}
                    deleteAction={deleteFiscalYear}
                    createForm={<FiscalYearSettings isDemo={isDemo} defaultFiscalYear={nextFiscalYear} />}
                    isDemo={isDemo}
                  />
                ) : null}
              </div>
              <div className="flex min-w-0 flex-wrap items-center justify-end gap-3">
                {isDemo ? (
                  <p className="rounded-md bg-white px-4 py-3 text-sm font-extrabold text-blue-700 shadow-sm">
                    Local demo mode. Add Supabase env vars to enable shared editing on Vercel.
                  </p>
                ) : null}
                {userEmail ? (
                  <form action={logout} className="flex min-w-0 flex-wrap items-center gap-3 rounded-md bg-white/10 px-4 py-3 text-sm font-extrabold text-white">
                    <span className="min-w-0 break-all">{userEmail}</span>
                    <button type="submit" className="min-h-11 rounded-md bg-white px-3 py-2 text-xs uppercase text-blue-700">
                      Logout
                    </button>
                  </form>
                ) : null}
              </div>
            </div>
          ) : null}
        />

        {!fiscalYear || !model ? (
          <FiscalYearSettings isDemo={isDemo} />
        ) : (
          <div className="grid min-w-0 gap-8">
            <SummaryMetrics model={model} />
            <DashboardInsights model={model} providerColorOverrides={providerColorOverrides} />
            <div className="grid min-w-0 gap-8 xl:grid-cols-[minmax(0,420px)_minmax(0,1fr)]">
              <div className="grid min-w-0 content-start gap-8">
                <FiscalYearSettings fiscalYear={fiscalYear} isDemo={isDemo} />
                <ContentLicenseForm
                  fiscalYearId={fiscalYear.id}
                  fiscalYear={fiscalYear.fiscal_year}
                  fiscalYearStartMonth={fiscalYear.fiscal_year_start_month}
                  providerOptions={providerOptions}
                  isDemo={isDemo}
                />
                <ProviderSummary
                  model={model}
                  fiscalYearId={fiscalYear.id}
                  providerColorOverrides={providerColorOverrides}
                  isDemo={isDemo}
                />
                <SharePanel allowedEmails={allowedEmails} currentUserEmail={userEmail} isDemo={isDemo} />
                <p className="px-2 text-sm font-medium text-muted">{licenses.length} content titles tracked.</p>
              </div>
              <div className="grid min-w-0 content-start gap-8">
                <MonthBoard model={model} providerColorOverrides={providerColorOverrides} />
                <LicenseManager
                  fiscalYearId={fiscalYear.id}
                  fiscalYear={fiscalYear.fiscal_year}
                  fiscalYearStartMonth={fiscalYear.fiscal_year_start_month}
                  licenses={licenses}
                  providerOptions={providerOptions}
                  providerColorOverrides={providerColorOverrides}
                  isDemo={isDemo}
                />
              </div>
            </div>
          </div>
        )}
      </div>
    </main>
  );
}
