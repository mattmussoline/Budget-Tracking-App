"use client";

import { ArrowRight, CheckCircle2, ChevronDown, ChevronUp, ExternalLink, GripVertical, Handshake, History, Pin, Plus, Radar, Save, Search, Trash2, X, XCircle } from "lucide-react";
import { type DragEvent, type KeyboardEvent, type MouseEvent, type ReactNode, useEffect, useMemo, useRef, useState, useTransition } from "react";
import { createPortal } from "react-dom";
import { SoftButton } from "@/components/ui/soft-button";
import { cn } from "@/components/ui/soft-surface";
import { budgetSourceOptions } from "@/features/budget/budget-source";
import {
  FOCUS_LIMIT,
  QUEUE_GROUP_TEST_IDS,
  QUEUE_SORT_LABELS,
  type QueueFilters,
  type QueueSort,
  type QueueSortColumn,
  type QueueView,
  emptyQueueFilters,
  groupQueueItems,
  focusFiveItems,
  isDecisionQueueStatus,
  isInFocusFive,
  matchesQueueFilters,
  moveGroup,
  moveQueueItem,
  moveQueueItemToGroupEnd,
  moveQueueItemToPosition,
  nextSortState,
  renumberQueue,
  resolveGroupOrder,
  sortQueueItems
} from "../content-review-queue";
import {
  addContentReviewItem,
  deleteContentReviewItem,
  reorderContentReviewGroups,
  reorderContentReviewItems,
  sendReviewToRoadmap,
  updateContentReviewItem
} from "../planning-actions";
import { CONTENT_FORMATS, CONTENT_GENRES, REVIEW_STATUSES, TONE_CLASSES } from "../planning-constants";
import { dollarsToOptionalCents, formatOptionalCurrency } from "../planning-model";
import type { ContentReviewGroupOrderRow, ContentReviewItem, ContentReviewUpdate, ReviewStatus } from "../planning-types";
import { isLikelyNotesHtml, plainTextToNotesHtml } from "../rich-text";
import { ColoredSelect } from "./colored-select";
import { ContentReviewFocusFive } from "./content-review-focus-five";
import { ContentReviewFocusPicker } from "./content-review-focus-picker";
import { ContentReviewRecapPanel } from "./content-review-recap-panel";
import { ContentReviewUpdateLog } from "./content-review-update-log";
import { ProviderCombobox } from "./provider-combobox";
import { RichTextNotes } from "./rich-text-notes";

type ContentReviewDashboardProps = {
  fiscalYearId: string;
  items: ContentReviewItem[];
  providerOptions?: string[];
  groupOrder?: ContentReviewGroupOrderRow[];
  updates?: ContentReviewUpdate[];
  isDemo?: boolean;
};
type SaveState = "idle" | "unsaved" | "saving" | "saved" | "error";
type DragKind = "item" | "group";

const decisionQueueGridClass = "md:grid-cols-[4.25rem_4.5rem_1.3fr_1fr_0.9fr_1fr]";
const compactControlClass = "min-h-9 w-full rounded-md border-0 bg-transparent px-0 text-sm font-bold normal-case tracking-normal outline-none focus:bg-panel-warm focus:px-2 focus:ring-2 focus:ring-formed-blue";

/**
 * Marks an element as a valid drop target. Cancelling dragover is what allows
 * the drop at all, and dropEffect has to match the effectAllowed set on
 * dragstart or the browser refuses the drop.
 */
function allowDrop(event: DragEvent<HTMLElement>) {
  event.preventDefault();
  if (event.dataTransfer) event.dataTransfer.dropEffect = "move";
}

const blankDraft = (): ContentReviewItem => ({
  id: "draft",
  title: "",
  provider: "",
  genre: "",
  format: "",
  reviewStatus: "not_started",
  budgetSource: "misc_licensing",
  notes: "",
  proposedRateCents: null,
  reviewLink: "",
  comparableContent: "",
  isCoproductionOpportunity: false,
  priorityRank: null
});

export function ContentReviewDashboard({ fiscalYearId, items, providerOptions = [], groupOrder = [], updates = [], isDemo }: ContentReviewDashboardProps) {
  const [records, setRecords] = useState(items);
  const [selectedId, setSelectedId] = useState(() => items.find((item) => isDecisionQueueStatus(item.reviewStatus))?.id ?? items[0]?.id ?? "");
  const [draft, setDraft] = useState<ContentReviewItem | null>(null);
  const [saveState, setSaveState] = useState<SaveState>("idle");
  const [isPending, startTransition] = useTransition();
  const selected = selectedId === "draft" ? draft : records.find((item) => item.id === selectedId) ?? null;
  const [openStatusModal, setOpenStatusModal] = useState<ReviewStatusModalKey | null>(null);
  const editorSectionRef = useRef<HTMLElement>(null);
  const shouldFocusEditorRef = useRef(false);
  const [filters, setFilters] = useState<QueueFilters>(emptyQueueFilters);
  const [sort, setSort] = useState<QueueSort>(null);
  const [view, setView] = useState<QueueView>("grouped");
  const [statusOrder, setStatusOrder] = useState<ReviewStatus[]>(() => resolveGroupOrder(groupOrder));
  const [updateLog, setUpdateLog] = useState<ContentReviewUpdate[]>(updates);
  const [isRecapOpen, setIsRecapOpen] = useState(false);
  const [isFocusPickerOpen, setIsFocusPickerOpen] = useState(false);
  const [dragKind, setDragKind] = useState<DragKind | null>(null);
  const [draggedItemId, setDraggedItemId] = useState<string | null>(null);
  const [draggedStatus, setDraggedStatus] = useState<ReviewStatus | null>(null);
  const [orderStatus, setOrderStatus] = useState("");
  const [isOrdering, startOrdering] = useTransition();
  // Tracks the last status the server knows about so a save can tell a real
  // transition from an unrelated edit and mirror the server-side log entry.
  const persistedStatusRef = useRef(new Map(items.map((item) => [item.id, item.reviewStatus])));

  function selectItem(id: string) {
    if (id !== selectedId) setSaveState("idle");
    setSelectedId(id);
  }

  function selectItemFromModal(id: string) {
    shouldFocusEditorRef.current = true;
    selectItem(id);
    setOpenStatusModal(null);
    setIsRecapOpen(false);
  }

  function changeItem(id: string, field: keyof ContentReviewItem, value: string | number | boolean | null) {
    setSelectedId(id);
    setSaveState("unsaved");
    if (id === "draft") {
      setDraft((current) => current ? { ...current, [field]: value } : current);
      return;
    }
    setRecords((current) => current.map((item) => item.id === id ? { ...item, [field]: value } : item));
  }

  function logLocalStatusChange(itemId: string, fromStatus: ReviewStatus | null, toStatus: ReviewStatus, kind: ContentReviewUpdate["kind"] = "status_change") {
    setUpdateLog((current) => [{
      id: `local-${itemId}-${Date.now()}`,
      itemId,
      kind,
      body: null,
      fromStatus,
      toStatus,
      authorEmail: null,
      createdAt: new Date().toISOString()
    }, ...current]);
  }

  function itemFormData(item: ContentReviewItem) {
    const formData = new FormData();
    formData.set("fiscalYearId", fiscalYearId);
    if (item.id !== "draft") formData.set("itemId", item.id);
    formData.set("title", item.title);
    formData.set("provider", item.provider ?? "");
    formData.set("genre", item.genre ?? "");
    formData.set("format", item.format ?? "");
    formData.set("reviewStatus", item.reviewStatus);
    formData.set("budgetSource", item.budgetSource ?? "misc_licensing");
    formData.set("notes", item.notes ?? "");
    formData.set("proposedRate", formatOptionalCurrency(item.proposedRateCents));
    formData.set("reviewLink", item.reviewLink ?? "");
    formData.set("comparableContent", "");
    formData.set("isCoproductionOpportunity", item.isCoproductionOpportunity ? "true" : "false");
    return formData;
  }

  function save(item: ContentReviewItem) {
    if (isDemo || isPending || !item.title.trim()) return;
    setSaveState("saving");
    const previousStatus = persistedStatusRef.current.get(item.id) ?? null;
    startTransition(async () => {
      try {
        const formData = itemFormData(item);
        if (item.id === "draft") {
          const savedItem = await addContentReviewItem(formData);
          setRecords((current) => [savedItem, ...current]);
          persistedStatusRef.current.set(savedItem.id, savedItem.reviewStatus);
          logLocalStatusChange(savedItem.id, null, savedItem.reviewStatus, "created");
          setDraft(null);
          setSelectedId(savedItem.id);
        } else {
          await updateContentReviewItem(formData);
          persistedStatusRef.current.set(item.id, item.reviewStatus);
          if (previousStatus && previousStatus !== item.reviewStatus) {
            logLocalStatusChange(item.id, previousStatus, item.reviewStatus);
          }
        }
        setSaveState("saved");
      } catch {
        setSaveState("error");
      }
    });
  }

  function addDraft() {
    const next = blankDraft();
    setDraft(next);
    setSelectedId("draft");
    setSaveState("idle");
  }

  const queue = draft ? [draft, ...records] : records;
  const isFiltering = filters.search.trim() !== "" || filters.status !== "all" || filters.provider !== "all";
  const filteredQueue = queue.filter((item) => matchesQueueFilters(item, filters));
  // Dragging a row is relative to its neighbours, so it only makes sense in the
  // manual order. Pinning and typing a priority are absolute — they name a slot
  // outright — so they stay available while a column sort is on, which is
  // exactly when you are hunting for the title you want to promote.
  const canDrag = !isDemo && sort === null && !isOrdering;
  const canSetPriority = !isDemo && !isOrdering;
  const priorityByIdMap = useMemo(() => new Map(records.map((item, index) => [item.id, index + 1])), [records]);
  const groupedQueue = groupQueueItems(filteredQueue, statusOrder);
  const flatQueue = sortQueueItems(filteredQueue, sort);
  const providerFilterOptions = useMemo(
    () => Array.from(new Set([...records.map((item) => (item.provider ?? "").trim()), ...providerOptions.map((option) => option.trim())].filter(Boolean))).sort((a, b) => a.localeCompare(b)),
    [records, providerOptions]
  );
  const activeQueue = queue.filter((item) => isDecisionQueueStatus(item.reviewStatus));
  const radarContent = queue.filter((item) => item.reviewStatus === "on_the_radar");
  const approvedContent = queue.filter((item) => item.reviewStatus === "approved");
  const rejectedContent = queue.filter((item) => item.reviewStatus === "rejected");
  const coproductionContent = queue.filter((item) => item.isCoproductionOpportunity);
  const modalConfig = openStatusModal ? REVIEW_STATUS_MODAL_CONFIGS[openStatusModal] : null;
  const modalItems = openStatusModal === "active" ? activeQueue : openStatusModal === "radar" ? radarContent : openStatusModal === "approved" ? approvedContent : openStatusModal === "coproduction" ? coproductionContent : rejectedContent;
  const selectedUpdates = selected ? updateLog.filter((update) => update.itemId === selected.id) : [];
  const focusFive = focusFiveItems(records);
  const focusCandidates = records.slice(FOCUS_LIMIT);
  const updateCountById = useMemo(() => {
    const counts = new Map<string, number>();
    for (const update of updateLog) counts.set(update.itemId, (counts.get(update.itemId) ?? 0) + 1);
    return counts;
  }, [updateLog]);

  function saveItemOrder(nextRecords: ContentReviewItem[], movedItemId?: string, movedToStatus?: ReviewStatus) {
    const previousRecords = records;
    const renumbered = renumberQueue(nextRecords);
    setRecords(renumbered);
    if (isDemo) return;

    const formData = new FormData();
    formData.set("fiscalYearId", fiscalYearId);
    renumbered.forEach((item) => formData.append("itemIds", item.id));
    if (movedItemId) formData.set("movedItemId", movedItemId);
    if (movedItemId && movedToStatus) formData.set("movedToStatus", movedToStatus);

    setOrderStatus("Saving order");
    startOrdering(async () => {
      try {
        await reorderContentReviewItems(formData);
        setOrderStatus("Order saved");
        if (movedItemId && movedToStatus) {
          const previousStatus = persistedStatusRef.current.get(movedItemId) ?? null;
          persistedStatusRef.current.set(movedItemId, movedToStatus);
          if (previousStatus !== movedToStatus) logLocalStatusChange(movedItemId, previousStatus, movedToStatus);
        }
      } catch {
        setRecords(previousRecords);
        setOrderStatus("Order error");
      }
    });
  }

  function applyItemMove(nextRecords: ContentReviewItem[], itemId: string, nextStatus?: ReviewStatus) {
    const withStatus = nextStatus
      ? nextRecords.map((item) => item.id === itemId ? { ...item, reviewStatus: nextStatus } : item)
      : nextRecords;
    saveItemOrder(withStatus, itemId, nextStatus);
  }

  function saveGroupOrder(nextOrder: ReviewStatus[]) {
    const previousOrder = statusOrder;
    setStatusOrder(nextOrder);
    if (isDemo) return;

    const formData = new FormData();
    formData.set("fiscalYearId", fiscalYearId);
    nextOrder.forEach((status) => formData.append("reviewStatuses", status));

    setOrderStatus("Saving order");
    startOrdering(async () => {
      try {
        await reorderContentReviewGroups(formData);
        setOrderStatus("Order saved");
      } catch {
        setStatusOrder(previousOrder);
        setOrderStatus("Order error");
      }
    });
  }

  function endDrag() {
    setDragKind(null);
    setDraggedItemId(null);
    setDraggedStatus(null);
  }

  function startItemDrag(event: DragEvent<HTMLElement>, itemId: string) {
    if (!canDrag || itemId === "draft") {
      event.preventDefault();
      return;
    }
    setDragKind("item");
    setDraggedItemId(itemId);
    event.dataTransfer.effectAllowed = "move";
    event.dataTransfer.setData("text/plain", itemId);
  }

  function startGroupDrag(event: DragEvent<HTMLElement>, status: ReviewStatus) {
    if (!canDrag) {
      event.preventDefault();
      return;
    }
    setDragKind("group");
    setDraggedStatus(status);
    event.dataTransfer.effectAllowed = "move";
    event.dataTransfer.setData("text/plain", status);
  }

  function dropOnRow(event: DragEvent<HTMLElement>, targetId: string) {
    event.preventDefault();
    event.stopPropagation();
    const sourceId = (dragKind === "item" ? draggedItemId : null) ?? event.dataTransfer.getData("text/plain");
    endDrag();
    if (!canDrag || !sourceId || sourceId === targetId) return;

    const dragged = records.find((item) => item.id === sourceId);
    const target = records.find((item) => item.id === targetId);
    if (!dragged || !target) return;

    const nextStatus = target.reviewStatus !== dragged.reviewStatus ? target.reviewStatus : undefined;
    applyItemMove(moveQueueItem(records, sourceId, targetId), sourceId, nextStatus);
  }

  /**
   * The Focus Five panel is always rendered in the manual order, so reordering
   * inside it stays meaningful even while the queue below is sorted.
   */
  function startFocusDrag(event: DragEvent<HTMLElement>, itemId: string) {
    if (!canSetPriority) {
      event.preventDefault();
      return;
    }
    setDragKind("item");
    setDraggedItemId(itemId);
    event.dataTransfer.effectAllowed = "move";
    event.dataTransfer.setData("text/plain", itemId);
  }

  function dropOnFocusRow(event: DragEvent<HTMLElement>, targetId: string) {
    event.preventDefault();
    event.stopPropagation();
    const sourceId = (dragKind === "item" ? draggedItemId : null) ?? event.dataTransfer.getData("text/plain");
    endDrag();
    if (!canSetPriority || !sourceId || sourceId === targetId) return;
    const next = moveQueueItem(records, sourceId, targetId);
    if (next === records) return;
    saveItemOrder(next, sourceId);
  }

  function dropOnGroup(event: DragEvent<HTMLElement>, targetStatus: ReviewStatus) {
    event.preventDefault();
    const payload = event.dataTransfer.getData("text/plain");
    const kind = dragKind;
    const sourceItemId = draggedItemId;
    const sourceStatus = draggedStatus;
    endDrag();
    if (!canDrag) return;

    if (kind === "group" && sourceStatus) {
      saveGroupOrder(moveGroup(statusOrder, sourceStatus, targetStatus));
      return;
    }

    const itemId = kind === "item" ? sourceItemId : payload;
    if (!itemId) return;
    const dragged = records.find((item) => item.id === itemId);
    if (!dragged || dragged.reviewStatus === targetStatus) return;
    applyItemMove(moveQueueItemToGroupEnd(records, itemId, targetStatus), itemId, targetStatus);
  }

  /** Pushes a review just past the Focus Five, keeping the rest of the order intact. */
  function releaseFromFocus(itemId: string) {
    if (!canSetPriority) return;
    const next = moveQueueItemToPosition(records, itemId, FOCUS_LIMIT + 1);
    if (next === records) return;
    saveItemOrder(next, itemId);
  }

  function moveGroupBy(status: ReviewStatus, delta: number) {
    if (isDemo || isOrdering) return;
    const index = statusOrder.indexOf(status);
    const targetIndex = index + delta;
    if (index < 0 || targetIndex < 0 || targetIndex >= statusOrder.length) return;
    saveGroupOrder(moveGroup(statusOrder, status, statusOrder[targetIndex]));
  }

  function moveToPosition(itemId: string, position: number) {
    if (!canSetPriority) return;
    const next = moveQueueItemToPosition(records, itemId, position);
    if (next === records) return;
    saveItemOrder(next, itemId);
  }

  function toggleSort(column: QueueSortColumn) {
    setSort((current) => nextSortState(current, column));
  }

  useEffect(() => {
    if (!shouldFocusEditorRef.current || openStatusModal) return;
    shouldFocusEditorRef.current = false;
    editorSectionRef.current?.scrollIntoView?.({ behavior: "smooth", block: "start" });
    editorSectionRef.current?.focus({ preventScroll: true });
  }, [openStatusModal, selectedId]);

  const rowProps = {
    isDemo,
    canDrag,
    canSetPriority,
    draggedItemId,
    priorityById: priorityByIdMap,
    onSelect: selectItem,
    onChange: changeItem,
    onDragStart: startItemDrag,
    onDragEnd: endDrag,
    onDrop: dropOnRow,
    onMoveToPosition: moveToPosition
  };

  return (
    <div className="grid gap-5">
      <section aria-label="Review status summary" className="grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
        <StatusCard label="Active Decisions" value={activeQueue.length} helper="Ready to work now" tone="active" onClick={() => setOpenStatusModal("active")} />
        <StatusCard label="Co-productions" value={coproductionContent.length} helper="Potential partner projects" tone="coproduction" onClick={() => setOpenStatusModal("coproduction")} />
        <StatusCard label="On the Radar" value={radarContent.length} helper="Long shots and weak-contact targets" tone="radar" onClick={() => setOpenStatusModal("radar")} />
        <StatusCard label="Approved" value={approvedContent.length} helper="Ready for roadmap follow-up" tone="approved" onClick={() => setOpenStatusModal("approved")} />
        <StatusCard label="Rejected" value={rejectedContent.length} helper="Archived decisions" tone="rejected" onClick={() => setOpenStatusModal("rejected")} />
      </section>

      <div className="grid gap-5 xl:grid-cols-[minmax(600px,1.15fr)_minmax(520px,1fr)]">
        <div className="grid gap-5">
          <ContentReviewFocusFive
            items={focusFive}
            selectedId={selectedId}
            canReorder={canSetPriority}
            draggedItemId={draggedItemId}
            updateCountById={updateCountById}
            canAdd={canSetPriority && focusCandidates.length > 0}
            onAdd={() => setIsFocusPickerOpen(true)}
            onSelect={selectItemFromModal}
            onRelease={releaseFromFocus}
            onDragStart={startFocusDrag}
            onDragEnd={endDrag}
            onDrop={dropOnFocusRow}
          />
          <section data-testid="content-review-decision-queue-block" className="rounded-lg bg-panel-warm p-4 md:p-6">
            {radarContent.length > 0 ? (
              <div className="mb-4 flex flex-col gap-3 rounded-lg border border-guild-gold bg-gradient-to-r from-guild-gold-soft to-deep-teal-soft p-3 shadow-[0_8px_18px_rgba(245,158,11,0.12)] sm:flex-row sm:items-center sm:justify-between">
                <div className="flex items-start gap-3">
                  <span className="grid h-9 w-9 shrink-0 place-items-center rounded-md bg-guild-gold-soft text-guild-gold-ink">
                    <Radar className="h-4 w-4" aria-hidden="true" />
                  </span>
                  <p className="text-sm font-semibold leading-snug text-guild-gold-ink">
                    {radarContent.length} On the Radar {radarContent.length === 1 ? "piece is" : "pieces are"} waiting for follow-up. Open the list and decide who gets a next touch.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setOpenStatusModal("radar")}
                  className="shrink-0 rounded-md bg-guild-gold px-3 py-2 text-sm font-semibold text-foreground transition hover:bg-guild-gold-soft focus:outline-none focus:ring-2 focus:ring-formed-blue"
                >
                  View Items
                </button>
              </div>
            ) : null}
            <div className="mb-4 flex items-start justify-between gap-4">
              <div><h2 className="font-display text-2xl">Decision Queue</h2><p className="text-sm text-muted">Drag to set your review order, or sort a column to look at the list another way.</p></div>
              <div className="flex shrink-0 flex-wrap justify-end gap-2">
                <SoftButton type="button" variant="ghost" onClick={() => setIsRecapOpen(true)}><History className="h-4 w-4" />Weekly Recap</SoftButton>
                <SoftButton type="button" variant="primary" onClick={addDraft}><Plus className="h-4 w-4" />Add Content</SoftButton>
              </div>
            </div>
            <QueueFilterBar
              filters={filters}
              providerOptions={providerFilterOptions}
              matchCount={filteredQueue.length}
              totalCount={queue.length}
              isFiltering={isFiltering}
              sort={sort}
              view={view}
              orderStatus={orderStatus}
              onChange={setFilters}
              onClear={() => setFilters(emptyQueueFilters)}
              onClearSort={() => setSort(null)}
              onChangeView={setView}
            />
            <QueueColumnHeader sort={sort} onToggleSort={toggleSort} />
            <div data-testid="content-review-active-queue" className="grid gap-4">
              {queue.length === 0 ? <p className="rounded-lg bg-white p-5 font-bold text-muted">Add content to start the decision queue.</p> : null}
              {queue.length > 0 && filteredQueue.length === 0 ? <p data-testid="content-review-no-matches" className="rounded-lg bg-white p-5 font-bold text-muted">No reviews match these filters.</p> : null}
              {queue.length > 0 && view === "priority" ? (
                <div data-testid="content-review-priority-list" className="grid gap-3">
                  {flatQueue.map((item) => <ReviewSummaryRow key={item.id} item={item} active={selectedId === item.id} {...rowProps} />)}
                </div>
              ) : null}
              {view === "grouped" ? groupedQueue.map(({ status, items: groupItems }) => {
                if (isFiltering && groupItems.length === 0) return null;
                if (queue.length === 0) return null;
                return <ContentReviewGroup
                  key={status.value}
                  title={status.label}
                  count={groupItems.length}
                  tone={status.tone}
                  testId={QUEUE_GROUP_TEST_IDS[status.value]}
                  open={isFiltering}
                  canReorder={canDrag}
                  isDragging={dragKind === "group" && draggedStatus === status.value}
                  onDragStart={(event) => startGroupDrag(event, status.value)}
                  onDragEnd={endDrag}
                  onDrop={(event) => dropOnGroup(event, status.value)}
                  onMoveBy={(delta) => moveGroupBy(status.value, delta)}
                  isDragActive={dragKind !== null}
                >
                  {sortQueueItems(groupItems, sort).map((item) => <ReviewSummaryRow key={item.id} item={item} active={selectedId === item.id} {...rowProps} />)}
                </ContentReviewGroup>;
              }) : null}
            </div>
          </section>
        </div>

        <section ref={editorSectionRef} tabIndex={-1} className="h-fit rounded-lg bg-white p-5 shadow-[0_12px_35px_rgba(15,23,42,0.12)] outline-none focus:ring-2 focus:ring-formed-blue md:p-7">
          {selected ? <ReviewEditor item={selected} providerOptions={providerOptions} isDemo={isDemo} isPending={isPending} saveState={isPending ? "saving" : saveState} onChange={(field, value) => changeItem(selected.id, field, value)} onSave={() => save(selected)} fiscalYearId={fiscalYearId} updates={selectedUpdates} onUpdateAdded={(update) => setUpdateLog((current) => [update, ...current])} onUpdateDeleted={(updateId) => setUpdateLog((current) => current.filter((entry) => entry.id !== updateId))} /> : <div className="grid min-h-64 place-items-center text-center text-muted"><div><h2 className="text-xl font-semibold">Select a review</h2><p>Choose a queue item or add new content.</p></div></div>}
        </section>
      </div>

      {modalConfig ? <ReviewStatusModal
        config={modalConfig}
        items={modalItems}
        selectedId={selectedId}
        isDemo={isDemo}
        priorityById={priorityByIdMap}
        onClose={() => setOpenStatusModal(null)}
        onSelect={selectItem}
        onOpenDetail={selectItemFromModal}
        onChange={changeItem}
      /> : null}

      {isFocusPickerOpen ? <ContentReviewFocusPicker
        candidates={focusCandidates}
        onPick={(itemId) => {
          moveToPosition(itemId, Math.min(focusFive.length + 1, FOCUS_LIMIT));
          setIsFocusPickerOpen(false);
        }}
        onClose={() => setIsFocusPickerOpen(false)}
      /> : null}

      {isRecapOpen ? <ContentReviewRecapPanel
        items={records}
        updates={updateLog}
        onClose={() => setIsRecapOpen(false)}
        onSelect={selectItemFromModal}
      /> : null}
    </div>
  );
}

type StatusCardTone = "neutral" | "active" | "coproduction" | "radar" | "approved" | "rejected";
type ReviewStatusModalKey = "active" | "coproduction" | "radar" | "approved" | "rejected";

const STATUS_CARD_TONES: Record<StatusCardTone, { card: string; label: string; helper: string; icon: string; rail: string; value: string; Icon: typeof CheckCircle2 }> = {
  neutral: { card: "bg-white text-foreground ring-hairline", label: "text-muted", helper: "text-muted", icon: "bg-panel-warm text-muted", rail: "bg-hairline-strong", value: "text-foreground", Icon: CheckCircle2 },
  active: { card: "bg-guild-gold-soft text-guild-gold-ink ring-guild-gold", label: "text-guild-gold-ink", helper: "text-guild-gold-ink", icon: "bg-guild-gold-soft text-guild-gold-ink", rail: "bg-guild-gold", value: "text-guild-gold-ink", Icon: ArrowRight },
  coproduction: { card: "bg-formed-blue-soft text-foreground ring-formed-blue-border", label: "text-formed-blue", helper: "text-muted", icon: "bg-white text-formed-blue ring-1 ring-formed-blue-border", rail: "bg-formed-blue", value: "text-foreground", Icon: Handshake },
  radar: { card: "bg-guild-gold-soft text-guild-gold-ink ring-guild-gold", label: "text-guild-gold-ink", helper: "text-guild-gold-ink", icon: "bg-guild-gold-soft text-guild-gold-ink", rail: "bg-guild-gold", value: "text-guild-gold-ink", Icon: Radar },
  approved: { card: "bg-deep-teal-soft text-deep-teal ring-deep-teal", label: "text-deep-teal", helper: "text-deep-teal", icon: "bg-deep-teal-soft text-deep-teal", rail: "bg-deep-teal", value: "text-deep-teal", Icon: CheckCircle2 },
  rejected: { card: "bg-danger-soft text-danger ring-danger-border", label: "text-danger", helper: "text-danger", icon: "bg-white text-danger ring-1 ring-danger-border", rail: "bg-danger", value: "text-danger", Icon: XCircle }
};

function StatusCard({ label, value, helper, tone = "neutral", onClick }: { label: string; value: number; helper: string; tone?: StatusCardTone; onClick?: () => void }) {
  const toneClasses = STATUS_CARD_TONES[tone];
  const Icon = toneClasses.Icon;
  const cardClass = cn(
    "group relative min-h-28 overflow-hidden rounded-lg p-4 text-left shadow-sm ring-1 transition",
    toneClasses.card,
    onClick && "cursor-pointer hover:-translate-y-0.5 hover:shadow-md focus:outline-none focus:ring-2 focus:ring-formed-blue"
  );
  const content = <>
    <span aria-hidden="true" className={cn("absolute inset-x-0 bottom-0 h-1", toneClasses.rail)} />
    <span className="flex items-start justify-between gap-3">
      <span className={cn("text-xs font-semibold uppercase tracking-wide", toneClasses.label)}>{label}</span>
      <span className={cn("grid h-9 w-9 shrink-0 place-items-center rounded-md transition group-hover:scale-105", toneClasses.icon)}>
        <Icon className="h-4 w-4" aria-hidden="true" />
      </span>
    </span>
    <span className={cn("mt-1 block font-display text-3xl", toneClasses.value)}>{value}</span>
    <span className={cn("mt-1 block max-w-56 text-xs font-bold leading-snug", toneClasses.helper)}>{helper}</span>
  </>;

  if (onClick) {
    return <button type="button" onClick={onClick} className={cardClass} aria-label={`${label}: ${value}. Open ${label.toLowerCase()} reviews`}>
      {content}
    </button>;
  }

  return <div className={cardClass}>{content}</div>;
}

const REVIEW_STATUS_MODAL_CONFIGS: Record<ReviewStatusModalKey, { title: string; eyebrow: string; description: string; empty: string; testId: string; tone: StatusCardTone }> = {
  active: {
    title: "Active Decisions",
    eyebrow: "Active Decision",
    description: "Current reviews that are ready for a clear yes, no, or next-step decision.",
    empty: "No active decisions right now.",
    testId: "content-review-active-modal-content",
    tone: "active"
  },
  coproduction: {
    title: "Co-productions",
    eyebrow: "Potential Co-production",
    description: "Reviews flagged as possible partner projects rather than standard licensing decisions.",
    empty: "No potential co-productions yet.",
    testId: "content-review-coproduction-content",
    tone: "coproduction"
  },
  radar: {
    title: "On the Radar",
    eyebrow: "Radar Target",
    description: "Long shots, weak-contact targets, and pieces worth keeping warm.",
    empty: "No radar targets yet.",
    testId: "content-review-radar-content",
    tone: "radar"
  },
  approved: {
    title: "Approved",
    eyebrow: "Approved Review",
    description: "Content that is cleared and ready for roadmap follow-up.",
    empty: "No approved reviews yet.",
    testId: "content-review-approved-modal-content",
    tone: "approved"
  },
  rejected: {
    title: "Rejected",
    eyebrow: "Rejected Review",
    description: "Archived decisions that stay available without crowding active work.",
    empty: "No rejected reviews yet.",
    testId: "content-review-rejected-modal-content",
    tone: "rejected"
  }
};

function ReviewStatusModal({ config, items, selectedId, isDemo, priorityById, onClose, onSelect, onOpenDetail, onChange }: { config: (typeof REVIEW_STATUS_MODAL_CONFIGS)[ReviewStatusModalKey]; items: ContentReviewItem[]; selectedId: string; isDemo?: boolean; priorityById: Map<string, number>; onClose: () => void; onSelect: (id: string) => void; onOpenDetail: (id: string) => void; onChange: (id: string, field: keyof ContentReviewItem, value: string | number | boolean | null) => void }) {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const toneClasses = STATUS_CARD_TONES[config.tone];
  const titleId = `review-status-modal-${config.tone}`;

  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;

    if (typeof dialog.showModal === "function" && !dialog.open) dialog.showModal();
    else dialog.setAttribute("open", "");
  }, []);

  function closeDialog() {
    const dialog = dialogRef.current;
    if (dialog?.open && typeof dialog.close === "function") dialog.close();
    else dialog?.removeAttribute("open");
    onClose();
  }

  function closeFromBackdrop(event: MouseEvent<HTMLDialogElement>) {
    if (event.target === event.currentTarget) closeDialog();
  }

  function closeFromEscape(event: KeyboardEvent<HTMLDialogElement>) {
    if (event.key !== "Escape") return;
    event.preventDefault();
    closeDialog();
  }

  return createPortal(<dialog
    ref={dialogRef}
    open
    style={{ display: "block", visibility: "visible" }}
    aria-labelledby={titleId}
    onClick={closeFromBackdrop}
    onKeyDown={closeFromEscape}
    onClose={onClose}
    className="fixed left-1/2 top-1/2 z-50 block w-[calc(100%-2rem)] max-w-4xl -translate-x-1/2 -translate-y-1/2 rounded-xl bg-white p-0 text-foreground shadow-2xl backdrop:bg-augustine-blue/60"
  >
    <div className="flex max-h-[calc(100vh-2rem)] flex-col">
      <header className={cn("flex shrink-0 items-start justify-between gap-4 border-b p-5 sm:p-7", toneClasses.card)}>
        <div>
          <p className={cn("text-xs font-semibold uppercase tracking-wide", toneClasses.label)}>{items.length} {config.eyebrow}{items.length === 1 ? "" : "s"}</p>
          <h2 id={titleId} className="font-display text-3xl">{config.title}</h2>
          <p className={cn("mt-1 text-sm font-medium", toneClasses.helper)}>{config.description}</p>
        </div>
        <button type="button" onClick={closeDialog} aria-label={`Close ${config.title} reviews`} className="rounded-md bg-white p-3 text-foreground shadow-sm ring-1 ring-hairline transition-colors hover:bg-panel-warm">
          <X className="h-5 w-5" aria-hidden="true" />
        </button>
      </header>
      <div data-testid={config.testId} className="grid min-h-0 gap-2 overflow-y-auto p-5 sm:p-7">
        {items.length ? items.map((item) => <ReviewSummaryRow key={item.id} item={item} active={selectedId === item.id} isDemo={isDemo} canDrag={false} priorityById={priorityById} onSelect={onSelect} onOpenDetail={onOpenDetail} onChange={onChange} />) : <p className="rounded-lg bg-panel-warm p-5 font-bold text-muted">{config.empty}</p>}
      </div>
      <footer className="flex shrink-0 justify-end border-t border-hairline p-4 sm:px-7">
        <button type="button" onClick={closeDialog} className="min-h-12 rounded-md px-5 py-3 text-sm font-semibold uppercase tracking-wide text-muted hover:bg-panel-warm">Close</button>
      </footer>
    </div>
  </dialog>, document.body);
}

const filterControlClass = "min-h-10 w-full rounded-md border-0 bg-white px-3 text-sm font-bold text-foreground shadow-sm ring-1 ring-hairline outline-none focus:ring-2 focus:ring-formed-blue";

function QueueFilterBar({ filters, providerOptions, matchCount, totalCount, isFiltering, sort, view, orderStatus, onChange, onClear, onClearSort, onChangeView }: { filters: QueueFilters; providerOptions: string[]; matchCount: number; totalCount: number; isFiltering: boolean; sort: QueueSort; view: QueueView; orderStatus: string; onChange: (filters: QueueFilters) => void; onClear: () => void; onClearSort: () => void; onChangeView: (view: QueueView) => void }) {
  return <div data-testid="content-review-queue-filters" className="mb-4 grid gap-2 rounded-lg bg-white/70 p-3 ring-1 ring-hairline">
    <div className="grid gap-2 sm:grid-cols-[minmax(0,1.4fr)_minmax(0,1fr)_minmax(0,1fr)]">
      <div className="relative">
        <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted" aria-hidden="true" />
        <input
          aria-label="Filter by title"
          type="search"
          placeholder="Search titles"
          value={filters.search}
          onChange={(event) => onChange({ ...filters, search: event.target.value })}
          className={cn(filterControlClass, "pl-9 font-medium normal-case tracking-normal")}
        />
      </div>
      <select
        aria-label="Filter by review status"
        value={filters.status}
        onChange={(event) => onChange({ ...filters, status: event.target.value as QueueFilters["status"] })}
        className={filterControlClass}
      >
        <option value="all">All statuses</option>
        {REVIEW_STATUSES.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}
      </select>
      <select
        aria-label="Filter by provider"
        value={filters.provider}
        onChange={(event) => onChange({ ...filters, provider: event.target.value })}
        className={filterControlClass}
      >
        <option value="all">All providers</option>
        {providerOptions.map((option) => <option key={option} value={option}>{option}</option>)}
      </select>
    </div>
    <div className="flex flex-wrap items-center justify-between gap-2">
      <div className="flex flex-wrap items-center gap-2">
        <p aria-live="polite" className="text-xs font-semibold uppercase tracking-wide text-muted">
          {isFiltering ? `Showing ${matchCount} of ${totalCount}` : `${totalCount} ${totalCount === 1 ? "review" : "reviews"}`}
        </p>
        {sort ? <button
          type="button"
          onClick={onClearSort}
          className="inline-flex min-h-8 items-center gap-1 rounded-md bg-formed-blue-soft px-3 text-xs font-semibold uppercase tracking-wide text-formed-blue transition hover:bg-formed-blue-soft focus:outline-none focus:ring-2 focus:ring-formed-blue"
        >
          <X className="h-3.5 w-3.5" aria-hidden="true" />Sorted by {QUEUE_SORT_LABELS[sort.column]} · Back to my order
        </button> : null}
        {orderStatus ? <span aria-live="polite" className="text-xs font-semibold uppercase tracking-wide text-muted">{orderStatus}</span> : null}
      </div>
      <div className="flex flex-wrap items-center gap-2">
        <div role="group" aria-label="Queue layout" className="flex gap-1 rounded-md bg-panel-warm p-1">
          <button
            type="button"
            aria-pressed={view === "grouped"}
            onClick={() => onChangeView("grouped")}
            className={cn("min-h-8 rounded px-2 text-[10px] font-semibold uppercase tracking-wide transition focus:outline-none focus:ring-2 focus:ring-formed-blue", view === "grouped" ? "bg-white text-foreground shadow-sm" : "text-muted hover:text-foreground")}
          >
            Group by status
          </button>
          <button
            type="button"
            aria-pressed={view === "priority"}
            onClick={() => onChangeView("priority")}
            className={cn("min-h-8 rounded px-2 text-[10px] font-semibold uppercase tracking-wide transition focus:outline-none focus:ring-2 focus:ring-formed-blue", view === "priority" ? "bg-white text-foreground shadow-sm" : "text-muted hover:text-foreground")}
          >
            Priority order
          </button>
        </div>
        {isFiltering ? <button type="button" onClick={onClear} className="inline-flex min-h-8 items-center gap-1 rounded-md bg-panel-warm px-3 text-xs font-semibold uppercase tracking-wide text-muted transition hover:bg-hairline hover:text-foreground focus:outline-none focus:ring-2 focus:ring-formed-blue">
          <X className="h-3.5 w-3.5" aria-hidden="true" />Clear filters
        </button> : null}
      </div>
    </div>
  </div>;
}

function QueueColumnHeader({ sort, onToggleSort }: { sort: QueueSort; onToggleSort: (column: QueueSortColumn) => void }) {
  return <div data-testid="content-review-queue-header" className={cn("mb-2 hidden gap-2 px-3 text-center text-[10px] font-semibold uppercase tracking-wide text-muted md:grid", decisionQueueGridClass)}>
    <SortHeaderCell column="priority" sort={sort} onToggleSort={onToggleSort} align="justify-start" />
    <span aria-hidden="true" />
    <SortHeaderCell column="title" sort={sort} onToggleSort={onToggleSort} />
    <SortHeaderCell column="reviewStatus" sort={sort} onToggleSort={onToggleSort} />
    <SortHeaderCell column="proposedRateCents" sort={sort} onToggleSort={onToggleSort} />
    <SortHeaderCell column="provider" sort={sort} onToggleSort={onToggleSort} />
  </div>;
}

function SortHeaderCell({ column, sort, onToggleSort, align = "justify-center" }: { column: QueueSortColumn; sort: QueueSort; onToggleSort: (column: QueueSortColumn) => void; align?: string }) {
  const active = sort?.column === column ? sort.direction : null;
  const label = QUEUE_SORT_LABELS[column];
  return <span aria-sort={active === "asc" ? "ascending" : active === "desc" ? "descending" : "none"}>
    <button
      type="button"
      onClick={() => onToggleSort(column)}
      aria-label={`Sort by ${label}`}
      className={cn(
        "inline-flex w-full items-center gap-1 rounded px-1 py-0.5 text-[10px] font-semibold uppercase tracking-wide transition hover:text-foreground focus:outline-none focus:ring-2 focus:ring-formed-blue",
        align,
        active ? "text-formed-blue" : "text-muted"
      )}
    >
      {label}
      {active === "asc" ? <ChevronUp className="h-3 w-3" aria-hidden="true" /> : null}
      {active === "desc" ? <ChevronDown className="h-3 w-3" aria-hidden="true" /> : null}
    </button>
  </span>;
}

type ReviewSummaryRowProps = {
  item: ContentReviewItem;
  active: boolean;
  isDemo?: boolean;
  canDrag: boolean;
  canSetPriority?: boolean;
  draggedItemId?: string | null;
  priorityById: Map<string, number>;
  onSelect: (id: string) => void;
  onOpenDetail?: (id: string) => void;
  onChange: (id: string, field: keyof ContentReviewItem, value: string | number | boolean | null) => void;
  onDragStart?: (event: DragEvent<HTMLElement>, id: string) => void;
  onDragEnd?: () => void;
  onDrop?: (event: DragEvent<HTMLElement>, id: string) => void;
  onMoveToPosition?: (id: string, position: number) => void;
};

function ReviewSummaryRow({ item, active, isDemo, canDrag, canSetPriority, draggedItemId, priorityById, onSelect, onOpenDetail, onChange, onDragStart, onDragEnd, onDrop, onMoveToPosition }: ReviewSummaryRowProps) {
  const status = REVIEW_STATUSES.find((option) => option.value === item.reviewStatus) ?? REVIEW_STATUSES[0];
  const isDraft = item.id === "draft";
  const draggable = Boolean(canDrag && onDragStart && !isDraft);
  return (
    <div
      aria-current={active ? "true" : undefined}
      data-testid={`content-review-row-${item.id}`}
      draggable={draggable}
      onDragStart={onDragStart ? (event) => onDragStart(event, item.id) : undefined}
      onDragEnd={onDragEnd}
      onDragOver={onDrop ? allowDrop : undefined}
      onDrop={onDrop ? (event) => onDrop(event, item.id) : undefined}
      className={cn("relative grid overflow-hidden gap-2 rounded-lg border-l-4 border-y border-r border-y-gray-200 border-r-gray-200 bg-panel-warm p-4 transition", decisionQueueGridClass, TONE_CLASSES[status.tone].accent, active && "ring-2 ring-formed-blue", draggedItemId === item.id && "opacity-60")}
    >
      {item.isCoproductionOpportunity ? <span aria-label="Potential co-production opportunity" title="Potential co-production opportunity" className="absolute right-3 top-0 z-10 rounded-b-md bg-augustine-blue-raised px-2 py-1 text-[9px] font-semibold uppercase leading-none tracking-wide text-white shadow-sm">Co-prod</span> : null}
      <PriorityCell
        item={item}
        position={priorityById.get(item.id) ?? null}
        canDrag={draggable}
        canSetPriority={Boolean(canSetPriority && !isDraft)}
        onMoveToPosition={onMoveToPosition}
      />
      <button
        type="button"
        aria-label={`Select ${item.title || "Untitled review"}`}
        onClick={() => (onOpenDetail ?? onSelect)(item.id)}
        className={cn(
          "min-h-10 rounded-md px-3 text-left text-xs font-semibold uppercase tracking-wide transition",
          active ? "bg-formed-blue text-white" : "bg-augustine-blue text-white hover:bg-augustine-blue-raised"
        )}
      >
        Select
      </button>
      <input aria-label="Summary Title" value={item.title} placeholder="Untitled review" disabled={isDemo} onFocus={() => onSelect(item.id)} onChange={(event) => onChange(item.id, "title", event.target.value)} className="min-h-10 min-w-0 w-full rounded-md border-0 bg-panel-warm px-3 text-sm font-semibold" />
      <select aria-label="Summary Review Status" value={item.reviewStatus} disabled={isDemo} onFocus={() => onSelect(item.id)} onChange={(event) => { onChange(item.id, "reviewStatus", event.target.value as ReviewStatus); }} className={cn("min-h-10 min-w-0 w-full rounded-md border-0 px-2 text-xs font-bold", TONE_CLASSES[status.tone].field)}>{REVIEW_STATUSES.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}</select>
      <CurrencyInput ariaLabel="Summary Proposed Yearly Rate" value={item.proposedRateCents} disabled={isDemo} onFocus={() => onSelect(item.id)} onChange={(value) => onChange(item.id, "proposedRateCents", value)} className="min-h-10 min-w-0 w-full rounded-md border-0 bg-panel-warm px-3 text-sm" />
      <input aria-label="Summary Provider" value={item.provider ?? ""} disabled={isDemo} onFocus={() => onSelect(item.id)} onChange={(event) => onChange(item.id, "provider", event.target.value)} className="min-h-10 min-w-0 w-full rounded-md border-0 bg-formed-blue-soft px-3 text-sm font-bold text-formed-blue" />
    </div>
  );
}

/**
 * The drag handle and the review's standing share one cell. Only the Focus Five
 * carry a number; everything below shows a pin that lifts a review into the
 * five. Typing a number is the keyboard route to the move a drag performs.
 */
function PriorityCell({ item, position, canDrag, canSetPriority, onMoveToPosition }: { item: ContentReviewItem; position: number | null; canDrag: boolean; canSetPriority: boolean; onMoveToPosition?: (id: string, position: number) => void }) {
  const [draftValue, setDraftValue] = useState<string | null>(null);
  const label = item.title || "Untitled review";

  if (position === null) {
    return <span className="flex items-center text-xs font-semibold uppercase tracking-wide text-muted">New</span>;
  }

  const focused = isInFocusFive(position);

  function commit() {
    const parsed = Number.parseInt(draftValue ?? "", 10);
    setDraftValue(null);
    if (!Number.isFinite(parsed) || parsed === position) return;
    onMoveToPosition?.(item.id, parsed);
  }

  const handle = canDrag ? <span
    aria-hidden="true"
    title={`Drag to reorder ${label}`}
    className="flex min-h-10 cursor-grab items-center text-muted active:cursor-grabbing"
  >
    <GripVertical className="h-4 w-4" />
  </span> : null;

  if (!focused) {
    return <span className="flex items-center gap-1">
      {handle}
      <button
        type="button"
        aria-label={`Add ${label} to the Focus Five`}
        title="Add to the Focus Five"
        disabled={!onMoveToPosition || !canSetPriority}
        onClick={() => onMoveToPosition?.(item.id, FOCUS_LIMIT)}
        className="flex min-h-10 w-9 items-center justify-center rounded-md text-muted transition hover:bg-guild-gold-soft hover:text-guild-gold-ink focus:outline-none focus:ring-2 focus:ring-formed-blue disabled:opacity-40 disabled:hover:bg-transparent disabled:hover:text-muted"
      >
        <Pin className="h-4 w-4" aria-hidden="true" />
      </button>
    </span>;
  }

  return <span className="flex items-center gap-1">
    {handle}
    <input
      aria-label={`Priority for ${label}`}
      inputMode="numeric"
      disabled={!onMoveToPosition || !canSetPriority}
      value={draftValue ?? String(position)}
      onChange={(event) => setDraftValue(event.target.value)}
      onBlur={() => setDraftValue(null)}
      onKeyDown={(event) => {
        if (event.key === "Escape") {
          setDraftValue(null);
          return;
        }
        if (event.key !== "Enter") return;
        event.preventDefault();
        commit();
      }}
      className="min-h-10 w-9 rounded-md bg-guild-gold-soft px-1 text-center text-sm font-semibold text-guild-gold-ink outline-none ring-1 ring-guild-gold focus:ring-2 focus:ring-formed-blue disabled:bg-amber-100 disabled:text-amber-900"
    />
  </span>;
}

/**
 * Two <summary> quirks shape this markup, both verified in a browser:
 *
 * 1. A drag that begins anywhere inside a <summary> fires dragstart but never
 *    completes a drop, so the handle sits beside the <details> and is
 *    positioned back over the header line. A <button> swallows drops the same
 *    way, which is why the handle is a focusable <span> instead.
 * 2. A <summary> under the cursor also swallows the drop itself. Groups render
 *    collapsed, so the summary is nearly the whole target — during a drag it
 *    stops taking pointer events and the drop lands on this wrapper.
 */
function ContentReviewGroup({ title, count, testId, tone, open, canReorder, isDragging, isDragActive, onDragStart, onDragEnd, onDrop, onMoveBy, children }: { title: string; count: number; testId: string; tone?: keyof typeof TONE_CLASSES; open?: boolean; canReorder?: boolean; isDragging?: boolean; isDragActive?: boolean; onDragStart?: (event: DragEvent<HTMLElement>) => void; onDragEnd?: () => void; onDrop?: (event: DragEvent<HTMLElement>) => void; onMoveBy?: (delta: number) => void; children: ReactNode }) {
  const isDraggable = Boolean(canReorder && onDragStart);
  return <div
    data-testid={testId}
    onDragOver={onDrop ? allowDrop : undefined}
    onDrop={onDrop}
    className={cn("relative rounded-md border border-hairline bg-white py-3 shadow-sm transition", tone && cn("border-l-4", TONE_CLASSES[tone].accent), isDragging && "opacity-60")}
  >
    {isDraggable ? <span
      draggable
      role="button"
      tabIndex={0}
      onDragStart={onDragStart}
      onDragEnd={onDragEnd}
      onKeyDown={(event) => {
        if (event.key !== "ArrowUp" && event.key !== "ArrowDown") return;
        event.preventDefault();
        onMoveBy?.(event.key === "ArrowUp" ? -1 : 1);
      }}
      aria-label={`Drag the ${title} group. Press the up and down arrow keys to move it.`}
      className="absolute left-1.5 top-3 z-10 flex h-6 w-5 cursor-grab items-center justify-center rounded text-muted transition hover:text-foreground focus:outline-none focus:ring-2 focus:ring-formed-blue active:cursor-grabbing"
    >
      <GripVertical className="h-4 w-4" aria-hidden="true" />
    </span> : null}
    <details open={open} className="group">
      <summary className={cn("flex cursor-pointer list-none items-center gap-3 px-3 pb-1 text-sm font-semibold [&::-webkit-details-marker]:hidden", isDraggable && "pl-8", isDragActive && "pointer-events-none")}>
        <span aria-hidden="true" className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-panel-warm text-xs font-black leading-none text-muted">
          <span className="group-open:hidden">+</span>
          <span className="hidden group-open:inline">−</span>
        </span>
        <span className="flex-1">{title}</span>
        <span className="rounded-full bg-panel-warm px-2 py-1 text-[10px] uppercase tracking-wide text-muted">{count}</span>
      </summary>
      <div className="mt-2 grid gap-3 px-3">{count ? children : <p className="rounded-md bg-panel-warm p-3 text-sm font-bold text-muted">No items.</p>}</div>
    </details>
  </div>;
}

function ReviewEditor({ item, providerOptions, isDemo, isPending, saveState, onChange, onSave, fiscalYearId, updates, onUpdateAdded, onUpdateDeleted }: { item: ContentReviewItem; providerOptions: string[]; isDemo?: boolean; isPending: boolean; saveState: SaveState; onChange: (field: keyof ContentReviewItem, value: string | number | boolean | null) => void; onSave: () => void; fiscalYearId: string; updates: ContentReviewUpdate[]; onUpdateAdded: (update: ContentReviewUpdate) => void; onUpdateDeleted: (updateId: string) => void }) {
  const [pipelineMessage, setPipelineMessage] = useState<string | null>(null);
  const [isPipelinePending, startPipelineTransition] = useTransition();

  function sendToRoadmap() {
    if (isDemo || item.id === "draft") return;
    setPipelineMessage(null);
    startPipelineTransition(async () => {
      try {
        const formData = new FormData();
        formData.set("fiscalYearId", fiscalYearId);
        formData.set("itemId", item.id);
        await sendReviewToRoadmap(formData);
        setPipelineMessage("Sent to Roadmap as TBD. Open the Roadmap backlog to schedule it.");
      } catch {
        setPipelineMessage("Could not send this review to the roadmap.");
      }
    });
  }

  return <div className="grid gap-4">
    <div className="flex items-start justify-between gap-4"><div><p className="text-xs font-semibold uppercase tracking-wide text-formed-blue">Selected Review</p><h2 className="font-display text-2xl">{item.id === "draft" ? "New Content Review" : item.title}</h2></div><span aria-live="polite" className="text-xs font-semibold uppercase text-muted">{saveState === "idle" ? "" : saveState}</span></div>
    {item.isCoproductionOpportunity ? <p className="inline-flex w-fit rounded-full bg-panel-warm px-3 py-1 text-xs font-semibold text-muted ring-1 ring-hairline">Potential co-production opportunity</p> : null}
    <div className="grid gap-1 border-y border-hairline">
      <CompactField label="Detail Title"><Field label="Detail Title" value={item.title} onChange={(value) => onChange("title", value)} disabled={isDemo} hideLabel /></CompactField>
      <CompactField label="Proposed Yearly Rate"><CurrencyField label="Proposed Yearly Rate" value={item.proposedRateCents} onChange={(value) => onChange("proposedRateCents", value)} disabled={isDemo} hideLabel /></CompactField>
      <CompactField label="Provider">
        <ProviderCombobox
          id={`review-provider-${item.id}`}
          value={item.provider ?? ""}
          options={providerOptions}
          disabled={isDemo}
          onChange={(value) => onChange("provider", value)}
          hideLabel
          inputClassName={compactControlClass}
        />
      </CompactField>
      <CompactField label="Status"><ColoredSelect label="Review Status" name="detailReviewStatus" value={item.reviewStatus} options={REVIEW_STATUSES} onChange={(event) => onChange("reviewStatus", event.target.value)} disabled={isDemo} compact /></CompactField>
      <CompactField label="Opportunity"><OpportunityField checked={Boolean(item.isCoproductionOpportunity)} disabled={isDemo} onChange={(value) => onChange("isCoproductionOpportunity", value)} /></CompactField>
      <CompactField label="Budget"><SelectField label="Budget Source" value={item.budgetSource ?? "misc_licensing"} options={budgetSourceOptions} onChange={(value) => onChange("budgetSource", value)} disabled={isDemo} hideLabel /></CompactField>
      <CompactField label="Metadata">
        <div className="grid gap-2 sm:grid-cols-2">
          <ColoredSelect label="Genre" name="detailGenre" value={item.genre ?? ""} options={CONTENT_GENRES} onChange={(event) => onChange("genre", event.target.value)} disabled={isDemo} compact />
          <ColoredSelect label="Format" name="detailFormat" value={item.format ?? ""} options={CONTENT_FORMATS} onChange={(event) => onChange("format", event.target.value)} disabled={isDemo} compact />
        </div>
      </CompactField>
      <CompactField label="Link"><LinkField label="Review Link" value={item.reviewLink ?? ""} onChange={(value) => onChange("reviewLink", value)} disabled={isDemo} hideLabel /></CompactField>
    </div>
    <div className="grid gap-4 md:grid-cols-2">
      <div className="md:col-span-2"><RichTextNotes label="Notes" value={combineReviewNotes(item)} onChange={(value) => { onChange("notes", value); onChange("comparableContent", ""); }} disabled={isDemo} /></div>
    </div>
    <ContentReviewUpdateLog
      fiscalYearId={fiscalYearId}
      itemId={item.id}
      updates={updates}
      isDemo={isDemo}
      onAdded={onUpdateAdded}
      onDeleted={onUpdateDeleted}
    />
    <div className="flex flex-wrap items-center justify-between gap-3">
      <div className="flex flex-wrap gap-2">
        {item.id !== "draft" ? <form action={deleteContentReviewItem} onSubmit={(event) => { if (!window.confirm(`Delete ${item.title}? This cannot be undone.`)) event.preventDefault(); }}><input type="hidden" name="fiscalYearId" value={fiscalYearId} /><input type="hidden" name="itemId" value={item.id} /><SoftButton type="submit" variant="ghost" className="text-danger" disabled={isDemo}><Trash2 className="h-4 w-4" />Delete Review</SoftButton></form> : null}
        {item.id !== "draft" && item.reviewStatus === "approved" ? <SoftButton type="button" variant="ghost" disabled={isDemo || isPipelinePending} onClick={sendToRoadmap}><ArrowRight className="h-4 w-4" />{isPipelinePending ? "Sending..." : "Send to Roadmap"}</SoftButton> : null}
      </div>
      <SoftButton type="button" variant="primary" onClick={onSave} disabled={isDemo || isPending || !item.title.trim()}><Save className="h-4 w-4" />Save Changes</SoftButton>
    </div>
    {pipelineMessage ? <p role="status" className="rounded-md bg-deep-teal-soft px-4 py-3 text-sm font-bold text-deep-teal">{pipelineMessage}</p> : null}
  </div>;
}

function CompactField({ label, children }: { label: string; children: ReactNode }) {
  return <div className="grid gap-3 border-t border-hairline py-2 first:border-t-0 sm:grid-cols-[7.5rem_minmax(0,1fr)] sm:items-center">
    <span className="text-[11px] font-semibold uppercase tracking-wide text-muted">{label}</span>
    <div className="min-w-0">{children}</div>
  </div>;
}

function Field({ label, value, onChange, disabled, hideLabel, type = "text" }: { label: string; value: string; onChange: (value: string) => void; disabled?: boolean; hideLabel?: boolean; type?: string }) {
  const input = <input aria-label={label} type={type} value={value} onChange={(event) => onChange(event.target.value)} disabled={disabled} className={hideLabel ? compactControlClass : "min-h-11 rounded-md border-0 bg-panel-warm px-3 text-sm font-medium normal-case tracking-normal"} />;

  if (hideLabel) return input;

  return <label className="grid gap-2 text-xs font-semibold uppercase tracking-wide">{label}{input}</label>;
}

function LinkField({ label, value, onChange, disabled, hideLabel }: { label: string; value: string; onChange: (value: string) => void; disabled?: boolean; hideLabel?: boolean }) {
  const trimmedValue = value.trim();
  const canOpen = /^https?:\/\//.test(trimmedValue);

  const field = <div className="flex flex-wrap gap-2">
    <input aria-label={label} type="url" value={value} onChange={(event) => onChange(event.target.value)} disabled={disabled} className={cn("min-w-0 flex-1", hideLabel ? compactControlClass : "min-h-11 rounded-md border-0 bg-panel-warm px-3 text-sm font-medium normal-case tracking-normal")} />
    {canOpen ? <a href={trimmedValue} target="_blank" rel="noreferrer" className={cn("inline-flex items-center justify-center gap-2 rounded-md bg-formed-blue-soft text-xs font-semibold uppercase tracking-wide text-formed-blue ring-1 ring-formed-blue-border hover:bg-formed-blue-soft", hideLabel ? "min-h-9 px-3" : "min-h-11 px-4")}><ExternalLink className="h-4 w-4" aria-hidden="true" />Open</a> : null}
  </div>;

  if (hideLabel) return field;

  return <label className="grid gap-2 text-xs font-semibold uppercase tracking-wide">{label}{field}</label>;
}

function SelectField({ label, value, options, onChange, disabled, hideLabel }: { label: string; value: string; options: readonly { label: string; value: string }[]; onChange: (value: string) => void; disabled?: boolean; hideLabel?: boolean }) {
  const select = <select aria-label={label} value={value} onChange={(event) => onChange(event.target.value)} disabled={disabled} className={hideLabel ? compactControlClass : "min-h-11 rounded-md border-0 bg-panel-warm px-3 text-sm font-medium normal-case tracking-normal"}>{options.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}</select>;

  if (hideLabel) return select;

  return <label className="grid gap-2 text-xs font-semibold uppercase tracking-wide">{label}{select}</label>;
}

function CurrencyField({ label, value, onChange, disabled, hideLabel }: { label: string; value: number | null; onChange: (value: number | null) => void; disabled?: boolean; hideLabel?: boolean }) {
  const input = <CurrencyInput ariaLabel={label} value={value} onChange={onChange} disabled={disabled} className={hideLabel ? compactControlClass : "min-h-11 rounded-md border-0 bg-panel-warm px-3 text-sm font-medium normal-case tracking-normal"} />;

  if (hideLabel) return input;

  return <label className="grid gap-2 text-xs font-semibold uppercase tracking-wide">{label}{input}</label>;
}

function OpportunityField({ checked, disabled, onChange }: { checked: boolean; disabled?: boolean; onChange: (value: boolean) => void }) {
  return <label className="inline-flex min-h-9 w-fit items-center gap-2 rounded-full bg-panel-warm px-3 text-xs font-semibold text-muted ring-1 ring-hairline">
    <input
      aria-label="Potential co-production opportunity"
      type="checkbox"
      checked={checked}
      disabled={disabled}
      onChange={(event) => onChange(event.target.checked)}
      className="h-4 w-4 accent-slate-700"
    />
    Potential co-production
  </label>;
}

function CurrencyInput({ ariaLabel, value, onChange, disabled, onClick, onFocus, className }: { ariaLabel: string; value: number | null; onChange: (value: number | null) => void; disabled?: boolean; onClick?: React.MouseEventHandler<HTMLInputElement>; onFocus?: React.FocusEventHandler<HTMLInputElement>; className: string }) {
  const [isEditing, setIsEditing] = useState(false);
  const [draftValue, setDraftValue] = useState("");

  return <input
    aria-label={ariaLabel}
    inputMode="decimal"
    value={isEditing ? draftValue : formatOptionalCurrency(value)}
    disabled={disabled}
    onClick={onClick}
    onFocus={(event) => {
      onFocus?.(event);
      setDraftValue(value === null ? "" : String(value / 100));
      setIsEditing(true);
    }}
    onBlur={() => setIsEditing(false)}
    onChange={(event) => {
      setDraftValue(event.target.value);
      onChange(dollarsToOptionalCents(event.target.value));
    }}
    className={className}
  />;
}

/**
 * Notes and the legacy Comparable Content column share one visible editor. Notes may still be
 * plain text from before rich text landed, so both halves are normalised to markup here.
 */
function combineReviewNotes(item: ContentReviewItem) {
  const notes = item.notes?.trim() ?? "";
  const comparable = item.comparableContent?.trim() ?? "";
  const notesHtml = notes && !isLikelyNotesHtml(notes) ? plainTextToNotesHtml(notes) : notes;
  const comparableHtml = comparable ? plainTextToNotesHtml(comparable) : "";
  return [notesHtml, comparableHtml].filter(Boolean).join("");
}
