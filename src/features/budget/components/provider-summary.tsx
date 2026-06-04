import { formatCurrency } from "@/lib/currency";
import { SoftSurface } from "@/components/ui/soft-surface";
import type { DashboardModel } from "../dashboard-model";
import { getProviderColor } from "../provider-colors";

type ProviderSummaryProps = {
  model: DashboardModel;
};

export function ProviderSummary({ model }: ProviderSummaryProps) {
  return (
    <SoftSurface className="bg-white p-6 md:p-8">
      <h2 className="mb-5 font-display text-2xl font-extrabold tracking-tight">Provider Summary</h2>
      <div className="grid gap-3">
        {model.providers.length === 0 ? (
          <p className="text-sm font-medium text-muted">Providers will appear here after content is added.</p>
        ) : (
          model.providers.map((provider) => {
            const color = getProviderColor(provider.provider);

            return (
            <div key={provider.provider} className={`flex items-center justify-between gap-4 rounded-lg p-4 ${color.bg} ${color.text}`}>
              <div className="flex min-w-0 items-center gap-3">
                <span className={`h-4 w-4 shrink-0 rounded-full ${color.marker}`} />
                <div className="min-w-0">
                  <p className="truncate font-extrabold">{provider.provider}</p>
                  <p className="text-xs font-bold opacity-70">{provider.licenseCount} title{provider.licenseCount === 1 ? "" : "s"}</p>
                </div>
              </div>
              <span className="font-display text-lg font-extrabold">{formatCurrency(provider.totalCents)}</span>
            </div>
            );
          })
        )}
      </div>
    </SoftSurface>
  );
}
