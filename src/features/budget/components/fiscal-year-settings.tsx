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
  sectionId?: string;
  defaults?: {
    label: string;
    fiscal_year: number;
    fiscal_year_start_month: number;
    budget_cents: number;
  };
  fiscalYear?: {
    id: string;
    label: string;
    fiscal_year: number;
    fiscal_year_start_month: number;
    budget_cents: number;
  };
};

export function FiscalYearSettings({ isDemo, sectionId, defaults, fiscalYear }: FiscalYearSettingsProps) {
  const isEditing = Boolean(fiscalYear);
  const values = fiscalYear ?? defaults;
  const fieldIdPrefix = isEditing ? `edit-fiscal-year-${fiscalYear?.id}` : sectionId ?? "create-fiscal-year";

  return (
    <div id={sectionId}>
      <SoftSurface className="bg-gray-100 p-6 md:p-8">
        <div className="mb-6 flex items-center gap-4">
          <div className="grid h-12 w-12 shrink-0 place-items-center rounded-lg bg-blue-500">
            <CalendarDays className="h-5 w-5 text-white" aria-hidden="true" />
          </div>
          <div>
            <h2 className="font-display text-2xl font-extrabold tracking-tight">
              {isEditing ? "Edit Fiscal Year" : "Create Fiscal Year"}
            </h2>
            <p className="text-sm font-medium text-muted">
              {isEditing
                ? "Update the label, fiscal calendar, or total budget."
                : "Create a separate budget view while preserving older fiscal years."}
            </p>
          </div>
        </div>
        <form action={isEditing ? updateFiscalYear : createFiscalYear} className="grid gap-4 md:grid-cols-2">
          {fiscalYear ? <input type="hidden" name="fiscalYearId" value={fiscalYear.id} /> : null}
          <SoftInput
            id={`${fieldIdPrefix}-label`}
            label="Label"
            name="label"
            defaultValue={values?.label ?? "FY26 Licensing Budget"}
            required
            disabled={isDemo}
          />
          <SoftInput
            id={`${fieldIdPrefix}-year`}
            label="Fiscal year"
            name="fiscalYear"
            type="number"
            defaultValue={values?.fiscal_year ?? 2026}
            required
            disabled={isDemo}
          />
          <SoftSelect
            id={`${fieldIdPrefix}-start-month`}
            label="FY starts in"
            name="fiscalYearStartMonth"
            defaultValue={String(values?.fiscal_year_start_month ?? 7)}
            options={monthOptions}
            disabled={isDemo}
          />
          <SoftInput
            id={`${fieldIdPrefix}-budget`}
            label="Budget"
            name="budget"
            defaultValue={values ? String(values.budget_cents / 100) : "30000"}
            placeholder={formatCurrency(3000000)}
            required
            disabled={isDemo}
          />
          <SoftButton type="submit" variant="primary" className="md:col-span-2" disabled={isDemo}>
            {isEditing ? "Save budget settings" : "Create fiscal year"}
          </SoftButton>
        </form>
      </SoftSurface>
    </div>
  );
}
