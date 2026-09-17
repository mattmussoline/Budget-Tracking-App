"use client";

import { Plus, Trash2, X } from "lucide-react";
import { useState } from "react";
import { SoftButton } from "@/components/ui/soft-button";
import { SoftInput } from "@/components/ui/soft-input";
import { SoftSelect } from "@/components/ui/soft-select";
import { cn } from "@/components/ui/soft-surface";
import { PlanningShell } from "@/features/planning/components/planning-shell";
import { TopBarDivider } from "@/features/planning/components/app-top-bar";
import { formatCurrency, formatCurrencyWholeDollars } from "@/lib/currency";
import { monthNames } from "@/lib/months";
import { logout } from "../auth-actions";
import { deleteContentLicense, dismissAttentionItem, updateContentLicense, updateProviderColor } from "../budget-actions";
import { budgetSourceOptions, getBudgetSourceColor } from "../budget-source";
import type { ContentLicense } from "../budget-types";
import { getProviderColorMap, providerColorOptions, type ProviderColorOverrides } from "../provider-colors";
import { outlierAttentionKey, zeroRateAttentionKey, type LicensingSummaryView } from "../summary-model";
import { AddContentModal, FiscalYearModal, InviteModal, type FiscalYearRow } from "./summary-modals";

type Selection = { kind: "quarter" | "month"; value: number };

type AttentionFilter = { id: string; label: string; licenseIds: string[] };

type LicensingSummaryProps = {
  fiscalYear: FiscalYearRow;
  fiscalYears: FiscalYearRow[];
  view: LicensingSummaryView;
  licenses: ContentLicense[];
  providerColorOverrides: ProviderColorOverrides;
  mode: "demo" | "live";
  userEmail?: string;
  allowedEmails: string[];
};

const cadenceOptions = [
  { label: "Quarterly", value: "quarterly" },
  { label: "Yearly", value: "yearly" }
];

const eyebrowClass = "text-[10.5px] font-semibold uppercase tracking-[0.08em] text-faint";
const panelClass = "min-w-0 rounded-soft border border-hairline bg-panel-warm";
/* Below sm the six columns stack into three pairs rather than crushing to 40px each. */
const rowGridClass =
  "grid grid-cols-[minmax(0,1fr)_auto] items-center gap-x-3 gap-y-1 sm:grid-cols-[minmax(0,2.1fr)_minmax(0,1.4fr)_110px_90px_70px_60px]";
const detailRowGridClass =
  "grid grid-cols-[minmax(0,1fr)_auto] items-center gap-x-3 gap-y-1 sm:grid-cols-[minmax(0,2fr)_minmax(0,1.3fr)_minmax(0,140px)_110px_60px]";

export function LicensingSummary({
  fiscalYear,
  fiscalYears,
  view,
  licenses,
  providerColorOverrides,
  mode,
  userEmail,
  allowedEmails
}: LicensingSummaryProps) {
  const isDemo = mode === "demo";
  const routePrefix = isDemo ? "/demo" : "";
  const [selection, setSelection] = useState<Selection>({ kind: "quarter", value: view.quarters.find((q) => q.isCurrent)?.quarter ?? 1 });
  const [search, setSearch] = useState("");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [modal, setModal] = useState<"add" | "fy" | "invite" | null>(null);
  /* Set by the "Needs attention" rail: pins the table to just the rows that item is about. */
  const [attentionFilter, setAttentionFilter] = useState<AttentionFilter | null>(null);

  const providerOptions = Array.from(new Set(licenses.map((license) => license.provider).filter(Boolean))).sort((a, b) =>
    a.localeCompare(b)
  );
  /* Which rows are currently flagged, so their editor can offer a matching confirm action. */
  const zeroRateFlaggedIds = new Set(view.attention.find((item) => item.id === "zero-rate")?.licenseIds ?? []);
  const outlierFlaggedIds = new Set(view.attention.find((item) => item.id.startsWith("outlier-"))?.licenseIds ?? []);
  const providerColorMap = getProviderColorMap(providerOptions, providerColorOverrides);
  const monthOptions = view.months.map((month) => ({ label: month.label, value: String(month.index) }));
  const monthLabelByIndex = new Map(view.months.map((month) => [month.index, month.shortLabel]));
  const cadenceByLicenseId = new Map(licenses.map((license) => [license.id, license.cadence]));

  const selectedMonths =
    selection.kind === "month"
      ? view.months.filter((month) => month.index === selection.value)
      : view.months.filter((month) => month.quarter === selection.value);
  const detailPayments = selectedMonths.flatMap((month) =>
    month.payments.map((payment) => ({
      key: `${payment.licenseId}-${payment.fiscalMonth}`,
      payment,
      monthAndNote: `${month.label}${paymentNote(payment.isProrated, payment.isFirstPayment, cadenceByLicenseId.get(payment.licenseId) === "quarterly")}`
    }))
  );
  const detailTotalCents = selectedMonths.reduce((total, month) => total + month.totalCents, 0);
  const detailTitle = selection.kind === "month" ? selectedMonths[0].label : `Quarter ${selection.value}`;
  const detailSubline = `${detailPayments.length} ${detailPayments.length === 1 ? "payment" : "payments"}${
    selection.kind === "quarter" ? ` across ${selectedMonths.map((month) => month.shortLabel).join(", ")}` : ""
  }`;

  const normalizedSearch = search.trim().toLowerCase();
  const attentionIds = attentionFilter ? new Set(attentionFilter.licenseIds) : null;
  const visibleLicenses = licenses.filter(
    (license) =>
      (!attentionIds || attentionIds.has(license.id)) &&
      (!normalizedSearch ||
        license.title.toLowerCase().includes(normalizedSearch) ||
        license.provider.toLowerCase().includes(normalizedSearch))
  );

  function scrollToRow(licenseId: string) {
    window.setTimeout(() => {
      document.getElementById(`license-row-${licenseId}`)?.scrollIntoView({ behavior: "smooth", block: "center" });
    }, 60);
  }

  function jumpToEditor(licenseId: string) {
    setEditingId(licenseId);
    setSearch("");
    setAttentionFilter(null);
    scrollToRow(licenseId);
  }

  /**
   * An attention item is only useful if you can act on it, so clicking one narrows
   * the table to the rows it names and opens the first for editing.
   */
  function openAttentionItem(item: LicensingSummaryView["attention"][number]) {
    const [firstId] = item.licenseIds;
    if (!firstId) return;
    setSearch("");
    setAttentionFilter({ id: item.id, label: item.actionLabel, licenseIds: item.licenseIds });
    setEditingId(firstId);
    scrollToRow(firstId);
  }

  return (
    <PlanningShell
      activeSection="dashboard"
      routePrefix={routePrefix}
      fullBleed
      topBarRight={
        <>
          <nav className="flex flex-wrap items-center gap-1" aria-label="Fiscal year budgets">
            {fiscalYears.map((year) => (
              <a
                key={year.id}
                href={`${routePrefix}/dashboard?fy=${year.id}`}
                aria-current={year.id === fiscalYear.id ? "page" : undefined}
                className={cn(
                  "inline-flex min-h-9 items-center rounded-lg border px-3 py-1.5 text-[13px] font-semibold transition-colors",
                  year.id === fiscalYear.id
                    ? "border-formed-blue bg-formed-blue-soft text-formed-blue"
                    : "border-hairline bg-panel text-foreground hover:border-hairline-strong"
                )}
              >
                FY{String(year.fiscal_year).slice(-2)}
              </a>
            ))}
            <button
              type="button"
              onClick={() => setModal("fy")}
              className="inline-flex min-h-9 items-center rounded-lg border border-hairline bg-panel px-3 py-1.5 text-xs font-semibold text-foreground transition-colors hover:border-hairline-strong"
            >
              + Add fiscal year
            </button>
          </nav>
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
      <div className="mx-auto flex max-w-[1600px] flex-wrap items-start">
        {/* Left rail: the three things you check before deciding anything. */}
        <aside className="grid w-full content-start gap-6 border-b border-hairline bg-panel-warm px-5 py-7 lg:sticky lg:top-[62px] lg:max-h-[calc(100vh-62px)] lg:w-[280px] lg:flex-[0_0_280px] lg:self-stretch lg:overflow-y-auto lg:border-b-0 lg:border-r lg:px-6">
          <section className="grid gap-2.5">
            <span className={eyebrowClass}>Fiscal year health</span>
            <span className="font-display text-2xl" style={{ color: view.health.color }}>
              {view.health.label}
            </span>
            <div className="h-[5px] overflow-hidden bg-tone-slate-bg">
              <div className="h-full" style={{ width: `${view.committedPercent}%`, background: view.health.color }} />
            </div>
            <span className="text-xs text-muted">{view.percentUsed}% used</span>
          </section>

          <section className="grid gap-2.5 border-t border-hairline pt-5">
            <div className="flex min-w-0 items-baseline justify-between gap-2">
              <span className={eyebrowClass}>Needs attention</span>
              <span className="shrink-0 text-[11px] font-bold text-danger">{view.attention.length} open</span>
            </div>
            {view.attention.length === 0 ? (
              <span className="text-xs text-faint">Nothing needs attention right now.</span>
            ) : (
              <div className="grid min-w-0 gap-2">
                {view.attention.map((item) => (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => openAttentionItem(item)}
                    aria-pressed={attentionFilter?.id === item.id}
                    className={cn(
                      "grid min-w-0 gap-0.5 border-l-[3px] py-1 pl-2.5 pr-1.5 text-left transition-colors hover:bg-tone-slate-bg",
                      attentionFilter?.id === item.id && "bg-tone-slate-bg"
                    )}
                    style={{ borderLeftColor: item.color }}
                  >
                    <span className="text-[12.5px] font-semibold [text-wrap:pretty]">{item.title}</span>
                    <span className="text-[11.5px] text-muted [text-wrap:pretty]">{item.detail}</span>
                    <span className="text-[11px] font-semibold text-formed-blue">
                      {item.licenseIds.length === 1 ? "Fix this title →" : `Review ${item.licenseIds.length} titles →`}
                    </span>
                  </button>
                ))}
              </div>
            )}
          </section>

          <section className="grid gap-2.5 border-t border-hairline pt-5">
            <div className="flex min-w-0 items-baseline justify-between gap-2">
              <span className={eyebrowClass}>Budget lines</span>
              <span className="shrink-0 text-[11px] font-bold text-muted">{view.titleCount} titles</span>
            </div>
            <div className="grid min-w-0 gap-2.5">
              {view.budgetLines.map((line) => (
                <div key={line.source} className="grid min-w-0 gap-1">
                  <div className="flex min-w-0 items-baseline justify-between gap-2">
                    <span className="min-w-0 truncate text-[12.5px]">{line.label}</span>
                    <span className="shrink-0 text-[12.5px] font-bold text-muted">
                      {formatCurrencyWholeDollars(line.amountCents)}
                    </span>
                  </div>
                  <div className="h-[3px] bg-tone-slate-bg">
                    <div className="h-full" style={{ width: `${line.barPercent}%`, background: line.color }} />
                  </div>
                </div>
              ))}
            </div>
          </section>

          <section className="grid content-start gap-2.5 border-t border-hairline pt-5">
            <SoftButton variant="primary" className="w-full justify-center rounded-none" onClick={() => setModal("add")}>
              <Plus className="h-4 w-4" aria-hidden="true" />
              Add content
            </SoftButton>
            <SoftButton variant="secondary" className="w-full justify-center rounded-none" onClick={() => setModal("fy")}>
              Add or edit fiscal year
            </SoftButton>
            <SoftButton variant="secondary" className="w-full justify-center rounded-none" onClick={() => setModal("invite")}>
              Invite a teammate
            </SoftButton>
          </section>
        </aside>

        <main className="grid min-w-0 flex-[1_1_640px] gap-9 px-5 pb-16 pt-8 md:px-8 lg:px-10">
          <div className="flex flex-wrap items-end justify-between gap-6">
            <div className="grid min-w-0 max-w-2xl gap-1.5">
              <h1 className="font-display text-[40px] leading-[1.05]">{fiscalYear.label}</h1>
              <p className="text-sm text-muted [text-wrap:pretty]">{view.statLine}</p>
            </div>
            <span className="inline-flex min-h-[30px] shrink-0 items-center rounded-lg bg-formed-blue-soft px-3 py-1.5 text-[13px] font-semibold text-formed-blue">
              {formatFiscalYearRange(fiscalYear.fiscal_year, fiscalYear.fiscal_year_start_month)}
            </span>
          </div>

          <section className={cn(panelClass, "grid gap-2 px-4 py-3.5")}>
            <div className="flex min-w-0 flex-wrap items-baseline justify-between gap-3">
              <span className="flex min-w-0 flex-wrap items-baseline gap-2">
                <span className={eyebrowClass}>Misc licensing budget</span>
                <span className="font-display text-[22px] leading-none" style={{ color: view.health.color }}>
                  {formatCurrencyWholeDollars(view.remainingCents)}{" "}
                  <span className="font-body text-xs font-semibold text-muted">
                    left of {formatCurrencyWholeDollars(view.budgetCents)}
                  </span>
                </span>
              </span>
              <span className="shrink-0 text-xs text-muted">
                {formatCurrencyWholeDollars(view.committedCents)} committed · {view.percentUsed}% used
              </span>
            </div>
            <div className="flex h-1.5 min-w-0 overflow-hidden bg-tone-slate-bg">
              <div style={{ width: `${view.committedPercent}%`, background: view.health.color }} />
            </div>
            <p className="text-[11.5px] text-faint [text-wrap:pretty]">
              {formatCurrencyWholeDollars(view.otherBudgetCents)} more is tracked here but paid from other budget lines — it
              does not count against this budget.
            </p>
          </section>

          <section className="grid min-w-0 gap-3.5">
            <div className="flex min-w-0 flex-wrap items-baseline justify-between gap-3">
              <h2 className="font-display text-2xl">When the money goes out</h2>
              <div className="flex shrink-0 items-center gap-3.5 text-[11.5px] text-muted">
                <span className="flex items-center gap-1.5">
                  <span className="h-2.5 w-2.5" style={{ background: "var(--deep-teal)" }} />
                  This budget
                </span>
                <span className="flex items-center gap-1.5">
                  <span className="h-2.5 w-2.5" style={{ background: "var(--tone-slate-line)" }} />
                  Other budget lines
                </span>
              </div>
            </div>

            <div className={cn(panelClass, "grid gap-3 px-5 pb-4 pt-5")}>
              <div className="grid min-w-0 grid-cols-2 gap-3 md:grid-cols-4">
                {view.quarters.map((quarter) => {
                  const isSelected = selection.kind === "quarter" && selection.value === quarter.quarter;

                  return (
                    <button
                      key={quarter.quarter}
                      type="button"
                      data-testid={`quarter-${quarter.quarter}`}
                      aria-pressed={isSelected}
                      onClick={() => setSelection({ kind: "quarter", value: quarter.quarter })}
                      className={cn(
                        "grid min-w-0 justify-items-start gap-1.5 border px-3 py-2.5 text-left transition-colors",
                        isSelected ? "border-deep-teal bg-deep-teal-soft" : "border-hairline bg-panel hover:border-hairline-strong"
                      )}
                    >
                      <span className="flex w-full min-w-0 items-baseline justify-between gap-2">
                        <span className="text-[13px] font-bold">{quarter.label}</span>
                        <span className="shrink-0 text-[11.5px] text-faint">{quarter.rangeLabel}</span>
                      </span>
                      <span className="font-display text-[26px] leading-none">
                        {formatCurrencyWholeDollars(quarter.totalCents)}
                      </span>
                    </button>
                  );
                })}
              </div>

              <div className="grid h-[108px] min-w-0 grid-cols-12 items-end gap-1">
                {view.months.map((month) => {
                  const isSelected = selection.kind === "month" && selection.value === month.index;
                  const isInSelectedQuarter = selection.kind === "quarter" && selection.value === month.quarter;

                  return (
                    <button
                      key={month.index}
                      type="button"
                      aria-label={`${month.label}: ${formatCurrency(month.totalCents)}`}
                      aria-pressed={isSelected}
                      onClick={() => setSelection({ kind: "month", value: month.index })}
                      className={cn(
                        "flex h-full min-w-0 flex-col items-center justify-end gap-1.5 border-b-2 px-0.5 py-1 transition-colors",
                        isSelected ? "bg-deep-teal-soft" : "hover:bg-panel-warm",
                        month.isCurrent ? "border-b-deep-teal" : "border-b-transparent"
                      )}
                    >
                      <span className="flex h-[78px] w-full min-w-0 flex-col justify-end">
                        <span
                          className="block w-full"
                          style={{ height: barHeight(month.otherCents, view.maxMonthCents), background: "var(--tone-slate-line)" }}
                        />
                        <span
                          className="block w-full"
                          style={{ height: barHeight(month.miscCents, view.maxMonthCents), background: "var(--deep-teal)" }}
                        />
                      </span>
                      <span
                        className={cn(
                          "text-[10.5px] font-semibold",
                          month.isCurrent ? "text-deep-teal" : isSelected || isInSelectedQuarter ? "text-foreground" : "text-faint"
                        )}
                      >
                        {month.shortLabel}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>

            <div data-testid="period-payments" className="min-w-0 rounded-soft border border-hairline bg-panel">
              <div className="flex min-w-0 flex-wrap items-baseline justify-between gap-3 border-b border-hairline bg-panel-warm px-4 py-3.5">
                <div className="flex min-w-0 items-baseline gap-2.5">
                  <h3 className="font-display text-[19px]">{detailTitle}</h3>
                  <span className="text-xs text-faint">{detailSubline}</span>
                </div>
                <span className="shrink-0 font-display text-[19px]">{formatCurrency(detailTotalCents)}</span>
              </div>
              {detailPayments.length === 0 ? (
                <p className="p-4 text-[13px] text-faint">No payments scheduled in this period.</p>
              ) : (
                detailPayments.map(({ key, payment, monthAndNote }) => (
                  <div
                    key={key}
                    className={cn(detailRowGridClass, "min-w-0 border-b border-hairline px-4 py-2.5 last:border-b-0")}
                  >
                    <span className="flex min-w-0 items-center gap-2">
                      <span
                        className="h-4 w-[3px] shrink-0"
                        style={{ background: getBudgetSourceColor(payment.budgetSource) }}
                      />
                      <span className="min-w-0 truncate text-[13.5px] font-semibold">{payment.title}</span>
                    </span>
                    <span className="min-w-0 truncate text-[12.5px] text-muted">{payment.provider}</span>
                    <span className="min-w-0 truncate text-[11.5px] text-faint">{monthAndNote}</span>
                    <span className="whitespace-nowrap text-right text-[13.5px] font-semibold">
                      {formatCurrency(payment.amountCents)}
                    </span>
                    <span className="flex justify-end">
                      <button
                        type="button"
                        onClick={() => jumpToEditor(payment.licenseId)}
                        className="text-[11.5px] font-semibold text-formed-blue hover:underline"
                      >
                        Edit
                        <span className="sr-only"> {payment.title}</span>
                      </button>
                    </span>
                  </div>
                ))
              )}
            </div>
          </section>

          <section className="grid min-w-0 gap-5 lg:grid-cols-2">
            <div className="grid min-w-0 content-start gap-3">
              <div className="grid gap-0.5">
                <h2 className="font-display text-[22px]">Where the money goes</h2>
                <p className="text-[12.5px] text-muted">Providers ranked by committed spend this fiscal year.</p>
              </div>
              <div className={cn(panelClass, "grid gap-3 px-5 py-4")}>
                {view.providers.map((provider) => (
                  <div key={provider.provider} className="grid min-w-0 gap-1.5">
                    <div className="flex min-w-0 items-baseline justify-between gap-2.5">
                      <span className="min-w-0 truncate text-[13px]">{provider.provider}</span>
                      <span className="shrink-0 whitespace-nowrap text-[13px] font-semibold">
                        {formatCurrencyWholeDollars(provider.amountCents)}
                      </span>
                    </div>
                    <div className="h-[3px] min-w-0 bg-tone-slate-bg">
                      <div
                        className="h-full"
                        style={{
                          width: `${provider.barPercent}%`,
                          background: providerColorMap[provider.provider]?.hex ?? "var(--deep-teal)"
                        }}
                      />
                    </div>
                  </div>
                ))}
                <p className="text-[11.5px] text-faint">{view.providerTailLine}</p>
                <ProviderColorPicker
                  fiscalYearId={fiscalYear.id}
                  providers={providerOptions}
                  providerColorMap={providerColorMap}
                  providerColorOverrides={providerColorOverrides}
                  isDemo={isDemo}
                />
              </div>
            </div>

            <div className="grid min-w-0 content-start gap-3">
              <div className="grid gap-0.5">
                <h2 className="font-display text-[22px]">Payment rhythm</h2>
                <p className="text-[12.5px] text-muted">How the year splits between recurring and one-time deals.</p>
              </div>
              <div className={cn(panelClass, "grid gap-3.5 px-5 py-4")}>
                {view.cadence.map((row) => (
                  <div key={row.label} className="grid min-w-0 gap-1.5">
                    <div className="flex min-w-0 items-baseline justify-between gap-2.5">
                      <span className="text-[13px] font-semibold">{row.label}</span>
                      <span className="shrink-0 whitespace-nowrap font-display text-xl">
                        {formatCurrencyWholeDollars(row.amountCents)}
                      </span>
                    </div>
                    <div className="h-[3px] min-w-0 bg-tone-slate-bg">
                      <div className="h-full" style={{ width: `${row.barPercent}%`, background: row.color }} />
                    </div>
                    <span className="text-[11.5px] text-faint">{row.detail}</span>
                  </div>
                ))}
                <div className="flex min-w-0 items-baseline justify-between gap-2.5 border-t border-hairline pt-3">
                  <span className="text-[12.5px] text-muted">Prorated first payments</span>
                  <span className="shrink-0 text-[12.5px] font-bold text-guild-gold-ink">{view.proratedLine}</span>
                </div>
              </div>
            </div>
          </section>

          <section className="grid min-w-0 gap-3.5" id="edit-content-section">
            <div className="flex min-w-0 flex-wrap items-center justify-between gap-3">
              <div className="grid min-w-0 gap-0.5">
                <h2 className="font-display text-2xl">All titles</h2>
                <p className="text-[13px] text-muted [text-wrap:pretty]">
                  Click a title to adjust its provider, amount, cadence, month, or budget line.
                </p>
                {attentionFilter ? (
                  <button
                    type="button"
                    onClick={() => setAttentionFilter(null)}
                    className="mt-1 inline-flex min-w-0 items-center gap-1.5 self-start rounded-lg border border-formed-blue bg-formed-blue-soft px-2.5 py-1 text-[12px] font-semibold text-formed-blue transition-colors hover:border-hairline-strong"
                  >
                    <span className="min-w-0 truncate">Needs attention: {attentionFilter.label}</span>
                    <X className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />
                    <span className="sr-only">Clear filter</span>
                  </button>
                ) : null}
              </div>
              <label className="min-w-[240px]">
                <span className="sr-only">Search titles or providers</span>
                <input
                  type="search"
                  value={search}
                  onChange={(event) => setSearch(event.target.value)}
                  placeholder="Search titles or providers"
                  className="min-h-9 w-full rounded-lg border border-hairline bg-panel px-3 text-[13px] text-foreground transition-colors placeholder:text-faint hover:border-hairline-strong focus:border-formed-blue"
                />
              </label>
            </div>

            <div data-testid="all-titles" className="min-w-0 rounded-soft border border-hairline bg-panel">
              <div
                className={cn(
                  rowGridClass,
                  "hidden border-b border-hairline bg-panel-warm px-4 py-2.5 text-[10.5px] font-semibold uppercase tracking-[0.04em] text-faint sm:grid"
                )}
              >
                <span>Title</span>
                <span>Provider</span>
                <span className="text-right">Installment</span>
                <span>Cadence</span>
                <span>Added</span>
                <span className="sr-only">Edit</span>
              </div>
              <datalist id="license-provider-options">
                {providerOptions.map((provider) => (
                  <option key={provider} value={provider} />
                ))}
              </datalist>
              {visibleLicenses.length === 0 ? (
                <p className="px-4 py-5 text-[13px] text-faint">No content matches your search.</p>
              ) : (
                visibleLicenses.map((license) => {
                  const isEditing = editingId === license.id;

                  return (
                    <div key={license.id} id={`license-row-${license.id}`} className="min-w-0 border-b border-hairline last:border-b-0">
                      <button
                        type="button"
                        onClick={() => setEditingId(isEditing ? null : license.id)}
                        style={{ borderLeftColor: getBudgetSourceColor(license.budgetSource) }}
                        className={cn(
                          rowGridClass,
                          "w-full border-l-[3px] px-4 py-3 text-left transition-colors hover:bg-panel-warm",
                          isEditing && "bg-panel-warm"
                        )}
                      >
                        <span className="min-w-0 truncate text-[13.5px] font-semibold">{license.title}</span>
                        <span className="min-w-0 truncate text-[13px] text-muted">{license.provider}</span>
                        <span className="whitespace-nowrap text-right text-[13px]">
                          {formatCurrency(license.installmentCents)}
                        </span>
                        <span className="text-[12.5px] capitalize text-muted">{license.cadence}</span>
                        <span className="text-[12.5px] text-muted">{monthLabelByIndex.get(license.addedFiscalMonth) ?? "—"}</span>
                        <span className="text-xs font-semibold text-formed-blue">{isEditing ? "Close" : "Edit"}</span>
                      </button>

                      {isEditing ? (
                        <div className="border-t border-hairline bg-panel-warm p-4">
                          <form action={updateContentLicense} className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
                            <input type="hidden" name="fiscalYearId" value={fiscalYear.id} />
                            <input type="hidden" name="licenseId" value={license.id} />
                            <SoftInput label="Title" name="title" defaultValue={license.title} required disabled={isDemo} surface="white" className="min-h-9 text-sm" />
                            <SoftInput
                              label="Provider"
                              name="provider"
                              list="license-provider-options"
                              defaultValue={license.provider}
                              required
                              disabled={isDemo}
                              surface="white"
                              className="min-h-9 text-sm"
                            />
                            <SoftInput
                              label="Amount"
                              name="installment"
                              defaultValue={String(license.installmentCents / 100)}
                              inputMode="decimal"
                              required
                              disabled={isDemo}
                              surface="white"
                              className="min-h-9 text-sm"
                            />
                            <SoftSelect
                              label="Cadence"
                              name="cadence"
                              defaultValue={license.cadence}
                              options={cadenceOptions}
                              disabled={isDemo}
                              surface="white"
                              className="min-h-9 text-sm"
                            />
                            <SoftSelect
                              label="Added month"
                              name="addedFiscalMonth"
                              defaultValue={String(license.addedFiscalMonth)}
                              options={monthOptions}
                              disabled={isDemo}
                              surface="white"
                              className="min-h-9 text-sm"
                            />
                            <SoftSelect
                              label="Budget line"
                              name="budgetSource"
                              defaultValue={license.budgetSource ?? "misc_licensing"}
                              options={[...budgetSourceOptions]}
                              disabled={isDemo}
                              surface="white"
                              className="min-h-9 text-sm"
                            />
                            <SoftInput
                              label="Runtime (minutes)"
                              name="minutes"
                              defaultValue={license.minutes ? String(license.minutes) : ""}
                              inputMode="numeric"
                              required
                              disabled={isDemo}
                              surface="white"
                              className="min-h-9 text-sm"
                            />
                            <div className="min-w-0 sm:col-span-2 xl:col-span-3">
                              <SoftInput
                                label="Notes"
                                name="notes"
                                defaultValue={license.notes ?? ""}
                                disabled={isDemo}
                                surface="white"
                                className="min-h-9 text-sm"
                              />
                            </div>
                            {zeroRateFlaggedIds.has(license.id) || outlierFlaggedIds.has(license.id) ? (
                              <div className="flex flex-wrap items-center gap-2 sm:col-span-2 xl:col-span-3">
                                {zeroRateFlaggedIds.has(license.id) ? (
                                  <SoftButton
                                    form={`confirm-zero-rate-${license.id}`}
                                    type="submit"
                                    variant="secondary"
                                    className="min-h-9 px-3 py-2 text-xs"
                                    disabled={isDemo}
                                  >
                                    Confirm $0 rate is correct
                                  </SoftButton>
                                ) : null}
                                {outlierFlaggedIds.has(license.id) ? (
                                  <SoftButton
                                    form={`verify-outlier-${license.id}`}
                                    type="submit"
                                    variant="secondary"
                                    className="min-h-9 px-3 py-2 text-xs"
                                    disabled={isDemo}
                                  >
                                    Verified, this amount is correct
                                  </SoftButton>
                                ) : null}
                              </div>
                            ) : null}
                            <div className="flex items-end justify-end gap-2 sm:col-span-2 xl:col-span-3">
                              <SoftButton
                                form={`delete-license-${license.id}`}
                                type="submit"
                                variant="danger"
                                className="min-h-9 px-3 py-2 text-xs"
                                disabled={isDemo}
                                onClick={(event) => {
                                  if (!window.confirm(`Delete ${license.title}? This cannot be undone.`)) {
                                    event.preventDefault();
                                  }
                                }}
                              >
                                <Trash2 className="h-4 w-4" aria-hidden="true" />
                                Delete
                              </SoftButton>
                              <SoftButton type="submit" variant="primary" className="min-h-9 px-3.5 py-2 text-xs" disabled={isDemo}>
                                Save
                              </SoftButton>
                            </div>
                          </form>
                          <form id={`delete-license-${license.id}`} action={deleteContentLicense}>
                            <input type="hidden" name="licenseId" value={license.id} />
                          </form>
                          {zeroRateFlaggedIds.has(license.id) ? (
                            <form id={`confirm-zero-rate-${license.id}`} action={dismissAttentionItem}>
                              <input type="hidden" name="fiscalYearId" value={fiscalYear.id} />
                              <input type="hidden" name="attentionKey" value={zeroRateAttentionKey(license.id)} />
                            </form>
                          ) : null}
                          {outlierFlaggedIds.has(license.id) ? (
                            <form id={`verify-outlier-${license.id}`} action={dismissAttentionItem}>
                              <input type="hidden" name="fiscalYearId" value={fiscalYear.id} />
                              <input
                                type="hidden"
                                name="attentionKey"
                                value={outlierAttentionKey(license.id, license.installmentCents)}
                              />
                            </form>
                          ) : null}
                        </div>
                      ) : null}
                    </div>
                  );
                })
              )}
            </div>
          </section>
        </main>
      </div>

      {modal === "add" ? (
        <AddContentModal
          fiscalYear={fiscalYear}
          fiscalYears={fiscalYears}
          monthOptions={monthOptions}
          providerOptions={providerOptions}
          isDemo={isDemo}
          onClose={() => setModal(null)}
        />
      ) : null}
      {modal === "fy" ? (
        <FiscalYearModal
          fiscalYear={fiscalYear}
          fiscalYears={fiscalYears}
          routePrefix={routePrefix}
          isDemo={isDemo}
          onClose={() => setModal(null)}
        />
      ) : null}
      {modal === "invite" ? (
        <InviteModal
          allowedEmails={allowedEmails}
          currentUserEmail={userEmail}
          isDemo={isDemo}
          onClose={() => setModal(null)}
        />
      ) : null}
    </PlanningShell>
  );
}

/**
 * The pie chart carried the provider colour picker; without it the overrides
 * would still be stored and rendered but no longer editable, so the picker
 * moves here, folded away under the ranking it colours.
 */
function ProviderColorPicker({
  fiscalYearId,
  providers,
  providerColorMap,
  providerColorOverrides,
  isDemo
}: {
  fiscalYearId: string;
  providers: string[];
  providerColorMap: ReturnType<typeof getProviderColorMap>;
  providerColorOverrides: ProviderColorOverrides;
  isDemo?: boolean;
}) {
  if (providers.length === 0) return null;

  return (
    <details className="group border-t border-hairline pt-3">
      <summary className="cursor-pointer list-none text-[11.5px] font-semibold text-muted marker:hidden [&::-webkit-details-marker]:hidden">
        Provider colors
      </summary>
      <div className="mt-3 grid gap-2">
        {providers.map((provider) => {
          const color = providerColorMap[provider];

          return (
            <form key={provider} action={updateProviderColor} className="flex min-w-0 items-center gap-2">
              <input type="hidden" name="fiscalYearId" value={fiscalYearId} />
              <input type="hidden" name="provider" value={provider} />
              <span className="h-2.5 w-2.5 shrink-0" style={{ background: color.hex }} aria-hidden="true" />
              <span className="min-w-0 flex-1 truncate text-xs">{provider}</span>
              <label className="sr-only" htmlFor={`provider-color-${slug(provider)}`}>
                Color for {provider}
              </label>
              <select
                id={`provider-color-${slug(provider)}`}
                name="colorKey"
                defaultValue={providerColorOverrides[provider] ?? color.key}
                disabled={isDemo}
                className="min-h-8 shrink-0 rounded-lg border border-hairline bg-panel px-2 text-xs text-foreground disabled:opacity-60"
              >
                {providerColorOptions.map((option) => (
                  <option key={option.key} value={option.key}>
                    {option.label}
                  </option>
                ))}
              </select>
              <SoftButton type="submit" variant="secondary" className="min-h-8 shrink-0 px-2.5 py-1 text-[11px]" disabled={isDemo}>
                Save
              </SoftButton>
            </form>
          );
        })}
      </div>
    </details>
  );
}

function slug(value: string) {
  return value.toLowerCase().replace(/[^a-z0-9]+/g, "-");
}

/** Bars keep a 3px stub so a small month still reads as "something happened". */
function barHeight(cents: number, maxCents: number) {
  if (cents <= 0) return 0;
  return Math.max(3, Math.round((cents / maxCents) * 78));
}

function paymentNote(isProrated: boolean, isFirstPayment: boolean, isQuarterly: boolean) {
  if (isProrated) return " · prorated first payment";
  if (isFirstPayment && isQuarterly) return " · first of 4";
  if (!isFirstPayment) return " · recurring";
  return "";
}

/** "July 2026 – June 2027" for the fiscal calendar the budget actually runs on. */
export function formatFiscalYearRange(fiscalYear: number, fiscalYearStartMonth: number) {
  const startName = monthNames[fiscalYearStartMonth - 1];
  const endName = monthNames[(fiscalYearStartMonth + 10) % 12];
  const startYear = fiscalYearStartMonth === 1 ? fiscalYear : fiscalYear - 1;

  return `${startName} ${startYear} – ${endName} ${fiscalYear}`;
}
