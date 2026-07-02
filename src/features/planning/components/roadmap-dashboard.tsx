"use client";

import Link from "next/link";
import type { Route } from "next";
import { ChevronLeft, ChevronRight, Plus, Trash2 } from "lucide-react";
import { type ChangeEvent, type FocusEvent, type FormEvent, type ReactNode, useMemo, useRef, useState } from "react";
import { SoftButton } from "@/components/ui/soft-button";
import { SoftInput } from "@/components/ui/soft-input";
import { SoftSelect } from "@/components/ui/soft-select";
import { cn } from "@/components/ui/soft-surface";
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
  const currentMonthKey = parseMonthAnchor(null);
  const releasedBacklog = backlog.filter((item) => isBeforeCurrentMonth(item.releaseDate, currentMonthKey));
  const otherBacklog = backlog.filter((item) => !isBeforeCurrentMonth(item.releaseDate, currentMonthKey));
  const categoryMap = new Map(categories.map((category) => [category.id, category]));
  const providerOptions = useMemo(() => Array.from(new Set(roadmapItems.map((item) => item.provider).filter(Boolean) as string[])).sort((a, b) => a.localeCompare(b)), [roadmapItems]);
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
      <div className="flex flex-wrap gap-2"><Link className="inline-flex min-h-11 items-center rounded-md bg-white/10 px-3 py-2 text-sm font-bold" href={href(shiftMonthAnchor(startMonth, -monthCount))}><ChevronLeft className="inline h-4 w-4" /> Previous</Link><Link className="inline-flex min-h-11 items-center rounded-md bg-amber-400 px-3 py-2 text-sm font-extrabold text-gray-900" href={href(today)}>Today</Link><Link className="inline-flex min-h-11 items-center rounded-md bg-white/10 px-3 py-2 text-sm font-bold" href={href(shiftMonthAnchor(startMonth, monthCount))}>Next <ChevronRight className="inline h-4 w-4" /></Link></div>
      <div className="flex flex-wrap gap-2">{([6, 9, 12] as const).map((count) => <Link key={count} href={href(startMonth, count)} aria-current={monthCount === count ? "page" : undefined} className={cn("inline-flex min-h-11 items-center rounded-md px-3 py-2 text-sm font-bold", monthCount === count ? "bg-white text-gray-900" : "bg-white/10 text-white")}>{count} months</Link>)}</div>
    </nav>

    <section className="min-w-0"><div className="mb-3 flex items-end justify-between gap-3"><div><h2 className="font-display text-3xl font-extrabold">{months[0].label}–{months[months.length - 1].label}</h2><p className="text-sm text-muted">Scroll through the roadmap, or click a month to see it at a glance.</p></div>{focusedMonthKey ? <SoftButton type="button" variant="primary" className="shadow-sm ring-1 ring-blue-100" onClick={() => setFocusedMonthKey(null)}><ChevronLeft className="h-4 w-4" aria-hidden="true" />Show all months</SoftButton> : null}</div>
      <div data-testid="roadmap-month-scroll" className="flex h-[70vh] gap-4 overflow-auto rounded-lg bg-gray-200 p-3 md:h-[600px]">
        {displayedMonths.map((month) => {
          const items = roadmapItems.filter((item) => item.releaseDate?.slice(0, 7) === month.key);
          return <article data-testid="roadmap-month-column" key={month.key} className={cn("min-h-full shrink-0 rounded-lg bg-gray-100 p-3", focusedMonthKey ? "w-full min-w-full" : "w-[320px]")}><button type="button" aria-label={`Focus ${month.label}`} onClick={() => setFocusedMonthKey(month.key)} className="mb-2 min-h-11 w-full rounded-md bg-white p-3 text-left transition-colors hover:bg-blue-50"><h3 className="text-lg font-extrabold">{month.label}</h3><p className="text-[10px] font-extrabold uppercase tracking-wide text-muted">{items.length} {items.length === 1 ? "release" : "releases"}</p></button><AddRoadmapModal triggerLabel="Add item" triggerAriaLabel={`Add item to ${month.label}`} triggerIcon={<Plus className="h-4 w-4" aria-hidden="true" />} triggerClassName="mb-3 min-h-11 w-full justify-center bg-white px-3 py-2 text-xs !text-blue-700 shadow-sm ring-1 ring-blue-100 hover:bg-blue-50 hover:!text-blue-800"><RoadmapForm fiscalYearId={fiscalYearId} categories={categories} providerOptions={providerOptions} defaultReleaseDate={`${month.key}-01`} idPrefix={`new-${month.key}`} isDemo={isDemo} /></AddRoadmapModal><div className={cn("grid gap-2", focusedMonthKey && "md:grid-cols-2 xl:grid-cols-3")}>{items.map((item) => <RoadmapCard key={item.id} item={item} category={item.categoryId ? categoryMap.get(item.categoryId) : undefined} categories={categories} fiscalYearId={fiscalYearId} isDemo={isDemo} providerOptions={providerOptions} />)}</div></article>;
        })}
      </div>
    </section>

    <div className="grid gap-6 xl:grid-cols-[1.35fr_0.8fr]">
      <SeriesTable fiscalYearId={fiscalYearId} ongoingSeries={ongoingSeries} isDemo={isDemo} />
      <section className="rounded-lg bg-gray-100 p-5"><h2 className="font-display text-2xl font-extrabold">Backlog</h2><p className="mb-4 text-sm text-muted">Undated items and releases outside this visible window.</p><div className="grid gap-3">{backlog.length ? <><BacklogGroup title="Already released content" count={releasedBacklog.length} testId="backlog-released-content">{releasedBacklog.map((item) => <RoadmapCard key={item.id} item={item} category={item.categoryId ? categoryMap.get(item.categoryId) : undefined} categories={categories} fiscalYearId={fiscalYearId} isDemo={isDemo} providerOptions={providerOptions} />)}</BacklogGroup><BacklogGroup title="Everything else" count={otherBacklog.length} testId="backlog-other-content">{otherBacklog.map((item) => <RoadmapCard key={item.id} item={item} category={item.categoryId ? categoryMap.get(item.categoryId) : undefined} categories={categories} fiscalYearId={fiscalYearId} isDemo={isDemo} providerOptions={providerOptions} />)}</BacklogGroup></> : <p className="rounded-md bg-white p-4 font-bold text-muted">No backlog items.</p>}</div></section>
    </div>
  </div>;
}

function isBeforeCurrentMonth(releaseDate: string | null, currentMonthKey: string) {
  return /^\d{4}-(0[1-9]|1[0-2])-\d{2}$/.test(releaseDate ?? "") && releaseDate!.slice(0, 7) < currentMonthKey;
}

function BacklogGroup({ title, count, testId, children }: { title: string; count: number; testId: string; children: ReactNode }) {
  return <details data-testid={testId} className="rounded-md bg-white p-3">
    <summary className="flex cursor-pointer list-none items-center justify-between gap-3 text-sm font-extrabold">
      <span>{title}</span>
      <span className="rounded-full bg-gray-100 px-2 py-1 text-[10px] uppercase tracking-wide text-muted">{count}</span>
    </summary>
    <div className="mt-3 grid gap-2">{count ? children : <p className="rounded-md bg-gray-50 p-3 text-sm font-bold text-muted">No items.</p>}</div>
  </details>;
}

function RoadmapCard({ item, category, categories, fiscalYearId, providerOptions, isDemo }: { item: RoadmapItem; category?: RoadmapCategory; categories: RoadmapCategory[]; fiscalYearId: string; providerOptions: string[]; isDemo?: boolean }) {
  return <EditRoadmapModal item={item} category={category}>
    <RoadmapForm fiscalYearId={fiscalYearId} categories={categories} providerOptions={providerOptions} item={item} isDemo={isDemo} />
  </EditRoadmapModal>;
}

function RoadmapForm({ fiscalYearId, categories, providerOptions, item, defaultReleaseDate = "", idPrefix, isDemo }: { fiscalYearId: string; categories: RoadmapCategory[]; providerOptions: string[]; item?: RoadmapItem; defaultReleaseDate?: string; idPrefix?: string; isDemo?: boolean }) {
  const action = item ? updateRoadmapItem : addRoadmapItem;
  const fieldPrefix = idPrefix ?? item?.id ?? "new";
  const formRef = useRef<HTMLFormElement>(null);
  const [resetCount, setResetCount] = useState(0);
  const [message, setMessage] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const fieldsDisabled = Boolean(isDemo || isSaving);
  const categoryOptions = categories
    .filter((category) => category.isActive || category.id === item?.categoryId)
    .map((category) => ({ label: category.name, value: category.id }));

  const handleAddSubmit = async (event: FormEvent<HTMLFormElement>) => {
    if (item) return;
    event.preventDefault();
    setMessage(null);
    setIsSaving(true);

    try {
      await addRoadmapItem(new FormData(event.currentTarget));
      formRef.current?.reset();
      setResetCount((count) => count + 1);
      setMessage("Roadmap item added.");
    } finally {
      setIsSaving(false);
    }
  };

  const handleEditSubmit = async (event: FormEvent<HTMLFormElement>) => {
    if (!item) return;
    const submitter = (event.nativeEvent as SubmitEvent).submitter as HTMLElement | null;
    if (submitter?.dataset.roadmapDelete === "true") return;

    event.preventDefault();
    setMessage(null);
    setIsSaving(true);

    try {
      await updateRoadmapItem(new FormData(event.currentTarget));
      setMessage("Roadmap item saved.");
    } finally {
      setIsSaving(false);
    }
  };

  return <form ref={formRef} action={item ? action : undefined} onSubmit={item ? handleEditSubmit : handleAddSubmit} className="mt-4 grid gap-3 border-t border-gray-200 pt-4 md:grid-cols-2">
    <input type="hidden" name="fiscalYearId" value={fiscalYearId} />
    {item ? <input type="hidden" name="itemId" value={item.id} /> : null}
    {message ? <p role="status" className="rounded-md bg-green-50 px-4 py-3 text-sm font-bold text-green-800 md:col-span-2">{message}</p> : null}
    <SoftInput id={`${fieldPrefix}-title`} label="Title" name="title" defaultValue={item?.title} required disabled={fieldsDisabled} />
    <ProviderInput key={`provider-${resetCount}`} id={`${fieldPrefix}-provider`} defaultValue={item?.provider ?? ""} options={providerOptions} disabled={fieldsDisabled} />
    <ReleaseDateField key={`date-${resetCount}`} id={`${fieldPrefix}-date`} defaultValue={item?.releaseDate ?? defaultReleaseDate} disabled={fieldsDisabled} />
    <SoftSelect id={`${fieldPrefix}-status`} label="Status" name="status" defaultValue={item?.status ?? "planned"} options={roadmapStatuses} className="min-h-9 px-3 text-sm" disabled={fieldsDisabled} />
    <SoftSelect id={`${fieldPrefix}-category`} label="Color category" name="categoryId" defaultValue={item?.categoryId ?? ""} placeholder="No category" options={categoryOptions} disabled={fieldsDisabled} />
    <SoftInput id={`${fieldPrefix}-notes`} label="Notes" name="notes" defaultValue={item?.notes ?? ""} disabled={fieldsDisabled} />
    <div className="flex gap-2 md:col-span-2">
      <SoftButton type="submit" variant="primary" disabled={fieldsDisabled}>{item ? isSaving ? "Saving..." : "Save Item" : isSaving ? "Adding..." : "Add Item"}</SoftButton>
      {item ? <SoftButton data-roadmap-delete="true" formAction={deleteRoadmapItem} type="submit" variant="ghost" className="text-red-700" disabled={isDemo} onClick={(event) => { if (!window.confirm(`Delete ${item.title}? This cannot be undone.`)) event.preventDefault(); }}><Trash2 className="h-4 w-4" />Delete</SoftButton> : null}
    </div>
  </form>;
}

function ProviderInput({ id, defaultValue, options, disabled }: { id: string; defaultValue: string; options: string[]; disabled?: boolean }) {
  const [value, setValue] = useState(defaultValue);
  const [isOpen, setIsOpen] = useState(false);
  const normalizedValue = value.trim().toLowerCase();
  const suggestions = options.filter((option) => {
    const normalizedOption = option.toLowerCase();
    return normalizedOption !== normalizedValue && (!normalizedValue || normalizedOption.includes(normalizedValue));
  }).slice(0, 5);

  const showSuggestions = !disabled && isOpen && suggestions.length > 0;
  const closeOnBlur = (event: FocusEvent<HTMLDivElement>) => {
    if (!event.currentTarget.contains(event.relatedTarget)) setIsOpen(false);
  };

  return <div className="relative" onBlur={closeOnBlur}>
    <label className="grid gap-2 text-xs font-extrabold uppercase tracking-wide text-foreground" htmlFor={id}>
      Provider
      <input
        id={id}
        name="provider"
        value={value}
        autoComplete="off"
        disabled={disabled}
        onFocus={() => setIsOpen(true)}
        onChange={(event: ChangeEvent<HTMLInputElement>) => {
          setValue(event.target.value);
          setIsOpen(true);
        }}
        className="min-h-12 w-full rounded-md border-0 bg-gray-100 px-4 text-base font-medium normal-case tracking-normal text-foreground shadow-none placeholder:text-gray-500 focus:border-2 focus:border-blue-500 focus:bg-white disabled:cursor-not-allowed disabled:opacity-70"
      />
    </label>
    {showSuggestions ? <div className="absolute z-20 mt-1 grid max-h-48 w-full overflow-auto rounded-md border border-gray-200 bg-white p-1 shadow-lg">
      {suggestions.map((option) => <button key={option} type="button" onMouseDown={(event) => event.preventDefault()} onClick={() => { setValue(option); setIsOpen(false); }} className="rounded px-3 py-2 text-left text-sm font-bold text-foreground hover:bg-blue-50">{option}</button>)}
    </div> : null}
  </div>;
}

function ReleaseDateField({ id, defaultValue, disabled }: { id: string; defaultValue: string; disabled?: boolean }) {
  const [mode, setMode] = useState(defaultValue === "TBD" ? "tbd" : "date");

  if (mode === "tbd") {
    return <div className="grid gap-2">
      <div className="flex min-h-12 items-center justify-between gap-3 rounded-md bg-red-50 px-4">
        <span className="text-xs font-extrabold uppercase tracking-wide text-red-700">Release date: TBD</span>
        <button type="button" onClick={() => setMode("date")} className="rounded-md px-2 py-1 text-xs font-extrabold uppercase tracking-wide text-red-700 hover:bg-red-100" disabled={disabled}>Pick date</button>
      </div>
      <input aria-label="Release date value" className="sr-only" name="releaseDate" value="TBD" readOnly disabled={disabled} />
    </div>;
  }

  return <div className="grid gap-2">
    <SoftInput id={id} type="date" label="Release date" name="releaseDate" defaultValue={defaultValue} disabled={disabled} />
    <button type="button" onClick={() => setMode("tbd")} className="w-fit rounded-md px-2 py-1 text-xs font-extrabold uppercase tracking-wide text-muted hover:bg-gray-100 hover:text-foreground" disabled={disabled}>Mark release date TBD</button>
  </div>;
}

function SeriesTable({ fiscalYearId, ongoingSeries, isDemo }: { fiscalYearId: string; ongoingSeries: OngoingSeries[]; isDemo?: boolean }) {
  return (
    <section>
      <div className="mb-3 flex items-center justify-between">
        <h2 className="font-display text-2xl font-extrabold">Ongoing Series Cadence</h2>
      </div>
      <div className="overflow-hidden rounded-lg border border-gray-200">
        <div className="grid grid-cols-[1.2fr_0.7fr_1fr_auto] gap-3 bg-gray-900 p-3 text-[10px] font-extrabold uppercase tracking-wide text-white">
          <span>Series</span>
          <span>Cadence</span>
          <span>Notes</span>
          <span>Edit</span>
        </div>
        {ongoingSeries.map((item, index) => (
          <details
            data-testid={`series-row-${item.id}`}
            key={item.id}
            className={cn("border-t border-orange-100 p-3", index % 2 === 0 ? "bg-white" : "bg-orange-50")}
          >
            <summary className="grid min-h-11 cursor-pointer list-none items-center gap-3 text-sm md:grid-cols-[1.2fr_0.7fr_1fr_auto]">
              <b>{item.series}</b>
              <span>{item.cadence}</span>
              <span>{item.notes}</span>
              <span>Edit</span>
            </summary>
            <form action={updateOngoingSeries} className="mt-3 grid gap-3 border-t border-gray-200 pt-3 md:grid-cols-2">
              <input type="hidden" name="fiscalYearId" value={fiscalYearId} />
              <input type="hidden" name="seriesId" value={item.id} />
              <SoftInput id={`series-${item.id}`} label="Series" name="series" defaultValue={item.series} disabled={isDemo} />
              <SoftInput id={`cadence-${item.id}`} label="Cadence" name="cadence" defaultValue={item.cadence} disabled={isDemo} />
              <SoftInput id={`series-notes-${item.id}`} label="Notes" name="notes" defaultValue={item.notes ?? ""} disabled={isDemo} />
              <div className="flex gap-2">
                <SoftButton type="submit" variant="primary" disabled={isDemo}>Save Series</SoftButton>
                <SoftButton
                  form={`delete-series-${item.id}`}
                  type="submit"
                  variant="ghost"
                  className="text-red-700"
                  disabled={isDemo}
                  onClick={(event) => {
                    if (!window.confirm(`Delete ${item.series}? This cannot be undone.`)) event.preventDefault();
                  }}
                >
                  Delete
                </SoftButton>
              </div>
            </form>
            <form id={`delete-series-${item.id}`} action={deleteOngoingSeries}>
              <input type="hidden" name="fiscalYearId" value={fiscalYearId} />
              <input type="hidden" name="seriesId" value={item.id} />
            </form>
          </details>
        ))}
        <details className="border-t border-orange-100 bg-blue-50 p-3">
          <summary className="flex min-h-11 cursor-pointer items-center font-extrabold">+ Add ongoing series</summary>
          <form action={addOngoingSeries} className="mt-3 grid gap-3 md:grid-cols-3">
            <input type="hidden" name="fiscalYearId" value={fiscalYearId} />
            <SoftInput id="new-series" label="Series" name="series" disabled={isDemo} />
            <SoftInput id="new-cadence" label="Cadence" name="cadence" disabled={isDemo} />
            <SoftInput id="new-series-notes" label="Notes" name="notes" disabled={isDemo} />
            <SoftButton type="submit" variant="primary" disabled={isDemo}>Add Series</SoftButton>
          </form>
        </details>
      </div>
    </section>
  );
}
