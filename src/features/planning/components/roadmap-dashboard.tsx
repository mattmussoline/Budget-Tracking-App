import { CalendarPlus, ClipboardList, Trash2 } from "lucide-react";
import { SoftButton } from "@/components/ui/soft-button";
import { SoftInput } from "@/components/ui/soft-input";
import { SoftSelect } from "@/components/ui/soft-select";
import { SoftSurface } from "@/components/ui/soft-surface";
import {
  addOngoingSeries,
  addRoadmapItem,
  deleteOngoingSeries,
  deleteRoadmapItem,
  updateOngoingSeries,
  updateRoadmapItem
} from "../planning-actions";
import type { OngoingSeries, RoadmapItem } from "../planning-types";

type RoadmapDashboardProps = {
  fiscalYearId: string;
  roadmapItems: RoadmapItem[];
  ongoingSeries: OngoingSeries[];
  isDemo?: boolean;
};

const roadmapStatuses = [
  { label: "Planned", value: "planned" },
  { label: "In progress", value: "in_progress" },
  { label: "Ready", value: "ready" },
  { label: "Released", value: "released" }
];

export function RoadmapDashboard({ fiscalYearId, roadmapItems, ongoingSeries, isDemo }: RoadmapDashboardProps) {
  return (
    <div className="grid gap-8 xl:grid-cols-[420px_1fr]">
      <div className="grid content-start gap-8">
        <SoftSurface className="bg-blue-50 p-6 md:p-8">
          <div className="mb-6 flex items-center gap-4">
            <div className="grid h-12 w-12 shrink-0 place-items-center rounded-lg bg-blue-500">
              <CalendarPlus className="h-5 w-5 text-white" aria-hidden="true" />
            </div>
            <div>
              <h2 className="font-display text-2xl font-extrabold tracking-tight">Add Roadmap Content</h2>
              <p className="text-sm font-medium text-muted">Saved items stay after refresh.</p>
            </div>
          </div>
          <form action={addRoadmapItem} className="grid gap-4">
            <input type="hidden" name="fiscalYearId" value={fiscalYearId} />
            <SoftInput label="Title" name="title" placeholder="New title" required disabled={isDemo} />
            <SoftInput label="Provider" name="provider" placeholder="Provider name" disabled={isDemo} />
            <SoftInput label="Release month" name="releaseMonth" placeholder="August 2026" required disabled={isDemo} />
            <SoftSelect label="Status" name="status" defaultValue="planned" options={roadmapStatuses} disabled={isDemo} />
            <SoftInput label="Notes" name="notes" placeholder="Optional planning notes" disabled={isDemo} />
            <SoftButton type="submit" variant="primary" disabled={isDemo}>
              Add to roadmap
            </SoftButton>
          </form>
        </SoftSurface>

        <SoftSurface className="bg-gray-50 p-6 md:p-8">
          <div className="mb-6 flex items-center gap-4">
            <div className="grid h-12 w-12 shrink-0 place-items-center rounded-lg bg-gray-900">
              <ClipboardList className="h-5 w-5 text-white" aria-hidden="true" />
            </div>
            <div>
              <h2 className="font-display text-2xl font-extrabold tracking-tight">Ongoing Series</h2>
              <p className="text-sm font-medium text-muted">Cadence is saved in the database.</p>
            </div>
          </div>
          <form action={addOngoingSeries} className="grid gap-4">
            <input type="hidden" name="fiscalYearId" value={fiscalYearId} />
            <SoftInput label="Series" name="series" placeholder="Practicing Catholic" required disabled={isDemo} />
            <SoftInput label="Cadence" name="cadence" placeholder="1 per week" required disabled={isDemo} />
            <SoftInput label="Notes" name="notes" placeholder="Optional notes" disabled={isDemo} />
            <SoftButton type="submit" variant="primary" disabled={isDemo}>
              Add series
            </SoftButton>
          </form>
        </SoftSurface>
      </div>

      <div className="grid content-start gap-8">
        <SavedRoadmapItems fiscalYearId={fiscalYearId} roadmapItems={roadmapItems} isDemo={isDemo} />
        <SavedSeries fiscalYearId={fiscalYearId} ongoingSeries={ongoingSeries} isDemo={isDemo} />
      </div>
    </div>
  );
}

function SavedRoadmapItems({ fiscalYearId, roadmapItems, isDemo }: Pick<RoadmapDashboardProps, "fiscalYearId" | "roadmapItems" | "isDemo">) {
  return (
    <SoftSurface className="overflow-hidden bg-gray-900">
      <div className="p-6 text-white md:p-8">
        <h2 className="font-display text-2xl font-extrabold tracking-tight">Saved Roadmap</h2>
        <p className="mt-1 text-sm font-medium text-gray-300">{roadmapItems.length} roadmap items saved.</p>
      </div>
      <div className="grid gap-4 bg-gray-100 p-4 md:p-6">
        {roadmapItems.length === 0 ? (
          <p className="rounded-lg bg-white p-4 text-sm font-bold text-muted">Add content to start the roadmap.</p>
        ) : (
          roadmapItems.map((item) => (
            <div key={item.id} className="rounded-lg bg-white p-4">
              <form action={updateRoadmapItem} className="grid gap-4 md:grid-cols-2">
                <input type="hidden" name="fiscalYearId" value={fiscalYearId} />
                <input type="hidden" name="itemId" value={item.id} />
                <SoftInput label="Title" name="title" defaultValue={item.title} required disabled={isDemo} />
                <SoftInput label="Provider" name="provider" defaultValue={item.provider ?? ""} disabled={isDemo} />
                <SoftInput label="Release month" name="releaseMonth" defaultValue={item.releaseMonth} required disabled={isDemo} />
                <SoftSelect label="Status" name="status" defaultValue={item.status} options={roadmapStatuses} disabled={isDemo} />
                <SoftInput label="Notes" name="notes" defaultValue={item.notes ?? ""} className="md:col-span-2" disabled={isDemo} />
                <div className="grid gap-2 sm:grid-cols-2 md:col-span-2">
                  <SoftButton type="submit" variant="primary" disabled={isDemo}>
                    Save
                  </SoftButton>
                  <SoftButton form={`delete-roadmap-${item.id}`} type="submit" variant="ghost" className="text-red-700 hover:bg-red-100" disabled={isDemo}>
                    <Trash2 className="h-4 w-4" aria-hidden="true" />
                    Delete
                  </SoftButton>
                </div>
              </form>
              <form id={`delete-roadmap-${item.id}`} action={deleteRoadmapItem}>
                <input type="hidden" name="fiscalYearId" value={fiscalYearId} />
                <input type="hidden" name="itemId" value={item.id} />
              </form>
            </div>
          ))
        )}
      </div>
    </SoftSurface>
  );
}

function SavedSeries({ fiscalYearId, ongoingSeries, isDemo }: Pick<RoadmapDashboardProps, "fiscalYearId" | "ongoingSeries" | "isDemo">) {
  return (
    <SoftSurface className="overflow-hidden bg-blue-50">
      <div className="p-6 md:p-8">
        <h2 className="font-display text-2xl font-extrabold tracking-tight">Saved Series Cadence</h2>
        <p className="mt-1 text-sm font-medium text-muted">{ongoingSeries.length} ongoing series saved.</p>
      </div>
      <div className="grid gap-4 p-4 pt-0 md:p-6 md:pt-0">
        {ongoingSeries.length === 0 ? (
          <p className="rounded-lg bg-white p-4 text-sm font-bold text-muted">Add ongoing series to track cadence.</p>
        ) : (
          ongoingSeries.map((item) => (
            <div key={item.id} className="rounded-lg bg-white p-4">
              <form action={updateOngoingSeries} className="grid gap-4 md:grid-cols-2">
                <input type="hidden" name="fiscalYearId" value={fiscalYearId} />
                <input type="hidden" name="seriesId" value={item.id} />
                <SoftInput label="Series" name="series" defaultValue={item.series} required disabled={isDemo} />
                <SoftInput label="Cadence" name="cadence" defaultValue={item.cadence} required disabled={isDemo} />
                <SoftInput label="Notes" name="notes" defaultValue={item.notes ?? ""} className="md:col-span-2" disabled={isDemo} />
                <div className="grid gap-2 sm:grid-cols-2 md:col-span-2">
                  <SoftButton type="submit" variant="primary" disabled={isDemo}>
                    Save
                  </SoftButton>
                  <SoftButton form={`delete-series-${item.id}`} type="submit" variant="ghost" className="text-red-700 hover:bg-red-100" disabled={isDemo}>
                    <Trash2 className="h-4 w-4" aria-hidden="true" />
                    Delete
                  </SoftButton>
                </div>
              </form>
              <form id={`delete-series-${item.id}`} action={deleteOngoingSeries}>
                <input type="hidden" name="fiscalYearId" value={fiscalYearId} />
                <input type="hidden" name="seriesId" value={item.id} />
              </form>
            </div>
          ))
        )}
      </div>
    </SoftSurface>
  );
}
