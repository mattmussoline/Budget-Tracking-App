import { CircleDollarSign, PiggyBank, TrendingDown, WalletCards } from "lucide-react";
import { formatCurrency } from "@/lib/currency";
import { SoftSurface } from "@/components/ui/soft-surface";
import type { DashboardModel } from "../dashboard-model";

type SummaryMetricsProps = {
  model: DashboardModel;
};

export function SummaryMetrics({ model }: SummaryMetricsProps) {
  const percentUsed = Math.max(0, model.percentUsed);
  const barPercent = Math.min(100, percentUsed);
  const health = getBudgetHealth(model.remainingPercent);
  const metrics = [
    { label: "Budget", value: formatCurrency(model.budgetCents), icon: PiggyBank, className: health.tile },
    { label: "Committed", value: formatCurrency(model.totalSpentCents), icon: CircleDollarSign, className: health.committed },
    { label: "Remaining", value: formatCurrency(model.remainingCents), icon: TrendingDown, className: health.tile }
  ];

  return (
    <div className="grid gap-5 lg:grid-cols-[1.2fr_1fr_1fr_1fr]">
      <SoftSurface className={`p-6 ${health.tile}`}>
        <div className="mb-5 flex items-center justify-between gap-4">
          <div className="grid h-12 w-12 place-items-center rounded-lg bg-white">
            <WalletCards className={health.icon} aria-hidden="true" />
          </div>
          <span className="rounded-md bg-white px-3 py-1 text-sm font-extrabold text-foreground">{percentUsed}% used</span>
        </div>
        <p className="text-sm font-extrabold uppercase tracking-wide text-foreground">Fiscal year health</p>
        <div className="mt-4 h-5 rounded-md bg-white">
          <div className={`h-full rounded-md transition-all duration-500 ${health.bar}`} style={{ width: `${barPercent}%` }} />
        </div>
      </SoftSurface>
      {metrics.map((metric) => (
        <SoftSurface key={metric.label} className={`p-6 ${metric.className}`}>
          <div className="mb-4 grid h-12 w-12 place-items-center rounded-lg bg-white">
            <metric.icon className={health.icon} aria-hidden="true" />
          </div>
          <p className="text-sm font-extrabold uppercase tracking-wide text-foreground">{metric.label}</p>
          <p className="font-display text-3xl font-extrabold tracking-tight">{metric.value}</p>
        </SoftSurface>
      ))}
    </div>
  );
}

function getBudgetHealth(remainingPercent: number) {
  if (remainingPercent < 0) {
    return {
      tile: "bg-red-100 text-red-950",
      committed: "bg-red-500 text-white",
      bar: "bg-red-500",
      icon: "h-5 w-5 text-red-600"
    };
  }

  if (remainingPercent < 30) {
    return {
      tile: "bg-amber-100 text-amber-950",
      committed: "bg-amber-500 text-white",
      bar: "bg-amber-500",
      icon: "h-5 w-5 text-amber-600"
    };
  }

  return {
    tile: "bg-emerald-100 text-emerald-950",
    committed: "bg-emerald-500 text-white",
    bar: "bg-emerald-500",
    icon: "h-5 w-5 text-emerald-600"
  };
}
