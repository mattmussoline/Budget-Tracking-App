"use client";

import { ChevronDown, Pencil, Trash2 } from "lucide-react";
import { SoftButton } from "@/components/ui/soft-button";
import { SoftInput } from "@/components/ui/soft-input";
import { SoftSelect } from "@/components/ui/soft-select";
import { SoftSurface } from "@/components/ui/soft-surface";
import { deleteContentLicense, updateContentLicense } from "../budget-actions";
import { getFiscalMonths } from "../budget-math";
import { budgetSourceOptions } from "../budget-source";
import type { ContentLicense } from "../budget-types";
import { getProviderColor, type ProviderColorOverrides } from "../provider-colors";
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

export function LicenseManager({
  fiscalYearId,
  fiscalYear,
  fiscalYearStartMonth,
  licenses,
  providerOptions,
  providerColorOverrides,
  isDemo
}: LicenseManagerProps) {
  const monthOptions = getFiscalMonths(fiscalYear, fiscalYearStartMonth).map((month) => ({
    label: month.label,
    value: String(month.index)
  }));

  return (
    <SoftSurface className="overflow-hidden bg-gray-900">
      <details id="edit-content-manager" className="group">
        <summary className="flex cursor-pointer list-none items-center justify-between gap-3 bg-gray-900 px-4 py-3 text-white marker:hidden md:px-5">
          <span className="flex min-w-0 items-center gap-3">
            <span className="grid h-9 w-9 shrink-0 place-items-center rounded-md bg-blue-500 text-white">
              <Pencil className="h-4 w-4" aria-hidden="true" />
            </span>
            <span className="min-w-0">
              <span className="block font-display text-lg font-extrabold tracking-tight">Edit Content</span>
              <span className="block text-xs font-medium text-gray-300">Adjust titles, providers, payment amounts, cadence, or added month.</span>
            </span>
          </span>
          <ChevronDown className="h-4 w-4 shrink-0 transition-transform group-open:rotate-180" aria-hidden="true" />
        </summary>
        <datalist id="license-manager-provider-options">
          {providerOptions.map((provider) => (
            <option key={provider} value={provider} />
          ))}
        </datalist>
        <div className="grid gap-2 bg-gray-100 p-3 md:p-4">
          {licenses.length === 0 ? (
            <p className="rounded-md bg-white px-3 py-2 text-sm font-bold text-muted">Added content will appear here for editing.</p>
          ) : (
            licenses.map((license, index) => {
              const providerColor = getProviderColor(license.provider, providerColorOverrides);

              return (
                <details id={`edit-license-${license.id}`} key={license.id} className="group/license overflow-hidden rounded-md bg-white shadow-sm">
                  <summary
                    className={`flex cursor-pointer list-none items-center justify-between gap-3 border-l-4 px-3 py-2 marker:hidden ${index % 2 === 0 ? "bg-white" : "bg-blue-50"}`}
                    style={{ borderLeftColor: providerColor.hex }}
                  >
                    <span className="min-w-0">
                      <span className="block truncate font-display text-base font-extrabold tracking-tight">{license.title}</span>
                      <span className="block truncate text-xs font-bold text-muted">
                        {license.provider} - {formatCurrency(license.installmentCents)}
                      </span>
                    </span>
                    <span className="flex shrink-0 items-center gap-2">
                      <span className={`rounded-md px-2 py-1 text-[11px] font-extrabold uppercase tracking-wide ${providerColor.bg} ${providerColor.text}`}>
                        {license.cadence}
                      </span>
                      <ChevronDown className="h-4 w-4 text-muted transition-transform group-open/license:rotate-180" aria-hidden="true" />
                    </span>
                  </summary>
                  <div className="border-t border-gray-100 p-3">
                    <form action={updateContentLicense} className="grid gap-3 md:grid-cols-2 xl:grid-cols-6">
                      <input type="hidden" name="fiscalYearId" value={fiscalYearId} />
                      <input type="hidden" name="licenseId" value={license.id} />
                      <SoftInput label="Title" name="title" defaultValue={license.title} required disabled={isDemo} className="min-h-9 px-3 text-sm" />
                      <SoftInput
                        label="Provider"
                        name="provider"
                        list="license-manager-provider-options"
                        defaultValue={license.provider}
                        required
                        disabled={isDemo}
                        className="min-h-9 px-3 text-sm"
                      />
                      <SoftInput
                        label="Amount"
                        name="installment"
                        defaultValue={String(license.installmentCents / 100)}
                        inputMode="decimal"
                        required
                        disabled={isDemo}
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
                        className="min-h-9 px-3 text-sm"
                      />
                      <SoftSelect
                        label="Added month"
                        name="addedFiscalMonth"
                        defaultValue={license.addedFiscalMonth ? String(license.addedFiscalMonth) : ""}
                        placeholder="Select"
                        options={monthOptions}
                        disabled={isDemo}
                        className="min-h-9 px-3 text-sm"
                      />
                      <SoftSelect
                        label="Budget source"
                        name="budgetSource"
                        defaultValue={license.budgetSource ?? "misc_licensing"}
                        options={[...budgetSourceOptions]}
                        disabled={isDemo}
                        className="min-h-9 px-3 text-sm"
                      />
                      <SoftInput
                        label="Notes"
                        name="notes"
                        defaultValue={license.notes ?? ""}
                        disabled={isDemo}
                        className="min-h-9 px-3 text-sm md:col-span-2 xl:col-span-1"
                      />
                      <div className="grid gap-2 sm:grid-cols-2 md:col-span-2 xl:col-span-6 xl:flex xl:justify-end">
                        <SoftButton type="submit" variant="primary" disabled={isDemo} className="min-h-9 px-3 py-2 text-xs">
                          Save
                        </SoftButton>
                        <SoftButton
                          form={`delete-${license.id}`}
                          type="submit"
                          variant="ghost"
                          className="min-h-9 px-3 py-2 text-xs text-red-700 hover:bg-red-100"
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
