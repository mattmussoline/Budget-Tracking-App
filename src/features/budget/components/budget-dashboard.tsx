import Link from "next/link";
import { ClipboardCheck, LogOut, Map, Plus } from "lucide-react";
import { CadenceSummary } from "./cadence-summary";
import { ContentLicenseForm } from "./content-license-form";
import { DashboardInsights } from "./dashboard-insights";
import { FiscalYearSettings } from "./fiscal-year-settings";
import { LicenseManager } from "./license-manager";
import { MonthBoard } from "./month-board";
import { ProviderSummary } from "./provider-summary";
import { SharePanel } from "./share-panel";
import { SummaryMetrics } from "./summary-metrics";
import { logout } from "../auth-actions";
import { createFiscalYear } from "../budget-actions";
import type { ContentLicense } from "../budget-types";
import type { DashboardModel } from "../dashboard-model";
import type { ProviderColorOverrides } from "../provider-colors";

type FiscalYearRow = {
  id: string;
  label: string;
  fiscal_year: number;
  fiscal_year_start_month: number;
  budget_cents: number;
};

type BudgetDashboardProps = {
  fiscalYear: FiscalYearRow | null;
  fiscalYears: FiscalYearRow[];
  model: DashboardModel | null;
  licenses: ContentLicense[];
  providerColorOverrides?: ProviderColorOverrides;
  mode: "demo" | "live";
  canInvite: boolean;
  invitedUsers: Array<{
    email: string;
    invited_by_email: string;
    created_at: string;
  }>;
};

export function BudgetDashboard({
  fiscalYear,
  fiscalYears,
  model,
  licenses,
  providerColorOverrides = {},
  mode,
  canInvite,
  invitedUsers
}: BudgetDashboardProps) {
  const isDemo = mode === "demo";
  const providerOptions = Array.from(new Set(licenses.map((license) => license.provider).filter(Boolean))).sort((a, b) =>
    a.localeCompare(b)
  );
  const nextFiscalYearDefaults = fiscalYear
    ? {
        label: `FY${String(fiscalYear.fiscal_year + 1).slice(-2)} Licensing Budget`,
        fiscal_year: fiscalYear.fiscal_year + 1,
        fiscal_year_start_month: fiscalYear.fiscal_year_start_month,
        budget_cents: fiscalYear.budget_cents
      }
    : undefined;

  return (
    <main className="min-h-screen bg-white px-5 py-6 md:px-8 lg:px-10">
      <div className="mx-auto grid max-w-7xl gap-8">
        <header className="relative overflow-hidden rounded-lg bg-blue-500 p-8 text-white md:p-10">
          <div className="absolute -right-10 -top-16 h-48 w-48 rounded-full bg-white/10" aria-hidden="true" />
          <div className="absolute bottom-6 right-28 h-20 w-20 rotate-12 bg-white/10" aria-hidden="true" />
          <div className="relative z-10 flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
            <div>
            <p className="mb-2 text-sm font-extrabold uppercase tracking-wide text-blue-100">Internal Licensing</p>
            <h1 className="font-display text-4xl font-extrabold tracking-tight md:text-6xl">
              {fiscalYear?.label ?? "Licensing Budget"}
            </h1>
            {fiscalYears.length > 0 ? (
              <nav className="mt-5 flex flex-wrap gap-3" aria-label="Fiscal year budgets">
                {fiscalYears.map((year) => {
                  const isActive = year.id === fiscalYear?.id;

                  return (
                    <Link
                      key={year.id}
                      href={`/dashboard?fy=${year.id}`}
                      aria-current={isActive ? "page" : undefined}
                      className={`inline-flex min-h-12 items-center gap-2 rounded-md px-4 py-3 text-sm font-extrabold transition ${
                        isActive
                          ? "bg-gray-950 text-white ring-2 ring-white ring-offset-2 ring-offset-blue-500"
                          : "bg-white/15 text-white hover:bg-white/25"
                      }`}
                    >
                      <span>FY{String(year.fiscal_year).slice(-2)}</span>
                      {isActive ? (
                        <span className="rounded bg-white px-2 py-1 text-[10px] font-extrabold uppercase text-gray-950">Current</span>
                      ) : null}
                    </Link>
                  );
                })}
                {nextFiscalYearDefaults ? (
                  <form action={createFiscalYear}>
                    <input type="hidden" name="label" value={nextFiscalYearDefaults.label} />
                    <input type="hidden" name="fiscalYear" value={nextFiscalYearDefaults.fiscal_year} />
                    <input type="hidden" name="fiscalYearStartMonth" value={nextFiscalYearDefaults.fiscal_year_start_month} />
                    <input type="hidden" name="budget" value={nextFiscalYearDefaults.budget_cents / 100} />
                    <button
                      className="inline-flex items-center gap-2 rounded-md bg-white px-3 py-2 text-sm font-extrabold text-blue-700 transition hover:bg-blue-50 disabled:cursor-not-allowed disabled:opacity-70"
                      type="submit"
                      disabled={isDemo}
                    >
                      <Plus className="h-4 w-4" aria-hidden="true" />
                      New FY
                    </button>
                  </form>
                ) : null}
              </nav>
            ) : null}
            </div>
            <div className="grid max-w-xl gap-3">
            <div className="flex flex-wrap items-center gap-3 text-sm font-extrabold text-blue-50 md:justify-end">
              <Link
                href="/roadmap"
                className="inline-flex min-h-12 items-center gap-2 rounded-md bg-blue-400 px-5 py-3 text-sm font-extrabold uppercase text-white transition hover:scale-[1.03] hover:bg-white/20"
              >
                <Map className="h-4 w-4" aria-hidden="true" />
                Content Roadmap
              </Link>
              <Link
                href="/content-review"
                className="inline-flex min-h-12 items-center gap-2 rounded-md bg-blue-400 px-5 py-3 text-sm font-extrabold uppercase text-white transition hover:scale-[1.03] hover:bg-white/20"
              >
                <ClipboardCheck className="h-4 w-4" aria-hidden="true" />
                Content Review
              </Link>
              <form action={logout}>
                <button className="inline-flex min-h-12 items-center gap-2 rounded-md bg-white px-5 py-3 text-sm font-extrabold uppercase text-blue-700 transition hover:scale-[1.03] hover:bg-blue-50" type="submit">
                  <LogOut className="h-4 w-4" aria-hidden="true" />
                  Logout
                </button>
              </form>
            </div>
            {isDemo ? (
              <p className="rounded-md bg-white px-4 py-3 text-sm font-extrabold text-blue-700">
                Local demo mode. Add Supabase env vars to enable shared editing and invites on Vercel.
              </p>
            ) : null}
            </div>
          </div>
        </header>

        {!fiscalYear || !model ? (
          <FiscalYearSettings isDemo={isDemo} />
        ) : (
          <div className="grid gap-8">
            <SummaryMetrics model={model} />
            <DashboardInsights model={model} providerColorOverrides={providerColorOverrides} />
            <div className="grid gap-8 xl:grid-cols-[420px_1fr]">
              <div className="grid content-start gap-8">
                <FiscalYearSettings fiscalYear={fiscalYear} isDemo={isDemo} />
                <ContentLicenseForm
                  fiscalYearId={fiscalYear.id}
                  fiscalYear={fiscalYear.fiscal_year}
                  fiscalYearStartMonth={fiscalYear.fiscal_year_start_month}
                  providerOptions={providerOptions}
                  isDemo={isDemo}
                />
                <p className="px-2 text-sm font-medium text-muted">{licenses.length} content titles tracked.</p>
              </div>
              <div className="grid gap-8">
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
            <div className="grid items-start gap-8 lg:grid-cols-[minmax(0,1.35fr)_minmax(320px,0.65fr)]">
              <ProviderSummary
                model={model}
                fiscalYearId={fiscalYear.id}
                providerColorOverrides={providerColorOverrides}
                isDemo={isDemo}
              />
              <div className="grid gap-8">
                <CadenceSummary model={model} />
                <SharePanel canInvite={canInvite} invitedUsers={invitedUsers} isDemo={isDemo} />
              </div>
            </div>
          </div>
        )}
      </div>
    </main>
  );
}
