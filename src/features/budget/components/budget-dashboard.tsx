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
import { deleteFiscalYear, dismissNeedsAttentionItem, pinFiscalYear } from "../budget-actions";
import type { BudgetSourceSummaryItem } from "../budget-source";
import type { ContentLicense } from "../budget-types";
import type { DashboardModel } from "../dashboard-model";
import { getNextFiscalYear } from "../fiscal-year-selection";
import type { ProviderColorOverrides } from "../provider-colors";
import { PlanningHeader } from "@/features/planning/components/planning-header";
import Link from "next/link";
import type { NeedsAttentionItem } from "../attention-model";
import { Plus } from "lucide-react";

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
  needsAttention?: NeedsAttentionItem[];
  budgetSourceSummary?: BudgetSourceSummaryItem[];
};

export function BudgetDashboard({
  fiscalYear,
  fiscalYears,
  model,
  licenses,
  providerColorOverrides = {},
  mode,
  userEmail,
  allowedEmails = [],
  needsAttention = [],
  budgetSourceSummary = []
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
            <div className="grid min-w-0 gap-8 lg:grid-cols-2">
              <BudgetSourcesPanel items={budgetSourceSummary} />
              <NeedsAttentionPanel fiscalYearId={fiscalYear.id} items={needsAttention} isDemo={isDemo} />
            </div>
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
            <ProviderSummary
              model={model}
              fiscalYearId={fiscalYear.id}
              providerColorOverrides={providerColorOverrides}
              isDemo={isDemo}
            />
          </div>
        )}
      </div>
    </main>
  );
}

const attentionToneClasses: Record<NeedsAttentionItem["tone"], string> = {
  amber: "border-amber-300 bg-amber-50 text-amber-950",
  blue: "border-blue-300 bg-blue-50 text-blue-950",
  red: "border-red-300 bg-red-50 text-red-950"
};

function BudgetSourcesPanel({ items }: { items: BudgetSourceSummaryItem[] }) {
  if (!items.length) return null;

  const total = items.reduce((sum, item) => sum + item.count, 0);

  return (
    <details data-testid="budget-sources-panel" className="rounded-lg bg-purple-50 ring-1 ring-purple-100">
      <summary className="flex cursor-pointer list-none items-center justify-between gap-3 p-5 marker:hidden md:p-6">
        <div>
          <h2 className="font-display text-2xl font-extrabold tracking-tight">Budget Sources</h2>
          <p className="text-sm font-medium text-muted">Content counted across budget items, roadmap titles, and content reviews.</p>
        </div>
        <span className="flex shrink-0 items-center gap-2">
          <span className="rounded-full bg-white/80 px-3 py-1 text-[10px] font-extrabold uppercase tracking-wide text-purple-900">
            {total} tracked
          </span>
          <span className="grid h-8 w-8 place-items-center rounded-full bg-white/80 text-purple-900 shadow-sm ring-1 ring-purple-100">
            <Plus className="h-4 w-4" aria-hidden="true" />
            <span className="sr-only">Open Budget Sources</span>
          </span>
        </span>
      </summary>
      <div className="grid gap-3 px-5 pb-5 md:grid-cols-4 md:px-6 md:pb-6">
        {items.map((item) => (
          <div key={item.source} className="rounded-md border border-gray-200 bg-gray-50 p-4">
            <p className="text-2xl font-extrabold text-foreground">{item.count}</p>
            <p className="text-xs font-extrabold uppercase tracking-wide text-muted">{item.label}</p>
          </div>
        ))}
      </div>
    </details>
  );
}

function NeedsAttentionPanel({ fiscalYearId, items, isDemo }: { fiscalYearId: string; items: NeedsAttentionItem[]; isDemo?: boolean }) {
  return (
    <details data-testid="needs-attention-panel" className="rounded-lg bg-red-50">
      <summary className="flex cursor-pointer list-none items-center justify-between gap-3 p-5 marker:hidden md:p-6">
        <div>
          <h2 className="font-display text-2xl font-extrabold tracking-tight">Needs Attention</h2>
          <p className="text-sm font-medium text-muted">Items that are blocked, undated, approved, released, or close to budget limits.</p>
        </div>
        <span className="flex shrink-0 items-center gap-2">
          <span className="rounded-full bg-white px-3 py-1 text-[10px] font-extrabold uppercase tracking-wide text-red-900">
            {items.length} open
          </span>
          <span className="grid h-8 w-8 place-items-center rounded-full bg-white text-red-900 shadow-sm ring-1 ring-red-100">
            <Plus className="h-4 w-4" aria-hidden="true" />
            <span className="sr-only">Open Needs Attention</span>
          </span>
        </span>
      </summary>
      {items.length ? (
        <div className="grid gap-3 px-5 pb-5 md:grid-cols-2 md:px-6 md:pb-6 xl:grid-cols-3">
          {items.map((item) => (
            <div key={item.id} className={`grid gap-3 rounded-md border p-4 ${attentionToneClasses[item.tone]}`}>
              <Link href={item.href} aria-label={`Open ${item.title}`} className="transition hover:-translate-y-0.5">
                <p className="text-sm font-extrabold">{item.title}</p>
                <p className="mt-1 text-xs font-bold opacity-80">{item.detail}</p>
              </Link>
              <form action={dismissNeedsAttentionItem}>
                <input type="hidden" name="fiscalYearId" value={fiscalYearId} />
                <input type="hidden" name="attentionKey" value={item.id} />
                <button
                  type="submit"
                  aria-label={`Mark ${item.title} complete`}
                  disabled={isDemo}
                  className="min-h-9 rounded-md bg-white px-3 py-2 text-xs font-extrabold text-foreground shadow-sm ring-1 ring-black/5 hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  Mark complete
                </button>
              </form>
            </div>
          ))}
        </div>
      ) : (
        <p className="mx-5 mb-5 rounded-md bg-white px-4 py-3 text-sm font-extrabold text-muted md:mx-6 md:mb-6">Nothing needs attention right now.</p>
      )}
    </details>
  );
}
