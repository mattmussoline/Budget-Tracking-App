import { formatCurrency } from "@/lib/currency";
import { SoftSurface } from "@/components/ui/soft-surface";
import type { DashboardModel } from "../dashboard-model";

type MonthBoardProps = {
  model: DashboardModel;
};

export function MonthBoard({ model }: MonthBoardProps) {
  const quarters = [1, 2, 3, 4].map((quarter) => ({
    quarter,
    months: model.months.filter((month) => month.quarter === quarter)
  }));

  return (
    <div className="grid gap-6">
      {quarters.map((quarter) => (
        <SoftSurface key={quarter.quarter} className="p-5 md:p-6">
          <div className="mb-5 flex items-center justify-between gap-4">
            <h2 className="font-display text-xl font-extrabold tracking-tight">Quarter {quarter.quarter}</h2>
            <p className="rounded-full px-4 py-2 text-sm font-bold text-muted soft-inset-sm">
              {formatCurrency(quarter.months.reduce((total, month) => total + month.totalCents, 0))}
            </p>
          </div>
          <div className="grid gap-4 lg:grid-cols-3">
            {quarter.months.map((month) => (
              <div key={month.index} className="min-h-48 rounded-2xl p-4 soft-inset">
                <div className="mb-4 flex items-center justify-between gap-3">
                  <h3 className="font-display text-lg font-bold tracking-tight">{month.label}</h3>
                  <span className="text-sm font-bold text-muted">{formatCurrency(month.totalCents)}</span>
                </div>
                <div className="grid gap-3">
                  {month.payments.length === 0 ? (
                    <p className="text-sm font-medium text-muted">No payments</p>
                  ) : (
                    month.payments.map((payment) => (
                      <div key={`${payment.licenseId}-${payment.fiscalMonth}`} className="rounded-xl p-3 soft-raised-sm">
                        <p className="text-sm font-bold text-foreground">{payment.title}</p>
                        <p className="text-xs font-medium text-muted">{payment.provider}</p>
                        <div className="mt-2 flex items-center justify-between gap-2">
                          <span className="text-sm font-bold">{formatCurrency(payment.amountCents)}</span>
                          {payment.isProrated ? (
                            <span className="rounded-full px-2 py-1 text-xs font-bold text-accent soft-inset-sm">
                              prorated
                            </span>
                          ) : null}
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            ))}
          </div>
        </SoftSurface>
      ))}
    </div>
  );
}
