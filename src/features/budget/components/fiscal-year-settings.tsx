import { CalendarDays } from "lucide-react";
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
  fiscalYear?: {
    id: string;
    label: string;
    fiscal_year: number;
    fiscal_year_start_month: number;
    budget_cents: number;
  };
};

export function FiscalYearSettings({ isDemo, fiscalYear }: FiscalYearSettingsProps) {
  const isEditing = Boolean(fiscalYear);

  return (
    <SoftSurface className="bg-gray-100 p-6 md:p-8">
      <div className="mb-6 flex items-center gap-4">
        <div className="grid h-12 w-12 shrink-0 place-items-center rounded-lg bg-blue-500">
          <CalendarDays className="h-5 w-5 text-white" aria-hidden="true" />
        </div>
        <div>
          <h2 className="font-display text-2xl font-extrabold tracking-tight">
            {isEditing ? "Edit Fiscal Year" : "Start a Fiscal Year"}
          </h2>
          <p className="text-sm font-medium text-muted">
            {isEditing ? "Update the label, fiscal calendar, or total budget." : "Set the budget, then add titles as they come in."}
          </p>
        </div>
      </div>
      <form action={isEditing ? updateFiscalYear : createFiscalYear} className="grid gap-4 md:grid-cols-2">
        {fiscalYear ? <input type="hidden" name="fiscalYearId" value={fiscalYear.id} /> : null}
        <SoftInput label="Label" name="label" defaultValue={fiscalYear?.label ?? "FY26 Licensing Budget"} required disabled={isDemo} />
        <SoftInput label="Fiscal year" name="fiscalYear" type="number" defaultValue={fiscalYear?.fiscal_year ?? 2026} required disabled={isDemo} />
        <SoftSelect
          label="FY starts in"
          name="fiscalYearStartMonth"
          defaultValue={String(fiscalYear?.fiscal_year_start_month ?? 7)}
          options={monthOptions}
          disabled={isDemo}
        />
        <SoftInput
          label="Budget"
          name="budget"
          defaultValue={fiscalYear ? String(fiscalYear.budget_cents / 100) : "30000"}
          placeholder={formatCurrency(3000000)}
          required
          disabled={isDemo}
        />
        <SoftButton type="submit" variant="primary" className="md:col-span-2" disabled={isDemo}>
          {isEditing ? "Save budget settings" : "Create budget"}
        </SoftButton>
      </form>
    </SoftSurface>
  );
}
