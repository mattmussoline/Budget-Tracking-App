"use client";

import Link from "next/link";
import type { Route } from "next";
import { CalendarPlus, ChevronLeft, ChevronRight, DollarSign, ExternalLink, Maximize2, Minimize2, Plus, Send, Trash2, X } from "lucide-react";
import { type FormEvent, type ReactNode, useMemo, useRef, useState } from "react";
import { SoftButton } from "@/components/ui/soft-button";
import { SoftInput } from "@/components/ui/soft-input";
import { SoftSelect } from "@/components/ui/soft-select";
import { cn } from "@/components/ui/soft-surface";
import { budgetSourceOptions } from "@/features/budget/budget-source";
import {
  addOngoingSeries, addRoadmapItem, deleteOngoingSeries, deleteRoadmapItem, sendRoadmapItemToBudget, sendRoadmapItemToClickUp, sendRoadmapMonthToClickUp,
  updateOngoingSeries, updateRoadmapItem
} from "../planning-actions";
import { TONE_CLASSES, type PlanningTone } from "../planning-constants";
import { buildMonthWindow, formatRoadmapDate, parseMonthAnchor, shiftMonthAnchor } from "../planning-model";
import type { OngoingSeries, RoadmapCategory, RoadmapItem } from "../planning-types";
import { AddRoadmapModal } from "./add-roadmap-modal";
import { CategoryManagerModal } from "./category-manager-modal";
import { EditRoadmapModal } from "./edit-roadmap-modal";
import { ProviderCombobox } from "./provider-combobox";

type RoadmapDashboardProps = {
  fiscalYearId: string;
  roadmapItems: RoadmapItem[];
  ongoingSeries: OngoingSeries[];
  categories: RoadmapCategory[];
  fiscalYearStartMonth?: string;
  startMonth: string;
  monthCount: 6 | 9 | 12;
  isDemo?: boolean;
};

const roadmapStatuses = [
  { label: "Planned", value: "planned" }, { label: "In progress", value: "in_progress" },
  { label: "Blocked", value: "blocked" }, { label: "Released", value: "released" }
];

type RoadmapFilter = { id: string; label: string };

export function RoadmapDashboard({ fiscalYearId, roadmapItems, ongoingSeries, categories, startMonth, fiscalYearStartMonth = getFiscalYearStartMonthForMonth(startMonth), monthCount, isDemo }: RoadmapDashboardProps) {
  const [focusedMonthKey, setFocusedMonthKey] = useState<string | null>(null);
  const [activeFilter, setActiveFilter] = useState<RoadmapFilter | null>(null);
  const [isRoadmapFocus, setIsRoadmapFocus] = useState(false);
  const months = buildMonthWindow(startMonth, monthCount);
  const displayedMonths = focusedMonthKey ? months.filter((month) => month.key === focusedMonthKey) : months;
  const visibleKeys = new Set(months.map((month) => month.key));
  const filteredItems = activeFilter ? roadmapItems.filter((item) => item.categoryId === activeFilter.id) : roadmapItems;
  const backlog = filteredItems.filter((item) => !item.releaseDate || !visibleKeys.has(item.releaseDate.slice(0, 7)));
  const currentMonthKey = parseMonthAnchor(null);
  const releasedBacklog = sortReleasedItems(backlog.filter((item) => item.status === "released" || isBeforeCurrentMonth(item.releaseDate, currentMonthKey)));
  const releasedByMonth = groupReleasedItemsByMonth(releasedBacklog);
  const otherBacklog = backlog.filter((item) => !releasedBacklog.some((released) => released.id === item.id));
  const categoryMap = new Map(categories.map((category) => [category.id, category]));
  const summary = buildRoadmapSummary(roadmapItems, categories, getTodayKey(), fiscalYearStartMonth);
  const providerOptions = useMemo(() => Array.from(new Set(roadmapItems.map((item) => item.provider).filter(Boolean) as string[])).sort((a, b) => a.localeCompare(b)), [roadmapItems]);
  const href = (start: string, count = monthCount) => `/roadmap?fy=${fiscalYearId}&start=${start}&months=${count}` as Route;
  const today = parseMonthAnchor(null);

  return <div className="grid min-w-0 gap-7">
    {!isRoadmapFocus ? <div className="flex flex-wrap items-start justify-between gap-3">
      <div className="flex flex-wrap gap-2">
        <AddRoadmapModal>
          <RoadmapForm fiscalYearId={fiscalYearId} categories={categories} providerOptions={providerOptions} isDemo={isDemo} />
        </AddRoadmapModal>
        <CategoryManagerModal fiscalYearId={fiscalYearId} categories={categories} isDemo={isDemo} />
      </div>
      <div className="flex flex-wrap gap-2" aria-label="Roadmap filters">
        {categories.filter((category) => category.isActive).map((category) => {
          const tone = (category.colorKey in TONE_CLASSES ? category.colorKey : "slate") as PlanningTone;
          const isActive = activeFilter?.id === category.id;
          return <button key={category.id} type="button" aria-label={isActive ? `Clear ${category.name} filter` : `Filter ${category.name}`} aria-pressed={isActive} onClick={() => setActiveFilter(isActive ? null : { id: category.id, label: category.name })} className={cn("rounded-md px-3 py-2 text-[10px] font-extrabold uppercase tracking-wide transition hover:-translate-y-0.5", TONE_CLASSES[tone].chip, isActive && "ring-2 ring-gray-900")}>{category.name}</button>;
        })}
      </div>
    </div> : null}

    {!isRoadmapFocus ? <nav aria-label="Roadmap timeline controls" className="flex flex-wrap items-center justify-between gap-3 rounded-lg bg-gray-900 p-3 text-white">
      <div className="flex flex-wrap gap-2"><Link className="inline-flex min-h-11 items-center rounded-md bg-white/10 px-3 py-2 text-sm font-bold" href={href(shiftMonthAnchor(startMonth, -monthCount))}><ChevronLeft className="inline h-4 w-4" /> Previous</Link><Link className="inline-flex min-h-11 items-center rounded-md bg-amber-400 px-3 py-2 text-sm font-extrabold text-gray-900" href={href(today)}>Today</Link><Link className="inline-flex min-h-11 items-center rounded-md bg-white/10 px-3 py-2 text-sm font-bold" href={href(shiftMonthAnchor(startMonth, monthCount))}>Next <ChevronRight className="inline h-4 w-4" /></Link></div>
      <div className="flex flex-wrap gap-2">{([6, 9, 12] as const).map((count) => <Link key={count} href={href(startMonth, count)} aria-current={monthCount === count ? "page" : undefined} className={cn("inline-flex min-h-11 items-center rounded-md px-3 py-2 text-sm font-bold", monthCount === count ? "bg-white text-gray-900" : "bg-white/10 text-white")}>{count} months</Link>)}</div>
    </nav> : null}

    {!isRoadmapFocus ? <RoadmapSummary summary={summary} /> : null}

    <section className={cn("min-w-0", isRoadmapFocus && "fixed inset-3 z-50 overflow-auto rounded-lg bg-white p-4 shadow-2xl ring-1 ring-gray-200 md:inset-6")}><div className="mb-3 flex flex-wrap items-end justify-between gap-3"><div><h2 className="font-display text-3xl font-extrabold">{months[0].label}–{months[months.length - 1].label}</h2><p className="text-sm text-muted">{activeFilter ? `Filtered by ${activeFilter.label}.` : "Scroll through the roadmap, or click a month to see it at a glance."}</p></div><div className="flex flex-wrap gap-2">{activeFilter ? <SoftButton type="button" variant="ghost" onClick={() => setActiveFilter(null)}><X className="h-4 w-4" aria-hidden="true" />Clear filter</SoftButton> : null}{focusedMonthKey ? <SoftButton type="button" variant="primary" className="shadow-sm ring-1 ring-blue-100" onClick={() => setFocusedMonthKey(null)}><ChevronLeft className="h-4 w-4" aria-hidden="true" />Show all months</SoftButton> : null}<SoftButton type="button" variant={isRoadmapFocus ? "primary" : "ghost"} className={cn(!isRoadmapFocus && "shadow-sm ring-1 ring-blue-100")} onClick={() => setIsRoadmapFocus((value) => !value)}>{isRoadmapFocus ? <Minimize2 className="h-4 w-4" aria-hidden="true" /> : <Maximize2 className="h-4 w-4" aria-hidden="true" />}{isRoadmapFocus ? "Exit focus view" : "Expand roadmap"}</SoftButton></div></div>
      <div data-testid="roadmap-month-scroll" className={cn("flex gap-4 overflow-x-auto overflow-y-visible rounded-lg bg-gray-200 p-3", isRoadmapFocus && "min-h-[calc(100vh-13rem)]")}>
        {displayedMonths.map((month) => {
          const items = filteredItems.filter((item) => item.releaseDate?.slice(0, 7) === month.key);
          return <article data-testid="roadmap-month-column" key={month.key} className={cn("shrink-0 self-start rounded-lg bg-gray-100 p-3", focusedMonthKey ? "w-full min-w-full" : isRoadmapFocus ? "w-[360px]" : "w-[320px]")}><button type="button" aria-label={`Focus ${month.label}`} onClick={() => setFocusedMonthKey(month.key)} className="mb-2 min-h-11 w-full rounded-md bg-white p-3 text-left transition-colors hover:bg-blue-50"><h3 className="text-lg font-extrabold">{month.label}</h3><p className="text-[10px] font-extrabold uppercase tracking-wide text-muted">{items.length} {items.length === 1 ? "release" : "releases"}</p></button><MonthClickUpButton fiscalYearId={fiscalYearId} monthKey={month.key} monthLabel={month.label} items={items} isDemo={isDemo} /><AddRoadmapModal triggerLabel="Add item" triggerAriaLabel={`Add item to ${month.label}`} triggerIcon={<Plus className="h-4 w-4" aria-hidden="true" />} triggerClassName="mb-3 min-h-11 w-full justify-center bg-white px-3 py-2 text-xs !text-blue-700 shadow-sm ring-1 ring-blue-100 hover:bg-blue-50 hover:!text-blue-800"><RoadmapForm fiscalYearId={fiscalYearId} categories={categories} providerOptions={providerOptions} defaultReleaseDate={`${month.key}-01`} idPrefix={`new-${month.key}`} isDemo={isDemo} /></AddRoadmapModal><div className={cn("grid gap-2", focusedMonthKey && "md:grid-cols-2 xl:grid-cols-3")}>{items.map((item) => <RoadmapCard key={item.id} item={item} category={item.categoryId ? categoryMap.get(item.categoryId) : undefined} categories={categories} fiscalYearId={fiscalYearId} isDemo={isDemo} providerOptions={providerOptions} />)}</div></article>;
        })}
      </div>
    </section>

    {!isRoadmapFocus ? <div className="grid gap-6 xl:grid-cols-[1.35fr_0.8fr]">
      <SeriesTable fiscalYearId={fiscalYearId} ongoingSeries={ongoingSeries} isDemo={isDemo} />
      <details data-testid="roadmap-backlog" className="self-start rounded-lg bg-gray-100">
        <summary className="flex cursor-pointer list-none items-center justify-between gap-3 px-4 py-3">
          <div>
            <h2 className="font-display text-lg font-extrabold">Backlog</h2>
            <p className="text-sm text-muted">Undated items and releases outside this visible window.</p>
          </div>
          <span className="grid h-8 w-8 shrink-0 place-items-center rounded-full bg-white text-muted shadow-sm ring-1 ring-gray-200">
            <Plus className="h-4 w-4" aria-hidden="true" />
            <span className="sr-only">Expand Backlog section</span>
          </span>
        </summary>
        <div className="grid gap-3 px-4 pb-4">{backlog.length ? <><BacklogGroup title="In progress" count={otherBacklog.length} testId="backlog-other-content">{otherBacklog.map((item) => <RoadmapCard key={item.id} item={item} category={item.categoryId ? categoryMap.get(item.categoryId) : undefined} categories={categories} fiscalYearId={fiscalYearId} isDemo={isDemo} providerOptions={providerOptions} />)}</BacklogGroup><BacklogGroup title="Already released content" count={releasedBacklog.length} testId="backlog-released-content">{releasedByMonth.map(({ monthKey, monthLabel, items }) => <BacklogGroup key={monthKey} title={monthLabel} count={items.length} testId={`released-month-${monthKey}`}>{items.map((item) => <RoadmapCard key={item.id} item={item} category={item.categoryId ? categoryMap.get(item.categoryId) : undefined} categories={categories} fiscalYearId={fiscalYearId} isDemo={isDemo} providerOptions={providerOptions} />)}</BacklogGroup>)}</BacklogGroup></> : <p className="rounded-md bg-white p-4 font-bold text-muted">No backlog items.</p>}</div>
      </details>
    </div> : null}
  </div>;
}

type RoadmapSummaryData = {
  totalTitles: number;
  releasedCount: number;
  inProgressCount: number;
  unscheduledCount: number;
  topAudiences: Array<{ name: string; count: number; tone: PlanningTone }>;
  topProvider: { name: string; count: number } | null;
  nextRelease: { title: string; date: string } | null;
};

function RoadmapSummary({ summary }: { summary: RoadmapSummaryData }) {
  return <details data-testid="roadmap-summary" className="rounded-lg bg-blue-50 ring-1 ring-blue-100">
    <summary className="flex min-h-20 cursor-pointer list-none items-center justify-between gap-4 p-5">
      <div>
        <h2 className="font-display text-2xl font-extrabold text-blue-950">Fiscal year at a glance</h2>
        <p className="text-sm font-bold text-blue-700">July - June roadmap snapshot.</p>
      </div>
      <div className="flex flex-wrap justify-end gap-2">
        <span className="rounded-full bg-blue-600 px-3 py-1 text-[10px] font-extrabold uppercase tracking-wide text-white">{summary.totalTitles} {summary.totalTitles === 1 ? "title" : "titles"}</span>
        {summary.nextRelease ? <span className="rounded-full bg-amber-300 px-3 py-1 text-[10px] font-extrabold uppercase tracking-wide text-amber-950">Next up</span> : null}
      </div>
    </summary>
    <div className="px-5 pb-5">
      <div className="mb-4 flex flex-wrap items-end justify-between gap-2">
        <div>
          <p className="text-sm font-bold text-blue-900">Snapshot of what is live, moving, and still needs a date.</p>
        </div>
        {summary.nextRelease ? <div className="rounded-md border border-amber-200 bg-amber-50 px-3 py-2 text-right text-xs font-bold text-amber-900">
          <span className="block text-[10px] font-extrabold uppercase tracking-wide">Next up</span>
          <span className="block text-foreground">{summary.nextRelease.title}</span>
          <span>{formatRoadmapDate(summary.nextRelease.date)}</span>
        </div> : null}
      </div>
      <div className="grid gap-3 md:grid-cols-4">
        <SummaryMetric value={`${summary.totalTitles} ${summary.totalTitles === 1 ? "title" : "titles"}`} label="Total content" accentClassName="bg-blue-600" />
        <SummaryMetric value={`${summary.releasedCount} released`} label="Already live" accentClassName="bg-green-500" />
        <SummaryMetric value={`${summary.inProgressCount} in progress`} label="Being worked on" accentClassName="bg-violet-500" />
        <SummaryMetric value={`${summary.unscheduledCount} unscheduled`} label="Need a date" accentClassName="bg-amber-400" />
      </div>
      <div className="mt-4 grid gap-3 md:grid-cols-2">
        <div className="rounded-md border border-blue-100 bg-white p-4">
          <h3 className="text-xs font-extrabold uppercase tracking-wide text-blue-700">Top audience</h3>
          <div className="mt-3 flex flex-wrap gap-2">
            {summary.topAudiences.length ? summary.topAudiences.map((audience) => <span key={audience.name} className={cn("rounded-full px-3 py-1 text-xs font-extrabold", TONE_CLASSES[audience.tone].chip)}>{audience.name} <span className="text-[10px] opacity-70">{audience.count}</span></span>) : <span className="text-sm font-bold text-muted">No audiences yet.</span>}
          </div>
        </div>
        <div className="rounded-md border border-amber-100 bg-white p-4">
          <h3 className="text-xs font-extrabold uppercase tracking-wide text-amber-700">Top provider</h3>
          <p className="mt-2 text-lg font-extrabold text-foreground">{summary.topProvider ? summary.topProvider.name : "No provider yet"}</p>
          <p className="text-xs font-bold text-muted">{summary.topProvider ? `${summary.topProvider.count} ${summary.topProvider.count === 1 ? "title" : "titles"}` : "Provider names will show here once added."}</p>
        </div>
      </div>
    </div>
  </details>;
}

function SummaryMetric({ value, label, accentClassName }: { value: string; label: string; accentClassName: string }) {
  return <div className="overflow-hidden rounded-md bg-white">
    <div className={cn("h-1", accentClassName)} />
    <div className="p-4">
    <p className="text-xl font-extrabold text-foreground">{value}</p>
    <p className="text-xs font-bold uppercase tracking-wide text-muted">{label}</p>
    </div>
  </div>;
}

function buildRoadmapSummary(roadmapItems: RoadmapItem[], categories: RoadmapCategory[], todayKey: string, fiscalYearStartMonth: string): RoadmapSummaryData {
  const summaryItems = roadmapItems.filter((item) => isInFiscalYearSnapshot(item.releaseDate, fiscalYearStartMonth));
  const categoryById = new Map(categories.map((category) => [category.id, category]));
  const audienceCounts = new Map<string, { name: string; count: number; tone: PlanningTone }>();
  const providerCounts = new Map<string, number>();

  for (const item of summaryItems) {
    if (item.categoryId) {
      const category = categoryById.get(item.categoryId);
      if (category) {
        const tone = (category.colorKey in TONE_CLASSES ? category.colorKey : "slate") as PlanningTone;
        const existing = audienceCounts.get(category.id);
        audienceCounts.set(category.id, { name: category.name, tone, count: (existing?.count ?? 0) + 1 });
      }
    }

    const provider = item.provider?.trim();
    if (provider) providerCounts.set(provider, (providerCounts.get(provider) ?? 0) + 1);
  }

  const topAudiences = Array.from(audienceCounts.values())
    .sort((a, b) => b.count - a.count || a.name.localeCompare(b.name))
    .slice(0, 3);
  const topProvider = Array.from(providerCounts.entries())
    .sort(([nameA, countA], [nameB, countB]) => countB - countA || nameA.localeCompare(nameB))
    .map(([name, count]) => ({ name, count }))[0] ?? null;
  const nextReleaseItem = summaryItems
    .filter((item) => isExactRoadmapDate(item.releaseDate) && item.releaseDate! >= todayKey)
    .sort((a, b) => a.releaseDate!.localeCompare(b.releaseDate!))[0];

  return {
    totalTitles: summaryItems.length,
    releasedCount: summaryItems.filter((item) => item.status === "released").length,
    inProgressCount: summaryItems.filter((item) => item.status === "in_progress").length,
    unscheduledCount: summaryItems.filter((item) => !isExactRoadmapDate(item.releaseDate)).length,
    topAudiences,
    topProvider,
    nextRelease: nextReleaseItem ? { title: nextReleaseItem.title, date: nextReleaseItem.releaseDate! } : null
  };
}

function isExactRoadmapDate(releaseDate: string | null) {
  return /^\d{4}-(0[1-9]|1[0-2])-\d{2}$/.test(releaseDate ?? "");
}

function isInFiscalYearSnapshot(releaseDate: string | null, fiscalYearStartMonth: string) {
  if (!isExactRoadmapDate(releaseDate)) return true;
  const monthKey = releaseDate!.slice(0, 7);
  const fiscalYearEndMonth = shiftMonthAnchor(fiscalYearStartMonth, 12);
  return monthKey >= fiscalYearStartMonth && monthKey < fiscalYearEndMonth;
}

function getFiscalYearStartMonthForMonth(monthKey: string) {
  const [year, month] = monthKey.split("-").map(Number);
  const fiscalStartYear = month >= 7 ? year : year - 1;
  return `${fiscalStartYear}-07`;
}

function getTodayKey(date = new Date()) {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
}

function isBeforeCurrentMonth(releaseDate: string | null, currentMonthKey: string) {
  return isExactRoadmapDate(releaseDate) && releaseDate!.slice(0, 7) < currentMonthKey;
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

function sortReleasedItems(items: RoadmapItem[]) {
  return [...items].sort((a, b) => (b.releaseDate ?? "").localeCompare(a.releaseDate ?? ""));
}

function groupReleasedItemsByMonth(items: RoadmapItem[]) {
  const grouped = new Map<string, RoadmapItem[]>();
  for (const item of items) {
    if (!item.releaseDate || !/^\d{4}-(0[1-9]|1[0-2])-\d{2}$/.test(item.releaseDate)) continue;
    const monthKey = item.releaseDate.slice(0, 7);
    grouped.set(monthKey, [...(grouped.get(monthKey) ?? []), item]);
  }

  return Array.from(grouped.entries()).map(([monthKey, monthItems]) => ({
    monthKey,
    monthLabel: formatMonthKey(monthKey),
    items: sortReleasedItems(monthItems)
  }));
}

function formatMonthKey(monthKey: string) {
  const [year, month] = monthKey.split("-").map(Number);
  return new Date(year, month - 1, 1).toLocaleDateString("en-US", { month: "long", year: "numeric" });
}

function RoadmapCard({ item, category, categories, fiscalYearId, providerOptions, isDemo }: { item: RoadmapItem; category?: RoadmapCategory; categories: RoadmapCategory[]; fiscalYearId: string; providerOptions: string[]; isDemo?: boolean }) {
  return <EditRoadmapModal item={item} category={category}>
    <RoadmapForm fiscalYearId={fiscalYearId} categories={categories} providerOptions={providerOptions} item={item} isDemo={isDemo} />
  </EditRoadmapModal>;
}

function MonthClickUpButton({ fiscalYearId, monthKey, monthLabel, items, isDemo }: { fiscalYearId: string; monthKey: string; monthLabel: string; items: RoadmapItem[]; isDemo?: boolean }) {
  const [message, setMessage] = useState<string | null>(null);
  const [isPushing, setIsPushing] = useState(false);
  const unpushedCount = items.filter((item) => !item.clickupTaskId).length;
  const hasItems = items.length > 0;

  const handlePushMonth = async () => {
    if (!hasItems) return;
    setMessage(null);
    setIsPushing(true);

    const formData = new FormData();
    formData.set("fiscalYearId", fiscalYearId);
    formData.set("monthKey", monthKey);

    try {
      const result = await sendRoadmapMonthToClickUp(formData);
      if (result.replacedMissingCount) {
        setMessage(`Recreated ${result.replacedMissingCount} missing ClickUp ${result.replacedMissingCount === 1 ? "task" : "tasks"}.`);
      } else if (result.createdCount) {
        setMessage(`Pushed ${result.createdCount} to ClickUp.`);
      } else {
        setMessage("Everything in this month is already in ClickUp.");
      }
    } catch {
      setMessage("Could not push this month to ClickUp.");
    } finally {
      setIsPushing(false);
    }
  };

  return <div className="mb-3 grid gap-2">
    <SoftButton type="button" variant="ghost" className="min-h-11 w-full justify-center bg-white px-3 py-2 text-xs !text-sky-700 shadow-sm ring-1 ring-sky-100 hover:bg-sky-50 hover:!text-sky-800" disabled={isDemo || isPushing || !hasItems} onClick={handlePushMonth} aria-label={`Push ${monthLabel} to ClickUp`}>
      <CalendarPlus className="h-4 w-4" aria-hidden="true" />
      {isPushing ? "Checking..." : unpushedCount ? `Push ${unpushedCount} to ClickUp` : "Check ClickUp"}
    </SoftButton>
    {message ? <p role="status" className="rounded-md bg-sky-50 px-3 py-2 text-xs font-bold text-sky-800">{message}</p> : null}
  </div>;
}

function RoadmapForm({ fiscalYearId, categories, providerOptions, item, defaultReleaseDate = "", idPrefix, isDemo }: { fiscalYearId: string; categories: RoadmapCategory[]; providerOptions: string[]; item?: RoadmapItem; defaultReleaseDate?: string; idPrefix?: string; isDemo?: boolean }) {
  const action = item ? updateRoadmapItem : addRoadmapItem;
  const fieldPrefix = idPrefix ?? item?.id ?? "new";
  const formRef = useRef<HTMLFormElement>(null);
  const [resetCount, setResetCount] = useState(0);
  const [message, setMessage] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [clickUpUrl, setClickUpUrl] = useState(item?.clickupTaskUrl ?? null);
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

  const handleSendToBudget = async () => {
    if (!item || !formRef.current) return;
    setMessage(null);
    setIsSaving(true);

    try {
      await sendRoadmapItemToBudget(new FormData(formRef.current));
      setMessage("Pushed to Dashboard with a $0 yearly placeholder. Update the amount on the Dashboard.");
    } catch {
      setMessage("Could not add this roadmap item to the budget.");
    } finally {
      setIsSaving(false);
    }
  };

  const handleSendToClickUp = async () => {
    if (!item || !formRef.current) return;
    setMessage(null);
    setIsSaving(true);

    try {
      const result = await sendRoadmapItemToClickUp(new FormData(formRef.current));
      setClickUpUrl(result.taskUrl ?? null);
      setMessage(result.replacedMissingTask ? "Original ClickUp task was missing, so a new one was created." : result.created ? "Pushed to ClickUp Content Upload Calendar." : "Already in ClickUp.");
    } catch {
      setMessage("Could not push this roadmap item to ClickUp.");
    } finally {
      setIsSaving(false);
    }
  };

  return <form ref={formRef} action={item ? action : undefined} onSubmit={item ? handleEditSubmit : handleAddSubmit} className="mt-4 grid gap-3 border-t border-gray-200 pt-4 md:grid-cols-2">
    <input type="hidden" name="fiscalYearId" value={fiscalYearId} />
    {item ? <input type="hidden" name="itemId" value={item.id} /> : null}
    {message ? <p role="status" className="rounded-md bg-green-50 px-4 py-3 text-sm font-bold text-green-800 md:col-span-2">{message}</p> : null}
    <SoftInput id={`${fieldPrefix}-title`} label="Title" name="title" defaultValue={item?.title} required disabled={fieldsDisabled} />
    <ProviderCombobox key={`provider-${resetCount}`} id={`${fieldPrefix}-provider`} defaultValue={item?.provider ?? ""} options={providerOptions} disabled={fieldsDisabled} />
    <ReleaseDateField key={`date-${resetCount}`} id={`${fieldPrefix}-date`} defaultValue={item?.releaseDate ?? defaultReleaseDate} disabled={fieldsDisabled} />
    <SoftSelect id={`${fieldPrefix}-status`} label="Status" name="status" defaultValue={item?.status ?? "planned"} options={roadmapStatuses} className="min-h-12 self-start px-3 text-sm" disabled={fieldsDisabled} />
    <SoftSelect id={`${fieldPrefix}-budget-source`} label="Budget source" name="budgetSource" defaultValue={item?.budgetSource ?? "misc_licensing"} options={[...budgetSourceOptions]} className="min-h-12 self-start px-3 text-sm" disabled={fieldsDisabled} />
    <SoftSelect id={`${fieldPrefix}-category`} label="Color category" name="categoryId" defaultValue={item?.categoryId ?? ""} placeholder="No category" options={categoryOptions} disabled={fieldsDisabled} />
    <SoftInput id={`${fieldPrefix}-notes`} label="Notes" name="notes" defaultValue={item?.notes ?? ""} disabled={fieldsDisabled} />
    <div data-testid="roadmap-form-actions" className={cn("flex flex-wrap gap-2 md:col-span-2", item && "pb-5 sm:pb-6")}>
      <SoftButton type="submit" variant="primary" disabled={fieldsDisabled}>{item ? isSaving ? "Saving..." : "Save Item" : isSaving ? "Adding..." : "Add Item"}</SoftButton>
      {item ? <SoftButton data-roadmap-delete="true" formAction={deleteRoadmapItem} type="submit" variant="ghost" className="text-red-700" disabled={isDemo} onClick={(event) => { if (!window.confirm(`Delete ${item.title}? This cannot be undone.`)) event.preventDefault(); }}><Trash2 className="h-4 w-4" />Delete</SoftButton> : null}
      {item ? <SoftButton type="button" variant="ghost" disabled={fieldsDisabled} onClick={handleSendToBudget}><DollarSign className="h-4 w-4" />Push to Dashboard</SoftButton> : null}
      {item ? <SoftButton type="button" variant="ghost" disabled={fieldsDisabled} onClick={handleSendToClickUp}><Send className="h-4 w-4" />{clickUpUrl ? "Check ClickUp" : "Push to ClickUp"}</SoftButton> : null}
      {clickUpUrl ? <a href={clickUpUrl} target="_blank" rel="noreferrer" className="inline-flex min-h-12 items-center justify-center gap-2 rounded-md bg-sky-50 px-5 py-3 text-sm font-extrabold uppercase tracking-wide text-sky-700 transition-all duration-200 hover:scale-[1.03] hover:bg-sky-100 active:scale-[0.98]"><ExternalLink className="h-4 w-4" />Open in ClickUp</a> : null}
    </div>
  </form>;
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
