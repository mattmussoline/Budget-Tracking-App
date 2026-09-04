"use client";

import { useState } from "react";
import { ChevronDown, Minus, Pencil, Plus } from "lucide-react";
import { formatCurrency } from "@/lib/currency";
import { cn } from "@/components/ui/soft-surface";
import type { DashboardModel } from "../dashboard-model";
import { getBudgetSourceLabel } from "../budget-source";
import { getProviderColorMap, type ProviderColorOverrides } from "../provider-colors";

type MonthBoardProps = {
  model: DashboardModel;
  providerColorOverrides: ProviderColorOverrides;
};

/**
 * The Sanctuary quarter grid: four flat quarter cards, each showing its
 * committed total against the busiest quarter, that open in place to reveal
 * their months. The current quarter is the only one that carries colour.
 */
export function MonthBoard({ model, providerColorOverrides }: MonthBoardProps) {
  const [expandedPayments, setExpandedPayments] = useState<Record<string, boolean>>({});
  const providerColorMap = getProviderColorMap(
    model.providers.map((provider) => provider.provider),
    providerColorOverrides
  );
  const quarters = [1, 2, 3, 4].map((quarter) => {
    const months = model.months.filter((month) => month.quarter === quarter);

    return {
      quarter,
      isCurrentQuarter: model.currentFiscalQuarter === quarter,
      months,
      totalCents: months.reduce((total, month) => total + month.totalCents, 0),
      rangeLabel: months.length ? `${months[0].label} – ${months[months.length - 1].label}` : ""
    };
  });
  const busiestQuarterCents = Math.max(...quarters.map((quarter) => quarter.totalCents), 1);
  const openLicenseEditor = (licenseId: string) => {
    const manager = document.getElementById("edit-content-manager");
    const licensePanel = document.getElementById(`edit-license-${licenseId}`);

    if (manager instanceof HTMLDetailsElement) {
      manager.open = true;
    }

    if (licensePanel instanceof HTMLDetailsElement) {
      licensePanel.open = true;
      licensePanel.scrollIntoView({ behavior: "smooth", block: "center" });

      const titleInput = licensePanel.querySelector<HTMLInputElement>("input[name='title']");
      titleInput?.focus({ preventScroll: true });
    }
  };
  const togglePayment = (paymentKey: string) => {
    setExpandedPayments((current) => ({
      ...current,
      [paymentKey]: !current[paymentKey]
    }));
  };

  return (
    <div className="grid min-w-0 gap-3.5 md:grid-cols-2">
      {quarters.map((quarter) => {
        const barPercent = Math.round((quarter.totalCents / busiestQuarterCents) * 100);

        return (
          <details
            key={quarter.quarter}
            data-testid={`quarter-${quarter.quarter}`}
            open={quarter.isCurrentQuarter}
            className={cn(
              "group min-w-0 rounded-soft border bg-panel-warm px-5 py-[18px] md:open:col-span-2",
              quarter.isCurrentQuarter ? "border-tone-cyan-line" : "border-hairline"
            )}
          >
            <summary className="grid cursor-pointer list-none gap-3 [&::-webkit-details-marker]:hidden">
              <div className="flex min-w-0 items-start justify-between gap-3">
                <div className="grid min-w-0 gap-1">
                  <h2 className="font-display text-lg">Quarter {quarter.quarter}</h2>
                  <p className="text-xs text-faint">
                    {quarter.rangeLabel}
                    {quarter.isCurrentQuarter ? <span className="ml-2 font-semibold text-deep-teal">Current quarter</span> : null}
                  </p>
                </div>
                <span className="grid h-7 w-7 shrink-0 place-items-center rounded-lg border border-hairline bg-panel text-muted">
                  <Plus aria-hidden="true" className="h-3.5 w-3.5 group-open:hidden" />
                  <Minus aria-hidden="true" className="hidden h-3.5 w-3.5 group-open:block" />
                </span>
              </div>
              <p className={cn("font-display text-3xl leading-none", quarter.isCurrentQuarter && "text-deep-teal")}>
                {formatCurrency(quarter.totalCents)}
              </p>
              <div className="h-1.5 overflow-hidden rounded-full bg-tone-slate-bg">
                <div
                  className={cn("h-full rounded-full", quarter.isCurrentQuarter ? "bg-deep-teal" : "bg-tone-cyan-line")}
                  style={{ width: `${barPercent}%` }}
                />
              </div>
            </summary>
            <div className="mt-4 grid gap-3.5 border-t border-hairline pt-4 md:grid-cols-3">
              {quarter.months.map((month) => {
                const isCurrentMonth = model.currentFiscalMonth === month.index;

                return (
                  <div
                    key={month.index}
                    className={cn(
                      "grid min-w-0 content-start gap-2.5 rounded-lg border p-3.5",
                      isCurrentMonth ? "border-tone-cyan-line bg-deep-teal-soft" : "border-hairline bg-panel"
                    )}
                  >
                    <div className="flex min-w-0 items-baseline justify-between gap-3">
                      <div className="min-w-0">
                        <h3 className="font-display text-base">{month.label}</h3>
                        {isCurrentMonth ? <span className="text-[11px] font-semibold text-deep-teal">Current month</span> : null}
                      </div>
                      <span className="shrink-0 text-xs font-semibold text-muted">{formatCurrency(month.totalCents)}</span>
                    </div>
                    <div className="grid gap-2">
                      {month.payments.length === 0 ? (
                        <p className="text-xs text-faint">No payments</p>
                      ) : (
                        month.payments.map((payment) => {
                          const providerColor = providerColorMap[payment.provider];
                          const budgetSourceLabel = getBudgetSourceLabel(payment.budgetSource);
                          const paymentKey = `${payment.licenseId}-${payment.fiscalMonth}`;
                          const isExpanded = Boolean(expandedPayments[paymentKey]);

                          return (
                            <div key={paymentKey} className="overflow-hidden rounded-lg border border-hairline bg-panel">
                              <button
                                type="button"
                                className="flex w-full items-center justify-between gap-2.5 px-2.5 py-2 text-left transition-colors hover:bg-panel-warm focus:outline-none focus-visible:ring-2 focus-visible:ring-formed-blue"
                                aria-label={`${isExpanded ? "Collapse" : "Expand"} ${payment.title} payment details`}
                                aria-expanded={isExpanded}
                                onClick={() => togglePayment(paymentKey)}
                              >
                                <span className="flex min-w-0 items-center gap-2">
                                  <span className={`h-2.5 w-2.5 shrink-0 rounded-full ${providerColor.marker}`} aria-hidden="true" />
                                  <span className="min-w-0 text-[13px] font-semibold leading-snug">{payment.title}</span>
                                </span>
                                <span className="flex shrink-0 items-center gap-1.5">
                                  <span className="text-[13px] font-semibold">{formatCurrency(payment.amountCents)}</span>
                                  <ChevronDown
                                    aria-hidden="true"
                                    className={cn("h-3.5 w-3.5 text-muted transition-transform", isExpanded && "rotate-180")}
                                  />
                                </span>
                              </button>
                              {isExpanded ? (
                                <div className="grid gap-2 border-t border-hairline px-2.5 pb-2.5 pt-2">
                                  <div className="flex flex-wrap items-center gap-1.5">
                                    {payment.isFirstPayment ? (
                                      <span className="rounded-md bg-tone-slate-bg px-1.5 py-0.5 text-[10px] font-bold text-muted">first</span>
                                    ) : null}
                                    {payment.isProrated ? (
                                      <span className="rounded-md bg-guild-gold-soft px-1.5 py-0.5 text-[10px] font-bold text-guild-gold-ink">prorated</span>
                                    ) : null}
                                  </div>
                                  <p className="text-[11px] text-muted">{payment.provider}</p>
                                  <span className="w-fit rounded-md bg-tone-slate-bg px-1.5 py-0.5 text-[10px] font-bold text-muted">
                                    {budgetSourceLabel}
                                  </span>
                                  <button
                                    type="button"
                                    className="inline-flex w-fit items-center gap-1.5 rounded-lg border border-hairline bg-panel px-2 py-1 text-[11px] font-semibold text-foreground transition-colors hover:border-hairline-strong focus:outline-none focus-visible:ring-2 focus-visible:ring-formed-blue"
                                    aria-label={`Edit ${payment.title}`}
                                    onClick={() => openLicenseEditor(payment.licenseId)}
                                  >
                                    <Pencil aria-hidden="true" className="h-3 w-3" />
                                    Edit
                                  </button>
                                </div>
                              ) : null}
                            </div>
                          );
                        })
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </details>
        );
      })}
    </div>
  );
}
