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
      <h2 className="mb-5 font-display text-2xl font-extrabold tracking-tight">Provider Summary</h2>
      <div className="grid gap-3">
        {model.providers.length === 0 ? (
          <p className="text-sm font-medium text-muted">Providers will appear here after content is added.</p>
        ) : (
          model.providers.map((provider) => {
            const color = getProviderColor(provider.provider, providerColorOverrides);

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
              <form action={updateProviderColor} className="grid gap-2 sm:grid-cols-[1fr_auto]">
                <input type="hidden" name="fiscalYearId" value={fiscalYearId} />
                <input type="hidden" name="provider" value={provider.provider} />
                <label className="grid gap-1 text-[10px] font-extrabold uppercase tracking-wide">
                  Color
                  <select
                    name="colorKey"
                    defaultValue={providerColorOverrides[provider.provider] ?? color.key}
                    disabled={isDemo}
                    className="min-h-10 rounded-md border-0 bg-white px-3 text-sm font-bold normal-case tracking-normal text-gray-900 disabled:opacity-60"
                  >
                    {providerColorOptions.map((option) => (
                      <option key={option.key} value={option.key}>
                        {option.label}
                      </option>
                    ))}
                  </select>
                </label>
                <SoftButton type="submit" variant="ghost" className="self-end bg-white/70" disabled={isDemo}>
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
