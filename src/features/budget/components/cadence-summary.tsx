import { Repeat2, CalendarClock } from "lucide-react";
import { formatCurrency } from "@/lib/currency";
import { SoftSurface } from "@/components/ui/soft-surface";
import type { DashboardModel } from "../dashboard-model";

export function CadenceSummary({ model }: { model: DashboardModel }) {
  const items = [
    { label: "Quarterly", value: model.cadenceTotals.quarterlyCents, icon: Repeat2 },
    { label: "Yearly", value: model.cadenceTotals.yearlyCents, icon: CalendarClock }
  ];

  return (
    <SoftSurface className="bg-blue-50 p-6 md:p-8">
      <h2 className="mb-5 font-display text-2xl font-extrabold tracking-tight">Cadence Mix</h2>
      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-1">
        {items.map((item) => (
          <div key={item.label} className="flex items-center gap-4 rounded-lg bg-white p-4">
            <div className="grid h-11 w-11 shrink-0 place-items-center rounded-lg bg-white">
              <item.icon className="h-5 w-5 text-blue-600" aria-hidden="true" />
            </div>
            <div>
              <p className="text-sm font-extrabold uppercase tracking-wide text-muted">{item.label}</p>
              <p className="font-display text-xl font-extrabold">{formatCurrency(item.value)}</p>
            </div>
          </div>
        ))}
      </div>
    </SoftSurface>
  );
}
