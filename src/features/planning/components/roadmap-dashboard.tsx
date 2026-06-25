"use client";

import Link from "next/link";
import type { Route } from "next";
import { ChevronLeft, ChevronRight, Trash2 } from "lucide-react";
import { type KeyboardEvent, useId, useMemo, useState } from "react";
import { SoftButton } from "@/components/ui/soft-button";
import { SoftInput } from "@/components/ui/soft-input";
import { SoftSelect } from "@/components/ui/soft-select";
import { cn } from "@/components/ui/soft-surface";
import { getProviderColor } from "@/features/budget/provider-colors";
import {
  addOngoingSeries, addRoadmapItem, deleteOngoingSeries, deleteRoadmapItem,
  updateOngoingSeries, updateRoadmapItem
} from "../planning-actions";
import { TONE_CLASSES, type PlanningTone } from "../planning-constants";
import { buildMonthWindow, parseMonthAnchor, shiftMonthAnchor } from "../planning-model";
import type { OngoingSeries, RoadmapCategory, RoadmapItem } from "../planning-types";
import { AddRoadmapModal } from "./add-roadmap-modal";
import { CategoryManagerModal } from "./category-manager-modal";
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
  const [focusedMonthKey, setFocusedMonthKey] = useState<string | null>(null);
  const months = buildMonthWindow(startMonth, monthCount);
  const displayedMonths = focusedMonthKey ? months.filter((month) => month.key === focusedMonthKey) : months;
  const visibleKeys = new Set(months.map((month) => month.key));
  const backlog = roadmapItems.filter((item) => !item.releaseDate || !visibleKeys.has(item.releaseDate.slice(0, 7)));
  const categoryMap = new Map(categories.map((category) => [category.id, category]));
  const providerOptions = Array.from(new Set(roadmapItems.map((item) => item.provider?.trim()).filter((provider): provider is string => Boolean(provider)))).sort((a, b) =>
    a.localeCompare(b)
  );
  const href = (start: string, count = monthCount) => `/roadmap?fy=${fiscalYearId}&start=${start}&months=${count}` as Route;
  const today = parseMonthAnchor(null);

  return <div className="grid min-w-0 gap-7">
    <div className="flex flex-wrap items-start justify-between gap-3">
      <div className="flex flex-wrap gap-2">
        <AddRoadmapModal>
          <RoadmapForm fiscalYearId={fiscalYearId} categories={categories} providerOptions={providerOptions} isDemo={isDemo} />
        </AddRoadmapModal>
        <CategoryManagerModal fiscalYearId={fiscalYearId} categories={categories} isDemo={isDemo} />
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

    <section className="min-w-0"><div className="mb-3 flex items-end justify-between gap-3"><div><h2 className="font-display text-3xl font-extrabold">{months[0].label}–{months[months.length - 1].label}</h2><p className="text-sm text-muted">Scroll through the roadmap, or click a month to see it at a glance.</p></div>{focusedMonthKey ? <SoftButton type="button" variant="ghost" onClick={() => setFocusedMonthKey(null)}>Show all months</SoftButton> : null}</div>
      <div data-testid="roadmap-month-scroll" className="flex h-[70vh] gap-4 overflow-auto rounded-lg bg-gray-200 p-3 md:h-[600px]">
        {displayedMonths.map((month) => {
          const items = roadmapItems.filter((item) => item.releaseDate?.slice(0, 7) === month.key);
          return <article data-testid="roadmap-month-column" key={month.key} className={cn("min-h-full shrink-0 rounded-lg bg-gray-100 p-3", focusedMonthKey ? "w-full min-w-full" : "w-[320px]")}><button type="button" aria-label={`Focus ${month.label}`} onClick={() => setFocusedMonthKey(month.key)} className="mb-3 w-full rounded-md bg-white p-3 text-left transition-colors hover:bg-blue-50"><h3 className="text-lg font-extrabold">{month.label}</h3><p className="text-[10px] font-extrabold uppercase tracking-wide text-muted">{items.length} {items.length === 1 ? "release" : "releases"}</p></button><div className={cn("grid gap-2", focusedMonthKey && "md:grid-cols-2 xl:grid-cols-3")}>{items.map((item) => <RoadmapCard key={item.id} item={item} category={item.categoryId ? categoryMap.get(item.categoryId) : undefined} categories={categories} providerOptions={providerOptions} fiscalYearId={fiscalYearId} isDemo={isDemo} />)}</div></article>;
        })}
      </div>
    </section>

    <div className="grid gap-6 xl:grid-cols-[1.35fr_0.8fr]">
      <SeriesTable fiscalYearId={fiscalYearId} ongoingSeries={ongoingSeries} isDemo={isDemo} />
      <section className="rounded-lg bg-gray-100 p-5"><h2 className="font-display text-2xl font-extrabold">Backlog</h2><p className="mb-4 text-sm text-muted">Undated items and releases outside this visible window.</p><div className="grid gap-2">{backlog.length ? backlog.map((item) => <RoadmapCard key={item.id} item={item} category={item.categoryId ? categoryMap.get(item.categoryId) : undefined} categories={categories} providerOptions={providerOptions} fiscalYearId={fiscalYearId} isDemo={isDemo} />) : <p className="rounded-md bg-white p-4 font-bold text-muted">No backlog items.</p>}</div></section>
    </div>
  </div>;
}

function RoadmapCard({ item, category, categories, providerOptions, fiscalYearId, isDemo }: { item: RoadmapItem; category?: RoadmapCategory; categories: RoadmapCategory[]; providerOptions: string[]; fiscalYearId: string; isDemo?: boolean }) {
  return <EditRoadmapModal item={item} category={category}>
    <RoadmapForm fiscalYearId={fiscalYearId} categories={categories} providerOptions={providerOptions} item={item} isDemo={isDemo} />
  </EditRoadmapModal>;
}

function RoadmapForm({ fiscalYearId, categories, providerOptions, item, isDemo }: { fiscalYearId: string; categories: RoadmapCategory[]; providerOptions: string[]; item?: RoadmapItem; isDemo?: boolean }) {
  const action = item ? updateRoadmapItem : addRoadmapItem;
  return <form action={action} className="mt-4 grid gap-3 border-t border-gray-200 pt-4 md:grid-cols-2"><input type="hidden" name="fiscalYearId" value={fiscalYearId} />{item ? <input type="hidden" name="itemId" value={item.id} /> : null}<SoftInput id={`${item?.id ?? "new"}-title`} label="Title" name="title" defaultValue={item?.title} required disabled={isDemo} /><ProviderCombobox id={`${item?.id ?? "new"}-provider`} label="Provider" name="provider" defaultValue={item?.provider ?? ""} options={providerOptions} disabled={isDemo} /><SoftInput id={`${item?.id ?? "new"}-date`} type="date" label="Release date" name="releaseDate" defaultValue={item?.releaseDate ?? ""} disabled={isDemo} /><SoftSelect id={`${item?.id ?? "new"}-status`} label="Status" name="status" defaultValue={item?.status ?? "planned"} options={roadmapStatuses} disabled={isDemo} /><SoftSelect id={`${item?.id ?? "new"}-category`} label="Color category" name="categoryId" defaultValue={item?.categoryId ?? ""} placeholder="No category" options={categories.filter((category) => category.isActive || category.id === item?.categoryId).map((category) => ({ label: category.name, value: category.id }))} disabled={isDemo} /><SoftInput id={`${item?.id ?? "new"}-notes`} label="Notes" name="notes" defaultValue={item?.notes ?? ""} disabled={isDemo} /><div className="flex gap-2 md:col-span-2"><SoftButton type="submit" variant="primary" disabled={isDemo}>{item ? "Save Item" : "Add Item"}</SoftButton>{item ? <SoftButton formAction={deleteRoadmapItem} type="submit" variant="ghost" className="text-red-700" disabled={isDemo}><Trash2 className="h-4 w-4" />Delete</SoftButton> : null}</div></form>;
}

function ProviderCombobox({ id, name, label, defaultValue, options, disabled }: { id: string; name: string; label: string; defaultValue: string; options: string[]; disabled?: boolean }) {
  const listId = useId();
  const [value, setValue] = useState(defaultValue);
  const [isOpen, setIsOpen] = useState(false);
  const trimmedValue = value.trim();
  const matchingOptions = useMemo(() => {
    const query = trimmedValue.toLowerCase();
    if (!query) return options;
    return options.filter((option) => option.toLowerCase().includes(query));
  }, [options, trimmedValue]);
  const exactMatch = options.some((option) => option.toLowerCase() === trimmedValue.toLowerCase());
  const showNewOption = trimmedValue.length > 0 && !exactMatch;

  const commitValue = (nextValue: string) => {
    setValue(nextValue);
    setIsOpen(true);
  };

  const handleKeyDown = (event: KeyboardEvent<HTMLInputElement>) => {
    if (event.key !== "Enter") return;
    event.preventDefault();
    commitValue(trimmedValue || value);
  };

  return (
    <label className="relative grid gap-2 text-xs font-extrabold uppercase tracking-wide text-foreground" htmlFor={id}>
      {label}
      <input
        id={id}
        name={name}
        role="combobox"
        aria-autocomplete="list"
        aria-controls={listId}
        aria-expanded={isOpen}
        autoComplete="off"
        value={value}
        disabled={disabled}
        onFocus={() => setIsOpen(true)}
        onChange={(event) => {
          setValue(event.target.value);
          setIsOpen(true);
        }}
        onKeyDown={handleKeyDown}
        className="min-h-12 w-full rounded-md border-0 bg-gray-100 px-4 text-base font-medium normal-case tracking-normal text-foreground shadow-none placeholder:text-gray-500 focus:border-2 focus:border-blue-500 focus:bg-white disabled:cursor-not-allowed disabled:opacity-70"
      />
      {isOpen && !disabled ? (
        <div id={listId} role="listbox" className="absolute left-0 right-0 top-full z-20 mt-1 max-h-56 overflow-auto rounded-md border border-gray-200 bg-white p-1 text-sm font-bold normal-case tracking-normal shadow-lg">
          {matchingOptions.map((option) => {
            const color = getProviderColor(option);
            return <button key={option} type="button" role="option" aria-selected={option === value} onMouseDown={(event) => event.preventDefault()} onClick={() => commitValue(option)} className="flex w-full items-center gap-2 rounded px-3 py-2 text-left hover:bg-gray-100"><span className={cn("h-3 w-3 rounded-full", color.marker)} aria-hidden="true" />{option}</button>;
          })}
          {showNewOption ? <div role="option" aria-selected="true" className="flex items-center gap-2 rounded px-3 py-2 text-muted"><span className={cn("h-3 w-3 rounded-full", getProviderColor(trimmedValue).marker)} aria-hidden="true" />Use &quot;{trimmedValue}&quot;</div> : null}
        </div>
      ) : null}
    </label>
  );
}

function SeriesTable({ fiscalYearId, ongoingSeries, isDemo }: { fiscalYearId: string; ongoingSeries: OngoingSeries[]; isDemo?: boolean }) {
  return <section><div className="mb-3 flex items-center justify-between"><h2 className="font-display text-2xl font-extrabold">Ongoing Series Cadence</h2></div><div className="overflow-hidden rounded-lg border border-gray-200"><div className="grid grid-cols-[1.2fr_0.7fr_1fr_auto] gap-3 bg-gray-900 p-3 text-[10px] font-extrabold uppercase tracking-wide text-white"><span>Series</span><span>Cadence</span><span>Notes</span><span>Edit</span></div>{ongoingSeries.map((item, index) => <details data-testid={`series-row-${item.id}`} key={item.id} className={cn("border-t border-orange-100 p-3", index % 2 === 0 ? "bg-white" : "bg-orange-50")}><summary className="grid cursor-pointer list-none grid-cols-[1.2fr_0.7fr_1fr_auto] gap-3 text-sm"><b>{item.series}</b><span>{item.cadence}</span><span>{item.notes}</span><span>Edit</span></summary><form action={updateOngoingSeries} className="mt-3 grid gap-3 border-t border-gray-200 pt-3 md:grid-cols-2"><input type="hidden" name="fiscalYearId" value={fiscalYearId} /><input type="hidden" name="seriesId" value={item.id} /><SoftInput id={`series-${item.id}`} label="Series" name="series" defaultValue={item.series} disabled={isDemo} /><SoftInput id={`cadence-${item.id}`} label="Cadence" name="cadence" defaultValue={item.cadence} disabled={isDemo} /><SoftInput id={`series-notes-${item.id}`} label="Notes" name="notes" defaultValue={item.notes ?? ""} disabled={isDemo} /><div className="flex gap-2"><SoftButton type="submit" variant="primary" disabled={isDemo}>Save Series</SoftButton><SoftButton form={`delete-series-${item.id}`} type="submit" variant="ghost" className="text-red-700" disabled={isDemo}>Delete</SoftButton></div></form><form id={`delete-series-${item.id}`} action={deleteOngoingSeries}><input type="hidden" name="fiscalYearId" value={fiscalYearId} /><input type="hidden" name="seriesId" value={item.id} /></form></details>)}<details className="border-t border-orange-100 bg-blue-50 p-3"><summary className="cursor-pointer font-extrabold">+ Add ongoing series</summary><form action={addOngoingSeries} className="mt-3 grid gap-3 md:grid-cols-3"><input type="hidden" name="fiscalYearId" value={fiscalYearId} /><SoftInput id="new-series" label="Series" name="series" disabled={isDemo} /><SoftInput id="new-cadence" label="Cadence" name="cadence" disabled={isDemo} /><SoftInput id="new-series-notes" label="Notes" name="notes" disabled={isDemo} /><SoftButton type="submit" variant="primary" disabled={isDemo}>Add Series</SoftButton></form></details></div></section>;
}
