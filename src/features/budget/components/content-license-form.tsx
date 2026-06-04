import { Plus } from "lucide-react";
import { SoftButton } from "@/components/ui/soft-button";
import { SoftInput } from "@/components/ui/soft-input";
import { SoftSelect } from "@/components/ui/soft-select";
import { SoftSurface } from "@/components/ui/soft-surface";
import { getFiscalMonths } from "../budget-math";
import { addContentLicense } from "../budget-actions";

type ContentLicenseFormProps = {
  fiscalYearId: string;
  fiscalYear: number;
  fiscalYearStartMonth: number;
  isDemo?: boolean;
};

export function ContentLicenseForm({
  fiscalYearId,
  fiscalYear,
  fiscalYearStartMonth,
  isDemo
}: ContentLicenseFormProps) {
  const monthOptions = getFiscalMonths(fiscalYear, fiscalYearStartMonth).map((month) => ({
    label: month.label,
    value: String(month.index)
  }));

  return (
    <SoftSurface className="p-6 md:p-8">
      <div className="mb-6 flex items-center gap-4">
        <div className="grid h-12 w-12 shrink-0 place-items-center rounded-2xl soft-inset-deep">
          <Plus className="h-5 w-5 text-accent" aria-hidden="true" />
        </div>
        <div>
          <h2 className="font-display text-2xl font-extrabold tracking-tight">Add Content</h2>
          <p className="text-sm font-medium text-muted">The first quarterly payment is prorated automatically.</p>
        </div>
      </div>
      <form action={addContentLicense} className="grid gap-4">
        <input type="hidden" name="fiscalYearId" value={fiscalYearId} />
        <SoftInput label="Title" name="title" placeholder="Jesus Thirsts" required disabled={isDemo} />
        <SoftInput label="Provider" name="provider" placeholder="Provider name" required disabled={isDemo} />
        <div className="grid gap-4 md:grid-cols-3">
          <SoftInput label="Payment amount" name="installment" inputMode="decimal" placeholder="1200" required disabled={isDemo} />
          <SoftSelect
            label="Cadence"
            name="cadence"
            defaultValue="quarterly"
            disabled={isDemo}
            options={[
              { label: "Quarterly", value: "quarterly" },
              { label: "Yearly", value: "yearly" }
            ]}
          />
          <SoftSelect label="Added month" name="addedFiscalMonth" options={monthOptions} disabled={isDemo} />
        </div>
        <SoftInput label="Notes" name="notes" placeholder="Optional context" disabled={isDemo} />
        <SoftButton type="submit" variant="primary" disabled={isDemo}>
          Add title
        </SoftButton>
      </form>
    </SoftSurface>
  );
}
