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
    <SoftSurface className="overflow-hidden border border-gray-200 bg-white">
      <div className="flex flex-col gap-3 border-b border-gray-200 p-5 sm:flex-row sm:items-end sm:justify-between md:p-6">
        <div>
          <h2 className="font-display text-2xl font-extrabold tracking-tight">Provider Summary</h2>
          <p className="mt-1 text-sm font-medium text-muted">
            {model.providers.length
              ? `${model.providers.length} provider${model.providers.length === 1 ? "" : "s"} tracked across the fiscal year.`
              : "Providers will appear here after content is added."}
          </p>
        </div>
        {model.providers.length > 0 ? (
          <span className="w-fit rounded-md bg-gray-100 px-3 py-2 text-xs font-extrabold uppercase tracking-wide text-muted">
            Color settings
          </span>
        ) : null}
      </div>
      {model.providers.length === 0 ? (
        <p className="p-5 text-sm font-medium text-muted md:p-6">Providers will appear here after content is added.</p>
      ) : (
        <div className="overflow-x-auto">
          <table className="min-w-[760px] w-full border-collapse">
            <thead>
              <tr className="bg-gray-50 text-left text-[10px] font-extrabold uppercase tracking-wide text-muted">
                <th scope="col" className="px-5 py-3 md:px-6">
                  Provider
                </th>
                <th scope="col" className="px-4 py-3 text-right">
                  Titles
                </th>
                <th scope="col" className="px-4 py-3 text-right">
                  Spend
                </th>
                <th scope="col" className="px-4 py-3">
                  Color
                </th>
                <th scope="col" className="px-5 py-3 text-right md:px-6">
                  Save
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {model.providers.map((provider) => {
                const color = providerColorMap[provider.provider];
                const colorSelectId = `provider-color-${provider.provider.toLowerCase().replace(/[^a-z0-9]+/g, "-")}`;

                return (
                  <tr key={provider.provider} className="align-middle">
                    <td className="px-5 py-3 md:px-6">
                      <div className="flex min-w-0 items-center gap-3">
                        <span className={`h-3 w-3 shrink-0 rounded-full ${color.marker}`} />
                        <span className="min-w-0 truncate text-sm font-extrabold text-foreground">{provider.provider}</span>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-right text-sm font-bold text-muted">
                      {provider.licenseCount}
                    </td>
                    <td className="px-4 py-3 text-right font-display text-base font-extrabold text-foreground">
                      {formatCurrency(provider.totalCents)}
                    </td>
                    <td className="px-4 py-3">
                      <form id={`provider-color-form-${colorSelectId}`} action={updateProviderColor} className="contents">
                        <input type="hidden" name="fiscalYearId" value={fiscalYearId} />
                        <input type="hidden" name="provider" value={provider.provider} />
                      </form>
                      <label className="sr-only" htmlFor={colorSelectId}>
                        Color for {provider.provider}
                      </label>
                      <select
                        id={colorSelectId}
                        form={`provider-color-form-${colorSelectId}`}
                        name="colorKey"
                        defaultValue={providerColorOverrides[provider.provider] ?? color.key}
                        disabled={isDemo}
                        className={`min-h-9 w-full rounded-md border-0 px-2 text-xs font-extrabold ${color.bg} ${color.text} disabled:opacity-60`}
                      >
                        {providerColorOptions.map((option) => (
                          <option key={option.key} value={option.key}>
                            {option.label}
                          </option>
                        ))}
                      </select>
                    </td>
                    <td className="px-5 py-3 text-right md:px-6">
                      <SoftButton
                        type="submit"
                        form={`provider-color-form-${colorSelectId}`}
                        variant="ghost"
                        className="min-h-9 rounded-md bg-gray-50 px-3 py-2 text-gray-600 hover:bg-gray-100"
                        disabled={isDemo}
                        aria-label={`Save color for ${provider.provider}`}
                        title="Save color"
                      >
                        <Save className="h-3.5 w-3.5" aria-hidden="true" />
                      </SoftButton>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </SoftSurface>
  );
}
