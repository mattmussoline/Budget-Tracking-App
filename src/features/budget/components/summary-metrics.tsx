import { formatCurrency, formatCurrencyWholeDollars } from "@/lib/currency";
import { cn } from "@/components/ui/soft-surface";
import type { DashboardModel } from "../dashboard-model";
import { DashboardPopout } from "./dashboard-popout";

type SummaryMetricsProps = {
  model: DashboardModel;
};

/**
 * The Sanctuary KPI row: a wider fiscal-year health tile followed by four flat
 * figure tiles. Colour only appears on the health tile and on Committed, so the
 * eye lands on the two numbers that carry a judgement.
 */
export function SummaryMetrics({ model }: SummaryMetricsProps) {
  const percentUsed = Math.max(0, model.percentUsed);
  const barPercent = Math.min(100, percentUsed);
  const health = getBudgetHealth(model.remainingPercent);
  const metrics = [
    {
      label: "Budget",
      value: formatCurrencyWholeDollars(model.budgetCents),
      className: "",
      valueClassName: "",
      labelClassName: "",
      description: "The fiscal-year licensing budget for misc licensing spend.",
      renderDetail: () => <BudgetDetail model={model} />
    },
    {
      label: "Committed",
      value: formatCurrencyWholeDollars(model.totalSpentCents),
      className: health.committedTile,
      valueClassName: health.accentText,
      labelClassName: health.accentText,
      description: "Misc licensing payments already committed inside this fiscal year.",
      renderDetail: () => <CommittedDetail model={model} />
    },
    {
      label: "Other budgets",
      value: formatCurrencyWholeDollars(model.otherBudgetSpentCents),
      className: "",
      valueClassName: "",
      labelClassName: "",
      description: "Spend tracked here but paid by another source, such as internal production or donor-funded budgets.",
      renderDetail: () => <OtherBudgetsDetail model={model} />
    },
    {
      label: "Remaining",
      value: formatCurrencyWholeDollars(model.remainingCents),
      className: "",
      valueClassName: "",
      labelClassName: "",
      description: "Budget left after misc licensing commitments.",
      renderDetail: () => <RemainingDetail model={model} />
    }
  ];

  return (
    <div className="grid min-w-0 gap-3.5 sm:grid-cols-2 lg:grid-cols-[minmax(0,1.25fr)_repeat(4,minmax(0,1fr))]">
      <DashboardPopout
        title="Fiscal year health"
        eyebrow={`${percentUsed}% used`}
        description="A quick read on how much of the misc licensing budget is already committed."
        toneClassName={health.tile}
        triggerClassName="min-w-0 bg-panel-warm p-0"
        trigger={
          <div className="grid min-w-0 gap-2.5 px-5 py-[18px]">
            <div className="flex min-w-0 items-center justify-between gap-2.5">
              <span className="text-xs font-semibold text-muted">Fiscal year health</span>
              <span className={cn("shrink-0 rounded-md px-1.5 py-0.5 text-[11px] font-bold", health.chip)}>{percentUsed}% used</span>
            </div>
            <p className={cn("font-display text-3xl leading-none", health.accentText)}>{health.label}</p>
            <div className="h-[7px] overflow-hidden rounded-full bg-tone-slate-bg">
              <div className={cn("h-full rounded-full transition-all duration-500", health.bar)} style={{ width: `${barPercent}%` }} />
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
          toneClassName={metric.className || "bg-panel-warm text-foreground"}
          triggerClassName={cn("min-w-0 p-0", metric.className || "bg-panel-warm")}
          trigger={
            <div className="grid min-w-0 gap-1.5 px-5 py-[18px]">
              <span className={cn("text-xs font-semibold text-muted", metric.labelClassName)}>{metric.label}</span>
              <p className={cn("break-words font-display text-[2rem] leading-none", metric.valueClassName)}>{metric.value}</p>
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
      <div className="rounded-soft border border-hairline bg-panel-warm p-5">
        <p className="text-xs font-semibold text-muted">Budget progress</p>
        <div className="mt-4 h-4 overflow-hidden rounded-full bg-tone-slate-bg">
          <div className={cn("h-full rounded-full", health.bar)} style={{ width: `${barPercent}%` }} />
        </div>
        <p className="mt-3 text-sm font-medium text-muted">
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
    <div className="grid gap-2.5">
      {rows.map(([label, value]) => (
        <div key={label} className="flex items-center justify-between gap-4 rounded-lg border border-hairline bg-panel-warm px-4 py-3">
          <span className="text-sm font-medium text-muted">{label}</span>
          <span className="text-right font-display text-xl text-foreground">{value}</span>
        </div>
      ))}
    </div>
  );
}

function getBudgetHealth(remainingPercent: number) {
  if (remainingPercent < 0) {
    return {
      label: "Over budget",
      tile: "bg-danger-soft text-danger",
      committedTile: "border-danger-border bg-danger-soft",
      chip: "bg-danger-soft text-danger",
      accentText: "text-danger",
      bar: "bg-danger"
    };
  }

  if (remainingPercent < 30) {
    return {
      label: "Watch closely",
      tile: "bg-guild-gold-soft text-guild-gold-ink",
      committedTile: "border-guild-gold bg-guild-gold-soft",
      chip: "bg-guild-gold-soft text-guild-gold-ink",
      accentText: "text-guild-gold-ink",
      bar: "bg-guild-gold"
    };
  }

  return {
    label: "On track",
    tile: "bg-deep-teal-soft text-deep-teal",
    committedTile: "border-tone-cyan-line bg-deep-teal-soft",
    chip: "bg-deep-teal-soft text-deep-teal",
    accentText: "text-deep-teal",
    bar: "bg-deep-teal"
  };
}
