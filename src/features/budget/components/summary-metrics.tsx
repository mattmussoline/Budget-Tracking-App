import { CircleDollarSign, PiggyBank, TrendingDown, WalletCards } from "lucide-react";
import { formatCurrency } from "@/lib/currency";
import { SoftSurface } from "@/components/ui/soft-surface";
import type { DashboardModel } from "../dashboard-model";

type SummaryMetricsProps = {
  model: DashboardModel;
};

export function SummaryMetrics({ model }: SummaryMetricsProps) {
  const percentUsed = model.budgetCents > 0 ? Math.min(100, Math.round((model.totalSpentCents / model.budgetCents) * 100)) : 0;
  const metrics = [
    { label: "Budget", value: formatCurrency(model.budgetCents), icon: PiggyBank },
    { label: "Committed", value: formatCurrency(model.totalSpentCents), icon: CircleDollarSign },
    { label: "Remaining", value: formatCurrency(model.remainingCents), icon: TrendingDown }
  ];

  return (
    <div className="grid gap-5 lg:grid-cols-[1.2fr_1fr_1fr_1fr]">
      <SoftSurface className="p-6">
        <div className="mb-5 flex items-center justify-between gap-4">
          <div className="grid h-12 w-12 place-items-center rounded-2xl soft-inset-deep">
            <WalletCards className="h-5 w-5 text-accent" aria-hidden="true" />
          </div>
          <span className="rounded-full px-3 py-1 text-sm font-bold text-muted soft-inset-sm">{percentUsed}% used</span>
        </div>
        <p className="text-sm font-bold uppercase text-muted">Fiscal year health</p>
        <div className="mt-4 h-5 rounded-full p-1 soft-inset">
          <div className="h-full rounded-full bg-accent transition-all duration-500" style={{ width: `${percentUsed}%` }} />
        </div>
      </SoftSurface>
      {metrics.map((metric) => (
        <SoftSurface key={metric.label} className="p-6">
          <div className="mb-4 grid h-12 w-12 place-items-center rounded-2xl soft-inset-deep">
            <metric.icon className="h-5 w-5 text-accent" aria-hidden="true" />
          </div>
          <p className="text-sm font-bold uppercase text-muted">{metric.label}</p>
          <p className="font-display text-3xl font-extrabold tracking-tight">{metric.value}</p>
        </SoftSurface>
      ))}
    </div>
  );
}
