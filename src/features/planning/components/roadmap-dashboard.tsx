"use client";

import Link from "next/link";
import type { Route } from "next";
import { CalendarPlus, Check, ChevronDown, ChevronLeft, ChevronRight, DollarSign, ExternalLink, Maximize2, Minimize2, Plus, Send, Star, Trash2, X } from "lucide-react";
import { type FormEvent, type ReactNode, type SelectHTMLAttributes, useMemo, useRef, useState } from "react";
import { SoftButton } from "@/components/ui/soft-button";
import { SoftInput } from "@/components/ui/soft-input";
import { SoftSelect } from "@/components/ui/soft-select";
import { cn } from "@/components/ui/soft-surface";
import { PageHead } from "./planning-shell";
import { DashboardPopout } from "@/features/budget/components/dashboard-popout";
import { budgetSourceOptions } from "@/features/budget/budget-source";
import {
  addOngoingSeries, addRoadmapItem, deleteOngoingSeries, deleteRoadmapItem, sendRoadmapItemToBudget, sendRoadmapItemToClickUp, sendRoadmapMonthToClickUp,
  updateOngoingSeries, updateRoadmapItem
} from "../planning-actions";
import { CONTENT_FORMATS, CONTENT_GENRES, TONE_CLASSES, type PlanningOption, type PlanningTone } from "../planning-constants";
import {
  buildMonthWindow,
  formatRoadmapDate,
  formatRoadmapDateLabel,
  getRoadmapMonthKey,
  isExactRoadmapDate,
  isMonthTbdRoadmapDate,
  parseMonthAnchor,
  shiftMonthAnchor
} from "../planning-model";
import { ROADMAP_STATUSES, type OngoingSeries, type RoadmapCategory, type RoadmapItem } from "../planning-types";
import { AddRoadmapModal } from "./add-roadmap-modal";
import { CategoryManagerModal } from "./category-manager-modal";
import { EditRoadmapModal } from "./edit-roadmap-modal";
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

export function RoadmapDashboard({ pageTitle = "Roadmap", pageDescription = ROADMAP_DESCRIPTION, fiscalYearId, roadmapItems, ongoingSeries, categories, startMonth, fiscalYearStartMonth = getFiscalYearStartMonthForMonth(startMonth), monthCount, routeBasePath = "/roadmap", isDemo }: RoadmapDashboardProps) {
  const [focusedMonthKey, setFocusedMonthKey] = useState<string | null>(null);
  const [activeFilter, setActiveFilter] = useState<RoadmapFilter | null>(null);
  const [isRoadmapFocus, setIsRoadmapFocus] = useState(false);
  const [activeRoadmapItemId, setActiveRoadmapItemId] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<"cards" | "calendar">("cards");
  const [calendarMonthKey, setCalendarMonthKey] = useState(() => parseMonthAnchor(null));
  const months = buildMonthWindow(startMonth, monthCount);
  const displayedMonths = focusedMonthKey ? months.filter((month) => month.key === focusedMonthKey) : months;
  const visibleKeys = new Set(months.map((month) => month.key));
  const filteredItems = activeFilter ? roadmapItems.filter((item) => item.categoryId === activeFilter.id) : roadmapItems;
  const backlog = filteredItems.filter((item) => {
    const monthKey = getRoadmapMonthKey(item.releaseDate);
    return !monthKey || !visibleKeys.has(monthKey);
  });
  const currentMonthKey = parseMonthAnchor(null);
  const releasedBacklog = sortReleasedItems(backlog.filter((item) => item.status === "released" || isBeforeCurrentMonth(item.releaseDate, currentMonthKey)));
  const releasedByMonth = groupReleasedItemsByMonth(releasedBacklog);
  const otherBacklog = backlog.filter((item) => !releasedBacklog.some((released) => released.id === item.id));
  const categoryMap = new Map(categories.map((category) => [category.id, category]));
  const summary = buildRoadmapSummary(roadmapItems, categories, getTodayKey(), fiscalYearStartMonth);
  const providerOptions = useMemo(() => Array.from(new Set(roadmapItems.map((item) => item.provider).filter(Boolean) as string[])).sort((a, b) => a.localeCompare(b)), [roadmapItems]);
  const href = (start: string, count = monthCount) => `${routeBasePath}?fy=${fiscalYearId}&start=${start}&months=${count}` as Route;
  const today = parseMonthAnchor(null);

  return <div className="grid min-w-0 gap-5">
    {!isRoadmapFocus ? <PageHead
      title={pageTitle}
      description={pageDescription}
      actions={<>
        <CategoryManagerModal fiscalYearId={fiscalYearId} categories={categories} isDemo={isDemo} />
        <AddRoadmapModal>
          <RoadmapForm fiscalYearId={fiscalYearId} categories={categories} providerOptions={providerOptions} isDemo={isDemo} />
        </AddRoadmapModal>
      </>}
    /> : null}

    {!isRoadmapFocus ? <div className="flex flex-wrap items-center justify-between gap-x-6 gap-y-3">
      <div className="flex flex-wrap items-center gap-2" aria-label="Roadmap filters">
        <span className="mr-1 text-xs font-semibold text-muted">Key</span>
        {categories.filter((category) => category.isActive).map((category) => {
          const tone = (category.colorKey in TONE_CLASSES ? category.colorKey : "slate") as PlanningTone;
          const isActive = activeFilter?.id === category.id;
          return <button key={category.id} type="button" aria-label={isActive ? `Clear ${category.name} filter` : `Filter ${category.name}`} aria-pressed={isActive} onClick={() => setActiveFilter(isActive ? null : { id: category.id, label: category.name })} className={cn("rounded-md px-2.5 py-1 text-xs font-semibold transition-colors", TONE_CLASSES[tone].chip, isActive && "ring-2 ring-formed-blue")}>{category.name}</button>;
        })}
      </div>
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

    {!isRoadmapFocus ? <RoadmapSummary summary={summary} /> : null}

    {viewMode === "cards" ? <section className={cn("min-w-0", isRoadmapFocus && "fixed inset-3 z-50 overflow-auto rounded-lg bg-white p-4 shadow-2xl ring-1 ring-hairline md:inset-6")}><div className="mb-3 flex flex-wrap items-end justify-between gap-3"><div className="grid gap-0.5"><h2 className="font-display text-2xl">{months[0].label} – {months[months.length - 1].label}</h2><p className="text-sm text-muted">{activeFilter ? `Filtered by ${activeFilter.label}.` : "Scroll through the roadmap, or click a month to see it at a glance."}</p></div><div className="flex flex-wrap gap-2">{activeFilter ? <SoftButton type="button" variant="ghost" onClick={() => setActiveFilter(null)}><X className="h-4 w-4" aria-hidden="true" />Clear filter</SoftButton> : null}{focusedMonthKey ? <SoftButton type="button" variant="primary" className="shadow-sm ring-1 ring-formed-blue-border" onClick={() => setFocusedMonthKey(null)}><ChevronLeft className="h-4 w-4" aria-hidden="true" />Show all months</SoftButton> : null}<SoftButton type="button" variant={isRoadmapFocus ? "primary" : "ghost"} className={cn(!isRoadmapFocus && "shadow-sm ring-1 ring-formed-blue-border")} onClick={() => setIsRoadmapFocus((value) => !value)}>{isRoadmapFocus ? <Minimize2 className="h-4 w-4" aria-hidden="true" /> : <Maximize2 className="h-4 w-4" aria-hidden="true" />}{isRoadmapFocus ? "Exit focus view" : "Expand roadmap"}</SoftButton></div></div>
      <div data-testid="roadmap-month-scroll" className={cn("flex gap-3 overflow-x-auto overflow-y-visible", isRoadmapFocus && "min-h-[calc(100vh-13rem)]")}>
        {displayedMonths.map((month) => {
          const items = filteredItems.filter((item) => getRoadmapMonthKey(item.releaseDate) === month.key);
          return <article data-testid="roadmap-month-column" key={month.key} className={cn("shrink-0 self-start rounded-soft border border-hairline bg-panel-warm p-3.5", focusedMonthKey ? "w-full min-w-full" : isRoadmapFocus ? "w-[360px]" : "w-[248px]")}><button type="button" aria-label={`Focus ${month.label}`} onClick={() => setFocusedMonthKey(month.key)} className="mb-2.5 grid w-full gap-1 rounded-lg px-1 py-0.5 text-left transition-colors hover:bg-panel"><h3 className="font-display text-lg">{month.label}</h3><p className="text-[11px] font-semibold text-muted">{items.length} {items.length === 1 ? "release" : "releases"}</p></button><MonthClickUpButton fiscalYearId={fiscalYearId} monthKey={month.key} monthLabel={month.label} items={items} isDemo={isDemo} /><AddRoadmapModal triggerLabel="Add item" triggerAriaLabel={`Add item to ${month.label}`} triggerIcon={<Plus className="h-4 w-4" aria-hidden="true" />} triggerClassName="mb-2.5 min-h-8 w-full justify-center border-dashed !border-hairline-strong bg-transparent px-2.5 py-1.5 text-xs !text-muted hover:!bg-panel hover:!text-foreground"><RoadmapForm fiscalYearId={fiscalYearId} categories={categories} providerOptions={providerOptions} defaultReleaseDate={`${month.key}-01`} idPrefix={`new-${month.key}`} isDemo={isDemo} /></AddRoadmapModal><div className={cn("grid gap-2", focusedMonthKey && "md:grid-cols-2 xl:grid-cols-3")}>{items.map((item) => <RoadmapCard key={item.id} item={item} category={item.categoryId ? categoryMap.get(item.categoryId) : undefined} categories={categories} fiscalYearId={fiscalYearId} isDemo={isDemo} providerOptions={providerOptions} isOpen={activeRoadmapItemId === item.id} onOpen={() => setActiveRoadmapItemId(item.id)} onClose={() => setActiveRoadmapItemId((currentId) => currentId === item.id ? null : currentId)} />)}</div></article>;
        })}
      </div>
    </section> : <RoadmapCalendar
      monthKey={calendarMonthKey}
      items={filteredItems}
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
      <details data-testid="roadmap-backlog" className="self-start rounded-soft border border-hairline bg-panel-warm" open>
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
  audienceRankings: Array<{ name: string; count: number; tone: PlanningTone }>;
  providerRankings: Array<{ name: string; count: number }>;
  genreRankings: Array<{ name: string; count: number; tone: PlanningTone }>;
  formatRankings: Array<{ name: string; count: number; tone: PlanningTone }>;
  nextRelease: { title: string; date: string } | null;
};

const RANKING_COLORS = ["#2563eb", "#d97706", "#059669", "#7c3aed", "#0891b2", "#ea580c", "#475569"];
const TONE_HEX: Record<PlanningTone, string> = {
  blue: "#327fef",
  amber: "#c79a3c",
  green: "#4e7a44",
  purple: "#7a5c94",
  red: "#a4343a",
  cyan: "#176c72",
  orange: "#c1703c",
  slate: "#b3a996"
};

function RoadmapSummary({ summary }: { summary: RoadmapSummaryData }) {
  const topAudiences = summary.audienceRankings.slice(0, 3);
  const topProvider = summary.providerRankings[0] ?? null;
  const topGenre = summary.genreRankings[0] ?? null;
  const topFormat = summary.formatRankings[0] ?? null;

  return <details data-testid="roadmap-summary" className="group rounded-soft border border-hairline bg-panel-warm">
    <summary className="flex cursor-pointer list-none items-center justify-between gap-4 px-5 py-4 [&::-webkit-details-marker]:hidden">
      <div className="grid min-w-0 gap-0.5">
        <h2 className="font-display text-lg">Fiscal year at a glance</h2>
        <p className="text-xs text-muted [text-wrap:pretty]">July – June roadmap snapshot. Expand for audience, provider, genre, and format rankings.</p>
      </div>
      <div className="flex shrink-0 flex-wrap items-center justify-end gap-2.5">
        <span className="rounded-md bg-tone-slate-bg px-2 py-0.5 text-[11px] font-bold text-muted">{summary.totalTitles} {summary.totalTitles === 1 ? "title" : "titles"}</span>
        {summary.nextRelease ? <span className="rounded-md bg-formed-blue-soft px-2 py-0.5 text-[11px] font-bold text-formed-blue">Next up</span> : null}
        <span className="grid h-7 w-7 shrink-0 place-items-center rounded-lg border border-hairline bg-panel text-muted">
          <ChevronDown className="h-3.5 w-3.5 transition-transform group-open:rotate-180" aria-hidden="true" />
        </span>
      </div>
    </summary>
    <div className="border-t border-hairline px-5 py-4">
      <div className="mb-4 flex flex-wrap items-end justify-between gap-2">
        <div>
          <p className="text-sm font-bold text-augustine-blue">Snapshot of what is live, moving, and still needs a date.</p>
        </div>
        {summary.nextRelease ? <div className="rounded-md border border-guild-gold bg-guild-gold-soft px-3 py-2 text-right text-xs font-bold text-guild-gold-ink">
          <span className="block text-[10px] font-semibold uppercase tracking-wide">Next up</span>
          <span className="block text-foreground">{summary.nextRelease.title}</span>
          <span>{formatRoadmapDate(summary.nextRelease.date)}</span>
        </div> : null}
      </div>
      <div className="grid gap-3 md:grid-cols-4">
        <SummaryMetric
          title="Total Content"
          value={`${summary.totalTitles} ${summary.totalTitles === 1 ? "title" : "titles"}`}
          label="Total content"
          accentClassName="bg-formed-blue"
          description="Every roadmap item in this fiscal-year snapshot."
        >
          <SummaryRows rows={[
            ["Total content", String(summary.totalTitles)],
            ["Already live", String(summary.releasedCount)],
            ["Being worked on", String(summary.inProgressCount)],
            ["Need a date", String(summary.unscheduledCount)]
          ]} />
        </SummaryMetric>
        <SummaryMetric
          title="Already Live"
          value={`${summary.releasedCount} released`}
          label="Already live"
          accentClassName="bg-deep-teal"
          description="Roadmap items marked as released."
        >
          <StatusItemList items={summary.releasedItems} emptyText="No released items yet." />
        </SummaryMetric>
        <SummaryMetric
          title="Being Worked On"
          value={`${summary.inProgressCount} in progress`}
          label="Being worked on"
          accentClassName="bg-deep-teal"
          description="Roadmap items currently marked in progress."
        >
          <StatusItemList items={summary.inProgressItems} emptyText="No in-progress items yet." />
        </SummaryMetric>
        <SummaryMetric
          title="Need A Date"
          value={`${summary.unscheduledCount} unscheduled`}
          label="Need a date"
          accentClassName="bg-guild-gold"
          description="Roadmap items without an exact release date."
        >
          <StatusItemList items={summary.unscheduledItems} emptyText="Every item has an exact release date." />
        </SummaryMetric>
      </div>
      <div className="mt-4 grid gap-3 md:grid-cols-2 xl:grid-cols-4">
        <DashboardPopout
          title="Top Audiences"
          eyebrow={`${summary.audienceRankings.length} audience${summary.audienceRankings.length === 1 ? "" : "s"}`}
          description="Ranking by roadmap item count."
          toneClassName="bg-formed-blue-soft text-augustine-blue"
          triggerClassName="min-w-0 p-0 bg-white"
          trigger={<div className="min-h-36 rounded-md border border-formed-blue-border p-4">
          <h3 className="text-xs font-semibold uppercase tracking-wide text-formed-blue">Top audiences</h3>
          <div className="mt-3 flex flex-wrap gap-2">
            {topAudiences.length ? topAudiences.map((audience) => <span key={audience.name} className={cn("rounded-full px-3 py-1 text-xs font-semibold", TONE_CLASSES[audience.tone].chip)}>{audience.name} <span className="text-[10px] opacity-70">{audience.count}</span></span>) : <span className="text-sm font-bold text-muted">No audiences yet.</span>}
          </div>
          </div>}
        >
          <RankingBreakdown items={summary.audienceRankings} emptyText="No audiences yet." />
        </DashboardPopout>
        <DashboardPopout
          title="Top Providers"
          eyebrow={`${summary.providerRankings.length} provider${summary.providerRankings.length === 1 ? "" : "s"}`}
          description="Ranking by roadmap item count."
          toneClassName="bg-guild-gold-soft text-guild-gold-ink"
          triggerClassName="min-w-0 p-0 bg-white"
          trigger={<div className="min-h-36 rounded-md border border-guild-gold p-4">
          <h3 className="text-xs font-semibold uppercase tracking-wide text-guild-gold-ink">Top provider</h3>
          <p className="mt-2 text-lg font-semibold text-foreground">{topProvider ? topProvider.name : "No provider yet"}</p>
          <p className="text-xs font-bold text-muted">{topProvider ? `${topProvider.count} ${topProvider.count === 1 ? "title" : "titles"}` : "Provider names will show here once added."}</p>
          </div>}
        >
          <RankingBreakdown items={summary.providerRankings} emptyText="No providers yet." />
        </DashboardPopout>
        <DashboardPopout
          title="Top Genres"
          eyebrow={`${summary.genreRankings.length} genre${summary.genreRankings.length === 1 ? "" : "s"}`}
          description="Ranking by roadmap item count."
          toneClassName="bg-guild-gold-soft text-guild-gold-ink"
          triggerClassName="min-w-0 p-0 bg-white"
          trigger={<div className="min-h-36 rounded-md border border-guild-gold p-4">
          <h3 className="text-xs font-semibold uppercase tracking-wide text-guild-gold-ink">Top genre</h3>
          <p className="mt-2 text-lg font-semibold text-foreground">{topGenre ? topGenre.name : "No genre yet"}</p>
          <p className="text-xs font-bold text-muted">{topGenre ? `${topGenre.count} ${topGenre.count === 1 ? "title" : "titles"}` : "Genre stats will show here once added."}</p>
          </div>}
        >
          <RankingBreakdown items={summary.genreRankings} emptyText="No genres yet." />
        </DashboardPopout>
        <DashboardPopout
          title="Top Formats"
          eyebrow={`${summary.formatRankings.length} format${summary.formatRankings.length === 1 ? "" : "s"}`}
          description="Ranking by roadmap item count."
          toneClassName="bg-deep-teal-soft text-deep-teal"
          triggerClassName="min-w-0 p-0 bg-white"
          trigger={<div className="min-h-36 rounded-md border border-deep-teal p-4">
          <h3 className="text-xs font-semibold uppercase tracking-wide text-deep-teal">Top format</h3>
          <p className="mt-2 text-lg font-semibold text-foreground">{topFormat ? topFormat.name : "No format yet"}</p>
          <p className="text-xs font-bold text-muted">{topFormat ? `${topFormat.count} ${topFormat.count === 1 ? "title" : "titles"}` : "Format stats will show here once added."}</p>
          </div>}
        >
          <RankingBreakdown items={summary.formatRankings} emptyText="No formats yet." />
        </DashboardPopout>
      </div>
    </div>
  </details>;
}

function SummaryMetric({ title, value, label, accentClassName, description, children }: { title: string; value: string; label: string; accentClassName: string; description: string; children: ReactNode }) {
  return <DashboardPopout
    title={title}
    eyebrow={value}
    description={description}
    toneClassName="bg-formed-blue-soft text-augustine-blue"
    triggerClassName="min-w-0 p-0 bg-white"
    trigger={<div className="overflow-hidden rounded-md">
    <div className={cn("h-1", accentClassName)} />
    <div className="p-4">
    <p className="text-xl font-semibold text-foreground">{value}</p>
    <p className="text-xs font-bold uppercase tracking-wide text-muted">{label}</p>
    </div>
  </div>}
  >
    {children}
  </DashboardPopout>;
}

function SummaryRows({ rows }: { rows: Array<[string, string]> }) {
  return <div className="overflow-hidden rounded-lg border border-hairline">
    {rows.map(([label, value]) => <div key={label} className="grid grid-cols-[minmax(0,1fr)_auto] gap-4 border-b border-hairline px-4 py-3 last:border-b-0">
      <span className="text-sm font-bold text-muted">{label}</span>
      <span className="text-sm font-semibold text-foreground">{value}</span>
    </div>)}
  </div>;
}

function StatusItemList({ items, emptyText }: { items: RoadmapItem[]; emptyText: string }) {
  if (!items.length) return <p className="rounded-lg bg-panel-warm p-4 text-sm font-bold text-muted">{emptyText}</p>;

  return <div className="grid gap-2">
    {items.map((item) => <div key={item.id} className="rounded-lg border border-hairline bg-white p-4">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="truncate text-base font-semibold text-foreground">{item.title}</p>
          <p className="text-sm font-bold text-muted">{item.provider?.trim() || "No provider"}</p>
        </div>
        <span className="rounded-full bg-panel-warm px-3 py-1 text-xs font-semibold text-muted">{formatRoadmapSummaryDate(item.releaseDate)}</span>
      </div>
      <div className="mt-3 flex flex-wrap gap-2">
        {item.genre ? <span className="rounded-full bg-guild-gold-soft px-3 py-1 text-xs font-semibold text-guild-gold-ink">{item.genre}</span> : null}
        {item.format ? <span className="rounded-full bg-deep-teal-soft px-3 py-1 text-xs font-semibold text-deep-teal">{item.format}</span> : null}
      </div>
    </div>)}
  </div>;
}

function RankingBreakdown({ items, emptyText }: { items: Array<{ name: string; count: number; tone?: PlanningTone }>; emptyText: string }) {
  if (!items.length) return <p className="rounded-lg bg-panel-warm p-4 text-sm font-bold text-muted">{emptyText}</p>;

  return <div className="grid gap-6 lg:grid-cols-[220px_minmax(0,1fr)]">
    <RankingPie items={items} />
    <RankingList items={items} />
  </div>;
}

function RankingList({ items }: { items: Array<{ name: string; count: number; tone?: PlanningTone }> }) {
  const total = Math.max(items.reduce((sum, item) => sum + item.count, 0), 1);

  return <div className="grid content-start gap-2">
    {items.map((item, index) => <div key={item.name} className="grid grid-cols-[auto_minmax(0,1fr)_auto_auto] items-center gap-3 rounded-lg border border-hairline bg-white p-3">
      <span className="grid h-8 w-8 place-items-center rounded-md bg-panel-warm text-xs font-semibold text-muted">{index + 1}</span>
      <span className="flex min-w-0 items-center gap-2">
        <span className="h-3 w-3 shrink-0 rounded-full" style={{ backgroundColor: getRankingColor(item, index) }} />
        <span className={cn("min-w-0 truncate text-sm font-semibold text-foreground", item.tone && TONE_CLASSES[item.tone].chip, item.tone && "rounded-full px-3 py-1")}>{item.name}</span>
      </span>
      <span className="text-sm font-semibold text-foreground">{Math.round((item.count / total) * 100)}%</span>
      <span className="text-sm font-semibold text-muted">{item.count} {item.count === 1 ? "title" : "titles"}</span>
    </div>)}
  </div>;
}

function RankingPie({ items }: { items: Array<{ name: string; count: number; tone?: PlanningTone }> }) {
  const [activeSlice, setActiveSlice] = useState<{ name: string; count: number; percent: number } | null>(null);
  const total = Math.max(items.reduce((sum, item) => sum + item.count, 0), 1);
  const size = 176;
  const strokeWidth = 42;
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  let runningShare = 0;

  function showSlice(slice: { name: string; count: number; percent: number }) {
    setActiveSlice(slice);
  }

  function hideSlice() {
    setActiveSlice(null);
  }

  return <div className="relative grid justify-items-center gap-3 rounded-lg bg-panel-warm p-5 text-center">
    <svg aria-label="Percent breakdown" role="img" viewBox={`0 0 ${size} ${size}`} className="h-44 w-44 -rotate-90">
      <circle cx={size / 2} cy={size / 2} r={radius} fill="none" stroke="#e5e7eb" strokeWidth={strokeWidth} />
      {items.map((item, index) => {
        const share = item.count / total;
        const percent = Math.round(share * 100);
        const dashArray = `${share * circumference} ${circumference}`;
        const dashOffset = -(runningShare * circumference);
        const slice = { name: item.name, count: item.count, percent };
        runningShare += share;
        return <circle
          key={item.name}
          aria-label={`${item.name}: ${item.count} ${item.count === 1 ? "title" : "titles"}, ${percent}%`}
          className="cursor-help outline-none transition-opacity hover:opacity-80 focus:opacity-80"
          cx={size / 2}
          cy={size / 2}
          fill="none"
          onBlur={hideSlice}
          onFocus={() => showSlice(slice)}
          onMouseEnter={() => showSlice(slice)}
          onMouseLeave={hideSlice}
          pointerEvents="stroke"
          r={radius}
          role="img"
          stroke={getRankingColor(item, index)}
          strokeDasharray={dashArray}
          strokeDashoffset={dashOffset}
          strokeLinecap="butt"
          strokeWidth={strokeWidth}
          tabIndex={0}
        >
          <title>{`${item.name}: ${item.count} ${item.count === 1 ? "title" : "titles"}, ${percent}%`}</title>
        </circle>;
      })}
    </svg>
    <div>
      <p className="text-xs font-semibold uppercase tracking-wide text-muted">Breakdown</p>
      <p className="font-display text-2xl text-foreground">{total} {total === 1 ? "title" : "titles"}</p>
    </div>
    {activeSlice ? <div data-testid="roadmap-pie-tooltip" className="pointer-events-none absolute left-1/2 top-full z-20 mt-2 w-max max-w-60 -translate-x-1/2 rounded-md bg-augustine-blue px-3 py-2 text-center text-xs font-semibold text-white shadow-lg">
      <p>{activeSlice.name}</p>
      <p className="font-bold opacity-85">{activeSlice.count} {activeSlice.count === 1 ? "title" : "titles"} · {activeSlice.percent}%</p>
    </div> : null}
  </div>;
}

function getRankingColor(item: { tone?: PlanningTone }, index: number) {
  return item.tone ? TONE_HEX[item.tone] : RANKING_COLORS[index % RANKING_COLORS.length];
}

function buildRoadmapSummary(roadmapItems: RoadmapItem[], categories: RoadmapCategory[], todayKey: string, fiscalYearStartMonth: string): RoadmapSummaryData {
  const summaryItems = roadmapItems.filter((item) => isInFiscalYearSnapshot(item.releaseDate, fiscalYearStartMonth));
  const categoryById = new Map(categories.map((category) => [category.id, category]));
  const audienceCounts = new Map<string, { name: string; count: number; tone: PlanningTone }>();
  const providerCounts = new Map<string, number>();
  const genreCounts = new Map<string, { name: string; count: number; tone: PlanningTone }>();
  const formatCounts = new Map<string, { name: string; count: number; tone: PlanningTone }>();
  const genreToneByValue = new Map(CONTENT_GENRES.map((option) => [option.value, option.tone]));
  const formatToneByValue = new Map(CONTENT_FORMATS.map((option) => [option.value, option.tone]));

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

    const genre = item.genre?.trim();
    if (genre) {
      const existing = genreCounts.get(genre);
      genreCounts.set(genre, { name: genre, tone: genreToneByValue.get(genre) ?? "slate", count: (existing?.count ?? 0) + 1 });
    }

    const format = item.format?.trim();
    if (format) {
      const existing = formatCounts.get(format);
      formatCounts.set(format, { name: format, tone: formatToneByValue.get(format) ?? "slate", count: (existing?.count ?? 0) + 1 });
    }
  }

  const audienceRankings = Array.from(audienceCounts.values())
    .sort((a, b) => b.count - a.count || a.name.localeCompare(b.name));
  const providerRankings = Array.from(providerCounts.entries())
    .sort(([nameA, countA], [nameB, countB]) => countB - countA || nameA.localeCompare(nameB))
    .map(([name, count]) => ({ name, count }));
  const genreRankings = Array.from(genreCounts.values())
    .sort((a, b) => b.count - a.count || a.name.localeCompare(b.name));
  const formatRankings = Array.from(formatCounts.values())
    .sort((a, b) => b.count - a.count || a.name.localeCompare(b.name));
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
    audienceRankings,
    providerRankings,
    genreRankings,
    formatRankings,
    nextRelease: nextReleaseItem ? { title: nextReleaseItem.title, date: nextReleaseItem.releaseDate! } : null
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

function formatRoadmapSummaryDate(releaseDate: string | null) {
  return formatRoadmapDateLabel(releaseDate);
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

function RoadmapCard({ item, category, categories, fiscalYearId, providerOptions, isDemo, isOpen, onOpen, onClose }: { item: RoadmapItem; category?: RoadmapCategory; categories: RoadmapCategory[]; fiscalYearId: string; providerOptions: string[]; isDemo?: boolean; isOpen: boolean; onOpen: () => void; onClose: () => void }) {
  return <EditRoadmapModal item={item} category={category} isDemo={isDemo} isOpen={isOpen} onOpen={onOpen} onClose={onClose}>
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

  return <div className="mb-3 grid gap-2">
    <SoftButton type="button" variant="secondary" className="min-h-8 w-full justify-center px-2.5 py-1.5 text-xs" disabled={isDemo || isPushing || !hasItems} onClick={handlePushMonth} aria-label={`Push ${monthLabel} to ClickUp`}>
      <CalendarPlus className="h-3.5 w-3.5" aria-hidden="true" />
      {isPushing ? "Checking..." : unpushedCount ? `Push ${unpushedCount} to ClickUp` : "Check ClickUp"}
    </SoftButton>
    {message ? <p role="status" className="rounded-md bg-formed-blue-soft px-3 py-2 text-xs font-bold text-formed-blue">{message}</p> : null}
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
      setMessage("Pushed to Licensing Summary with a $0 yearly placeholder. Update the amount on the Licensing Summary.");
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
          <SoftSelect id={`${fieldPrefix}-budget-source`} label="Budget source" name="budgetSource" defaultValue={item?.budgetSource ?? "misc_licensing"} options={[...budgetSourceOptions]} className="min-h-12 px-3 text-sm" disabled={fieldsDisabled} />
        </div>
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
        {item ? <SoftButton type="button" variant="ghost" disabled={fieldsDisabled} onClick={handleSendToBudget}><DollarSign className="h-4 w-4" />Push to Licensing Summary</SoftButton> : null}
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
        <div className="grid grid-cols-[1.2fr_0.7fr_1fr_auto] gap-3.5 border-y border-hairline bg-panel px-5 py-2.5 text-[11px] font-semibold text-muted">
          <span>Series</span>
          <span>Cadence</span>
          <span>Notes</span>
          <span>Edit</span>
        </div>
        {ongoingSeries.map((item) => (
          <details
            data-testid={`series-row-${item.id}`}
            key={item.id}
            className="border-b border-hairline px-5 py-3 last:border-b-0"
          >
            <summary className="grid cursor-pointer list-none items-center gap-3.5 text-sm md:grid-cols-[1.2fr_0.7fr_1fr_auto] [&::-webkit-details-marker]:hidden">
              <b className="font-semibold">{item.series}</b>
              <span className="text-muted">{item.cadence}</span>
              <span className="text-[13px] text-muted">{item.notes}</span>
              <span className="text-xs font-semibold text-formed-blue">Edit</span>
            </summary>
            <form action={updateOngoingSeries} className="mt-3 grid gap-3 border-t border-hairline pt-3 md:grid-cols-2">
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
            <SoftInput id="new-series-notes" label="Notes" name="notes" disabled={isDemo} />
            <SoftButton type="submit" variant="primary" disabled={isDemo}>Add Series</SoftButton>
          </form>
        </details>
      </div>
    </section>
  );
}
