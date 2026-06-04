import { formatCurrency } from "@/lib/currency";
import { SoftSurface } from "@/components/ui/soft-surface";
import type { DashboardModel } from "../dashboard-model";
import { getProviderColor, type ProviderColorOverrides } from "../provider-colors";

type MonthBoardProps = {
  model: DashboardModel;
  providerColorOverrides: ProviderColorOverrides;
};

export function MonthBoard({ model, providerColorOverrides }: MonthBoardProps) {
  const quarterNumbers = [1, 2, 3, 4];
  const orderedQuarterNumbers = model.currentFiscalQuarter
    ? [model.currentFiscalQuarter, ...quarterNumbers.filter((quarter) => quarter !== model.currentFiscalQuarter)]
    : quarterNumbers;
  const quarters = orderedQuarterNumbers.map((quarter) => ({
    quarter,
    isCurrentQuarter: model.currentFiscalQuarter === quarter,
    months: model.months.filter((month) => month.quarter === quarter)
  }));

  return (
    <div className="grid gap-6">
      {quarters.map((quarter) => (
        <SoftSurface
          key={quarter.quarter}
          className={`p-5 md:p-6 ${quarter.isCurrentQuarter ? "bg-amber-50 outline outline-4 outline-amber-300" : "bg-gray-100"}`}
        >
          <div className="mb-5 flex items-center justify-between gap-4">
            <div>
              {quarter.isCurrentQuarter ? (
                <p className="text-xs font-extrabold uppercase tracking-wide text-amber-700">Current quarter</p>
              ) : null}
              <h2 className="font-display text-xl font-extrabold tracking-tight">Quarter {quarter.quarter}</h2>
            </div>
            <p className="rounded-md bg-white px-4 py-2 text-sm font-extrabold text-muted">
              {formatCurrency(quarter.months.reduce((total, month) => total + month.totalCents, 0))}
            </p>
          </div>
          <div className="grid gap-4 lg:grid-cols-3">
            {quarter.months.map((month) => {
              const isCurrentMonth = model.currentFiscalMonth === month.index;

              return (
              <div
                key={month.index}
                className={`min-h-48 rounded-lg p-4 ${isCurrentMonth ? "bg-amber-100 outline outline-4 outline-amber-400" : "bg-white"}`}
              >
                <div className="mb-4 flex items-center justify-between gap-3">
                  <div>
                    <h3 className="font-display text-lg font-extrabold tracking-tight">{month.label}</h3>
                    {isCurrentMonth ? <span className="text-xs font-extrabold uppercase tracking-wide text-amber-700">Current month</span> : null}
                  </div>
                  <span className="text-sm font-extrabold text-muted">{formatCurrency(month.totalCents)}</span>
                </div>
                <div className="grid gap-3">
                  {month.payments.length === 0 ? (
                    <p className="text-sm font-medium text-muted">No payments</p>
                  ) : (
                    month.payments.map((payment) => {
                      const providerColor = getProviderColor(payment.provider, providerColorOverrides);
                      const tileClass = `${providerColor.bg} ${providerColor.text}`;

                      return (
                      <div key={`${payment.licenseId}-${payment.fiscalMonth}`} className={`rounded-lg p-3 ${tileClass}`}>
                        <div className="mb-2 flex items-start justify-between gap-3">
                          <p className="text-sm font-extrabold">{payment.title}</p>
                          {payment.isFirstPayment ? (
                            <span className="rounded-md bg-white px-2 py-1 text-[10px] font-extrabold uppercase tracking-wide text-gray-900">
                              first
                            </span>
                          ) : null}
                        </div>
                        <p className="text-xs font-bold opacity-80">{payment.provider}</p>
                        <div className="mt-2 flex items-center justify-between gap-2">
                          <span className="text-sm font-extrabold">{formatCurrency(payment.amountCents)}</span>
                          {payment.isProrated ? (
                            <span className="rounded-md bg-white/70 px-2 py-1 text-xs font-extrabold">
                              prorated
                            </span>
                          ) : null}
                        </div>
                      </div>
                    );
                    })
                  )}
                </div>
              </div>
              );
            })}
          </div>
        </SoftSurface>
      ))}
    </div>
  );
}
