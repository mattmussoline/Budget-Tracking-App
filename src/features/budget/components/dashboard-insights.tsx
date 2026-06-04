import { GalleryHorizontalEnd, Gauge } from "lucide-react";
import { formatCurrency } from "@/lib/currency";
import { SoftSurface } from "@/components/ui/soft-surface";
import type { DashboardModel } from "../dashboard-model";
import { getProviderColor, type ProviderColorOverrides } from "../provider-colors";

export function DashboardInsights({
  model,
  providerColorOverrides
}: {
  model: DashboardModel;
  providerColorOverrides: ProviderColorOverrides;
}) {
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
  ];
  const providerTotal = model.providers.reduce((total, provider) => total + provider.totalCents, 0);
  let runningPercent = 0;
  const providerStops = model.providers.map((provider, index) => {
    const color = getProviderColor(provider.provider, providerColorOverrides);
    const nextPercent =
      index === model.providers.length - 1
        ? 100
        : runningPercent + Math.round((provider.totalCents / Math.max(providerTotal, 1)) * 100);
    const stop = `${color.hex} ${runningPercent}% ${nextPercent}%`;
    runningPercent = nextPercent;
    return stop;
  });
  const pieBackground = providerStops.length > 0 ? `conic-gradient(${providerStops.join(", ")})` : "#e5e7eb";
  const topProviders = model.providers.slice(0, 4);

  const providerLabel = [
    `${model.insights.providerCount} active provider${model.insights.providerCount === 1 ? "" : "s"}`,
    providerTotal > 0 ? formatCurrency(providerTotal) : "No provider spend"
  ];

  return (
    <SoftSurface className="bg-white p-6 md:p-8">
      <div className="mb-5">
        <h2 className="font-display text-2xl font-extrabold tracking-tight">Dashboard</h2>
        <p className="text-sm font-medium text-muted">Quick signals for how the licensing year is taking shape.</p>
      </div>
      <div className="grid gap-4 lg:grid-cols-[1fr_1fr_1.4fr]">
        {items.map((item) => (
          <div key={item.label} className={`rounded-lg p-5 ${item.className}`}>
            <div className="mb-4 grid h-11 w-11 place-items-center rounded-lg bg-white">
              <item.icon className="h-5 w-5" aria-hidden="true" />
            </div>
            <p className="text-xs font-extrabold uppercase tracking-wide opacity-75">{item.label}</p>
            <p className="font-display text-3xl font-extrabold tracking-tight">{item.value}</p>
            <p className="mt-1 text-sm font-bold opacity-75">{item.detail}</p>
          </div>
        ))}
        <div className="grid gap-5 rounded-lg bg-amber-100 p-5 text-amber-950 md:grid-cols-[140px_1fr]">
          <div className="grid place-items-center">
            <div className="relative h-32 w-32 rounded-full" style={{ background: pieBackground }}>
              <div className="absolute inset-6 grid place-items-center rounded-full bg-amber-100 text-center">
                <span className="font-display text-3xl font-extrabold">{model.insights.providerCount}</span>
              </div>
            </div>
          </div>
          <div className="grid content-center gap-3">
            <div>
              <p className="text-xs font-extrabold uppercase tracking-wide opacity-75">Providers</p>
              <p className="font-display text-2xl font-extrabold tracking-tight">{providerLabel[0]}</p>
              <p className="text-sm font-bold opacity-75">{providerLabel[1]}</p>
            </div>
            <div className="grid gap-2">
              {topProviders.length === 0 ? (
                <p className="text-sm font-bold opacity-75">Providers appear here after content is added.</p>
              ) : (
                topProviders.map((provider) => {
                  const color = getProviderColor(provider.provider, providerColorOverrides);
                  const percent = providerTotal > 0 ? Math.round((provider.totalCents / providerTotal) * 100) : 0;

                  return (
                    <div key={provider.provider} className="flex items-center justify-between gap-3 text-sm font-extrabold">
                      <span className="flex min-w-0 items-center gap-2">
                        <span className={`h-3 w-3 shrink-0 rounded-full ${color.marker}`} />
                        <span className="truncate">{provider.provider}</span>
                      </span>
                      <span>{percent}%</span>
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
