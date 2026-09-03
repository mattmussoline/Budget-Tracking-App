import { ContentLicenseForm } from "./content-license-form";
import { DashboardInsights } from "./dashboard-insights";
import { DashboardPopout } from "./dashboard-popout";
import { FiscalYearSettings } from "./fiscal-year-settings";
import { FiscalYearManager } from "./fiscal-year-manager";
import { LicenseManager } from "./license-manager";
import { MonthBoard } from "./month-board";
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
import type { Route } from "next";
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
          routePrefix={isDemo ? "/demo" : ""}
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
                    routePrefix={isDemo ? "/demo" : ""}
                  />
                ) : null}
              </div>
              <div className="flex min-w-0 flex-wrap items-center justify-end gap-3">
                {isDemo ? (
                  <p className="rounded-md bg-white px-4 py-3 text-sm font-semibold text-formed-blue shadow-sm">
                    Public demo mode. Sample data only; editing is disabled.
                  </p>
                ) : null}
                {userEmail ? (
                  <form action={logout} className="flex min-w-0 flex-wrap items-center gap-3 rounded-md bg-white/10 px-4 py-3 text-sm font-semibold text-white">
                    <span className="min-w-0 break-all">{userEmail}</span>
                    <button type="submit" className="min-h-11 rounded-md bg-white px-3 py-2 text-xs uppercase text-formed-blue">
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
            <DashboardInsights
              fiscalYearId={fiscalYear.id}
              isDemo={isDemo}
              model={model}
              providerColorOverrides={providerColorOverrides}
            />
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
          </div>
        )}
      </div>
    </main>
  );
}

const attentionToneClasses: Record<NeedsAttentionItem["tone"], string> = {
  amber: "border-guild-gold bg-guild-gold-soft text-guild-gold-ink",
  blue: "border-formed-blue-border bg-formed-blue-soft text-augustine-blue",
  red: "border-danger-border bg-danger-soft text-danger"
};

function BudgetSourcesPanel({ items }: { items: BudgetSourceSummaryItem[] }) {
  if (!items.length) return null;

  const total = items.reduce((sum, item) => sum + item.count, 0);

  return (
    <div data-testid="budget-sources-panel">
      <DashboardPopout
        title="Budget Sources"
        eyebrow={`${total} tracked`}
        description="Content counted across budget items, roadmap titles, and content reviews."
        toneClassName="bg-deep-teal-soft text-deep-teal"
        triggerClassName="w-full bg-deep-teal-soft p-0 text-deep-teal ring-1 ring-deep-teal"
        trigger={
          <div className="flex min-w-0 items-center justify-between gap-3 p-5 md:p-6">
            <div className="min-w-0">
              <h2 className="font-display text-2xl tracking-tight">Budget Sources</h2>
              <p className="text-sm font-medium text-muted">Content counted across budget items, roadmap titles, and content reviews.</p>
            </div>
            <span className="flex shrink-0 items-center gap-2">
              <span className="rounded-full bg-white/80 px-3 py-1 text-[10px] font-semibold uppercase tracking-wide text-deep-teal">
                {total} tracked
              </span>
              <span className="grid h-8 w-8 place-items-center rounded-full bg-white/80 text-deep-teal shadow-sm ring-1 ring-deep-teal">
                <Plus className="h-4 w-4" aria-hidden="true" />
              </span>
            </span>
          </div>
        }
      >
        <div className="grid gap-3 md:grid-cols-4">
          {items.map((item) => (
            <div key={item.source} className="rounded-md border border-hairline bg-panel-warm p-4">
              <p className="text-2xl font-semibold text-foreground">{item.count}</p>
              <p className="text-xs font-semibold uppercase tracking-wide text-muted">{item.label}</p>
            </div>
          ))}
        </div>
      </DashboardPopout>
    </div>
  );
}

function NeedsAttentionPanel({ fiscalYearId, items, isDemo }: { fiscalYearId: string; items: NeedsAttentionItem[]; isDemo?: boolean }) {
  return (
    <div data-testid="needs-attention-panel">
      <DashboardPopout
        title="Needs Attention"
        eyebrow={`${items.length} open`}
        description="Items that are blocked, undated, approved, released, or close to budget limits."
        toneClassName="bg-guild-gold-soft text-guild-gold-ink"
        triggerClassName="w-full bg-guild-gold-soft p-0 text-guild-gold-ink"
        trigger={
          <div className="flex min-w-0 items-center justify-between gap-3 p-5 md:p-6">
            <div className="min-w-0">
              <h2 className="font-display text-2xl tracking-tight">Needs Attention</h2>
              <p className="text-sm font-medium text-muted">Items that are blocked, undated, approved, released, or close to budget limits.</p>
            </div>
            <span className="flex shrink-0 items-center gap-2">
              <span className="rounded-full bg-white px-3 py-1 text-[10px] font-semibold uppercase tracking-wide text-danger">
                {items.length} open
              </span>
              <span className="grid h-8 w-8 place-items-center rounded-full bg-white text-danger shadow-sm ring-1 ring-danger-border">
                <Plus className="h-4 w-4" aria-hidden="true" />
              </span>
            </span>
          </div>
        }
      >
        {items.length ? (
          <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
            {items.map((item) => (
              <div key={item.id} className={`grid gap-3 rounded-md border p-4 ${attentionToneClasses[item.tone]}`}>
                <Link href={isDemo ? (`/demo${item.href}` as Route) : item.href} aria-label={`Open ${item.title}`} className="transition hover:-translate-y-0.5">
                  <p className="text-sm font-semibold">{item.title}</p>
                  <p className="mt-1 text-xs font-bold opacity-80">{item.detail}</p>
                </Link>
                <form action={dismissNeedsAttentionItem}>
                  <input type="hidden" name="fiscalYearId" value={fiscalYearId} />
                  <input type="hidden" name="attentionKey" value={item.id} />
                  <button
                    type="submit"
                    aria-label={`Mark ${item.title} complete`}
                    disabled={isDemo}
                    className="min-h-9 rounded-md bg-white px-3 py-2 text-xs font-semibold text-foreground shadow-sm ring-1 ring-black/5 hover:bg-panel-warm disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    Mark complete
                  </button>
                </form>
              </div>
            ))}
          </div>
        ) : (
          <p className="rounded-md bg-panel-warm px-4 py-3 text-sm font-semibold text-muted">Nothing needs attention right now.</p>
        )}
      </DashboardPopout>
    </div>
  );
}
