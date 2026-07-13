import { CircleDollarSign, PiggyBank, TrendingDown, WalletCards } from "lucide-react";
import { formatCurrency, formatCurrencyWholeDollars } from "@/lib/currency";
import type { DashboardModel } from "../dashboard-model";
import { DashboardPopout } from "./dashboard-popout";

type SummaryMetricsProps = {
  model: DashboardModel;
};

export function SummaryMetrics({ model }: SummaryMetricsProps) {
  const percentUsed = Math.max(0, model.percentUsed);
  const barPercent = Math.min(100, percentUsed);
  const health = getBudgetHealth(model.remainingPercent);
  const metrics = [
    {
      label: "Budget",
      value: formatCurrencyWholeDollars(model.budgetCents),
      icon: PiggyBank,
      className: health.tile,
      description: "The fiscal-year licensing budget for misc licensing spend.",
      renderDetail: () => <BudgetDetail model={model} />
    },
    {
      label: "Committed",
      value: formatCurrencyWholeDollars(model.totalSpentCents),
      icon: CircleDollarSign,
      className: health.committed,
      description: "Misc licensing payments already committed inside this fiscal year.",
      renderDetail: () => <CommittedDetail model={model} />
    },
    {
      label: "Other Budgets",
      value: formatCurrencyWholeDollars(model.otherBudgetSpentCents),
      icon: WalletCards,
      className: "bg-blue-100 text-blue-950",
      description: "Spend tracked here but paid by another source, such as internal production or donor-funded budgets.",
      renderDetail: () => <OtherBudgetsDetail model={model} />
    },
    {
      label: "Remaining",
      value: formatCurrencyWholeDollars(model.remainingCents),
      icon: TrendingDown,
      className: health.tile,
      description: "Budget left after misc licensing commitments.",
      renderDetail: () => <RemainingDetail model={model} />
    }
  ];

  return (
    <div className="grid min-w-0 gap-5 lg:grid-cols-[minmax(0,1.2fr)_repeat(4,minmax(0,1fr))]">
      <DashboardPopout
        title="Fiscal year health"
        eyebrow={`${percentUsed}% used`}
        description="A quick read on how much of the misc licensing budget is already committed."
        toneClassName={health.tile}
        triggerClassName={`min-w-0 p-0 ${health.tile}`}
        trigger={
          <div className="min-w-0 p-5 sm:p-6">
            <div className="mb-5 flex min-w-0 items-center justify-between gap-4">
              <div className="grid h-12 w-12 place-items-center rounded-lg bg-white">
                <WalletCards className={health.icon} aria-hidden="true" />
              </div>
              <span className="min-w-0 rounded-md bg-white px-3 py-1 text-sm font-extrabold text-foreground">{percentUsed}% used</span>
            </div>
            <p className="text-sm font-extrabold uppercase tracking-wide text-foreground">Fiscal year health</p>
            <div className="mt-4 h-5 rounded-md bg-white">
              <div className={`h-full rounded-md transition-all duration-500 ${health.bar}`} style={{ width: `${barPercent}%` }} />
            </div>
          </div>
        }
      >
        <HealthDetail model={model} health={health} barPercent={barPercent} percentUsed={percentUsed} />
      </DashboardPopout>
      {metrics.map((metric) => (
        <DashboardPopout
          key={metric.label}
          title={metric.label}
          eyebrow={metric.value}
          description={metric.description}
          toneClassName={metric.className}
          triggerClassName={`min-w-0 p-0 ${metric.className}`}
          trigger={
            <div className="min-w-0 p-5 sm:p-6">
              <div className="mb-4 grid h-12 w-12 place-items-center rounded-lg bg-white">
                <metric.icon className={health.icon} aria-hidden="true" />
              </div>
              <p className="text-sm font-extrabold uppercase tracking-wide text-foreground">{metric.label}</p>
              <p className="break-words font-display text-3xl font-extrabold tracking-tight">{metric.value}</p>
            </div>
          }
        >
          {metric.renderDetail()}
        </DashboardPopout>
      ))}
    </div>
  );
}

function HealthDetail({ model, health, barPercent, percentUsed }: { model: DashboardModel; health: ReturnType<typeof getBudgetHealth>; barPercent: number; percentUsed: number }) {
  return (
    <div className="grid gap-5 md:grid-cols-[minmax(0,1.3fr)_minmax(240px,0.7fr)]">
      <div className="rounded-lg bg-gray-50 p-5">
        <p className="text-sm font-extrabold uppercase tracking-wide text-muted">Budget progress</p>
        <div className="mt-4 h-6 rounded-md bg-white ring-1 ring-gray-200">
          <div className={`h-full rounded-md ${health.bar}`} style={{ width: `${barPercent}%` }} />
        </div>
        <p className="mt-3 text-sm font-bold text-muted">
          {percentUsed}% used, with {formatCurrency(model.remainingCents)} remaining from {formatCurrency(model.budgetCents)}.
        </p>
      </div>
      <MetricBreakdown
        rows={[
          ["Budget", formatCurrency(model.budgetCents)],
          ["Committed", formatCurrency(model.totalSpentCents)],
          ["Remaining", formatCurrency(model.remainingCents)]
        ]}
      />
    </div>
  );
}

function BudgetDetail({ model }: { model: DashboardModel }) {
  return (
    <MetricBreakdown
      rows={[
        ["Fiscal-year budget", formatCurrency(model.budgetCents)],
        ["Committed from this budget", formatCurrency(model.totalSpentCents)],
        ["Still available", formatCurrency(model.remainingCents)],
        ["Used", `${Math.max(0, model.percentUsed)}%`]
      ]}
    />
  );
}

function CommittedDetail({ model }: { model: DashboardModel }) {
  return (
    <MetricBreakdown
      rows={[
        ["Committed licensing spend", formatCurrency(model.totalSpentCents)],
        ["Budget", formatCurrency(model.budgetCents)],
        ["Remaining", formatCurrency(model.remainingCents)],
        ["Quarterly commitments", formatCurrency(model.cadenceTotals.quarterlyCents)],
        ["Yearly commitments", formatCurrency(model.cadenceTotals.yearlyCents)]
      ]}
    />
  );
}

function OtherBudgetsDetail({ model }: { model: DashboardModel }) {
  return (
    <MetricBreakdown
      rows={[
        ["Tracked outside misc licensing", formatCurrency(model.otherBudgetSpentCents)],
        ["Misc licensing committed", formatCurrency(model.totalSpentCents)],
        ["All tracked spend", formatCurrency(model.totalSpentCents + model.otherBudgetSpentCents)]
      ]}
    />
  );
}

function RemainingDetail({ model }: { model: DashboardModel }) {
  return (
    <MetricBreakdown
      rows={[
        ["Remaining", formatCurrency(model.remainingCents)],
        ["Budget", formatCurrency(model.budgetCents)],
        ["Committed", formatCurrency(model.totalSpentCents)],
        ["Remaining share", `${model.remainingPercent}%`]
      ]}
    />
  );
}

function MetricBreakdown({ rows }: { rows: Array<[string, string]> }) {
  return (
    <div className="grid gap-3">
      {rows.map(([label, value]) => (
        <div key={label} className="flex items-center justify-between gap-4 rounded-lg border border-gray-200 bg-gray-50 px-4 py-3">
          <span className="text-sm font-extrabold text-muted">{label}</span>
          <span className="text-right font-display text-xl font-extrabold text-foreground">{value}</span>
        </div>
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
