"use client";

import { ChevronDown, ChevronRight, ChevronUp, History, Plus, Search, SlidersHorizontal, Star } from "lucide-react";
import { useMemo, useState, useTransition } from "react";
import { cn } from "@/components/ui/soft-surface";
import {
  type QueueFilters,
  type QueueLane,
  type QueueSort,
  type QueueSortColumn,
  QUEUE_GROUP_TEST_IDS,
  acquisitionTargetTotalCents,
  emptyQueueFilters,
  groupQueueItems,
  isPriorityListFull,
  laneHeading,
  laneItems,
  matchesQueueFilters,
  needsDecisionItems,
  nextSortState,
  priorityItems,
  resolveGroupOrder,
  shouldClearPriorityOnStatusChange,
  sortQueueItems
} from "../content-review-queue";
import {
  addContentReviewItem,
  deleteContentReviewItem,
  setContentReviewFocusMembership,
  updateContentReviewItem
} from "../planning-actions";
import { REVIEW_STATUSES, TONE_CLASSES, TONE_SWATCH_CLASSES } from "../planning-constants";
import { formatOptionalCurrency } from "../planning-model";
import type { ContentReviewGroupOrderRow, ContentReviewItem, ContentReviewUpdate, ReviewStatus } from "../planning-types";
import { ContentReviewAddModal, type ContentReviewAddFormValues } from "./content-review-add-modal";
import { ContentReviewDetailPanel } from "./content-review-detail-panel";
import { ContentReviewPrioritiesPicker } from "./content-review-priorities-picker";
import { ContentReviewRail } from "./content-review-rail";
import { ContentReviewRecapPanel } from "./content-review-recap-panel";
import { ContentReviewToast, type ContentReviewToastState } from "./content-review-toast";

type ContentReviewDashboardProps = {
  pageTitle?: string;
  pageDescription?: string;
  fiscalYearId: string;
  items: ContentReviewItem[];
  providerOptions?: string[];
  groupOrder?: ContentReviewGroupOrderRow[];
  updates?: ContentReviewUpdate[];
  isDemo?: boolean;
  currentUserEmail?: string | null;
};

const COLUMN_GRID_CLASS = "grid-cols-[minmax(180px,3fr)_150px_minmax(0,1.2fr)_96px]";

const SORT_LABELS: Record<QueueSortColumn, string> = {
  priority: "Priority",
  title: "Title",
  reviewStatus: "Status",
  proposedRateCents: "Rate",
  provider: "Provider"
};

/** Group headings count items, so the one countable-noun status reads as a plural. */
const GROUP_HEADING_LABELS: Partial<Record<ReviewStatus, string>> = {
  acquisition_target: "Acquisition Targets"
};

const groupHeadingLabel = (status: ReviewStatus, fallback: string) => GROUP_HEADING_LABELS[status] ?? fallback;

const statusLabel = (status: ReviewStatus) => REVIEW_STATUSES.find((option) => option.value === status)?.label ?? status;
const statusTone = (status: ReviewStatus) => REVIEW_STATUSES.find((option) => option.value === status)?.tone ?? "slate";

export function ContentReviewDashboard({
  pageDescription,
  fiscalYearId,
  items,
  providerOptions = [],
  groupOrder = [],
  updates = [],
  isDemo,
  currentUserEmail
}: ContentReviewDashboardProps) {
  const [records, setRecords] = useState(items);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [lane, setLane] = useState<QueueLane>("priorities");
  const [filters, setFilters] = useState<QueueFilters>(emptyQueueFilters);
  const [showFilters, setShowFilters] = useState(false);
  const [sort, setSort] = useState<QueueSort>(null);
  const [collapsed, setCollapsed] = useState<Set<ReviewStatus>>(() => new Set());
  const [updateLog, setUpdateLog] = useState<ContentReviewUpdate[]>(updates);
  const [toast, setToast] = useState<ContentReviewToastState>(null);
  const [showPicker, setShowPicker] = useState(false);
  const [showRecap, setShowRecap] = useState(false);
  const [showAdd, setShowAdd] = useState(false);
  const [, startTransition] = useTransition();
  const statusOrder = useMemo(() => resolveGroupOrder(groupOrder), [groupOrder]);

  const selected = selectedId ? records.find((item) => item.id === selectedId) ?? null : null;
  const priorities = useMemo(() => priorityItems(records), [records]);
  const selectedUpdates = useMemo(() => (selected ? updateLog.filter((update) => update.itemId === selected.id) : []), [selected, updateLog]);
  const providerFilterOptions = useMemo(
    () => Array.from(new Set([...records.map((item) => (item.provider ?? "").trim()), ...providerOptions.map((option) => option.trim())].filter(Boolean))).sort((a, b) => a.localeCompare(b)),
    [records, providerOptions]
  );
  const pickerCandidates = useMemo(
    () => needsDecisionItems(records).filter((item) => !item.inFocus),
    [records]
  );

  const acquisitionTargetCount = useMemo(() => records.filter((item) => item.reviewStatus === "acquisition_target").length, [records]);
  const acquisitionTargetTotal = useMemo(() => acquisitionTargetTotalCents(records), [records]);

  const laneBase = laneItems(records, lane, priorities);
  const isFiltering = filters.search.trim() !== "" || filters.status !== "all" || filters.provider !== "all";
  const filteredLane = laneBase.filter((item) => matchesQueueFilters(item, filters));
  const heading = laneHeading(lane, laneBase.length, records.filter((item) => item.id !== "draft").length);
  const isGrouped = lane === "all" && !sort && filters.search.trim() === "";

  function selectItem(id: string) {
    setSelectedId(id);
  }

  function closeDetail() {
    setSelectedId(null);
  }

  function selectLane(nextLane: QueueLane) {
    setLane(nextLane);
    setCollapsed(new Set());
    setFilters((current) => ({ ...current, status: "all" }));
  }

  function toggleGroup(status: ReviewStatus) {
    setCollapsed((current) => {
      const next = new Set(current);
      if (next.has(status)) next.delete(status);
      else next.add(status);
      return next;
    });
  }

  function toggleSort(column: QueueSortColumn) {
    setSort((current) => nextSortState(current, column));
  }

  function itemFormData(item: ContentReviewItem) {
    const formData = new FormData();
    formData.set("fiscalYearId", fiscalYearId);
    formData.set("itemId", item.id);
    formData.set("title", item.title);
    formData.set("provider", item.provider ?? "");
    formData.set("genre", item.genre ?? "");
    formData.set("format", item.format ?? "");
    formData.set("reviewStatus", item.reviewStatus);
    formData.set("budgetSource", item.budgetSource ?? "misc_licensing");
    formData.set("minutes", item.minutes != null ? String(item.minutes) : "");
    formData.set("notes", item.notes ?? "");
    formData.set("proposedRate", formatOptionalCurrency(item.proposedRateCents));
    formData.set("reviewLink", item.reviewLink ?? "");
    formData.set("comparableContent", "");
    formData.set("isCoproductionOpportunity", item.isCoproductionOpportunity ? "true" : "false");
    return formData;
  }

  function persistItem(item: ContentReviewItem) {
    if (isDemo) return;
    startTransition(async () => {
      try {
        await updateContentReviewItem(itemFormData(item));
      } catch {
        // Best-effort autosave; the field keeps its edited value locally either way.
      }
    });
  }

  function persistFocus(itemId: string, inFocus: boolean) {
    if (isDemo) return;
    const formData = new FormData();
    formData.set("fiscalYearId", fiscalYearId);
    formData.set("itemId", itemId);
    formData.set("inFocus", inFocus ? "true" : "false");
    startTransition(async () => {
      try {
        await setContentReviewFocusMembership(formData);
      } catch {
        setRecords((current) => current.map((entry) => (entry.id === itemId ? { ...entry, inFocus: !inFocus } : entry)));
      }
    });
  }

  function logLocalStatusChange(itemId: string, fromStatus: ReviewStatus, toStatus: ReviewStatus) {
    setUpdateLog((current) => [{
      id: `local-${itemId}-${Date.now()}`,
      itemId,
      kind: "status_change",
      body: null,
      fromStatus,
      toStatus,
      authorEmail: currentUserEmail ?? null,
      createdAt: new Date().toISOString()
    }, ...current]);
  }

  function changeStatus(itemId: string, nextStatus: ReviewStatus) {
    const item = records.find((entry) => entry.id === itemId);
    if (!item || item.reviewStatus === nextStatus) return;
    const previousStatus = item.reviewStatus;
    const previousInFocus = Boolean(item.inFocus);
    const clearFocus = shouldClearPriorityOnStatusChange(item, nextStatus);
    const snapshot = records;

    setRecords((current) => current.map((entry) => (entry.id === itemId ? { ...entry, reviewStatus: nextStatus, inFocus: clearFocus ? false : entry.inFocus } : entry)));
    logLocalStatusChange(itemId, previousStatus, nextStatus);
    persistItem({ ...item, reviewStatus: nextStatus, inFocus: clearFocus ? false : item.inFocus });
    if (clearFocus) persistFocus(itemId, false);

    setToast({
      message: `Moved to ${statusLabel(nextStatus)}.`,
      undo: () => {
        setRecords(snapshot);
        persistItem({ ...item, reviewStatus: previousStatus, inFocus: previousInFocus });
        if (clearFocus) persistFocus(itemId, previousInFocus);
      }
    });
  }

  /** Every inline detail-panel field saves the same way: patch the local record, then autosave the whole row. */
  function commitFields(itemId: string, patch: Partial<ContentReviewItem>) {
    const item = records.find((entry) => entry.id === itemId);
    if (!item) return;
    const next = { ...item, ...patch };
    setRecords((current) => current.map((entry) => (entry.id === itemId ? next : entry)));
    persistItem(next);
  }

  function togglePriority(itemId: string) {
    const item = records.find((entry) => entry.id === itemId);
    if (!item) return;
    const nextInFocus = !item.inFocus;
    if (nextInFocus && isPriorityListFull(records)) {
      setToast({ message: "Priorities is full — remove something first." });
      return;
    }
    setRecords((current) => current.map((entry) => (entry.id === itemId ? { ...entry, inFocus: nextInFocus } : entry)));
    persistFocus(itemId, nextInFocus);
    if (!nextInFocus) {
      setToast({
        message: "Removed from Priorities.",
        undo: () => {
          setRecords((current) => current.map((entry) => (entry.id === itemId ? { ...entry, inFocus: true } : entry)));
          persistFocus(itemId, true);
        }
      });
    }
  }

  function deleteItem(itemId: string) {
    if (isDemo) return;
    setRecords((current) => current.filter((entry) => entry.id !== itemId));
    if (selectedId === itemId) setSelectedId(null);
    const formData = new FormData();
    formData.set("fiscalYearId", fiscalYearId);
    formData.set("itemId", itemId);
    startTransition(async () => {
      try {
        await deleteContentReviewItem(formData);
      } catch {
        // Deletion is rare enough that a failed request just needs a page refresh to reconcile.
      }
    });
  }

  const [isAdding, startAdding] = useTransition();

  function submitAdd(values: ContentReviewAddFormValues) {
    if (isDemo) {
      setShowAdd(false);
      return;
    }
    const formData = new FormData();
    formData.set("fiscalYearId", fiscalYearId);
    formData.set("title", values.title);
    formData.set("provider", values.provider);
    formData.set("genre", values.genre);
    formData.set("format", values.format);
    formData.set("reviewStatus", values.reviewStatus);
    formData.set("budgetSource", values.budgetSource);
    formData.set("minutes", values.minutes);
    formData.set("notes", values.notes);
    formData.set("proposedRate", values.proposedRate);
    formData.set("reviewLink", values.reviewLink);
    formData.set("comparableContent", "");
    formData.set("isCoproductionOpportunity", values.isCoproductionOpportunity ? "true" : "false");

    startAdding(async () => {
      try {
        const saved = await addContentReviewItem(formData);
        setRecords((current) => [saved, ...current]);
        setUpdateLog((current) => [{
          id: `local-${saved.id}-${Date.now()}`,
          itemId: saved.id,
          kind: "created",
          body: null,
          fromStatus: null,
          toStatus: saved.reviewStatus,
          authorEmail: currentUserEmail ?? null,
          createdAt: new Date().toISOString()
        }, ...current]);
        if (values.addToPriorities && !isPriorityListFull([...records, saved])) {
          setRecords((current) => current.map((entry) => (entry.id === saved.id ? { ...entry, inFocus: true } : entry)));
          persistFocus(saved.id, true);
        }
        setLane(saved.reviewStatus);
        setSelectedId(saved.id);
        setShowAdd(false);
      } catch {
        // Keep the modal open so the values are not lost on a failed save.
      }
    });
  }

  return (
    <div className="-mx-5 -mt-8 flex min-w-0 flex-wrap items-start md:-mx-10">
      {pageDescription ? <p className="w-full bg-formed-blue-soft px-5 py-2 text-xs font-semibold text-formed-blue md:px-10">{pageDescription}</p> : null}

      <ContentReviewRail
        items={records}
        priorities={priorities}
        lane={lane}
        canEdit={!isDemo}
        onSelectLane={selectLane}
        onSelectPriority={selectItem}
        onRemovePriority={togglePriority}
        onAddPriority={() => setShowPicker(true)}
      />

      <section className="min-w-0 flex-1 px-[18px] pb-[60px] pt-[24px] md:min-w-[540px] md:px-[26px] md:pt-[30px]">
        <div className="mb-4 flex flex-wrap items-end justify-between gap-4">
          <div>
            <h1 className="font-display text-[32px] leading-[1.05] md:text-[38px]">{heading.title}</h1>
            <p className="mt-1 text-[13px] leading-normal text-muted">{heading.subline}</p>
          </div>
          <div className="flex shrink-0 flex-wrap items-center gap-2">
            {acquisitionTargetCount > 0 ? (
              <div className="flex min-h-9 items-center gap-1.5 border border-tone-amber-line bg-tone-amber-line px-3.5 py-2 text-[13px]">
                <span className="font-semibold text-white">Acquisition Targets</span>
                <span className="text-white">
                  {acquisitionTargetCount} · {formatOptionalCurrency(acquisitionTargetTotal) || "$0.00"} · no contract
                </span>
              </div>
            ) : null}
            <button
              type="button"
              onClick={() => setShowRecap(true)}
              className="inline-flex min-h-9 items-center gap-1.5 border border-hairline bg-panel px-3.5 py-2 text-[13px] font-semibold text-foreground transition hover:bg-panel-warm"
            >
              <History className="h-4 w-4" aria-hidden="true" />Weekly recap
            </button>
            <button
              type="button"
              onClick={() => setShowAdd(true)}
              className="inline-flex min-h-9 items-center gap-1.5 border border-formed-blue bg-formed-blue px-3.5 py-2 text-[13px] font-semibold text-white transition hover:border-formed-blue-hover hover:bg-formed-blue-hover"
            >
              <Plus className="h-4 w-4" aria-hidden="true" />Add content
            </button>
          </div>
        </div>

        <div className="mb-3 flex flex-wrap items-center gap-2">
          <div className="relative min-w-[200px] flex-1">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-[15px] w-[15px] -translate-y-1/2 text-faint" aria-hidden="true" />
            <input
              aria-label="Search titles"
              type="search"
              placeholder="Search titles"
              value={filters.search}
              onChange={(event) => setFilters((current) => ({ ...current, search: event.target.value }))}
              className="min-h-9 w-full border border-hairline bg-panel py-2 pl-9 pr-3 text-[13px] font-normal normal-case tracking-normal outline-none focus:ring-2 focus:ring-formed-blue"
            />
          </div>
          <button
            type="button"
            onClick={() => setShowFilters((current) => !current)}
            className={cn(
              "inline-flex min-h-9 items-center gap-1.5 border px-3 py-2 text-[13px] font-semibold transition",
              isFiltering ? "border-formed-blue-border bg-formed-blue-soft text-formed-blue-hover" : "border-hairline bg-panel text-foreground hover:bg-panel-warm"
            )}
          >
            <SlidersHorizontal className="h-3.5 w-3.5" aria-hidden="true" />{isFiltering ? "Filters on" : "Filter"}
          </button>
        </div>

        {showFilters ? (
          <div className="mb-4 flex flex-wrap items-center gap-2 border border-hairline bg-panel px-3.5 py-3" style={{ animation: "fadein 150ms ease" }}>
            <select
              aria-label="Filter by review status"
              value={filters.status}
              onChange={(event) => setFilters((current) => ({ ...current, status: event.target.value as QueueFilters["status"] }))}
              className="min-h-9 border border-hairline bg-panel px-2 text-[13px] font-medium normal-case tracking-normal"
            >
              <option value="all">All statuses</option>
              {REVIEW_STATUSES.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}
            </select>
            <select
              aria-label="Filter by provider"
              value={filters.provider}
              onChange={(event) => setFilters((current) => ({ ...current, provider: event.target.value }))}
              className="min-h-9 border border-hairline bg-panel px-2 text-[13px] font-medium normal-case tracking-normal"
            >
              <option value="all">All providers</option>
              {providerFilterOptions.map((option) => <option key={option} value={option}>{option}</option>)}
            </select>
            {isFiltering ? (
              <button type="button" onClick={() => setFilters(emptyQueueFilters)} className="text-[13px] font-semibold text-muted underline hover:text-foreground">Clear</button>
            ) : null}
          </div>
        ) : null}

        <div className={cn("mb-2 hidden gap-2.5 border-b border-l-[3px] border-hairline-strong border-l-transparent px-3 pb-2 md:grid", COLUMN_GRID_CLASS)}>
          <SortHeader column="title" sort={sort} onToggle={toggleSort} />
          <SortHeader column="reviewStatus" sort={sort} onToggle={toggleSort} />
          <SortHeader column="provider" sort={sort} onToggle={toggleSort} />
          <SortHeader column="proposedRateCents" sort={sort} onToggle={toggleSort} align="justify-center" />
        </div>

        {filteredLane.length === 0 ? (
          <div className="grid place-items-center gap-3 py-16 text-center">
            <p className="font-display text-xl leading-[1.3]">Nothing here — this lane is clear.</p>
            {isFiltering ? <button type="button" onClick={() => setFilters(emptyQueueFilters)} className="border border-hairline bg-panel px-3.5 py-2 text-[13px] font-semibold hover:bg-panel-warm">Clear filters</button> : null}
          </div>
        ) : isGrouped ? (
          <div className="grid gap-0">
            {groupQueueItems(filteredLane, statusOrder).map(({ status, items: groupItems }) => {
              if (groupItems.length === 0) return null;
              const isOpen = !collapsed.has(status.value);
              return (
                <div key={status.value} data-testid={QUEUE_GROUP_TEST_IDS[status.value]}>
                  <button
                    type="button"
                    onClick={() => toggleGroup(status.value)}
                    className={cn("mt-2.5 flex w-full items-center gap-2 px-3 py-2.5 text-left", TONE_CLASSES[status.tone].field)}
                  >
                    {isOpen ? <ChevronDown className="h-3 w-3 shrink-0" aria-hidden="true" /> : <ChevronRight className="h-3 w-3 shrink-0" aria-hidden="true" />}
                    <span className="text-[12.5px] font-bold">{groupHeadingLabel(status.value, status.label)}</span>
                    <span className="text-xs font-semibold">{groupItems.length}</span>
                  </button>
                  {isOpen ? groupItems.map((item) => <QueueRow key={item.id} item={item} selected={selectedId === item.id} onSelect={selectItem} />) : null}
                </div>
              );
            })}
          </div>
        ) : (
          <div className="grid gap-0">
            {sortQueueItems(filteredLane, sort).map((item) => <QueueRow key={item.id} item={item} selected={selectedId === item.id} onSelect={selectItem} />)}
          </div>
        )}
      </section>

      {selected ? (
        <ContentReviewDetailPanel
          item={selected}
          allItems={records}
          fiscalYearId={fiscalYearId}
          providerOptions={providerFilterOptions}
          isDemo={isDemo}
          updates={selectedUpdates}
          onClose={closeDetail}
          onStatusChange={(status) => changeStatus(selected.id, status)}
          onFieldCommit={(patch) => commitFields(selected.id, patch)}
          onTogglePriority={() => togglePriority(selected.id)}
          onDelete={() => deleteItem(selected.id)}
          onUpdateAdded={(update) => setUpdateLog((current) => [update, ...current])}
          onUpdateDeleted={(updateId) => setUpdateLog((current) => current.filter((entry) => entry.id !== updateId))}
        />
      ) : null}

      <ContentReviewToast toast={toast} onDismiss={() => setToast(null)} />

      {showPicker ? (
        <ContentReviewPrioritiesPicker
          candidates={pickerCandidates}
          onPick={(itemId) => {
            togglePriority(itemId);
            setShowPicker(false);
          }}
          onClose={() => setShowPicker(false)}
        />
      ) : null}

      {showRecap ? (
        <ContentReviewRecapPanel
          items={records}
          updates={updateLog}
          currentUserEmail={currentUserEmail}
          onClose={() => setShowRecap(false)}
          onSelect={(itemId) => {
            selectItem(itemId);
            setShowRecap(false);
          }}
        />
      ) : null}

      {showAdd ? (
        <ContentReviewAddModal isSubmitting={isAdding} onSubmit={submitAdd} onClose={() => setShowAdd(false)} />
      ) : null}
    </div>
  );
}

function SortHeader({ column, sort, onToggle, align = "justify-start" }: { column: QueueSortColumn; sort: QueueSort; onToggle: (column: QueueSortColumn) => void; align?: string }) {
  const active = sort?.column === column ? sort.direction : null;
  return (
    <span role="columnheader" aria-sort={active === "asc" ? "ascending" : active === "desc" ? "descending" : "none"} className={cn("flex", align)}>
      <button
        type="button"
        onClick={() => onToggle(column)}
        aria-label={`Sort by ${SORT_LABELS[column]}`}
        className={cn(
          "inline-flex items-center gap-1 text-[10.5px] font-semibold uppercase tracking-[.07em] transition",
          active ? "text-formed-blue" : "text-muted hover:text-foreground"
        )}
      >
        {SORT_LABELS[column]}
        {active === "asc" ? <ChevronUp className="h-[11px] w-[11px]" aria-hidden="true" /> : null}
        {active === "desc" ? <ChevronDown className="h-[11px] w-[11px]" aria-hidden="true" /> : null}
      </button>
    </span>
  );
}

function QueueRow({ item, selected, onSelect }: { item: ContentReviewItem; selected: boolean; onSelect: (id: string) => void }) {
  const tone = statusTone(item.reviewStatus);
  return (
    <button
      type="button"
      data-testid={`content-review-row-${item.id}`}
      aria-current={selected ? "true" : undefined}
      onClick={() => onSelect(item.id)}
      className={cn(
        "grid w-full grid-cols-1 gap-1.5 border-b border-hairline border-l-[3px] px-3 py-3 text-left transition-colors md:gap-2.5",
        COLUMN_GRID_CLASS,
        TONE_CLASSES[tone].accent,
        selected ? "border-l-formed-blue bg-formed-blue-soft" : "bg-panel hover:bg-panel-warm"
      )}
    >
      <span className="flex min-w-0 items-center gap-2">
        {item.inFocus ? <Star className="h-3.5 w-3.5 shrink-0 fill-tone-amber-line text-tone-amber-line" aria-hidden="true" /> : null}
        <span className="min-w-0 text-[14px] font-semibold leading-[1.35] [overflow-wrap:anywhere] [text-wrap:pretty]">{item.title || "Untitled review"}</span>
        {item.isCoproductionOpportunity ? <span className="shrink-0 border border-formed-blue-border bg-formed-blue-soft px-1.5 py-0.5 text-[9.5px] font-bold uppercase tracking-[.06em] text-formed-blue-hover">CO-PROD</span> : null}
      </span>
      <span className="flex items-center gap-1.5">
        <span aria-hidden="true" className={cn("h-1.5 w-1.5 shrink-0", TONE_SWATCH_CLASSES[tone])} />
        <span className="text-[12px] font-medium text-muted">{statusLabel(item.reviewStatus)}</span>
      </span>
      <span className="truncate text-[12.5px] font-normal text-muted">{item.provider || ""}</span>
      <span className="text-center text-[12.5px] font-medium tabular-nums">
        {item.proposedRateCents ? formatOptionalCurrency(item.proposedRateCents) : <span className="text-faint">—</span>}
      </span>
    </button>
  );
}
