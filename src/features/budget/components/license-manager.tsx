import { Pencil, Trash2 } from "lucide-react";
import { SoftButton } from "@/components/ui/soft-button";
import { SoftInput } from "@/components/ui/soft-input";
import { SoftSelect } from "@/components/ui/soft-select";
import { SoftSurface } from "@/components/ui/soft-surface";
import { deleteContentLicense, updateContentLicense } from "../budget-actions";
import { getFiscalMonths } from "../budget-math";
import type { ContentLicense } from "../budget-types";

type LicenseManagerProps = {
  fiscalYearId: string;
  fiscalYear: number;
  fiscalYearStartMonth: number;
  licenses: ContentLicense[];
  providerOptions: string[];
  isDemo?: boolean;
};

export function LicenseManager({
  fiscalYearId,
  fiscalYear,
  fiscalYearStartMonth,
  licenses,
  providerOptions,
  isDemo
}: LicenseManagerProps) {
  const monthOptions = getFiscalMonths(fiscalYear, fiscalYearStartMonth).map((month) => ({
    label: month.label,
    value: String(month.index)
  }));

  return (
    <SoftSurface className="bg-white p-6 md:p-8">
      <div className="mb-6 flex items-center gap-4">
        <div className="grid h-12 w-12 shrink-0 place-items-center rounded-lg bg-gray-900 text-white">
          <Pencil className="h-5 w-5" aria-hidden="true" />
        </div>
        <div>
          <h2 className="font-display text-2xl font-extrabold tracking-tight">Edit Content</h2>
          <p className="text-sm font-medium text-muted">Adjust titles, providers, payment amounts, cadence, or added month.</p>
        </div>
      </div>
      <datalist id="license-manager-provider-options">
        {providerOptions.map((provider) => (
          <option key={provider} value={provider} />
        ))}
      </datalist>
      <div className="grid gap-4">
        {licenses.length === 0 ? (
          <p className="rounded-lg bg-gray-100 p-4 text-sm font-bold text-muted">Added content will appear here for editing.</p>
        ) : (
          licenses.map((license) => (
            <div key={license.id} className="rounded-lg bg-gray-100 p-4">
              <form action={updateContentLicense} className="grid gap-4 xl:grid-cols-[minmax(180px,1fr)_minmax(180px,1fr)_150px_170px_170px]">
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
                <SoftInput label="Notes" name="notes" defaultValue={license.notes ?? ""} disabled={isDemo} className="xl:col-span-4" />
                <div className="grid gap-2 sm:grid-cols-2 xl:col-span-1">
                  <SoftButton type="submit" variant="primary" disabled={isDemo}>
                    Save
                  </SoftButton>
                  <SoftButton form={`delete-${license.id}`} type="submit" variant="ghost" disabled={isDemo}>
                    <Trash2 className="h-4 w-4" aria-hidden="true" />
                    Delete
                  </SoftButton>
                </div>
              </form>
              <form id={`delete-${license.id}`} action={deleteContentLicense}>
                <input type="hidden" name="licenseId" value={license.id} />
              </form>
            </div>
          ))
        )}
      </div>
    </SoftSurface>
  );
}
