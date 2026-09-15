"use client";

import Link from "next/link";
import type { Route } from "next";
import { Check, ChevronLeft, ChevronRight, DollarSign, ExternalLink, Maximize2, Minimize2, Plus, Presentation, Send, Star, Trash2, X } from "lucide-react";
import { type FormEvent, type ReactNode, type SelectHTMLAttributes, useMemo, useRef, useState } from "react";
import { SoftButton } from "@/components/ui/soft-button";
import { SoftInput } from "@/components/ui/soft-input";
import { SoftSelect } from "@/components/ui/soft-select";
import { cn } from "@/components/ui/soft-surface";
import { PageHead } from "./planning-shell";
import { budgetSourceOptions, buildMinutesByBudgetSourceSummary, getBudgetSourceLabel } from "@/features/budget/budget-source";
import { formatCurrency } from "@/lib/currency";
import {
  addOngoingSeries, addRoadmapItem, deleteOngoingSeries, deleteRoadmapItem, sendRoadmapItemToBudget, sendRoadmapItemToClickUp, sendRoadmapMonthToClickUp,
  updateOngoingSeries, updateRoadmapItem
} from "../planning-actions";
import { CONTENT_FORMATS, CONTENT_GENRES, TONE_CLASSES, type PlanningOption } from "../planning-constants";
import {
  buildMonthWindow,
  getRoadmapMonthKey,
  isExactRoadmapDate,
  isMonthTbdRoadmapDate,
  parseMonthAnchor,
  shiftMonthAnchor
} from "../planning-model";
import { buildRoadmapMix, matchesMixFilter, type MixFilter } from "../roadmap-mix";
import { ROADMAP_STATUSES, type OngoingSeries, type RoadmapCategory, type RoadmapItem } from "../planning-types";
import { AddRoadmapModal } from "./add-roadmap-modal";
import { CategoryManagerModal } from "./category-manager-modal";
import { EditRoadmapModal } from "./edit-roadmap-modal";
import { RoadmapMix } from "./roadmap-mix";
import { RoadmapPresent } from "./roadmap-present";
import { RoadmapRail } from "./roadmap-rail";
import { ProviderCombobox } from "./provider-combobox";

type RoadmapDashboardProps = {
  /** Rendered here rather than by PlanningShell so the page actions can reach client state. */
  pageTitle?: string;
  pageDescription?: string;
  fiscalYearId: string;
  roadmapItems: RoadmapItem[];
  ongoingSeries: OngoingSeries[];
  categories: RoadmapCategory[];
  fiscalYearStartMonth?: string;
  startMonth: string;
  monthCount: 6 | 9 | 12;
  routeBasePath?: "/roadmap" | "/demo/roadmap";
  /** Shown as the present-mode eyebrow, e.g. "FY27". */
  fiscalYearLabel?: string;
  isDemo?: boolean;
};

const roadmapStatuses = [
  { label: "Planned", value: "planned" },
  { label: "Scheduled", value: "scheduled" },
  { label: "In progress", value: "in_progress" },
  { label: "Blocked", value: "blocked" },
  { label: "Released", value: "released" }
] satisfies Array<{ label: string; value: (typeof ROADMAP_STATUSES)[number] }>;
const genreOptions = [{ label: "No genre", value: "", tone: "slate" }, ...CONTENT_GENRES] satisfies PlanningOption[];
const formatOptions = [{ label: "No format", value: "", tone: "slate" }, ...CONTENT_FORMATS] satisfies PlanningOption[];

type RoadmapFilter = { id: string; label: string };

const ROADMAP_DESCRIPTION = "Plan releases by month, rank the fiscal year at a glance, and hand titles off to Licensing Summary or ClickUp.";

export function RoadmapDashboard({ pageTitle = "Roadmap", pageDescription = ROADMAP_DESCRIPTION, fiscalYearId, roadmapItems, ongoingSeries, categories, startMonth, fiscalYearStartMonth = getFiscalYearStartMonthForMonth(startMonth), monthCount, routeBasePath = "/roadmap", fiscalYearLabel, isDemo }: RoadmapDashboardProps) {
  const [focusedMonthKey, setFocusedMonthKey] = useState<string | null>(null);
  const [activeFilter, setActiveFilter] = useState<RoadmapFilter | null>(null);
  const [mixFilter, setMixFilter] = useState<MixFilter | null>(null);
  const [isRoadmapFocus, setIsRoadmapFocus] = useState(false);
  const [activeRoadmapItemId, setActiveRoadmapItemId] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<"cards" | "calendar">("cards");
  const [isPresenting, setIsPresenting] = useState(false);
  const [calendarMonthKey, setCalendarMonthKey] = useState(() => parseMonthAnchor(null));
  const months = buildMonthWindow(startMonth, monthCount);
  const displayedMonths = focusedMonthKey ? months.filter((month) => month.key === focusedMonthKey) : months;
  const visibleKeys = new Set(months.map((month) => month.key));
  /** Category filter only. The Mix ranks from this — ranking the Mix-filtered list would collapse each list to its own selected row. */
  const filteredItems = activeFilter ? roadmapItems.filter((item) => item.categoryId === activeFilter.id) : roadmapItems;
  const visibleItems = mixFilter ? filteredItems.filter((item) => matchesMixFilter(item, mixFilter)) : filteredItems;
  const mixLists = buildRoadmapMix(filteredItems, categories, mixFilter);
  const clearAllFilters = () => {
    setActiveFilter(null);
    setMixFilter(null);
  };
  const filterSummary = [activeFilter?.label, mixFilter?.label].filter(Boolean).join(" + ");
  const pickMixFilter = (next: MixFilter | null) => {
    setMixFilter(next);
    setFocusedMonthKey(null);
  };
  const backlog = visibleItems.filter((item) => {
    const monthKey = getRoadmapMonthKey(item.releaseDate);
    return !monthKey || !visibleKeys.has(monthKey);
  });
  const currentMonthKey = parseMonthAnchor(null);
  const releasedBacklog = sortReleasedItems(backlog.filter((item) => item.status === "released" || isBeforeCurrentMonth(item.releaseDate, currentMonthKey)));
  const releasedByMonth = groupReleasedItemsByMonth(releasedBacklog);
  const otherBacklog = backlog.filter((item) => !releasedBacklog.some((released) => released.id === item.id));
  const categoryMap = new Map(categories.map((category) => [category.id, category]));
  const summary = buildRoadmapSummary(roadmapItems, getTodayKey(), fiscalYearStartMonth);
  const minutesByBudgetSource = buildMinutesByBudgetSourceSummary([
    ...roadmapItems.filter((item) => isInFiscalYearSnapshot(item.releaseDate, fiscalYearStartMonth)),
    ...ongoingSeries
  ]);
  const providerOptions = useMemo(() => Array.from(new Set(roadmapItems.map((item) => item.provider).filter(Boolean) as string[])).sort((a, b) => a.localeCompare(b)), [roadmapItems]);
  const href = (start: string, count = monthCount) => `${routeBasePath}?fy=${fiscalYearId}&start=${start}&months=${count}` as Route;
  const categoryCounts = new Map<string, number>();
  for (const item of roadmapItems) {
    if (item.categoryId) categoryCounts.set(item.categoryId, (categoryCounts.get(item.categoryId) ?? 0) + 1);
  }
  const jumpToBacklog = () => {
    const node = document.getElementById("roadmap-backlog");
    if (node) window.scrollTo({ top: node.getBoundingClientRect().top + window.scrollY - 80, behavior: "smooth" });
  };
  const presentMonths = months.map((month) => ({
    key: month.key,
    label: month.date.toLocaleDateString("en-US", { month: "short", year: "numeric" }),
    items: visibleItems.filter((item) => getRoadmapMonthKey(item.releaseDate) === month.key)
  }));
  const today = parseMonthAnchor(null);

  return <div className="grid min-w-0 gap-5">
    {!isRoadmapFocus ? <PageHead title={pageTitle} description={pageDescription} /> : null}

    <div className={cn("grid min-w-0 gap-5", !isRoadmapFocus && "xl:grid-cols-[288px_minmax(0,1fr)] xl:items-start")}>
      {!isRoadmapFocus ? <RoadmapRail
        minutes={minutesByBudgetSource}
        categories={categories.filter((category) => category.isActive)}
        categoryCounts={categoryCounts}
        activeCategoryId={activeFilter?.id ?? null}
        onToggleCategory={(category) => setActiveFilter(activeFilter?.id === category.id ? null : { id: category.id, label: category.name })}
        hasFilter={Boolean(filterSummary)}
        onClearFilter={clearAllFilters}
        nextRelease={summary.nextRelease}
        onOpenNextRelease={setActiveRoadmapItemId}
        stats={{ released: summary.releasedCount, inProgress: summary.inProgressCount, needsDate: summary.unscheduledCount, backlog: backlog.length }}
        onJumpToBacklog={jumpToBacklog}
        actions={<>
          <AddRoadmapModal>
            <RoadmapForm fiscalYearId={fiscalYearId} categories={categories} providerOptions={providerOptions} isDemo={isDemo} />
          </AddRoadmapModal>
          <CategoryManagerModal fiscalYearId={fiscalYearId} categories={categories} isDemo={isDemo} />
          <SoftButton type="button" variant="secondary" className="w-full justify-center" onClick={() => { setFocusedMonthKey(null); setIsPresenting(true); }}>
            <Presentation className="h-4 w-4" aria-hidden="true" />
            Present to team
          </SoftButton>
        </>}
      /> : null}

      <div className="grid min-w-0 gap-5">

    {!isRoadmapFocus ? <div className="flex flex-wrap items-center justify-between gap-x-6 gap-y-3">
      <nav aria-label="Roadmap timeline controls" className="flex flex-wrap items-center gap-3.5">
        {viewMode === "cards" ? <>
          <div className="flex items-center overflow-hidden rounded-lg border border-hairline bg-panel">
            <Link className="inline-flex min-h-9 items-center gap-1 px-3 py-1.5 text-[13px] font-semibold text-muted transition-colors hover:bg-panel-warm hover:text-foreground" href={href(shiftMonthAnchor(startMonth, -monthCount))}><ChevronLeft className="h-3.5 w-3.5" aria-hidden="true" />Previous</Link>
            <span aria-hidden="true" className="w-px self-stretch bg-hairline" />
            <Link className="inline-flex min-h-9 items-center bg-formed-blue-soft px-3 py-1.5 text-[13px] font-bold text-formed-blue" href={href(today)}>Today</Link>
            <span aria-hidden="true" className="w-px self-stretch bg-hairline" />
            <Link className="inline-flex min-h-9 items-center gap-1 px-3 py-1.5 text-[13px] font-semibold text-muted transition-colors hover:bg-panel-warm hover:text-foreground" href={href(shiftMonthAnchor(startMonth, monthCount))}>Next<ChevronRight className="h-3.5 w-3.5" aria-hidden="true" /></Link>
          </div>
          <div className="flex items-center overflow-hidden rounded-lg border border-hairline bg-panel">
            {([6, 9, 12] as const).map((count) => <Link key={count} href={href(startMonth, count)} aria-current={monthCount === count ? "page" : undefined} className={cn("inline-flex min-h-9 items-center px-3 py-1.5 text-[13px] transition-colors", monthCount === count ? "bg-augustine-blue font-bold text-white" : "font-semibold text-muted hover:bg-panel-warm hover:text-foreground")}>{count} months</Link>)}
          </div>
        </> : <div className="flex items-center overflow-hidden rounded-lg border border-hairline bg-panel">
          <button type="button" aria-label="Previous month" onClick={() => setCalendarMonthKey((key) => shiftMonthAnchor(key, -1))} className="inline-flex min-h-9 items-center gap-1 px-3 py-1.5 text-[13px] font-semibold text-muted transition-colors hover:bg-panel-warm hover:text-foreground"><ChevronLeft className="h-3.5 w-3.5" aria-hidden="true" />Previous</button>
          <span aria-hidden="true" className="w-px self-stretch bg-hairline" />
          <button type="button" onClick={() => setCalendarMonthKey(parseMonthAnchor(null))} className="inline-flex min-h-9 items-center bg-formed-blue-soft px-3 py-1.5 text-[13px] font-bold text-formed-blue">Today</button>
          <span aria-hidden="true" className="w-px self-stretch bg-hairline" />
          <button type="button" aria-label="Next month" onClick={() => setCalendarMonthKey((key) => shiftMonthAnchor(key, 1))} className="inline-flex min-h-9 items-center gap-1 px-3 py-1.5 text-[13px] font-semibold text-muted transition-colors hover:bg-panel-warm hover:text-foreground">Next<ChevronRight className="h-3.5 w-3.5" aria-hidden="true" /></button>
        </div>}
        <div className="flex items-center overflow-hidden rounded-lg border border-hairline bg-panel" role="group" aria-label="Roadmap view">
          <button type="button" aria-pressed={viewMode === "cards"} onClick={() => setViewMode("cards")} className={cn("inline-flex min-h-9 items-center px-3 py-1.5 text-[13px] transition-colors", viewMode === "cards" ? "bg-augustine-blue font-bold text-white" : "font-semibold text-muted hover:bg-panel-warm hover:text-foreground")}>Cards</button>
          <span aria-hidden="true" className="w-px self-stretch bg-hairline" />
          <button type="button" aria-pressed={viewMode === "calendar"} onClick={() => setViewMode("calendar")} className={cn("inline-flex min-h-9 items-center px-3 py-1.5 text-[13px] transition-colors", viewMode === "calendar" ? "bg-augustine-blue font-bold text-white" : "font-semibold text-muted hover:bg-panel-warm hover:text-foreground")}>Calendar</button>
        </div>
      </nav>
    </div> : null}


    {viewMode === "cards" ? <section className={cn("min-w-0", isRoadmapFocus && "fixed inset-3 z-50 overflow-auto rounded-lg bg-white p-4 shadow-2xl ring-1 ring-hairline md:inset-6")}><div className="mb-3 flex flex-wrap items-end justify-between gap-3"><div className="grid gap-0.5"><h2 className="font-display text-2xl">{months[0].label} – {months[months.length - 1].label}</h2><p className="text-sm text-muted">{filterSummary ? `Filtered to ${filterSummary} — ${visibleItems.length} ${visibleItems.length === 1 ? "title" : "titles"}.` : "Scroll through the roadmap, or click a month to see it at a glance."}</p></div><div className="flex flex-wrap gap-2">{filterSummary ? <SoftButton type="button" variant="ghost" onClick={clearAllFilters}><X className="h-4 w-4" aria-hidden="true" />Clear filter</SoftButton> : null}{focusedMonthKey ? <SoftButton type="button" variant="primary" className="shadow-sm ring-1 ring-formed-blue-border" onClick={() => setFocusedMonthKey(null)}><ChevronLeft className="h-4 w-4" aria-hidden="true" />Show all months</SoftButton> : null}<SoftButton type="button" variant={isRoadmapFocus ? "primary" : "ghost"} className={cn(!isRoadmapFocus && "shadow-sm ring-1 ring-formed-blue-border")} onClick={() => setIsRoadmapFocus((value) => !value)}>{isRoadmapFocus ? <Minimize2 className="h-4 w-4" aria-hidden="true" /> : <Maximize2 className="h-4 w-4" aria-hidden="true" />}{isRoadmapFocus ? "Exit focus view" : "Expand roadmap"}</SoftButton></div></div>
      <div data-testid="roadmap-month-scroll" className={cn("flex gap-3 overflow-x-auto overflow-y-visible", isRoadmapFocus && "min-h-[calc(100vh-13rem)]")}>
        {displayedMonths.map((month) => {
          const items = visibleItems.filter((item) => getRoadmapMonthKey(item.releaseDate) === month.key);
          const monthMinutes = items.reduce((sum, item) => sum + (Number(item.minutes) || 0), 0);
          return <article data-testid="roadmap-month-column" key={month.key} className={cn("shrink-0 self-start overflow-hidden rounded-soft border border-hairline bg-panel", focusedMonthKey ? "w-full min-w-full" : isRoadmapFocus ? "w-[360px]" : "w-[286px]")}>
            <button type="button" aria-label={`Focus ${month.label}`} onClick={() => setFocusedMonthKey(month.key)} className="flex w-full flex-wrap items-baseline justify-between gap-2 border-b border-hairline bg-panel-warm px-3.5 py-3 text-left transition-colors hover:bg-hairline/40">
              <h3 className="font-display text-xl">{month.label}</h3>
              <span className="text-[11px] font-semibold text-faint">{items.length} {items.length === 1 ? "release" : "releases"} · {monthMinutes} min</span>
            </button>
            <div className={cn("grid", focusedMonthKey && "md:grid-cols-2 xl:grid-cols-3")}>
              {items.length ? items.map((item) => <RoadmapCard key={item.id} variant="month" item={item} category={item.categoryId ? categoryMap.get(item.categoryId) : undefined} categories={categories} fiscalYearId={fiscalYearId} isDemo={isDemo} providerOptions={providerOptions} isOpen={activeRoadmapItemId === item.id} onOpen={() => setActiveRoadmapItemId(item.id)} onClose={() => setActiveRoadmapItemId((currentId) => currentId === item.id ? null : currentId)} />) : <p className="border-b border-hairline px-3.5 py-4 text-xs text-faint">Nothing scheduled this month.</p>}
            </div>
            <div className="flex flex-wrap items-center justify-between gap-2 px-3.5 py-2.5">
              <AddRoadmapModal triggerLabel="Add" triggerAriaLabel={`Add item to ${month.label}`} triggerIcon={<Plus className="h-3 w-3" aria-hidden="true" />} triggerClassName="min-h-0 border-0 bg-transparent p-0 text-[11.5px] !text-muted hover:!bg-transparent hover:!text-foreground">
                <RoadmapForm fiscalYearId={fiscalYearId} categories={categories} providerOptions={providerOptions} defaultReleaseDate={`${month.key}-01`} idPrefix={`new-${month.key}`} isDemo={isDemo} />
              </AddRoadmapModal>
              <MonthClickUpButton fiscalYearId={fiscalYearId} monthKey={month.key} monthLabel={month.label} items={items} isDemo={isDemo} />
            </div>
          </article>;
        })}
      </div>
    </section> : <RoadmapCalendar
      monthKey={calendarMonthKey}
      items={visibleItems}
      categoryMap={categoryMap}
      categories={categories}
      fiscalYearId={fiscalYearId}
      providerOptions={providerOptions}
      isDemo={isDemo}
      activeRoadmapItemId={activeRoadmapItemId}
      setActiveRoadmapItemId={setActiveRoadmapItemId}
    />}

    {!isRoadmapFocus ? <div className="grid gap-4 xl:grid-cols-[minmax(0,1.6fr)_minmax(0,1fr)]">
      <SeriesTable fiscalYearId={fiscalYearId} ongoingSeries={ongoingSeries} isDemo={isDemo} />
      <details id="roadmap-backlog" data-testid="roadmap-backlog" className="self-start rounded-soft border border-hairline bg-panel-warm" open>
        <summary className="flex cursor-pointer list-none items-center justify-between gap-3 px-5 py-3 [&::-webkit-details-marker]:hidden">
          <div className="grid min-w-0 gap-0.5">
            <h2 className="font-display text-lg">Backlog</h2>
            <p className="text-xs text-muted [text-wrap:pretty]">Undated items and releases outside this visible window.</p>
          </div>
          <span className="grid h-7 w-7 shrink-0 place-items-center rounded-lg border border-hairline bg-panel text-muted">
            <Plus className="h-3.5 w-3.5" aria-hidden="true" />
            <span className="sr-only">Expand Backlog section</span>
          </span>
        </summary>
        <div className="grid gap-3 border-t border-hairline px-5 pb-4 pt-3">{backlog.length ? <><BacklogGroup title="In progress" count={otherBacklog.length} testId="backlog-other-content" defaultOpen>{otherBacklog.map((item) => <RoadmapCard key={item.id} item={item} category={item.categoryId ? categoryMap.get(item.categoryId) : undefined} categories={categories} fiscalYearId={fiscalYearId} isDemo={isDemo} providerOptions={providerOptions} isOpen={activeRoadmapItemId === item.id} onOpen={() => setActiveRoadmapItemId(item.id)} onClose={() => setActiveRoadmapItemId((currentId) => currentId === item.id ? null : currentId)} />)}</BacklogGroup><BacklogGroup title="Already released content" count={releasedBacklog.length} testId="backlog-released-content">{releasedByMonth.map(({ monthKey, monthLabel, items }) => <BacklogGroup key={monthKey} title={monthLabel} count={items.length} testId={`released-month-${monthKey}`}>{items.map((item) => <RoadmapCard key={item.id} item={item} category={item.categoryId ? categoryMap.get(item.categoryId) : undefined} categories={categories} fiscalYearId={fiscalYearId} isDemo={isDemo} providerOptions={providerOptions} isOpen={activeRoadmapItemId === item.id} onOpen={() => setActiveRoadmapItemId(item.id)} onClose={() => setActiveRoadmapItemId((currentId) => currentId === item.id ? null : currentId)} />)}</BacklogGroup>)}</BacklogGroup></> : <p className="text-sm text-faint">No backlog items.</p>}</div>
      </details>
    </div> : null}

    {!isRoadmapFocus ? <RoadmapMix lists={mixLists} rankedTitleCount={filteredItems.length} isFiltered={Boolean(filterSummary)} activeFilter={mixFilter} onPick={pickMixFilter} /> : null}
      </div>
    </div>

    {isPresenting ? <RoadmapPresent
      fiscalYearLabel={fiscalYearLabel}
      rangeLabel={`${months[0].label} – ${months[months.length - 1].label}`}
      months={presentMonths}
      columns={Math.min(monthCount, 6)}
      minutes={minutesByBudgetSource}
      categories={categories.filter((category) => category.isActive)}
      categoryMap={categoryMap}
      stats={{ total: summary.totalTitles, released: summary.releasedCount, inProgress: summary.inProgressCount, needsDate: summary.unscheduledCount }}
      onExit={() => setIsPresenting(false)}
    /> : null}
  </div>;
}

type RoadmapSummaryData = {
  totalTitles: number;
  releasedCount: number;
  inProgressCount: number;
  unscheduledCount: number;
  releasedItems: RoadmapItem[];
  inProgressItems: RoadmapItem[];
  unscheduledItems: RoadmapItem[];
  nextRelease: { id: string; title: string; date: string } | null;
};






function buildRoadmapSummary(roadmapItems: RoadmapItem[], todayKey: string, fiscalYearStartMonth: string): RoadmapSummaryData {
  const summaryItems = roadmapItems.filter((item) => isInFiscalYearSnapshot(item.releaseDate, fiscalYearStartMonth));
  const nextReleaseItem = summaryItems
    .filter((item) => isExactRoadmapDate(item.releaseDate) && item.releaseDate! >= todayKey)
    .sort((a, b) => a.releaseDate!.localeCompare(b.releaseDate!))[0];
  const releasedItems = sortRoadmapSummaryItems(summaryItems.filter((item) => item.status === "released"), "desc");
  const inProgressItems = sortRoadmapSummaryItems(summaryItems.filter((item) => item.status === "in_progress"), "asc");
  const unscheduledItems = sortRoadmapSummaryItems(summaryItems.filter((item) => !isExactRoadmapDate(item.releaseDate)), "asc");

  return {
    totalTitles: summaryItems.length,
    releasedCount: releasedItems.length,
    inProgressCount: inProgressItems.length,
    unscheduledCount: unscheduledItems.length,
    releasedItems,
    inProgressItems,
    unscheduledItems,
    nextRelease: nextReleaseItem ? { id: nextReleaseItem.id, title: nextReleaseItem.title, date: nextReleaseItem.releaseDate! } : null
  };
}

function sortRoadmapSummaryItems(items: RoadmapItem[], direction: "asc" | "desc") {
  return [...items].sort((a, b) => {
    const dateA = isExactRoadmapDate(a.releaseDate) ? a.releaseDate! : "9999-12-31";
    const dateB = isExactRoadmapDate(b.releaseDate) ? b.releaseDate! : "9999-12-31";
    const dateSort = direction === "asc" ? dateA.localeCompare(dateB) : dateB.localeCompare(dateA);
    return dateSort || a.title.localeCompare(b.title);
  });
}


function isInFiscalYearSnapshot(releaseDate: string | null, fiscalYearStartMonth: string) {
  const monthKey = getRoadmapMonthKey(releaseDate);
  if (!monthKey) return true;
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
  const monthKey = getRoadmapMonthKey(releaseDate);
  return Boolean(monthKey && monthKey < currentMonthKey);
}

function BacklogGroup({ title, count, testId, children, defaultOpen = false }: { title: string; count: number; testId: string; children: ReactNode; defaultOpen?: boolean }) {
  return <details data-testid={testId} className="rounded-md bg-white p-3" open={defaultOpen}>
    <summary className="flex cursor-pointer list-none items-center justify-between gap-3 text-sm font-semibold">
      <span>{title}</span>
      <span className="rounded-full bg-panel-warm px-2 py-1 text-[10px] uppercase tracking-wide text-muted">{count}</span>
    </summary>
    <div className="mt-3 grid gap-2">{count ? children : <p className="rounded-md bg-panel-warm p-3 text-sm font-bold text-muted">No items.</p>}</div>
  </details>;
}

function sortReleasedItems(items: RoadmapItem[]) {
  return [...items].sort((a, b) => (b.releaseDate ?? "").localeCompare(a.releaseDate ?? ""));
}

function groupReleasedItemsByMonth(items: RoadmapItem[]) {
  const grouped = new Map<string, RoadmapItem[]>();
  for (const item of items) {
    const monthKey = getRoadmapMonthKey(item.releaseDate);
    if (!monthKey) continue;
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

function RoadmapCard({ item, category, categories, fiscalYearId, providerOptions, isDemo, isOpen, onOpen, onClose, variant }: { item: RoadmapItem; category?: RoadmapCategory; categories: RoadmapCategory[]; fiscalYearId: string; providerOptions: string[]; isDemo?: boolean; isOpen: boolean; onOpen: () => void; onClose: () => void; variant?: "card" | "month" }) {
  return <EditRoadmapModal item={item} category={category} isDemo={isDemo} isOpen={isOpen} onOpen={onOpen} onClose={onClose} variant={variant}>
    <RoadmapForm fiscalYearId={fiscalYearId} categories={categories} providerOptions={providerOptions} item={item} isDemo={isDemo} />
  </EditRoadmapModal>;
}

type RoadmapCalendarProps = {
  monthKey: string;
  items: RoadmapItem[];
  categoryMap: Map<string, RoadmapCategory>;
  categories: RoadmapCategory[];
  fiscalYearId: string;
  providerOptions: string[];
  isDemo?: boolean;
  activeRoadmapItemId: string | null;
  setActiveRoadmapItemId: (updater: string | null | ((currentId: string | null) => string | null)) => void;
};

const WEEKDAY_LABELS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

function RoadmapCalendar({ monthKey, items, categoryMap, categories, fiscalYearId, providerOptions, isDemo, activeRoadmapItemId, setActiveRoadmapItemId }: RoadmapCalendarProps) {
  const [year, month] = monthKey.split("-").map(Number);
  const daysInMonth = new Date(year, month, 0).getDate();
  const startWeekday = new Date(year, month - 1, 1).getDay();
  const monthLabel = new Date(year, month - 1, 1).toLocaleDateString("en-US", { month: "long", year: "numeric" });
  const byDay = useMemo(() => groupCalendarItemsByDay(items, monthKey), [items, monthKey]);
  const today = new Date();
  const isCurrentMonth = today.getFullYear() === year && today.getMonth() === month - 1;
  const totalCount = items.filter((item) => getRoadmapMonthKey(item.releaseDate) === monthKey).length;
  const trailing = (7 - ((startWeekday + daysInMonth) % 7)) % 7;

  return <section className="min-w-0 rounded-soft border border-hairline bg-panel-warm p-3.5">
    <div className="mb-3 flex flex-wrap items-end justify-between gap-3">
      <div className="grid gap-0.5">
        <h2 className="font-display text-2xl">{monthLabel}</h2>
        <p className="text-sm text-muted">{totalCount} {totalCount === 1 ? "release" : "releases"} this month. Month-TBD items sit on the 1st.</p>
      </div>
    </div>
    <div className="mb-1.5 grid grid-cols-7 gap-1.5 text-center text-[11px] font-semibold uppercase tracking-wide text-muted">
      {WEEKDAY_LABELS.map((label) => <span key={label}>{label}</span>)}
    </div>
    <div className="grid grid-cols-7 gap-1.5">
      {Array.from({ length: startWeekday }, (_, index) => <div key={`lead-${index}`} aria-hidden="true" />)}
      {Array.from({ length: daysInMonth }, (_, index) => {
        const day = index + 1;
        return <RoadmapCalendarDay
          key={day}
          day={day}
          isToday={isCurrentMonth && today.getDate() === day}
          items={byDay.get(day) ?? []}
          categoryMap={categoryMap}
          categories={categories}
          fiscalYearId={fiscalYearId}
          providerOptions={providerOptions}
          isDemo={isDemo}
          activeRoadmapItemId={activeRoadmapItemId}
          setActiveRoadmapItemId={setActiveRoadmapItemId}
        />;
      })}
      {Array.from({ length: trailing }, (_, index) => <div key={`trail-${index}`} aria-hidden="true" />)}
    </div>
  </section>;
}

function groupCalendarItemsByDay(items: RoadmapItem[], monthKey: string) {
  const byDay = new Map<number, RoadmapItem[]>();
  for (const item of items) {
    if (getRoadmapMonthKey(item.releaseDate) !== monthKey) continue;
    const day = isExactRoadmapDate(item.releaseDate) ? Number(item.releaseDate!.slice(8, 10)) : 1;
    byDay.set(day, [...(byDay.get(day) ?? []), item]);
  }
  return byDay;
}

const CALENDAR_VISIBLE_ITEM_LIMIT = 3;

function RoadmapCalendarDay({ day, isToday, items, categoryMap, categories, fiscalYearId, providerOptions, isDemo, activeRoadmapItemId, setActiveRoadmapItemId }: { day: number; isToday: boolean } & Omit<RoadmapCalendarProps, "monthKey" | "items"> & { items: RoadmapItem[] }) {
  const [isExpanded, setIsExpanded] = useState(false);
  const visibleItems = isExpanded ? items : items.slice(0, CALENDAR_VISIBLE_ITEM_LIMIT);
  const hiddenCount = items.length - visibleItems.length;

  return <div className={cn("flex min-h-28 flex-col gap-1 rounded-md border border-hairline bg-panel p-1.5", isToday && "border-formed-blue ring-1 ring-formed-blue")}>
    <span className={cn("text-xs font-bold", isToday ? "text-formed-blue" : "text-muted")}>{day}</span>
    <div className="flex min-w-0 flex-col gap-1">
      {visibleItems.map((item) => <EditRoadmapModal key={item.id} item={item} category={item.categoryId ? categoryMap.get(item.categoryId) : undefined} isDemo={isDemo} variant="chip" isOpen={activeRoadmapItemId === item.id} onOpen={() => setActiveRoadmapItemId(item.id)} onClose={() => setActiveRoadmapItemId((currentId) => currentId === item.id ? null : currentId)}>
        <RoadmapForm fiscalYearId={fiscalYearId} categories={categories} providerOptions={providerOptions} item={item} isDemo={isDemo} />
      </EditRoadmapModal>)}
      {hiddenCount > 0 ? <button type="button" onClick={() => setIsExpanded(true)} className="w-fit rounded px-1 text-[10px] font-bold text-muted hover:text-foreground">+{hiddenCount} more</button> : null}
      {isExpanded && items.length > CALENDAR_VISIBLE_ITEM_LIMIT ? <button type="button" onClick={() => setIsExpanded(false)} className="w-fit rounded px-1 text-[10px] font-bold text-muted hover:text-foreground">Show less</button> : null}
    </div>
  </div>;
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

  return <div className="grid justify-items-end gap-1.5">
    <button type="button" className="text-[11px] font-semibold text-formed-blue transition-colors hover:text-formed-blue-hover disabled:cursor-not-allowed disabled:text-faint" disabled={isDemo || isPushing || !hasItems} onClick={handlePushMonth} aria-label={`Push ${monthLabel} to ClickUp`}>
      {isPushing ? "Checking..." : unpushedCount ? `Push ${unpushedCount} to ClickUp` : "Check ClickUp"}
    </button>
    {message ? <p role="status" className="rounded-md bg-formed-blue-soft px-2.5 py-1.5 text-[11px] font-bold text-formed-blue">{message}</p> : null}
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
  const [sentToBudget, setSentToBudget] = useState(Boolean(item?.sentToBudgetAt));
  const [formedUrl, setFormedUrl] = useState(item?.formedUrl ?? "");
  const [formedUrlCandidate, setFormedUrlCandidate] = useState(item?.formedUrlCandidate ?? "");
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
      setFormedUrl("");
      setFormedUrlCandidate("");
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
      setSentToBudget(true);
      setMessage("Pushed to Licensing Summary with this item's cost as a yearly placeholder. Adjust the cadence on the Licensing Summary if needed.");
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

  return <form id={item ? `edit-${item.id}-form` : undefined} ref={formRef} action={item ? action : undefined} onSubmit={item ? handleEditSubmit : handleAddSubmit} className="grid gap-5 py-5">
    <input type="hidden" name="fiscalYearId" value={fiscalYearId} />
    {item ? <input type="hidden" name="itemId" value={item.id} /> : null}
    {message ? <p role="status" className="rounded-md bg-deep-teal-soft px-4 py-3 text-sm font-bold text-deep-teal">{message}</p> : null}

    <section className="grid gap-3">
      <div className="flex items-center gap-2 border-b border-hairline pb-2 text-sm font-semibold uppercase tracking-wide text-muted">
        Core details
      </div>
      <div className="grid gap-3 md:grid-cols-2">
        <SoftInput id={`${fieldPrefix}-title`} label="Title" name="title" defaultValue={item?.title} required disabled={fieldsDisabled} />
        <ProviderCombobox key={`provider-${resetCount}`} id={`${fieldPrefix}-provider`} defaultValue={item?.provider ?? ""} options={providerOptions} disabled={fieldsDisabled} />
        <RoadmapColoredSelect id={`${fieldPrefix}-genre`} label="Genre" name="genre" defaultValue={item?.genre ?? ""} options={genreOptions} disabled={fieldsDisabled} />
        <RoadmapColoredSelect id={`${fieldPrefix}-format`} label="Format" name="format" defaultValue={item?.format ?? ""} options={formatOptions} disabled={fieldsDisabled} />
        <ReleaseDateField key={`date-${resetCount}`} id={`${fieldPrefix}-date`} defaultValue={item?.releaseDate ?? defaultReleaseDate} disabled={fieldsDisabled} />
        <div className="self-start">
          <SoftSelect id={`${fieldPrefix}-status`} label="Status" name="status" defaultValue={item?.status ?? "planned"} options={roadmapStatuses} className="min-h-12 px-3 text-sm" disabled={fieldsDisabled} />
        </div>
      </div>
    </section>

    <section className="grid gap-3">
      <div className="flex items-center gap-2 border-b border-hairline pb-2 text-sm font-semibold uppercase tracking-wide text-muted">
        Planning details
      </div>
      <div className="grid gap-3 md:grid-cols-2">
        <div className="self-start">
          <SoftSelect id={`${fieldPrefix}-budget-source`} label="Budget source" name="budgetSource" defaultValue={item?.budgetSource ?? ""} placeholder="Select" required options={[...budgetSourceOptions]} className="min-h-12 px-3 text-sm" disabled={fieldsDisabled} />
        </div>
        <SoftInput id={`${fieldPrefix}-minutes`} label="Minutes of content" name="minutes" type="number" min={1} inputMode="numeric" placeholder="Total runtime, e.g. 96" defaultValue={item?.minutes ?? ""} required disabled={fieldsDisabled} />
        <SoftInput id={`${fieldPrefix}-cost`} label="Cost" name="cost" inputMode="decimal" placeholder="0" defaultValue={item?.costCents !== null && item?.costCents !== undefined ? formatCurrency(item.costCents) : ""} required disabled={fieldsDisabled} />
        <SoftSelect id={`${fieldPrefix}-category`} label="Color category" name="categoryId" defaultValue={item?.categoryId ?? ""} placeholder="No category" options={categoryOptions} disabled={fieldsDisabled} />
        <div className="grid gap-2 md:col-span-2">
          <SoftInput id={`${fieldPrefix}-formed-url`} label="Formed link" name="formedUrl" type="url" placeholder="https://watch.formed.org/..." value={formedUrl} onChange={(event) => setFormedUrl(event.target.value)} disabled={fieldsDisabled} />
          <input type="hidden" name="formedUrlCandidate" value={formedUrlCandidate} />
          {formedUrl ? <a href={formedUrl} target="_blank" rel="noreferrer" className="inline-flex min-h-10 w-fit items-center justify-center gap-2 rounded-md bg-deep-teal-soft px-4 py-2 text-xs font-semibold uppercase tracking-wide text-deep-teal ring-1 ring-deep-teal transition hover:bg-deep-teal-soft"><ExternalLink className="h-4 w-4" aria-hidden="true" />Open on Formed</a> : null}
          {!formedUrl && formedUrlCandidate ? (
            <div className="grid gap-2 rounded-md bg-guild-gold-soft p-3 text-guild-gold-ink ring-1 ring-guild-gold">
              <p className="text-xs font-semibold uppercase tracking-wide">Suggested Formed link</p>
              <a href={formedUrlCandidate} target="_blank" rel="noreferrer" className="min-w-0 break-all text-sm font-bold underline decoration-amber-400 underline-offset-4">{formedUrlCandidate}</a>
              <SoftButton type="button" variant="ghost" className="w-fit bg-white text-guild-gold-ink ring-1 ring-guild-gold" disabled={fieldsDisabled} onClick={() => { setFormedUrl(formedUrlCandidate); setFormedUrlCandidate(""); }}>
                <Check className="h-4 w-4" />Use suggested link
              </SoftButton>
            </div>
          ) : null}
        </div>
        <label htmlFor={`${fieldPrefix}-individual-marketing`} className="flex min-h-16 items-start gap-3 rounded-md bg-guild-gold-soft p-3 text-guild-gold-ink ring-1 ring-guild-gold md:col-span-2">
          <input
            id={`${fieldPrefix}-individual-marketing`}
            type="checkbox"
            name="featuredInIndividualMarketing"
            defaultChecked={Boolean(item?.featuredInIndividualMarketing)}
            disabled={fieldsDisabled}
            className="mt-1 h-5 w-5 rounded border-guild-gold text-guild-gold-ink accent-amber-500"
          />
          <span>
            <span className="flex items-center gap-2 text-sm font-semibold uppercase tracking-wide"><Star className="h-4 w-4 fill-amber-400 text-guild-gold-ink" aria-hidden="true" />Individual marketing campaign</span>
            <span className="mt-1 block text-sm font-bold normal-case tracking-normal text-guild-gold-ink">Highlight this roadmap item when it is being leveraged in individual marketing.</span>
          </span>
        </label>
        <label className="grid gap-2 text-xs font-semibold uppercase tracking-wide text-foreground md:col-span-2" htmlFor={`${fieldPrefix}-notes`}>
          Notes
          <textarea
            id={`${fieldPrefix}-notes`}
            name="notes"
            defaultValue={item?.notes ?? ""}
            disabled={fieldsDisabled}
            className="min-h-20 w-full resize-y rounded-md border-0 bg-panel-warm px-4 py-3 text-base font-medium normal-case tracking-normal text-foreground shadow-none placeholder:text-faint focus:border-2 focus:border-formed-blue focus:bg-white disabled:cursor-not-allowed disabled:opacity-70"
          />
        </label>
      </div>
    </section>

    <div data-testid="roadmap-form-actions" className={cn("flex flex-wrap items-center justify-between gap-3 border-t border-hairline pt-4", item && "pb-1")}>
      <div className="flex flex-wrap gap-2">
        {!item ? <SoftButton type="submit" variant="primary" disabled={fieldsDisabled}>{isSaving ? "Adding..." : "Add Item"}</SoftButton> : null}
        {item ? <SoftButton data-roadmap-delete="true" formAction={deleteRoadmapItem} type="submit" variant="ghost" className="text-danger" disabled={isDemo} onClick={(event) => { if (!window.confirm(`Delete ${item.title}? This cannot be undone.`)) event.preventDefault(); }}><Trash2 className="h-4 w-4" />Delete</SoftButton> : null}
      </div>
      <div className="flex flex-wrap gap-2">
        {item ? <SoftButton type="button" variant="ghost" disabled={fieldsDisabled} onClick={handleSendToBudget} className={sentToBudget ? "border-deep-teal bg-deep-teal-soft text-deep-teal hover:bg-deep-teal-soft hover:text-deep-teal" : undefined}><DollarSign className="h-4 w-4" />{sentToBudget ? "Pushed to Licensing Summary" : "Push to Licensing Summary"}</SoftButton> : null}
        {item ? <SoftButton type="button" variant="ghost" disabled={fieldsDisabled} onClick={handleSendToClickUp}><Send className="h-4 w-4" />{clickUpUrl ? "Check ClickUp" : "Push to ClickUp"}</SoftButton> : null}
        {clickUpUrl ? <a href={clickUpUrl} target="_blank" rel="noreferrer" className="inline-flex min-h-12 items-center justify-center gap-2 rounded-md bg-formed-blue-soft px-5 py-3 text-sm font-semibold uppercase tracking-wide text-formed-blue transition-all duration-200 hover:bg-formed-blue-soft"><ExternalLink className="h-4 w-4" />Open in ClickUp</a> : null}
      </div>
    </div>
  </form>;
}

function RoadmapColoredSelect({ label, options, id, defaultValue = "", ...props }: SelectHTMLAttributes<HTMLSelectElement> & { label: string; options: PlanningOption[] }) {
  const fieldId = id ?? props.name;
  const [value, setValue] = useState(String(defaultValue));
  const selected = options.find((option) => option.value === value);
  const tone = selected?.tone ?? "slate";

  return <label className="grid gap-2 text-xs font-semibold uppercase tracking-wide text-foreground" htmlFor={fieldId}>
    {label}
    <select
      {...props}
      id={fieldId}
      value={value}
      onChange={(event) => {
        setValue(event.target.value);
        props.onChange?.(event);
      }}
      className={cn("min-h-12 self-start rounded-md border-0 px-3 text-sm font-bold normal-case tracking-normal shadow-inner ring-1 ring-black/5", TONE_CLASSES[tone].field, props.className)}
    >
      {options.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}
    </select>
  </label>;
}

function ReleaseDateField({ id, defaultValue, disabled }: { id: string; defaultValue: string; disabled?: boolean }) {
  const defaultMonth = getRoadmapMonthKey(defaultValue) ?? parseMonthAnchor(null);
  const [mode, setMode] = useState(defaultValue === "TBD" ? "tbd" : isMonthTbdRoadmapDate(defaultValue) ? "month-tbd" : "date");
  const [monthKey, setMonthKey] = useState(defaultMonth);

  if (mode === "tbd") {
    return <div className="grid gap-2">
      <div className="flex min-h-12 items-center justify-between gap-3 rounded-md bg-danger-soft px-4">
        <span className="text-xs font-semibold uppercase tracking-wide text-danger">Release date: TBD</span>
        <div className="flex flex-wrap justify-end gap-1">
          <button type="button" onClick={() => setMode("month-tbd")} className="rounded-md px-2 py-1 text-xs font-semibold uppercase tracking-wide text-danger hover:bg-danger-soft" disabled={disabled}>Pick month</button>
          <button type="button" onClick={() => setMode("date")} className="rounded-md px-2 py-1 text-xs font-semibold uppercase tracking-wide text-danger hover:bg-danger-soft" disabled={disabled}>Pick date</button>
        </div>
      </div>
      <input aria-label="Release date value" className="sr-only" name="releaseDate" value="TBD" readOnly disabled={disabled} />
    </div>;
  }

  if (mode === "month-tbd") {
    return <div className="grid gap-2">
      <label className="grid gap-2 text-xs font-semibold uppercase tracking-wide text-foreground" htmlFor={`${id}-month`}>
        Release month
        <input
          id={`${id}-month`}
          aria-label="Release month"
          type="month"
          value={monthKey}
          onChange={(event) => setMonthKey(event.target.value)}
          disabled={disabled}
          className="min-h-12 rounded-md border-0 bg-danger-soft px-3 text-sm font-bold normal-case tracking-normal text-danger shadow-inner ring-1 ring-danger-border"
        />
      </label>
      <div className="flex flex-wrap gap-2">
        <span className="rounded-full bg-danger-soft px-3 py-1 text-xs font-semibold uppercase tracking-wide text-danger">Date TBD</span>
        <button type="button" onClick={() => setMode("date")} className="w-fit rounded-md px-2 py-1 text-xs font-semibold uppercase tracking-wide text-muted hover:bg-panel-warm hover:text-foreground" disabled={disabled}>Pick exact date</button>
        <button type="button" onClick={() => setMode("tbd")} className="w-fit rounded-md px-2 py-1 text-xs font-semibold uppercase tracking-wide text-muted hover:bg-panel-warm hover:text-foreground" disabled={disabled}>No month yet</button>
      </div>
      <input aria-label="Release date value" className="sr-only" name="releaseDate" value={`${monthKey}-TBD`} readOnly disabled={disabled} />
    </div>;
  }

  return <div className="grid gap-2">
    <SoftInput id={id} type="date" label="Release date" name="releaseDate" defaultValue={isExactRoadmapDate(defaultValue) ? defaultValue : ""} disabled={disabled} />
    <div className="flex flex-wrap gap-2">
      <button type="button" onClick={() => setMode("month-tbd")} className="w-fit rounded-md px-2 py-1 text-xs font-semibold uppercase tracking-wide text-muted hover:bg-panel-warm hover:text-foreground" disabled={disabled}>Date TBD in this month</button>
      <button type="button" onClick={() => setMode("tbd")} className="w-fit rounded-md px-2 py-1 text-xs font-semibold uppercase tracking-wide text-muted hover:bg-panel-warm hover:text-foreground" disabled={disabled}>No month yet</button>
    </div>
  </div>;
}

function SeriesTable({ fiscalYearId, ongoingSeries, isDemo }: { fiscalYearId: string; ongoingSeries: OngoingSeries[]; isDemo?: boolean }) {
  return (
    <section className="overflow-hidden rounded-soft border border-hairline bg-panel-warm">
      <div className="flex flex-wrap items-baseline justify-between gap-3 px-5 py-4">
        <h2 className="font-display text-lg">Ongoing series cadence</h2>
      </div>
      <div>
        <div className="grid grid-cols-[1fr_0.6fr_0.9fr_0.5fr_auto] gap-3.5 border-y border-hairline bg-panel px-5 py-2.5 text-[11px] font-semibold text-muted">
          <span>Series</span>
          <span>Cadence</span>
          <span>Budget line</span>
          <span>Minutes</span>
          <span>Edit</span>
        </div>
        {ongoingSeries.map((item) => (
          <details
            data-testid={`series-row-${item.id}`}
            key={item.id}
            className="border-b border-hairline px-5 py-3 last:border-b-0"
          >
            <summary className="grid cursor-pointer list-none items-center gap-3.5 text-sm md:grid-cols-[1fr_0.6fr_0.9fr_0.5fr_auto] [&::-webkit-details-marker]:hidden">
              <b className="font-semibold">{item.series}</b>
              <span className="text-muted">{item.cadence}</span>
              <span className="text-[13px] text-muted">{getBudgetSourceLabel(item.budgetSource)}</span>
              <span className="text-[13px] text-muted">{item.minutes ?? "—"}</span>
              <span className="text-xs font-semibold text-formed-blue">Edit</span>
            </summary>
            <form action={updateOngoingSeries} className="mt-3 grid gap-3 border-t border-hairline pt-3 md:grid-cols-2">
              <input type="hidden" name="fiscalYearId" value={fiscalYearId} />
              <input type="hidden" name="seriesId" value={item.id} />
              <SoftInput id={`series-${item.id}`} label="Series" name="series" defaultValue={item.series} disabled={isDemo} />
              <SoftInput id={`cadence-${item.id}`} label="Cadence" name="cadence" defaultValue={item.cadence} disabled={isDemo} />
              <SoftSelect id={`series-budget-source-${item.id}`} label="Budget source" name="budgetSource" defaultValue={item.budgetSource ?? ""} placeholder="Select" required options={[...budgetSourceOptions]} disabled={isDemo} />
              <SoftInput id={`series-minutes-${item.id}`} label="Minutes of content" name="minutes" type="number" min={1} inputMode="numeric" placeholder="Total runtime" defaultValue={item.minutes ?? ""} required disabled={isDemo} />
              <SoftInput id={`series-cost-${item.id}`} label="Cost" name="cost" inputMode="decimal" placeholder="0" defaultValue={item.costCents !== null && item.costCents !== undefined ? formatCurrency(item.costCents) : ""} required disabled={isDemo} />
              <SoftInput id={`series-notes-${item.id}`} label="Notes" name="notes" defaultValue={item.notes ?? ""} disabled={isDemo} />
              <div className="flex gap-2">
                <SoftButton type="submit" variant="primary" disabled={isDemo}>Save Series</SoftButton>
                <SoftButton
                  form={`delete-series-${item.id}`}
                  type="submit"
                  variant="ghost"
                  className="text-danger"
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
        <details className="border-t border-hairline px-5 py-3">
          <summary className="flex cursor-pointer items-center text-xs font-semibold text-formed-blue">+ Add ongoing series</summary>
          <form action={addOngoingSeries} className="mt-3 grid gap-3 md:grid-cols-3">
            <input type="hidden" name="fiscalYearId" value={fiscalYearId} />
            <SoftInput id="new-series" label="Series" name="series" disabled={isDemo} />
            <SoftInput id="new-cadence" label="Cadence" name="cadence" disabled={isDemo} />
            <SoftSelect id="new-series-budget-source" label="Budget source" name="budgetSource" defaultValue="" placeholder="Select" required options={[...budgetSourceOptions]} disabled={isDemo} />
            <SoftInput id="new-series-minutes" label="Minutes of content" name="minutes" type="number" min={1} inputMode="numeric" placeholder="Total runtime" required disabled={isDemo} />
            <SoftInput id="new-series-cost" label="Cost" name="cost" inputMode="decimal" placeholder="0" required disabled={isDemo} />
            <SoftInput id="new-series-notes" label="Notes" name="notes" disabled={isDemo} />
            <SoftButton type="submit" variant="primary" disabled={isDemo}>Add Series</SoftButton>
          </form>
        </details>
      </div>
    </section>
  );
}
