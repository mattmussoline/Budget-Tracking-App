import { BarChart3, Building2, GalleryHorizontalEnd, Gauge } from "lucide-react";
import { formatCurrency } from "@/lib/currency";
import { SoftSurface } from "@/components/ui/soft-surface";
import type { DashboardModel } from "../dashboard-model";

export function DashboardInsights({ model }: { model: DashboardModel }) {
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
      label: "Providers",
      value: String(model.insights.providerCount),
      detail: "Active provider count",
      icon: Building2,
      className: "bg-amber-100 text-amber-950"
    },
    {
      label: "Budget used",
      value: `${model.percentUsed}%`,
      detail: `${model.remainingPercent}% remaining`,
      icon: BarChart3,
      className: "bg-gray-100 text-gray-950"
    }
  ];

  return (
    <SoftSurface className="bg-white p-6 md:p-8">
      <div className="mb-5">
        <h2 className="font-display text-2xl font-extrabold tracking-tight">Dashboard</h2>
        <p className="text-sm font-medium text-muted">Quick signals for how the licensing year is taking shape.</p>
      </div>
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
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
      </div>
    </SoftSurface>
  );
}
