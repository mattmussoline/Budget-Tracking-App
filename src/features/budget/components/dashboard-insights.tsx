import { GalleryHorizontalEnd, Gauge, Repeat2 } from "lucide-react";
import { formatCurrency } from "@/lib/currency";
import type { DashboardModel } from "../dashboard-model";
import { getProviderColorMap, type ProviderColorOverrides } from "../provider-colors";
import { DashboardPopout } from "./dashboard-popout";
import { ProviderPieChart } from "./provider-pie-chart";
import { ProviderSummaryTable } from "./provider-summary";

type DashboardRow = [string, string];
const insightValueClassName = "break-words font-display text-2xl leading-none xl:text-[1.875rem]";
const insightDetailClassName = "text-xs text-faint";

export function DashboardInsights({
  model,
  providerColorOverrides,
  fiscalYearId,
  isDemo
}: {
  model: DashboardModel;
  providerColorOverrides: ProviderColorOverrides;
  fiscalYearId: string;
  isDemo?: boolean;
}) {
  const providerColorMap = getProviderColorMap(
    model.providers.map((provider) => provider.provider),
    providerColorOverrides
  );
  const items: Array<{
    label: string;
    value: string;
    detail: string;
    secondaryDetail?: string;
    icon: typeof GalleryHorizontalEnd;
    className: string;
    description: string;
    modalRows: DashboardRow[];
  }> = [
    {
      label: "Content pieces",
      value: String(model.insights.licenseCount),
      detail: `${model.insights.quarterlyLicenseCount} quarterly / ${model.insights.yearlyLicenseCount} yearly`,
      icon: GalleryHorizontalEnd,
      className: "bg-panel-warm",
      description: "Every content title currently tracked in this fiscal year.",
      modalRows: [
        ["Total content pieces", String(model.insights.licenseCount)],
        ["Quarterly cadence", String(model.insights.quarterlyLicenseCount)],
        ["Yearly cadence", String(model.insights.yearlyLicenseCount)],
        ["Active providers", String(model.insights.providerCount)]
      ]
    },
    {
      label: "Average rate",
      value: formatCurrency(model.insights.averageInstallmentCents),
      detail: "Average installment amount",
      icon: Gauge,
      className: "bg-panel-warm",
      description: "The average payment amount across tracked content.",
      modalRows: [
        ["Average installment", formatCurrency(model.insights.averageInstallmentCents)],
        ["Content pieces", String(model.insights.licenseCount)],
        ["Committed licensing spend", formatCurrency(model.totalSpentCents)]
      ]
    },
    {
      label: "Cadence mix",
      value: `${model.insights.quarterlyLicenseCount} / ${model.insights.yearlyLicenseCount}`,
      detail: `${formatCurrency(model.cadenceTotals.quarterlyCents)} quarterly`,
      secondaryDetail: `${formatCurrency(model.cadenceTotals.yearlyCents)} yearly`,
      icon: Repeat2,
      className: "bg-panel-warm",
      description: "How the fiscal year splits between quarterly and yearly payment rhythms.",
      modalRows: [
        ["Quarterly content pieces", String(model.insights.quarterlyLicenseCount)],
        ["Yearly content pieces", String(model.insights.yearlyLicenseCount)],
        ["Quarterly spend", formatCurrency(model.cadenceTotals.quarterlyCents)],
        ["Yearly spend", formatCurrency(model.cadenceTotals.yearlyCents)]
      ]
    }
  ];
  const providerTotal = model.providers.reduce((total, provider) => total + provider.licenseCount, 0);
  const pieSize = 84;
  const pieCenter = pieSize / 2;
  const pieStrokeWidth = 12;
  const pieRadius = (pieSize - pieStrokeWidth) / 2;
  const pieCircumference = 2 * Math.PI * pieRadius;
  const expandedPieSize = 220;
  const expandedPieCenter = expandedPieSize / 2;
  const expandedPieStrokeWidth = 64;
  const expandedPieRadius = (expandedPieSize - expandedPieStrokeWidth) / 2;
  const expandedPieCircumference = 2 * Math.PI * expandedPieRadius;
  let runningShare = 0;
  const providerSlices = model.providers.map((provider, index) => {
    const color = providerColorMap[provider.provider];
    const nextShare =
      index === model.providers.length - 1
        ? 100
        : runningShare + Math.round((provider.licenseCount / Math.max(providerTotal, 1)) * 100);
    const share = Math.max(nextShare - runningShare, 0);
    const contentLabel = `${provider.licenseCount} content piece${provider.licenseCount === 1 ? "" : "s"}`;
    const percentLabel = `${provider.licenseSharePercent}%`;
    const ariaLabel = `${provider.provider}: ${contentLabel}, ${percentLabel}`;
    const slice = {
      provider: provider.provider,
      color: color.hex,
      dashArray: `${(share / 100) * pieCircumference} ${pieCircumference}`,
      dashOffset: -((runningShare / 100) * pieCircumference),
      ariaLabel,
      contentLabel,
      percentLabel
    };
    runningShare = nextShare;
    return slice;
  });
  runningShare = 0;
  const expandedProviderSlices = model.providers.map((provider, index) => {
    const color = providerColorMap[provider.provider];
    const nextShare =
      index === model.providers.length - 1
        ? 100
        : runningShare + Math.round((provider.licenseCount / Math.max(providerTotal, 1)) * 100);
    const share = Math.max(nextShare - runningShare, 0);
    const contentLabel = `${provider.licenseCount} content piece${provider.licenseCount === 1 ? "" : "s"}`;
    const percentLabel = `${provider.licenseSharePercent}%`;
    const ariaLabel = `${provider.provider}: ${contentLabel}, ${percentLabel}`;
    const slice = {
      provider: provider.provider,
      color: color.hex,
      dashArray: `${(share / 100) * expandedPieCircumference} ${expandedPieCircumference}`,
      dashOffset: -((runningShare / 100) * expandedPieCircumference),
      ariaLabel,
      contentLabel,
      percentLabel
    };
    runningShare = nextShare;
    return slice;
  });
  const topProviders = model.providers.slice(0, 4);

  const providerLabel = [
    `${model.insights.providerCount} active provider${model.insights.providerCount === 1 ? "" : "s"}`,
    providerTotal > 0 ? `${providerTotal} content piece${providerTotal === 1 ? "" : "s"}` : "No provider content"
  ];

  return (
    <section className="grid min-w-0 gap-3">
      <div className="flex flex-wrap items-baseline gap-x-3 gap-y-1">
        <h2 className="font-display text-2xl">Licensing summary</h2>
        <p className="text-sm text-muted">Quick signals for how the licensing year is taking shape.</p>
      </div>
      <div className="grid min-w-0 gap-3.5 md:grid-cols-2 xl:grid-cols-[repeat(3,minmax(0,1fr))_minmax(0,1.4fr)]">
        {items.map((item) => (
          <DashboardPopout
            key={item.label}
            title={item.label}
            eyebrow={item.value}
            description={item.description}
            toneClassName={item.className}
            triggerClassName={`min-w-0 p-0 ${item.className}`}
            trigger={
              <div className="grid min-w-0 gap-1.5 overflow-hidden px-5 py-[18px]">
                <p className="text-xs font-semibold text-muted">{item.label}</p>
                <p className={insightValueClassName}>{item.value}</p>
                <p className={insightDetailClassName}>{item.detail}</p>
                {"secondaryDetail" in item ? <p className={insightDetailClassName}>{item.secondaryDetail}</p> : null}
              </div>
            }
          >
            <DashboardRows rows={item.modalRows} />
          </DashboardPopout>
        ))}
        <DashboardPopout
          title="Active Providers"
          eyebrow={providerLabel[0]}
          description={providerLabel[1]}
          toneClassName="bg-panel-warm text-foreground"
          triggerClassName="min-w-0 bg-panel-warm p-0"
          trigger={
            <div className="flex min-w-0 items-center gap-5 px-5 py-[18px]">
            <div className="shrink-0">
              <ProviderPieChart
                center={pieCenter}
                centerTextClassName="font-display text-2xl"
                providerCount={model.insights.providerCount}
                radius={pieRadius}
                size={pieSize}
                slices={providerSlices}
                strokeWidth={pieStrokeWidth}
              />
            </div>
            <div className="grid min-w-0 flex-1 content-center gap-1.5">
              <p className="text-xs font-semibold text-muted">Active providers</p>
              {topProviders.length === 0 ? (
                <p className="text-xs text-faint">Providers appear here after content is added.</p>
              ) : (
                topProviders.map((provider) => {
                  const color = providerColorMap[provider.provider];

                  return (
                    <div key={provider.provider} className="flex items-center justify-between gap-3 text-xs">
                      <span className="flex min-w-0 items-center gap-2">
                        <span className={`h-2.5 w-2.5 shrink-0 rounded-full ${color.marker}`} />
                        <span className="truncate">{provider.provider}</span>
                      </span>
                      <span className="text-muted">{provider.licenseSharePercent}%</span>
                    </div>
                  );
                })
              )}
            </div>
          </div>
          }
        >
          <div className="grid gap-6 lg:grid-cols-[300px_minmax(0,1fr)]">
              <div className="grid content-start justify-items-center gap-4 rounded-soft border border-hairline bg-panel-warm p-5">
                <ProviderPieChart
                  center={expandedPieCenter}
                  centerClassName="bg-panel-warm"
                  providerCount={model.insights.providerCount}
                  radius={expandedPieRadius}
                  size={expandedPieSize}
                  slices={expandedProviderSlices}
                  strokeWidth={expandedPieStrokeWidth}
                />
                <div className="text-center">
                  <p className="text-xs font-semibold text-muted">Provider mix</p>
                  <p className="font-display text-2xl">{providerLabel[0]}</p>
                  <p className="text-sm font-bold opacity-75">{providerLabel[1]}</p>
                </div>
              </div>
              <div className="min-w-0 overflow-hidden rounded-lg border border-hairline">
                <ProviderSummaryTable
                  fiscalYearId={fiscalYearId}
                  isDemo={isDemo}
                  providerColorMap={providerColorMap}
                  providerColorOverrides={providerColorOverrides}
                  providers={model.providers}
                />
              </div>
            </div>
        </DashboardPopout>
      </div>
    </section>
  );
}

function DashboardRows({ rows }: { rows: DashboardRow[] }) {
  return (
    <div className="grid gap-3">
      {rows.map(([label, value]) => (
        <div key={label} className="flex items-center justify-between gap-4 rounded-lg border border-hairline bg-panel-warm px-4 py-3">
          <span className="text-sm font-semibold text-muted">{label}</span>
          <span className="text-right font-display text-xl text-foreground">{value}</span>
        </div>
      ))}
    </div>
  );
}
