import { Save } from "lucide-react";
import { formatCurrency } from "@/lib/currency";
import { SoftButton } from "@/components/ui/soft-button";
import { SoftSurface } from "@/components/ui/soft-surface";
import { updateProviderColor } from "../budget-actions";
import type { DashboardModel } from "../dashboard-model";
import { getProviderColorMap, providerColorOptions, type ProviderColorOverrides } from "../provider-colors";

type ProviderSummaryProps = {
  model: DashboardModel;
  fiscalYearId: string;
  providerColorOverrides: ProviderColorOverrides;
  isDemo?: boolean;
};

export function ProviderSummary({ model, fiscalYearId, providerColorOverrides, isDemo }: ProviderSummaryProps) {
  const providerColorMap = getProviderColorMap(
    model.providers.map((provider) => provider.provider),
    providerColorOverrides
  );

  return (
    <SoftSurface className="bg-white p-6 md:p-8">
      <div className="mb-5 flex items-end justify-between gap-4">
        <div>
          <h2 className="font-display text-2xl font-extrabold tracking-tight">Provider Summary</h2>
          {model.providers.length > 0 ? (
            <p className="mt-1 text-xs font-bold uppercase tracking-wide text-muted">
              {model.providers.length} provider{model.providers.length === 1 ? "" : "s"}
            </p>
          ) : null}
        </div>
      </div>
      <div className="overflow-hidden rounded-lg border border-gray-100 bg-white">
        {model.providers.length === 0 ? (
          <p className="px-3 py-3 text-sm font-medium text-muted">Providers will appear here after content is added.</p>
        ) : (
          model.providers.map((provider) => {
            const color = providerColorMap[provider.provider];
            const colorSelectId = `provider-color-${provider.provider.toLowerCase().replace(/[^a-z0-9]+/g, "-")}`;

            return (
              <div key={provider.provider} className="grid gap-2 border-b border-gray-100 px-3 py-3 last:border-b-0">
                <div className="grid grid-cols-[minmax(0,1fr)_auto] items-start gap-3">
                  <div className="flex min-w-0 items-start gap-3">
                    <span className={`mt-1.5 h-3 w-3 shrink-0 rounded-full ${color.marker}`} />
                    <div className="min-w-0">
                      <p className="truncate text-sm font-extrabold text-foreground">{provider.provider}</p>
                      <p className="text-xs font-bold text-muted">
                        {provider.licenseCount} title{provider.licenseCount === 1 ? "" : "s"}
                      </p>
                    </div>
                  </div>
                  <span className="font-display text-base font-extrabold text-foreground">{formatCurrency(provider.totalCents)}</span>
                </div>
                <form action={updateProviderColor} className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-2 pl-6">
                  <input type="hidden" name="fiscalYearId" value={fiscalYearId} />
                  <input type="hidden" name="provider" value={provider.provider} />
                  <label className="sr-only" htmlFor={colorSelectId}>
                    Color for {provider.provider}
                  </label>
                  <select
                    id={colorSelectId}
                    name="colorKey"
                    defaultValue={providerColorOverrides[provider.provider] ?? color.key}
                    disabled={isDemo}
                    className={`min-h-8 rounded-md border-0 px-2 text-xs font-extrabold ${color.bg} ${color.text} disabled:opacity-60`}
                  >
                    {providerColorOptions.map((option) => (
                      <option key={option.key} value={option.key}>
                        {option.label}
                      </option>
                    ))}
                  </select>
                  <SoftButton
                    type="submit"
                    variant="ghost"
                    className="min-h-8 rounded-md bg-gray-50 px-2 py-1 text-gray-600 hover:bg-gray-100"
                    disabled={isDemo}
                    aria-label={`Save color for ${provider.provider}`}
                    title="Save color"
                  >
                    <Save className="h-3.5 w-3.5" aria-hidden="true" />
                  </SoftButton>
                </form>
              </div>
            );
          })
        )}
      </div>
    </SoftSurface>
  );
}
