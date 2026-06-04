import { CadenceSummary } from "./cadence-summary";
import { ContentLicenseForm } from "./content-license-form";
import { FiscalYearSettings } from "./fiscal-year-settings";
import { MonthBoard } from "./month-board";
import { ProviderSummary } from "./provider-summary";
import { SharePanel } from "./share-panel";
import { SummaryMetrics } from "./summary-metrics";
import type { ContentLicense } from "../budget-types";
import type { DashboardModel } from "../dashboard-model";

type FiscalYearRow = {
  id: string;
  label: string;
  fiscal_year: number;
  fiscal_year_start_month: number;
  budget_cents: number;
};

type BudgetDashboardProps = {
  fiscalYear: FiscalYearRow | null;
  model: DashboardModel | null;
  licenses: ContentLicense[];
  mode: "demo" | "live";
};

export function BudgetDashboard({ fiscalYear, model, licenses, mode }: BudgetDashboardProps) {
  const isDemo = mode === "demo";

  return (
    <main className="min-h-screen px-5 py-6 md:px-8 lg:px-10">
      <div className="mx-auto grid max-w-7xl gap-8">
        <header className="flex flex-col gap-4 py-6 md:flex-row md:items-end md:justify-between">
          <div>
            <p className="mb-2 text-sm font-bold uppercase text-muted">Internal Licensing</p>
            <h1 className="font-display text-4xl font-extrabold tracking-tight md:text-6xl">
              {fiscalYear?.label ?? "Licensing Budget"}
            </h1>
          </div>
          <div className="grid max-w-xl gap-3">
            <p className="text-base font-medium leading-7 text-muted">
              Track titles, providers, payment cadence, quarter proration, committed spend, and remaining budget in one place.
            </p>
            {isDemo ? (
              <p className="rounded-2xl px-4 py-3 text-sm font-bold text-muted soft-inset-sm">
                Local demo mode. Add Supabase env vars to enable shared editing on Vercel.
              </p>
            ) : null}
          </div>
        </header>

        {!fiscalYear || !model ? (
          <FiscalYearSettings isDemo={isDemo} />
        ) : (
          <div className="grid gap-8">
            <SummaryMetrics model={model} />
            <div className="grid gap-8 xl:grid-cols-[420px_1fr]">
              <div className="grid content-start gap-8">
                <ContentLicenseForm
                  fiscalYearId={fiscalYear.id}
                  fiscalYear={fiscalYear.fiscal_year}
                  fiscalYearStartMonth={fiscalYear.fiscal_year_start_month}
                  isDemo={isDemo}
                />
                <ProviderSummary model={model} />
                <CadenceSummary model={model} />
                <SharePanel fiscalYearId={fiscalYear.id} isDemo={isDemo} />
                <p className="px-2 text-sm font-medium text-muted">{licenses.length} content titles tracked.</p>
              </div>
              <MonthBoard model={model} />
            </div>
          </div>
        )}
      </div>
    </main>
  );
}
