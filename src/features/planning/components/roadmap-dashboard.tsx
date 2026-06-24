import Link from "next/link";
import type { Route } from "next";
import { ChevronLeft, ChevronRight, KeyRound, Plus, Trash2 } from "lucide-react";
import { SoftButton } from "@/components/ui/soft-button";
import { SoftInput } from "@/components/ui/soft-input";
import { SoftSelect } from "@/components/ui/soft-select";
import { cn } from "@/components/ui/soft-surface";
import {
  addOngoingSeries, addRoadmapCategory, addRoadmapItem, deleteOngoingSeries, deleteRoadmapItem,
  updateOngoingSeries, updateRoadmapCategory, updateRoadmapItem
} from "../planning-actions";
import { ROADMAP_COLORS, TONE_CLASSES, type PlanningTone } from "../planning-constants";
import { buildMonthWindow, parseMonthAnchor, shiftMonthAnchor } from "../planning-model";
import type { OngoingSeries, RoadmapCategory, RoadmapItem } from "../planning-types";
import { AddRoadmapModal } from "./add-roadmap-modal";
import { EditRoadmapModal } from "./edit-roadmap-modal";

type RoadmapDashboardProps = {
  fiscalYearId: string;
  roadmapItems: RoadmapItem[];
  ongoingSeries: OngoingSeries[];
  categories: RoadmapCategory[];
  startMonth: string;
  monthCount: 6 | 9 | 12;
  isDemo?: boolean;
};

const roadmapStatuses = [
  { label: "Planned", value: "planned" }, { label: "In progress", value: "in_progress" },
  { label: "Ready", value: "ready" }, { label: "Released", value: "released" }
];

export function RoadmapDashboard({ fiscalYearId, roadmapItems, ongoingSeries, categories, startMonth, monthCount, isDemo }: RoadmapDashboardProps) {
  const months = buildMonthWindow(startMonth, monthCount);
  const visibleKeys = new Set(months.map((month) => month.key));
  const backlog = roadmapItems.filter((item) => !item.releaseDate || !visibleKeys.has(item.releaseDate.slice(0, 7)));
  const categoryMap = new Map(categories.map((category) => [category.id, category]));
  const href = (start: string, count = monthCount) => `/roadmap?fy=${fiscalYearId}&start=${start}&months=${count}` as Route;
  const today = parseMonthAnchor(null);

  return <div className="grid min-w-0 gap-7">
    <div className="flex flex-wrap items-start justify-between gap-3">
      <div className="flex flex-wrap gap-2">
        <AddRoadmapModal>
          <RoadmapForm fiscalYearId={fiscalYearId} categories={categories} isDemo={isDemo} />
        </AddRoadmapModal>
        <CategoryManager fiscalYearId={fiscalYearId} categories={categories} isDemo={isDemo} />
      </div>
      <div className="flex flex-wrap gap-2">
        {categories.filter((category) => category.isActive).map((category) => {
          const tone = (category.colorKey in TONE_CLASSES ? category.colorKey : "slate") as PlanningTone;
          return <span key={category.id} className={cn("rounded-md px-3 py-2 text-[10px] font-extrabold uppercase tracking-wide", TONE_CLASSES[tone].chip)}>{category.name}</span>;
        })}
      </div>
    </div>

    <nav aria-label="Roadmap timeline controls" className="flex flex-wrap items-center justify-between gap-3 rounded-lg bg-gray-900 p-3 text-white">
      <div className="flex gap-2"><Link className="rounded-md bg-white/10 px-3 py-2 text-sm font-bold" href={href(shiftMonthAnchor(startMonth, -monthCount))}><ChevronLeft className="inline h-4 w-4" /> Previous</Link><Link className="rounded-md bg-amber-400 px-3 py-2 text-sm font-extrabold text-gray-900" href={href(today)}>Today</Link><Link className="rounded-md bg-white/10 px-3 py-2 text-sm font-bold" href={href(shiftMonthAnchor(startMonth, monthCount))}>Next <ChevronRight className="inline h-4 w-4" /></Link></div>
      <div className="flex gap-2">{([6, 9, 12] as const).map((count) => <Link key={count} href={href(startMonth, count)} aria-current={monthCount === count ? "page" : undefined} className={cn("rounded-md px-3 py-2 text-sm font-bold", monthCount === count ? "bg-white text-gray-900" : "bg-white/10 text-white")}>{count} months</Link>)}</div>
    </nav>

    <section className="min-w-0"><div className="mb-3 flex items-end justify-between gap-3"><div><h2 className="font-display text-3xl font-extrabold">{months[0].label}–{months[months.length - 1].label}</h2><p className="text-sm text-muted">Scroll horizontally to browse the visible release window.</p></div></div>
      <div className="grid auto-cols-[minmax(240px,1fr)] grid-flow-col gap-3 overflow-x-auto pb-4">
        {months.map((month) => {
          const items = roadmapItems.filter((item) => item.releaseDate?.slice(0, 7) === month.key);
          return <article key={month.key} className="min-h-80 rounded-lg bg-gray-100 p-3"><div className="mb-3 rounded-md bg-white p-3"><h3 className="text-lg font-extrabold">{month.label}</h3><p className="text-[10px] font-extrabold uppercase tracking-wide text-muted">{items.length} {items.length === 1 ? "release" : "releases"}</p></div><div className="grid gap-2">{items.map((item) => <RoadmapCard key={item.id} item={item} category={item.categoryId ? categoryMap.get(item.categoryId) : undefined} categories={categories} fiscalYearId={fiscalYearId} isDemo={isDemo} />)}</div></article>;
        })}
      </div>
    </section>

    <div className="grid gap-6 xl:grid-cols-[1.35fr_0.8fr]">
      <SeriesTable fiscalYearId={fiscalYearId} ongoingSeries={ongoingSeries} isDemo={isDemo} />
      <section className="rounded-lg bg-gray-100 p-5"><h2 className="font-display text-2xl font-extrabold">Backlog</h2><p className="mb-4 text-sm text-muted">Undated items and releases outside this visible window.</p><div className="grid gap-2">{backlog.length ? backlog.map((item) => <RoadmapCard key={item.id} item={item} category={item.categoryId ? categoryMap.get(item.categoryId) : undefined} categories={categories} fiscalYearId={fiscalYearId} isDemo={isDemo} />) : <p className="rounded-md bg-white p-4 font-bold text-muted">No backlog items.</p>}</div></section>
    </div>
  </div>;
}

function RoadmapCard({ item, category, categories, fiscalYearId, isDemo }: { item: RoadmapItem; category?: RoadmapCategory; categories: RoadmapCategory[]; fiscalYearId: string; isDemo?: boolean }) {
  return <EditRoadmapModal item={item} category={category}>
    <RoadmapForm fiscalYearId={fiscalYearId} categories={categories} item={item} isDemo={isDemo} />
  </EditRoadmapModal>;
}

function RoadmapForm({ fiscalYearId, categories, item, isDemo }: { fiscalYearId: string; categories: RoadmapCategory[]; item?: RoadmapItem; isDemo?: boolean }) {
  const action = item ? updateRoadmapItem : addRoadmapItem;
  return <form action={action} className="mt-4 grid gap-3 border-t border-gray-200 pt-4 md:grid-cols-2"><input type="hidden" name="fiscalYearId" value={fiscalYearId} />{item ? <input type="hidden" name="itemId" value={item.id} /> : null}<SoftInput id={`${item?.id ?? "new"}-title`} label="Title" name="title" defaultValue={item?.title} required disabled={isDemo} /><SoftInput id={`${item?.id ?? "new"}-provider`} label="Provider" name="provider" defaultValue={item?.provider ?? ""} disabled={isDemo} /><SoftInput id={`${item?.id ?? "new"}-date`} type="date" label="Release date" name="releaseDate" defaultValue={item?.releaseDate ?? ""} disabled={isDemo} /><SoftSelect id={`${item?.id ?? "new"}-status`} label="Status" name="status" defaultValue={item?.status ?? "planned"} options={roadmapStatuses} disabled={isDemo} /><SoftSelect id={`${item?.id ?? "new"}-category`} label="Color category" name="categoryId" defaultValue={item?.categoryId ?? ""} placeholder="No category" options={categories.filter((category) => category.isActive || category.id === item?.categoryId).map((category) => ({ label: category.name, value: category.id }))} disabled={isDemo} /><SoftInput id={`${item?.id ?? "new"}-notes`} label="Notes" name="notes" defaultValue={item?.notes ?? ""} disabled={isDemo} /><div className="flex gap-2 md:col-span-2"><SoftButton type="submit" variant="primary" disabled={isDemo}>{item ? "Save Item" : "Add Item"}</SoftButton>{item ? <SoftButton formAction={deleteRoadmapItem} type="submit" variant="ghost" className="text-red-700" disabled={isDemo}><Trash2 className="h-4 w-4" />Delete</SoftButton> : null}</div></form>;
}

function CategoryManager({ fiscalYearId, categories, isDemo }: { fiscalYearId: string; categories: RoadmapCategory[]; isDemo?: boolean }) {
  return <details className="rounded-lg bg-gray-100 p-1 open:p-5"><summary className="inline-flex min-h-12 cursor-pointer list-none items-center justify-center gap-2 rounded-md bg-gray-100 px-5 py-3 text-sm font-extrabold uppercase tracking-wide transition-all duration-200 hover:scale-[1.03] hover:bg-gray-200 active:scale-[0.98]"><KeyRound className="h-4 w-4" aria-hidden="true" />Manage Key</summary><div className="mt-4 grid gap-3">{categories.map((category) => <form key={category.id} action={updateRoadmapCategory} className="grid gap-2 rounded-md bg-white p-3 sm:grid-cols-[1fr_130px_110px_80px_auto]"><input type="hidden" name="fiscalYearId" value={fiscalYearId} /><input type="hidden" name="categoryId" value={category.id} /><input className="rounded-md bg-gray-100 px-3" name="name" defaultValue={category.name} aria-label={`Category name ${category.name}`} /><select className="rounded-md bg-gray-100 px-3" name="colorKey" defaultValue={category.colorKey} aria-label={`Category color ${category.name}`}>{ROADMAP_COLORS.map((color) => <option key={color.value} value={color.value}>{color.label}</option>)}</select><select className="rounded-md bg-gray-100 px-3" name="isActive" defaultValue={category.isActive ? "true" : "false"} aria-label={`Category status ${category.name}`}><option value="true">Active</option><option value="false">Retired</option></select><input className="rounded-md bg-gray-100 px-3" type="number" min="0" name="sortOrder" defaultValue={category.sortOrder} aria-label={`Category order ${category.name}`} /><SoftButton type="submit" disabled={isDemo}>Save</SoftButton></form>)}<form action={addRoadmapCategory} className="grid gap-2 rounded-md bg-blue-50 p-3 sm:grid-cols-[1fr_130px_110px_80px_auto]"><input type="hidden" name="fiscalYearId" value={fiscalYearId} /><input className="rounded-md bg-white px-3" name="name" placeholder="New category" aria-label="New category name" /><select className="rounded-md bg-white px-3" name="colorKey" defaultValue="blue" aria-label="New category color">{ROADMAP_COLORS.map((color) => <option key={color.value} value={color.value}>{color.label}</option>)}</select><span className="rounded-md bg-white px-3 py-2 text-sm font-bold text-muted">Active</span><input className="rounded-md bg-white px-3" type="number" min="0" name="sortOrder" defaultValue={categories.length} aria-label="New category order" /><SoftButton type="submit" variant="primary" disabled={isDemo}><Plus className="h-4 w-4" />Add</SoftButton></form></div></details>;
}

function SeriesTable({ fiscalYearId, ongoingSeries, isDemo }: { fiscalYearId: string; ongoingSeries: OngoingSeries[]; isDemo?: boolean }) {
  return <section><div className="mb-3 flex items-center justify-between"><h2 className="font-display text-2xl font-extrabold">Ongoing Series Cadence</h2></div><div className="overflow-hidden rounded-lg border border-gray-200"><div className="grid grid-cols-[1.2fr_0.7fr_1fr_auto] gap-3 bg-gray-900 p-3 text-[10px] font-extrabold uppercase tracking-wide text-white"><span>Series</span><span>Cadence</span><span>Notes</span><span>Edit</span></div>{ongoingSeries.map((item) => <details key={item.id} className="border-t border-white bg-gray-100 p-3"><summary className="grid cursor-pointer list-none grid-cols-[1.2fr_0.7fr_1fr_auto] gap-3 text-sm"><b>{item.series}</b><span>{item.cadence}</span><span>{item.notes}</span><span>Edit</span></summary><form action={updateOngoingSeries} className="mt-3 grid gap-3 border-t border-gray-200 pt-3 md:grid-cols-2"><input type="hidden" name="fiscalYearId" value={fiscalYearId} /><input type="hidden" name="seriesId" value={item.id} /><SoftInput id={`series-${item.id}`} label="Series" name="series" defaultValue={item.series} disabled={isDemo} /><SoftInput id={`cadence-${item.id}`} label="Cadence" name="cadence" defaultValue={item.cadence} disabled={isDemo} /><SoftInput id={`series-notes-${item.id}`} label="Notes" name="notes" defaultValue={item.notes ?? ""} disabled={isDemo} /><div className="flex gap-2"><SoftButton type="submit" variant="primary" disabled={isDemo}>Save Series</SoftButton><SoftButton form={`delete-series-${item.id}`} type="submit" variant="ghost" className="text-red-700" disabled={isDemo}>Delete</SoftButton></div></form><form id={`delete-series-${item.id}`} action={deleteOngoingSeries}><input type="hidden" name="fiscalYearId" value={fiscalYearId} /><input type="hidden" name="seriesId" value={item.id} /></form></details>)}<details className="border-t border-white bg-blue-50 p-3"><summary className="cursor-pointer font-extrabold">+ Add ongoing series</summary><form action={addOngoingSeries} className="mt-3 grid gap-3 md:grid-cols-3"><input type="hidden" name="fiscalYearId" value={fiscalYearId} /><SoftInput id="new-series" label="Series" name="series" disabled={isDemo} /><SoftInput id="new-cadence" label="Cadence" name="cadence" disabled={isDemo} /><SoftInput id="new-series-notes" label="Notes" name="notes" disabled={isDemo} /><SoftButton type="submit" variant="primary" disabled={isDemo}>Add Series</SoftButton></form></details></div></section>;
}
