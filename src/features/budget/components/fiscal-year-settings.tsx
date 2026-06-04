import { CalendarDays } from "lucide-react";
import { SoftButton } from "@/components/ui/soft-button";
import { SoftInput } from "@/components/ui/soft-input";
import { SoftSelect } from "@/components/ui/soft-select";
import { SoftSurface } from "@/components/ui/soft-surface";
import { createFiscalYear } from "../budget-actions";

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

export function FiscalYearSettings({ isDemo }: { isDemo?: boolean }) {
  return (
    <SoftSurface className="p-6 md:p-8">
      <div className="mb-6 flex items-center gap-4">
        <div className="grid h-12 w-12 shrink-0 place-items-center rounded-2xl soft-inset-deep">
          <CalendarDays className="h-5 w-5 text-accent" aria-hidden="true" />
        </div>
        <div>
          <h2 className="font-display text-2xl font-extrabold tracking-tight">Start a Fiscal Year</h2>
          <p className="text-sm font-medium text-muted">Set the budget once, then add titles as they come in.</p>
        </div>
      </div>
      <form action={createFiscalYear} className="grid gap-4 md:grid-cols-2">
        <SoftInput label="Label" name="label" defaultValue="FY26 Licensing Budget" required disabled={isDemo} />
        <SoftInput label="Fiscal year" name="fiscalYear" type="number" defaultValue="2026" required disabled={isDemo} />
        <SoftSelect label="FY starts in" name="fiscalYearStartMonth" defaultValue="7" options={monthOptions} disabled={isDemo} />
        <SoftInput label="Budget" name="budget" defaultValue="30000" required disabled={isDemo} />
        <SoftButton type="submit" variant="primary" className="md:col-span-2" disabled={isDemo}>
          Create budget
        </SoftButton>
      </form>
    </SoftSurface>
  );
}
