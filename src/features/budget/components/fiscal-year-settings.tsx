import { SoftButton } from "@/components/ui/soft-button";
import { SoftInput } from "@/components/ui/soft-input";
import { SoftSelect } from "@/components/ui/soft-select";
import { SoftSurface } from "@/components/ui/soft-surface";
import { createFiscalYear, updateFiscalYear } from "../budget-actions";
import { formatCurrency } from "@/lib/currency";

const monthOptions = [
  { label: "January", value: "1" },
  { label: "February", value: "2" },
  { label: "March", value: "3" },
  { label: "April", value: "4" },
  { label: "May", value: "5" },
  { label: "June", value: "6" },
  { label: "July", value: "7" },
  { label: "August", value: "8" },
  { label: "September", value: "9" },
  { label: "October", value: "10" },
  { label: "November", value: "11" },
  { label: "December", value: "12" }
];

type FiscalYearSettingsProps = {
  isDemo?: boolean;
  defaultFiscalYear?: number;
  fiscalYear?: {
    id: string;
    label: string;
    fiscal_year: number;
    fiscal_year_start_month: number;
    budget_cents: number;
  };
};

export function FiscalYearSettings({ isDemo, defaultFiscalYear = 2026, fiscalYear }: FiscalYearSettingsProps) {
  const isEditing = Boolean(fiscalYear);

  return (
    <SoftSurface className="bg-panel-warm p-5">
      <div className="mb-3.5 grid gap-0.5">
        <h2 className="font-display text-lg">{isEditing ? "Edit fiscal year" : "Start a fiscal year"}</h2>
        <p className="text-xs text-muted">
          {isEditing ? "Update the label, fiscal calendar, or total budget." : "Set the budget, then add titles as they come in."}
        </p>
      </div>
      <form action={isEditing ? updateFiscalYear : createFiscalYear} className="grid gap-2.5 sm:grid-cols-2">
        {fiscalYear ? <input type="hidden" name="fiscalYearId" value={fiscalYear.id} /> : null}
        <SoftInput
          label="Label"
          name="label"
          defaultValue={fiscalYear?.label ?? `FY${String(defaultFiscalYear).slice(-2)} Licensing Budget`}
          required
          disabled={isDemo}
          surface="white"
        />
        <SoftInput
          label="Fiscal year"
          name="fiscalYear"
          type="number"
          defaultValue={fiscalYear?.fiscal_year ?? defaultFiscalYear}
          required
          disabled={isDemo}
          surface="white"
        />
        <SoftSelect
          label="FY starts in"
          name="fiscalYearStartMonth"
          defaultValue={String(fiscalYear?.fiscal_year_start_month ?? 7)}
          options={monthOptions}
          disabled={isDemo}
          surface="white"
        />
        <SoftInput
          label="Budget"
          name="budget"
          defaultValue={fiscalYear ? String(fiscalYear.budget_cents / 100) : "30000"}
          placeholder={formatCurrency(3000000)}
          required
          disabled={isDemo}
          surface="white"
        />
        <SoftButton type="submit" variant="secondary" className="mt-1 w-full sm:col-span-2" disabled={isDemo}>
          {isEditing ? "Save budget settings" : "Create budget"}
        </SoftButton>
      </form>
    </SoftSurface>
  );
}
