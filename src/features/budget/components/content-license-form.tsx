import { SoftButton } from "@/components/ui/soft-button";
import { SoftInput } from "@/components/ui/soft-input";
import { SoftSelect } from "@/components/ui/soft-select";
import { SoftSurface } from "@/components/ui/soft-surface";
import { getFiscalMonths } from "../budget-math";
import { addContentLicense } from "../budget-actions";
import { budgetSourceOptions } from "../budget-source";

type ContentLicenseFormProps = {
  fiscalYearId: string;
  fiscalYear: number;
  fiscalYearStartMonth: number;
  providerOptions: string[];
  isDemo?: boolean;
};

export function ContentLicenseForm({
  fiscalYearId,
  fiscalYear,
  fiscalYearStartMonth,
  providerOptions,
  isDemo
}: ContentLicenseFormProps) {
  const monthOptions = getFiscalMonths(fiscalYear, fiscalYearStartMonth).map((month) => ({
    label: month.label,
    value: String(month.index)
  }));

  return (
    <SoftSurface className="bg-panel-warm p-5">
      <div className="mb-3.5 grid gap-0.5">
        <h2 className="font-display text-lg">Add content</h2>
        <p className="text-xs text-muted">The first quarterly payment is prorated automatically.</p>
      </div>
      <form action={addContentLicense} className="grid gap-2.5">
        <input type="hidden" name="fiscalYearId" value={fiscalYearId} />
        <SoftInput label="Title" name="title" placeholder="Jesus Thirsts" required disabled={isDemo} surface="white" />
        <SoftInput label="Provider" name="provider" list="provider-options" placeholder="Provider name" required disabled={isDemo} surface="white" />
        <datalist id="provider-options">
          {providerOptions.map((provider) => (
            <option key={provider} value={provider} />
          ))}
        </datalist>
        <div className="grid gap-2.5 sm:grid-cols-2">
          <SoftInput label="Payment amount" name="installment" inputMode="decimal" placeholder="1200" required disabled={isDemo} surface="white" />
          <SoftSelect
            label="Cadence"
            name="cadence"
            defaultValue=""
            placeholder="Select"
            required
            disabled={isDemo}
            surface="white"
            options={[
              { label: "Quarterly", value: "quarterly" },
              { label: "Yearly", value: "yearly" }
            ]}
          />
        </div>
        <div className="grid gap-2.5 sm:grid-cols-2">
          <SoftSelect
            label="Added month"
            name="addedFiscalMonth"
            defaultValue=""
            placeholder="Select"
            options={monthOptions}
            required
            disabled={isDemo}
            surface="white"
          />
          <SoftSelect
            label="Budget source"
            name="budgetSource"
            defaultValue="misc_licensing"
            options={[...budgetSourceOptions]}
            required
            disabled={isDemo}
            surface="white"
          />
        </div>
        <SoftInput label="Notes" name="notes" placeholder="Optional context" disabled={isDemo} surface="white" />
        <SoftButton type="submit" variant="primary" className="mt-1 w-full" disabled={isDemo}>
          Add title
        </SoftButton>
      </form>
    </SoftSurface>
  );
}
