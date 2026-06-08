import { formatCurrency } from "@/lib/currency";
import { SoftButton } from "@/components/ui/soft-button";
import { SoftSurface } from "@/components/ui/soft-surface";
import { updateProviderColor } from "../budget-actions";
import type { DashboardModel } from "../dashboard-model";
import { getProviderColor, providerColorOptions, type ProviderColorOverrides } from "../provider-colors";

type ProviderSummaryProps = {
  model: DashboardModel;
  fiscalYearId: string;
  providerColorOverrides: ProviderColorOverrides;
  isDemo?: boolean;
};

export function ProviderSummary({ model, fiscalYearId, providerColorOverrides, isDemo }: ProviderSummaryProps) {
  return (
    <SoftSurface className="bg-white p-6 md:p-8">
      <div className="mb-5">
        <h2 className="font-display text-2xl font-extrabold tracking-tight">Provider Keys & Colors</h2>
      </div>
      <div className="grid gap-3">
        {model.providers.length === 0 ? (
          <p className="text-sm font-medium text-muted">Providers will appear here after content is added.</p>
        ) : (
          model.providers.map((provider) => {
            const color = getProviderColor(provider.provider, providerColorOverrides);
            const selectedColorKey = providerColorOverrides[provider.provider] ?? color.key;

            return (
              <div key={provider.provider} className={`grid gap-4 rounded-lg p-4 ${color.bg} ${color.text}`}>
                <div className="flex items-center justify-between gap-4">
                  <div className="flex min-w-0 items-center gap-3">
                    <span className={`h-4 w-4 shrink-0 rounded-full ${color.marker}`} />
                    <div className="min-w-0">
                      <p className="truncate font-extrabold">{provider.provider}</p>
                      <p className="text-xs font-bold opacity-70">{provider.licenseCount} title{provider.licenseCount === 1 ? "" : "s"}</p>
                    </div>
                  </div>
                  <span className="font-display text-lg font-extrabold">{formatCurrency(provider.totalCents)}</span>
                </div>
                <form action={updateProviderColor} className="grid gap-3">
                  <input type="hidden" name="fiscalYearId" value={fiscalYearId} />
                  <input type="hidden" name="provider" value={provider.provider} />
                  <fieldset className="grid gap-2">
                    <legend className="text-[10px] font-extrabold uppercase tracking-wide opacity-75">Color key</legend>
                    <div className="flex flex-wrap gap-2">
                      {providerColorOptions.map((option) => (
                        <label key={option.key} className="cursor-pointer">
                          <input
                            className="peer sr-only"
                            type="radio"
                            name="colorKey"
                            value={option.key}
                            defaultChecked={selectedColorKey === option.key}
                            disabled={isDemo}
                          />
                          <span className="grid h-10 w-10 place-items-center rounded-md bg-white shadow-sm ring-2 ring-transparent transition peer-checked:ring-gray-950 peer-disabled:cursor-not-allowed peer-disabled:opacity-50">
                            <span className={`h-5 w-5 rounded-full ${option.marker}`} />
                            <span className="sr-only">{option.label}</span>
                          </span>
                        </label>
                      ))}
                    </div>
                  </fieldset>
                  <SoftButton type="submit" variant="ghost" className="w-fit bg-white/70" disabled={isDemo}>
                    Save
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
