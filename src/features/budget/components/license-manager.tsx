"use client";

import { ChevronDown, Trash2 } from "lucide-react";
import { SoftButton } from "@/components/ui/soft-button";
import { SoftInput } from "@/components/ui/soft-input";
import { SoftSelect } from "@/components/ui/soft-select";
import { SoftSurface, cn } from "@/components/ui/soft-surface";
import { deleteContentLicense, updateContentLicense } from "../budget-actions";
import { getFiscalMonths } from "../budget-math";
import { budgetSourceOptions } from "../budget-source";
import type { ContentLicense } from "../budget-types";
import { getProviderColorMap, type ProviderColorOverrides } from "../provider-colors";
import { formatCurrency } from "@/lib/currency";

type LicenseManagerProps = {
  fiscalYearId: string;
  fiscalYear: number;
  fiscalYearStartMonth: number;
  licenses: ContentLicense[];
  providerOptions: string[];
  providerColorOverrides: ProviderColorOverrides;
  isDemo?: boolean;
};

const rowGridClass = "grid gap-3.5 sm:grid-cols-[minmax(0,2.1fr)_minmax(0,1.5fr)_104px_92px_84px_52px]";

export function LicenseManager({
  fiscalYearId,
  fiscalYear,
  fiscalYearStartMonth,
  licenses,
  providerOptions,
  providerColorOverrides,
  isDemo
}: LicenseManagerProps) {
  const providerColorMap = getProviderColorMap(providerOptions, providerColorOverrides);
  const fiscalMonths = getFiscalMonths(fiscalYear, fiscalYearStartMonth);
  const monthOptions = fiscalMonths.map((month) => ({
    label: month.label,
    value: String(month.index)
  }));
  const monthLabelByIndex = new Map(fiscalMonths.map((month) => [month.index, month.label.slice(0, 3)]));

  return (
    <SoftSurface className="overflow-hidden bg-panel-warm">
      <details id="edit-content-manager" className="group" open>
        <summary className="flex cursor-pointer list-none items-baseline justify-between gap-4 px-5 py-4 marker:hidden [&::-webkit-details-marker]:hidden">
          <span className="grid min-w-0 gap-0.5">
            <span className="block font-display text-lg">Edit content</span>
            <span className="block text-xs text-muted">Adjust titles, providers, payment amounts, cadence, or added month.</span>
          </span>
          <ChevronDown className="h-4 w-4 shrink-0 text-muted transition-transform group-open:rotate-180" aria-hidden="true" />
        </summary>
        <datalist id="license-manager-provider-options">
          {providerOptions.map((provider) => (
            <option key={provider} value={provider} />
          ))}
        </datalist>
        <div className={cn(rowGridClass, "hidden border-y border-hairline bg-panel px-5 py-2.5 text-[11px] font-semibold text-muted sm:grid")}>
          <span>Title</span>
          <span>Provider</span>
          <span className="text-right">Installment</span>
          <span>Cadence</span>
          <span>Added</span>
          <span className="sr-only">Edit</span>
        </div>
        <div className="grid border-t border-hairline sm:border-t-0">
          {licenses.length === 0 ? (
            <p className="px-5 py-4 text-sm text-muted">Added content will appear here for editing.</p>
          ) : (
            licenses.map((license) => {
              const providerColor = providerColorMap[license.provider];

              return (
                <details id={`edit-license-${license.id}`} key={license.id} className="group/license border-b border-hairline last:border-b-0">
                  <summary
                    className={cn(
                      rowGridClass,
                      "cursor-pointer list-none items-center border-l-[3px] border-transparent px-5 py-3 text-sm transition-colors hover:bg-panel marker:hidden [&::-webkit-details-marker]:hidden group-open/license:bg-panel"
                    )}
                    style={{ borderLeftColor: providerColor.hex }}
                  >
                    <span className="min-w-0 truncate font-semibold">{license.title}</span>
                    <span className="min-w-0 truncate text-muted">{license.provider}</span>
                    <span className="text-right sm:tabular-nums">{formatCurrency(license.installmentCents)}</span>
                    <span className="text-[13px] capitalize text-muted">{license.cadence}</span>
                    <span className="text-[13px] text-muted">{monthLabelByIndex.get(license.addedFiscalMonth) ?? "—"}</span>
                    <span className="flex items-center gap-1 text-xs font-semibold text-formed-blue">
                      Edit
                      <ChevronDown className="h-3.5 w-3.5 transition-transform group-open/license:rotate-180" aria-hidden="true" />
                    </span>
                  </summary>
                  <div className="border-t border-hairline bg-panel px-5 py-4">
                    <form action={updateContentLicense} className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
                      <input type="hidden" name="fiscalYearId" value={fiscalYearId} />
                      <input type="hidden" name="licenseId" value={license.id} />
                      <SoftInput label="Title" name="title" defaultValue={license.title} required disabled={isDemo} surface="white" className="min-h-9 px-3 text-sm" />
                      <SoftInput
                        label="Provider"
                        name="provider"
                        list="license-manager-provider-options"
                        defaultValue={license.provider}
                        required
                        disabled={isDemo}
                        surface="white"
                        className="min-h-9 px-3 text-sm"
                      />
                      <SoftInput
                        label="Amount"
                        name="installment"
                        defaultValue={String(license.installmentCents / 100)}
                        inputMode="decimal"
                        required
                        disabled={isDemo}
                        surface="white"
                        className="min-h-9 px-3 text-sm"
                      />
                      <SoftSelect
                        label="Cadence"
                        name="cadence"
                        defaultValue={license.cadence || ""}
                        placeholder="Select"
                        options={[
                          { label: "Quarterly", value: "quarterly" },
                          { label: "Yearly", value: "yearly" }
                        ]}
                        disabled={isDemo}
                        surface="white"
                        className="min-h-9 px-3 text-sm"
                      />
                      <SoftSelect
                        label="Added month"
                        name="addedFiscalMonth"
                        defaultValue={license.addedFiscalMonth ? String(license.addedFiscalMonth) : ""}
                        placeholder="Select"
                        options={monthOptions}
                        disabled={isDemo}
                        surface="white"
                        className="min-h-9 px-3 text-sm"
                      />
                      <SoftSelect
                        label="Budget source"
                        name="budgetSource"
                        defaultValue={license.budgetSource ?? "misc_licensing"}
                        options={[...budgetSourceOptions]}
                        disabled={isDemo}
                        surface="white"
                        className="min-h-9 px-3 text-sm"
                      />
                      <SoftInput
                        label="Notes"
                        name="notes"
                        defaultValue={license.notes ?? ""}
                        disabled={isDemo}
                        surface="white"
                        className="min-h-9 px-3 text-sm"
                      />
                      <div className="flex flex-wrap items-end justify-end gap-2 md:col-span-2 xl:col-span-3">
                        <SoftButton
                          form={`delete-${license.id}`}
                          type="submit"
                          variant="ghost"
                          className="min-h-9 px-3 py-2 text-xs text-danger hover:bg-danger-soft"
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
                        <SoftButton type="submit" variant="primary" disabled={isDemo} className="min-h-9 px-3 py-2 text-xs">
                          Save
                        </SoftButton>
                      </div>
                    </form>
                  </div>
                  <form id={`delete-${license.id}`} action={deleteContentLicense}>
                    <input type="hidden" name="licenseId" value={license.id} />
                  </form>
                </details>
              );
            })
          )}
        </div>
      </details>
    </SoftSurface>
  );
}
