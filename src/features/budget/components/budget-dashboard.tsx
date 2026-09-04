import { ChevronDown } from "lucide-react";
import Link from "next/link";
import type { Route } from "next";
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
import type { NeedsAttentionItem } from "../attention-model";
import { PlanningShell } from "@/features/planning/components/planning-shell";
import { TopBarDivider } from "@/features/planning/components/app-top-bar";
import { monthNames } from "@/lib/months";

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
    <PlanningShell
      title={fiscalYear?.label ?? "Licensing Budget"}
      description="Titles, providers, payment cadence, quarter proration, committed spend, and remaining budget in one place."
      activeSection="dashboard"
      routePrefix={isDemo ? "/demo" : ""}
      actions={
        fiscalYear ? (
          <span className="rounded-lg bg-formed-blue-soft px-3 py-1.5 text-xs font-semibold text-formed-blue">
            {formatFiscalYearRange(fiscalYear.fiscal_year, fiscalYear.fiscal_year_start_month)}
          </span>
        ) : null
      }
      topBarRight={
        <>
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
          {isDemo ? (
            <>
              <TopBarDivider />
              <span className="text-[13px] font-semibold text-formed-blue">Public demo. Sample data only.</span>
            </>
          ) : null}
          {userEmail ? (
            <>
              <TopBarDivider />
              <form action={logout} className="flex min-w-0 items-center gap-2.5">
                <span className="min-w-0 truncate text-[13px] text-muted">{userEmail}</span>
                <button
                  type="submit"
                  className="rounded-lg border border-hairline bg-panel px-2.5 py-1.5 text-xs font-semibold text-foreground transition-colors hover:border-hairline-strong"
                >
                  Logout
                </button>
              </form>
            </>
          ) : null}
        </>
      }
    >
      {!fiscalYear || !model ? (
        <FiscalYearSettings isDemo={isDemo} />
      ) : (
        <div className="grid min-w-0 gap-5">
          <SummaryMetrics model={model} />
          <DashboardInsights
            fiscalYearId={fiscalYear.id}
            isDemo={isDemo}
            model={model}
            providerColorOverrides={providerColorOverrides}
          />
          <div className="grid min-w-0 gap-3.5 lg:grid-cols-2">
            <BudgetSourcesPanel items={budgetSourceSummary} />
            <NeedsAttentionPanel fiscalYearId={fiscalYear.id} items={needsAttention} isDemo={isDemo} />
          </div>
          <div className="grid min-w-0 gap-5 xl:grid-cols-[minmax(0,348px)_minmax(0,1fr)]">
            <div className="grid min-w-0 content-start gap-4">
              <FiscalYearSettings fiscalYear={fiscalYear} isDemo={isDemo} />
              <ContentLicenseForm
                fiscalYearId={fiscalYear.id}
                fiscalYear={fiscalYear.fiscal_year}
                fiscalYearStartMonth={fiscalYear.fiscal_year_start_month}
                providerOptions={providerOptions}
                isDemo={isDemo}
              />
              <SharePanel allowedEmails={allowedEmails} currentUserEmail={userEmail} isDemo={isDemo} />
            </div>
            <div className="grid min-w-0 content-start gap-4">
              <div className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1">
                <h2 className="font-display text-2xl">Committed by quarter</h2>
                <p className="text-sm text-muted">
                  {licenses.length} content {licenses.length === 1 ? "title" : "titles"} tracked. Click a quarter to expand its months.
                </p>
              </div>
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
    </PlanningShell>
  );
}

/** "July 2025 – June 2026" for the fiscal calendar the budget actually runs on. */
function formatFiscalYearRange(fiscalYear: number, fiscalYearStartMonth: number) {
  const startName = monthNames[fiscalYearStartMonth - 1];
  const endMonthIndex = (fiscalYearStartMonth + 10) % 12;
  const endName = monthNames[endMonthIndex];
  const startYear = fiscalYearStartMonth === 1 ? fiscalYear : fiscalYear - 1;
  const endYear = fiscalYearStartMonth === 1 ? fiscalYear : fiscalYear;

  return `${startName} ${startYear} – ${endName} ${endYear}`;
}

const attentionToneClasses: Record<NeedsAttentionItem["tone"], string> = {
  amber: "border-guild-gold bg-guild-gold-soft text-guild-gold-ink",
  blue: "border-formed-blue-border bg-formed-blue-soft text-augustine-blue",
  red: "border-danger-border bg-danger-soft text-danger"
};

/** The collapsible strip shared by Budget sources and Needs attention. */
function CollapsibleStrip({
  title,
  description,
  count,
  countClassName,
  chevronClassName
}: {
  title: string;
  description: string;
  count: string;
  countClassName: string;
  chevronClassName: string;
}) {
  return (
    <div className="flex min-w-0 items-center justify-between gap-4 px-5 py-4">
      <div className="grid min-w-0 gap-0.5">
        <h2 className="font-display text-lg">{title}</h2>
        <p className="text-xs text-muted [text-wrap:pretty]">{description}</p>
      </div>
      <span className="flex shrink-0 items-center gap-2.5">
        <span className={`rounded-md px-2 py-0.5 text-[11px] font-bold ${countClassName}`}>{count}</span>
        <span className={`grid h-7 w-7 place-items-center rounded-lg border bg-panel ${chevronClassName}`}>
          <ChevronDown className="h-3.5 w-3.5" aria-hidden="true" />
        </span>
      </span>
    </div>
  );
}

function BudgetSourcesPanel({ items }: { items: BudgetSourceSummaryItem[] }) {
  if (!items.length) return null;

  const total = items.reduce((sum, item) => sum + item.count, 0);

  return (
    <div data-testid="budget-sources-panel">
      <DashboardPopout
        title="Budget sources"
        eyebrow={`${total} tracked`}
        description="Content counted across budget items, roadmap titles, and content reviews."
        toneClassName="bg-panel-warm text-foreground"
        triggerClassName="w-full bg-panel-warm p-0"
        showExpandIcon={false}
        trigger={
          <CollapsibleStrip
            title="Budget sources"
            description="Content counted across budget items, roadmap titles, and content reviews."
            count={`${total} tracked`}
            countClassName="bg-tone-slate-bg text-muted"
            chevronClassName="border-hairline text-muted"
          />
        }
      >
        <div className="grid gap-3 md:grid-cols-4">
          {items.map((item) => (
            <div key={item.source} className="rounded-lg border border-hairline bg-panel-warm p-4">
              <p className="font-display text-2xl text-foreground">{item.count}</p>
              <p className="text-xs font-semibold text-muted">{item.label}</p>
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
        title="Needs attention"
        eyebrow={`${items.length} open`}
        description="Items that are blocked, undated, approved, released, or close to budget limits."
        toneClassName="bg-danger-soft text-danger"
        triggerClassName="w-full border-danger-border bg-danger-soft p-0"
        showExpandIcon={false}
        trigger={
          <CollapsibleStrip
            title="Needs attention"
            description="Items that are blocked, undated, approved, released, or close to budget limits."
            count={`${items.length} open`}
            countClassName="bg-danger-soft text-danger"
            chevronClassName="border-danger-border text-danger"
          />
        }
      >
        {items.length ? (
          <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
            {items.map((item) => (
              <div key={item.id} className={`grid gap-3 rounded-lg border p-4 ${attentionToneClasses[item.tone]}`}>
                <Link href={isDemo ? (`/demo${item.href}` as Route) : item.href} aria-label={`Open ${item.title}`} className="transition-colors">
                  <p className="text-sm font-semibold">{item.title}</p>
                  <p className="mt-1 text-xs font-medium opacity-80">{item.detail}</p>
                </Link>
                <form action={dismissNeedsAttentionItem}>
                  <input type="hidden" name="fiscalYearId" value={fiscalYearId} />
                  <input type="hidden" name="attentionKey" value={item.id} />
                  <button
                    type="submit"
                    aria-label={`Mark ${item.title} complete`}
                    disabled={isDemo}
                    className="min-h-9 rounded-lg border border-hairline bg-panel px-3 py-2 text-xs font-semibold text-foreground transition-colors hover:border-hairline-strong disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    Mark complete
                  </button>
                </form>
              </div>
            ))}
          </div>
        ) : (
          <p className="rounded-lg border border-hairline bg-panel-warm px-4 py-3 text-sm font-medium text-muted">Nothing needs attention right now.</p>
        )}
      </DashboardPopout>
    </div>
  );
}
