import { ChevronDown, Pencil, Trash2 } from "lucide-react";
import { SoftButton } from "@/components/ui/soft-button";
import { SoftInput } from "@/components/ui/soft-input";
import { SoftSelect } from "@/components/ui/soft-select";
import { SoftSurface } from "@/components/ui/soft-surface";
import { deleteContentLicense, updateContentLicense } from "../budget-actions";
import { getFiscalMonths } from "../budget-math";
import type { ContentLicense } from "../budget-types";
import { getProviderColor, type ProviderColorOverrides } from "../provider-colors";

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
    <SoftSurface className="self-start overflow-hidden bg-gray-900">
      <details className="group">
        <summary className="flex cursor-pointer list-none items-center justify-between gap-4 bg-gray-900 px-5 py-4 text-white marker:hidden md:px-6">
          <span className="flex min-w-0 items-center gap-4">
            <span className="grid h-12 w-12 shrink-0 place-items-center rounded-lg bg-blue-500 text-white">
              <Pencil className="h-5 w-5" aria-hidden="true" />
            </span>
            <span className="min-w-0">
              <span className="block font-display text-2xl font-extrabold tracking-tight">Edit Content</span>
              <span className="block text-sm font-medium text-gray-300">Adjust titles, providers, payment amounts, cadence, or added month.</span>
            </span>
          </span>
          <ChevronDown className="h-5 w-5 shrink-0 transition-transform group-open:rotate-180" aria-hidden="true" />
        </summary>
        <datalist id="license-manager-provider-options">
          {providerOptions.map((provider) => (
            <option key={provider} value={provider} />
          ))}
        </datalist>
        <div className="grid gap-4 bg-gray-100 p-4 md:p-6">
          {licenses.length === 0 ? (
            <p className="rounded-lg bg-gray-100 p-4 text-sm font-bold text-muted">Added content will appear here for editing.</p>
          ) : (
            licenses.map((license, index) => {
              const providerColor = getProviderColor(license.provider, providerColorOverrides);

              return (
                <div key={license.id} className="overflow-hidden rounded-lg bg-white">
                  <div
                    className={`flex flex-col gap-2 border-l-8 p-4 sm:flex-row sm:items-center sm:justify-between ${index % 2 === 0 ? "bg-white" : "bg-blue-50"}`}
                    style={{ borderLeftColor: providerColor.hex }}
                  >
                    <div>
                      <h3 className="font-display text-xl font-extrabold tracking-tight">{license.title}</h3>
                      <p className="text-sm font-bold text-muted">{license.provider}</p>
                    </div>
                    <span className={`w-fit rounded-md px-3 py-2 text-xs font-extrabold uppercase tracking-wide ${providerColor.bg} ${providerColor.text}`}>
                      {license.cadence}
                    </span>
                  </div>
                  <div className="p-4">
                    <form action={updateContentLicense} className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
                      <input type="hidden" name="fiscalYearId" value={fiscalYearId} />
                      <input type="hidden" name="licenseId" value={license.id} />
                      <SoftInput label="Title" name="title" defaultValue={license.title} required disabled={isDemo} />
                      <SoftInput
                        label="Provider"
                        name="provider"
                        list="license-manager-provider-options"
                        defaultValue={license.provider}
                        required
                        disabled={isDemo}
                      />
                      <SoftInput
                        label="Amount"
                        name="installment"
                        defaultValue={String(license.installmentCents / 100)}
                        inputMode="decimal"
                        required
                        disabled={isDemo}
                      />
                      <SoftSelect
                        label="Cadence"
                        name="cadence"
                        defaultValue={license.cadence}
                        options={[
                          { label: "Quarterly", value: "quarterly" },
                          { label: "Yearly", value: "yearly" }
                        ]}
                        disabled={isDemo}
                      />
                      <SoftSelect
                        label="Added month"
                        name="addedFiscalMonth"
                        defaultValue={String(license.addedFiscalMonth)}
                        options={monthOptions}
                        disabled={isDemo}
                      />
                      <SoftInput label="Notes" name="notes" defaultValue={license.notes ?? ""} disabled={isDemo} className="xl:col-span-2" />
                      <div className="grid gap-2 sm:grid-cols-2 xl:col-span-1">
                        <SoftButton type="submit" variant="primary" disabled={isDemo}>
                          Save
                        </SoftButton>
                        <SoftButton form={`delete-${license.id}`} type="submit" variant="ghost" className="text-red-700 hover:bg-red-100" disabled={isDemo}>
                          <Trash2 className="h-4 w-4" aria-hidden="true" />
                          Delete
                        </SoftButton>
                      </div>
                    </form>
                  </div>
                  <form id={`delete-${license.id}`} action={deleteContentLicense}>
                    <input type="hidden" name="licenseId" value={license.id} />
                  </form>
                </div>
              );
            })
          )}
        </div>
      </details>
    </SoftSurface>
  );
}
