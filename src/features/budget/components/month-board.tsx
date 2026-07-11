"use client";

import { useState } from "react";
import { ChevronDown, Minus, Pencil, Plus } from "lucide-react";
import { formatCurrency } from "@/lib/currency";
import type { DashboardModel } from "../dashboard-model";
import { getBudgetSourceLabel } from "../budget-source";
import { getProviderColorMap, type ProviderColorOverrides } from "../provider-colors";

type MonthBoardProps = {
  model: DashboardModel;
  providerColorOverrides: ProviderColorOverrides;
};

export function MonthBoard({ model, providerColorOverrides }: MonthBoardProps) {
  const [expandedPayments, setExpandedPayments] = useState<Record<string, boolean>>({});
  const providerColorMap = getProviderColorMap(
    model.providers.map((provider) => provider.provider),
    providerColorOverrides
  );
  const quarterNumbers = [1, 2, 3, 4];
  const orderedQuarterNumbers = model.currentFiscalQuarter
    ? [model.currentFiscalQuarter, ...quarterNumbers.filter((quarter) => quarter !== model.currentFiscalQuarter)]
    : quarterNumbers;
  const quarters = orderedQuarterNumbers.map((quarter) => ({
    quarter,
    isCurrentQuarter: model.currentFiscalQuarter === quarter,
    months: model.months.filter((month) => month.quarter === quarter)
  }));
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
    <div className="grid gap-6">
      {quarters.map((quarter) => (
        <details
          key={quarter.quarter}
          data-testid={`quarter-${quarter.quarter}`}
          open={quarter.isCurrentQuarter}
          className={`group min-w-0 rounded-lg shadow-none soft-raised p-5 md:p-6 ${quarter.isCurrentQuarter ? "bg-amber-50 outline outline-4 outline-amber-300" : "bg-gray-100"}`}
        >
          <summary className="mb-5 flex cursor-pointer list-none items-start justify-between gap-4 [&::-webkit-details-marker]:hidden">
            <div className="min-w-0">
              {quarter.isCurrentQuarter ? (
                <p className="text-xs font-extrabold uppercase tracking-wide text-amber-700">Current quarter</p>
              ) : null}
              <h2 className="font-display text-xl font-extrabold tracking-tight">Quarter {quarter.quarter}</h2>
              <p className="mt-2 w-fit rounded-md bg-white px-3 py-1.5 text-xs font-extrabold text-muted">
                {formatCurrency(quarter.months.reduce((total, month) => total + month.totalCents, 0))}
              </p>
            </div>
            <span className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-white text-gray-700 shadow-sm">
              <Plus aria-hidden="true" className="h-5 w-5 group-open:hidden" />
              <Minus aria-hidden="true" className="hidden h-5 w-5 group-open:block" />
            </span>
          </summary>
          <div className="grid gap-4 lg:grid-cols-3">
            {quarter.months.map((month) => {
              const isCurrentMonth = model.currentFiscalMonth === month.index;

              return (
              <div
                key={month.index}
                className={`min-h-48 rounded-lg p-4 ${isCurrentMonth ? "bg-amber-100 outline outline-4 outline-amber-400" : "bg-white"}`}
              >
                <div className="mb-4 flex items-center justify-between gap-3">
                  <div>
                    <h3 className="font-display text-lg font-extrabold tracking-tight">{month.label}</h3>
                    {isCurrentMonth ? <span className="text-xs font-extrabold uppercase tracking-wide text-amber-700">Current month</span> : null}
                  </div>
                  <span className="text-sm font-extrabold text-muted">{formatCurrency(month.totalCents)}</span>
                </div>
                <div className="grid gap-3">
                  {month.payments.length === 0 ? (
                    <p className="text-sm font-medium text-muted">No payments</p>
                  ) : (
                    month.payments.map((payment) => {
                      const providerColor = providerColorMap[payment.provider];
                      const tileClass = `${providerColor.bg} ${providerColor.text}`;
                      const budgetSourceLabel = getBudgetSourceLabel(payment.budgetSource);
                      const paymentKey = `${payment.licenseId}-${payment.fiscalMonth}`;
                      const isExpanded = Boolean(expandedPayments[paymentKey]);

                      return (
                        <div key={paymentKey} className={`overflow-hidden rounded-lg ${tileClass}`}>
                          <button
                            type="button"
                            className="flex w-full items-center justify-between gap-3 p-3 text-left transition hover:bg-white/25 focus:outline-none focus-visible:ring-4 focus-visible:ring-blue-300"
                            aria-label={`${isExpanded ? "Collapse" : "Expand"} ${payment.title} payment details`}
                            aria-expanded={isExpanded}
                            onClick={() => togglePayment(paymentKey)}
                          >
                            <span className="min-w-0 text-sm font-extrabold leading-snug">{payment.title}</span>
                            <span className="flex shrink-0 items-center gap-2">
                              <span className="text-sm font-extrabold">{formatCurrency(payment.amountCents)}</span>
                              <ChevronDown
                                aria-hidden="true"
                                className={`h-4 w-4 transition-transform ${isExpanded ? "rotate-180" : ""}`}
                              />
                            </span>
                          </button>
                          {isExpanded ? (
                            <div className="border-t border-white/40 px-3 pb-3 pt-2">
                              <div className="mb-2 flex flex-wrap items-center gap-2">
                                {payment.isFirstPayment ? (
                                  <span className="rounded-md bg-white px-2 py-1 text-[10px] font-extrabold uppercase tracking-wide text-gray-900">
                                    first
                                  </span>
                                ) : null}
                                {payment.isProrated ? (
                                  <span className="rounded-md bg-white/70 px-2 py-1 text-xs font-extrabold">
                                    prorated
                                  </span>
                                ) : null}
                              </div>
                              <p className="text-xs font-bold opacity-80">{payment.provider}</p>
                              <span className="mt-2 inline-flex rounded-md bg-white/80 px-2 py-1 text-[10px] font-extrabold uppercase tracking-wide text-gray-900">
                                {budgetSourceLabel}
                              </span>
                              <button
                                type="button"
                                className="mt-3 inline-flex items-center gap-1.5 rounded-md bg-white/85 px-2.5 py-1.5 text-xs font-extrabold text-gray-900 transition hover:bg-white focus:outline-none focus-visible:ring-4 focus-visible:ring-blue-300"
                                aria-label={`Edit ${payment.title}`}
                                onClick={() => openLicenseEditor(payment.licenseId)}
                              >
                                <Pencil aria-hidden="true" className="h-3.5 w-3.5" />
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
      ))}
    </div>
  );
}
