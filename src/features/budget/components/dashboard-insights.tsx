import { GalleryHorizontalEnd, Gauge, Repeat2 } from "lucide-react";
import { formatCurrency } from "@/lib/currency";
import { SoftSurface } from "@/components/ui/soft-surface";
import type { DashboardModel } from "../dashboard-model";
import { getProviderColorMap, type ProviderColorOverrides } from "../provider-colors";
import { ProviderPieChart } from "./provider-pie-chart";

export function DashboardInsights({
  model,
  providerColorOverrides
}: {
  model: DashboardModel;
  providerColorOverrides: ProviderColorOverrides;
}) {
  const providerColorMap = getProviderColorMap(
    model.providers.map((provider) => provider.provider),
    providerColorOverrides
  );
  const items = [
    {
      label: "Content pieces",
      value: String(model.insights.licenseCount),
      detail: `${model.insights.quarterlyLicenseCount} quarterly / ${model.insights.yearlyLicenseCount} yearly`,
      icon: GalleryHorizontalEnd,
      className: "bg-blue-100 text-blue-950"
    },
    {
      label: "Average rate",
      value: formatCurrency(model.insights.averageInstallmentCents),
      detail: "Average installment amount",
      icon: Gauge,
      className: "bg-emerald-100 text-emerald-950"
    },
    {
      label: "Cadence mix",
      value: `${model.insights.quarterlyLicenseCount} / ${model.insights.yearlyLicenseCount}`,
      detail: `${formatCurrency(model.cadenceTotals.quarterlyCents)} quarterly`,
      secondaryDetail: `${formatCurrency(model.cadenceTotals.yearlyCents)} yearly`,
      icon: Repeat2,
      className: "bg-teal-100 text-teal-950"
    }
  ];
  const providerTotal = model.providers.reduce((total, provider) => total + provider.licenseCount, 0);
  const pieSize = 112;
  const pieCenter = pieSize / 2;
  const pieStrokeWidth = 40;
  const pieRadius = (pieSize - pieStrokeWidth) / 2;
  const pieCircumference = 2 * Math.PI * pieRadius;
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
  const topProviders = model.providers.slice(0, 4);

  const providerLabel = [
    `${model.insights.providerCount} active provider${model.insights.providerCount === 1 ? "" : "s"}`,
    providerTotal > 0 ? `${providerTotal} content piece${providerTotal === 1 ? "" : "s"}` : "No provider content"
  ];

  return (
    <SoftSurface className="bg-white p-6 md:p-8">
      <div className="mb-5">
        <h2 className="font-display text-2xl font-extrabold tracking-tight">Dashboard</h2>
        <p className="text-sm font-medium text-muted">Quick signals for how the licensing year is taking shape.</p>
      </div>
      <div className="grid gap-4 lg:grid-cols-[repeat(3,minmax(0,1fr))_minmax(0,1.4fr)]">
        {items.map((item) => (
          <div key={item.label} className={`min-w-0 rounded-lg p-5 ${item.className}`}>
            <div className="mb-4 grid h-11 w-11 place-items-center rounded-lg bg-white">
              <item.icon className="h-5 w-5" aria-hidden="true" />
            </div>
            <p className="text-xs font-extrabold uppercase tracking-wide opacity-75">{item.label}</p>
            <p className="font-display text-3xl font-extrabold tracking-tight">{item.value}</p>
            <p className="mt-1 text-sm font-bold opacity-75">{item.detail}</p>
            {"secondaryDetail" in item ? <p className="text-sm font-bold opacity-75">{item.secondaryDetail}</p> : null}
          </div>
        ))}
        <div className="grid min-w-0 gap-4 rounded-lg bg-amber-100 p-5 text-amber-950 md:grid-cols-[112px_minmax(0,1fr)]">
          <div className="grid place-items-center">
            <ProviderPieChart
              center={pieCenter}
              providerCount={model.insights.providerCount}
              radius={pieRadius}
              size={pieSize}
              slices={providerSlices}
              strokeWidth={pieStrokeWidth}
            />
          </div>
          <div className="grid min-w-0 content-center gap-3">
            <div>
              <p className="text-xs font-extrabold uppercase tracking-wide opacity-75">Providers</p>
              <p className="text-wrap font-display text-xl font-extrabold leading-tight tracking-tight">{providerLabel[0]}</p>
              <p className="text-sm font-bold opacity-75">{providerLabel[1]}</p>
            </div>
            <div className="grid gap-2">
              {topProviders.length === 0 ? (
                <p className="text-sm font-bold opacity-75">Providers appear here after content is added.</p>
              ) : (
                topProviders.map((provider) => {
                  const color = providerColorMap[provider.provider];

                  return (
                    <div key={provider.provider} className="flex items-center justify-between gap-3 text-sm font-extrabold">
                      <span className="flex min-w-0 items-center gap-2">
                        <span className={`h-3 w-3 shrink-0 rounded-full ${color.marker}`} />
                        <span className="truncate">{provider.provider}</span>
                      </span>
                      <span>{provider.licenseSharePercent}%</span>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        </div>
      </div>
    </SoftSurface>
  );
}
