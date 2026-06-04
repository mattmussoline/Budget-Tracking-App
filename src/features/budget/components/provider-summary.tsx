import { formatCurrency } from "@/lib/currency";
import { SoftSurface } from "@/components/ui/soft-surface";
import type { DashboardModel } from "../dashboard-model";

type ProviderSummaryProps = {
  model: DashboardModel;
};

export function ProviderSummary({ model }: ProviderSummaryProps) {
  return (
    <SoftSurface className="p-6 md:p-8">
      <h2 className="mb-5 font-display text-2xl font-extrabold tracking-tight">Provider Summary</h2>
      <div className="grid gap-3">
        {model.providers.length === 0 ? (
          <p className="text-sm font-medium text-muted">Providers will appear here after content is added.</p>
        ) : (
          model.providers.map((provider) => (
            <div key={provider.provider} className="flex items-center justify-between gap-4 rounded-2xl p-4 soft-inset">
              <span className="font-bold">{provider.provider}</span>
              <span className="font-display text-lg font-extrabold">{formatCurrency(provider.totalCents)}</span>
            </div>
          ))
        )}
      </div>
    </SoftSurface>
  );
}
