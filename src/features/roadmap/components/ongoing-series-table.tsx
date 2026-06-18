import type { OngoingSeries } from "../roadmap-types";

type OngoingSeriesTableProps = {
  series: OngoingSeries[];
  onEditSeries: (seriesId: string) => void;
};

export function OngoingSeriesTable({ series, onEditSeries }: OngoingSeriesTableProps) {
  return (
    <section className="grid gap-3">
      <h2 className="font-display text-2xl font-extrabold tracking-tight text-gray-950">Ongoing Series Cadence</h2>
      <div className="overflow-x-auto rounded-lg bg-sky-100">
        <table className="w-full min-w-[760px] border-collapse text-left">
          <thead className="bg-gray-900 text-white">
            <tr>
              {["Series", "Start Date", "End Date", "Cadence", "Notes"].map((heading) => (
                <th key={heading} className="px-4 py-3 text-xs font-extrabold uppercase tracking-wide">
                  {heading}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {series.map((item, index) => (
              <tr
                key={item.id}
                role="button"
                tabIndex={0}
                className={`cursor-pointer border-b-2 border-white transition hover:bg-cyan-100 focus-visible:bg-cyan-100 ${
                  index % 2 === 0 ? "bg-white" : "bg-sky-100"
                }`}
                onClick={() => onEditSeries(item.id)}
                onKeyDown={(event) => {
                  if (event.key === "Enter" || event.key === " ") {
                    event.preventDefault();
                    onEditSeries(item.id);
                  }
                }}
              >
                <td className="px-4 py-3 text-sm font-extrabold text-gray-950">
                  <span className="text-left transition group-hover:text-blue-700">{item.series}</span>
                </td>
                <td className="px-4 py-3 text-sm font-bold text-gray-900">{item.startDate}</td>
                <td className="px-4 py-3 text-sm font-bold text-gray-900">{item.endDate}</td>
                <td className="px-4 py-3 text-sm font-bold text-gray-900">{item.cadence || " "}</td>
                <td className="px-4 py-3 text-sm font-bold text-gray-900">{item.notes || " "}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}
