"use client";

import { ArrowRight, CheckCircle2, ExternalLink, Handshake, Plus, Radar, Save, Search, Trash2, X, XCircle } from "lucide-react";
import { type KeyboardEvent, type MouseEvent, type ReactNode, useEffect, useMemo, useRef, useState, useTransition } from "react";
import { createPortal } from "react-dom";
import { SoftButton } from "@/components/ui/soft-button";
import { cn } from "@/components/ui/soft-surface";
import { budgetSourceOptions } from "@/features/budget/budget-source";
import { addContentReviewItem, deleteContentReviewItem, sendReviewToRoadmap, updateContentReviewItem } from "../planning-actions";
import { CONTENT_FORMATS, CONTENT_GENRES, REVIEW_STATUSES, TONE_CLASSES } from "../planning-constants";
import { dollarsToOptionalCents, formatOptionalCurrency } from "../planning-model";
import type { ContentReviewItem, ReviewStatus } from "../planning-types";
import { isLikelyNotesHtml, plainTextToNotesHtml } from "../rich-text";
import { ColoredSelect } from "./colored-select";
import { ProviderCombobox } from "./provider-combobox";
import { RichTextNotes } from "./rich-text-notes";

type ContentReviewDashboardProps = { fiscalYearId: string; items: ContentReviewItem[]; providerOptions?: string[]; isDemo?: boolean };
type SaveState = "idle" | "unsaved" | "saving" | "saved" | "error";
type QueueFilters = { search: string; status: ReviewStatus | "all"; provider: string };

const emptyQueueFilters: QueueFilters = { search: "", status: "all", provider: "all" };

// Approved and rejected keep their original test ids so the completed-review selectors stay stable.
const QUEUE_GROUP_ORDER: ReviewStatus[] = ["not_started", "on_the_radar", "in_progress", "blocked", "approved", "rejected"];

const QUEUE_GROUP_TEST_IDS: Record<ReviewStatus, string> = {
  not_started: "content-review-group-not-started",
  on_the_radar: "content-review-group-on-the-radar",
  in_progress: "content-review-group-in-progress",
  blocked: "content-review-group-blocked",
  approved: "content-review-approved-content",
  rejected: "content-review-rejected-content"
};

const decisionQueueGridClass = "md:grid-cols-[4.5rem_1.3fr_1fr_0.9fr_1fr]";
const compactControlClass = "min-h-9 w-full rounded-md border-0 bg-transparent px-0 text-sm font-bold normal-case tracking-normal outline-none focus:bg-gray-50 focus:px-2 focus:ring-2 focus:ring-blue-200";

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
  isCoproductionOpportunity: false
});

export function ContentReviewDashboard({ fiscalYearId, items, providerOptions = [], isDemo }: ContentReviewDashboardProps) {
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

  function selectItem(id: string) {
    if (id !== selectedId) setSaveState("idle");
    setSelectedId(id);
  }

  function selectItemFromModal(id: string) {
    shouldFocusEditorRef.current = true;
    selectItem(id);
    setOpenStatusModal(null);
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
    startTransition(async () => {
      try {
        const formData = itemFormData(item);
        if (item.id === "draft") {
          const savedItem = await addContentReviewItem(formData);
          setRecords((current) => [savedItem, ...current]);
          setDraft(null);
          setSelectedId(savedItem.id);
        } else {
          await updateContentReviewItem(formData);
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
  const groupedQueue = QUEUE_GROUP_ORDER.map((value) => {
    const status = REVIEW_STATUSES.find((option) => option.value === value) ?? REVIEW_STATUSES[0];
    return { status, items: filteredQueue.filter((item) => item.reviewStatus === value) };
  });
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

  useEffect(() => {
    if (!shouldFocusEditorRef.current || openStatusModal) return;
    shouldFocusEditorRef.current = false;
    editorSectionRef.current?.scrollIntoView?.({ behavior: "smooth", block: "start" });
    editorSectionRef.current?.focus({ preventScroll: true });
  }, [openStatusModal, selectedId]);

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
          <section data-testid="content-review-decision-queue-block" className="rounded-lg bg-gray-100 p-4 md:p-6">
            {radarContent.length > 0 ? (
              <div className="mb-4 flex flex-col gap-3 rounded-lg border border-amber-200 bg-gradient-to-r from-amber-50 to-cyan-50 p-3 shadow-[0_8px_18px_rgba(245,158,11,0.12)] sm:flex-row sm:items-center sm:justify-between">
                <div className="flex items-start gap-3">
                  <span className="grid h-9 w-9 shrink-0 place-items-center rounded-md bg-amber-100 text-amber-800">
                    <Radar className="h-4 w-4" aria-hidden="true" />
                  </span>
                  <p className="text-sm font-extrabold leading-snug text-amber-900">
                    {radarContent.length} On the Radar {radarContent.length === 1 ? "piece is" : "pieces are"} waiting for follow-up. Open the list and decide who gets a next touch.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setOpenStatusModal("radar")}
                  className="shrink-0 rounded-md bg-amber-400 px-3 py-2 text-sm font-extrabold text-gray-950 transition hover:bg-amber-300 focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  View Items
                </button>
              </div>
            ) : null}
            <div className="mb-4 flex items-start justify-between gap-4">
              <div><h2 className="font-display text-2xl font-extrabold">Decision Queue</h2><p className="text-sm text-muted">Select a title to edit every review detail.</p></div>
              <SoftButton type="button" variant="primary" onClick={addDraft}><Plus className="h-4 w-4" />Add Content</SoftButton>
            </div>
            <QueueFilterBar
              filters={filters}
              providerOptions={providerFilterOptions}
              matchCount={filteredQueue.length}
              totalCount={queue.length}
              isFiltering={isFiltering}
              onChange={setFilters}
              onClear={() => setFilters(emptyQueueFilters)}
            />
            <div className={cn("mb-2 hidden gap-2 px-3 text-center text-[10px] font-extrabold uppercase tracking-wide text-muted md:grid", decisionQueueGridClass)}>
              <span aria-hidden="true" /><span>Title</span><span>Review Status</span><span>Yearly Rate</span><span>Provider</span>
            </div>
            <div data-testid="content-review-active-queue" className="grid gap-4">
              {queue.length === 0 ? <p className="rounded-lg bg-white p-5 font-bold text-muted">Add content to start the decision queue.</p> : null}
              {queue.length > 0 && filteredQueue.length === 0 ? <p data-testid="content-review-no-matches" className="rounded-lg bg-white p-5 font-bold text-muted">No reviews match these filters.</p> : null}
              {groupedQueue.map(({ status, items: groupItems }) => {
                if (isFiltering && groupItems.length === 0) return null;
                if (queue.length === 0) return null;
                return <ContentReviewGroup
                  key={status.value}
                  title={status.label}
                  count={groupItems.length}
                  tone={status.tone}
                  testId={QUEUE_GROUP_TEST_IDS[status.value]}
                  open={isFiltering || (groupItems.length > 0 && !isFinalReviewStatus(status.value))}
                >
                  {groupItems.map((item) => <ReviewSummaryRow key={item.id} item={item} active={selectedId === item.id} isDemo={isDemo} onSelect={selectItem} onChange={changeItem} />)}
                </ContentReviewGroup>;
              })}
            </div>
          </section>
        </div>

        <section ref={editorSectionRef} tabIndex={-1} className="h-fit rounded-lg bg-white p-5 shadow-[0_12px_35px_rgba(15,23,42,0.12)] outline-none focus:ring-2 focus:ring-blue-300 md:p-7">
          {selected ? <ReviewEditor item={selected} providerOptions={providerOptions} isDemo={isDemo} isPending={isPending} saveState={isPending ? "saving" : saveState} onChange={(field, value) => changeItem(selected.id, field, value)} onSave={() => save(selected)} fiscalYearId={fiscalYearId} /> : <div className="grid min-h-64 place-items-center text-center text-muted"><div><h2 className="text-xl font-extrabold">Select a review</h2><p>Choose a queue item or add new content.</p></div></div>}
        </section>
      </div>

      {modalConfig ? <ReviewStatusModal
        config={modalConfig}
        items={modalItems}
        selectedId={selectedId}
        isDemo={isDemo}
        onClose={() => setOpenStatusModal(null)}
        onSelect={selectItem}
        onOpenDetail={selectItemFromModal}
        onChange={changeItem}
      /> : null}
    </div>
  );
}

type StatusCardTone = "neutral" | "active" | "coproduction" | "radar" | "approved" | "rejected";
type ReviewStatusModalKey = "active" | "coproduction" | "radar" | "approved" | "rejected";

const STATUS_CARD_TONES: Record<StatusCardTone, { card: string; label: string; helper: string; icon: string; rail: string; value: string; Icon: typeof CheckCircle2 }> = {
  neutral: { card: "bg-white text-foreground ring-gray-200", label: "text-muted", helper: "text-muted", icon: "bg-gray-100 text-muted", rail: "bg-gray-300", value: "text-foreground", Icon: CheckCircle2 },
  active: { card: "bg-orange-50 text-orange-950 ring-orange-200", label: "text-orange-800", helper: "text-orange-900", icon: "bg-orange-100 text-orange-800", rail: "bg-orange-500", value: "text-orange-950", Icon: ArrowRight },
  coproduction: { card: "bg-sky-50 text-slate-950 ring-sky-200", label: "text-sky-800", helper: "text-slate-700", icon: "bg-white text-sky-800 ring-1 ring-sky-200", rail: "bg-sky-500", value: "text-slate-950", Icon: Handshake },
  radar: { card: "bg-amber-50 text-amber-950 ring-amber-200", label: "text-amber-800", helper: "text-amber-900", icon: "bg-amber-100 text-amber-800", rail: "bg-amber-400", value: "text-amber-950", Icon: Radar },
  approved: { card: "bg-emerald-50 text-emerald-950 ring-emerald-200", label: "text-emerald-800", helper: "text-emerald-900", icon: "bg-emerald-100 text-emerald-800", rail: "bg-emerald-500", value: "text-emerald-950", Icon: CheckCircle2 },
  rejected: { card: "bg-rose-50 text-rose-950 ring-rose-200", label: "text-rose-800", helper: "text-rose-900", icon: "bg-white text-rose-800 ring-1 ring-rose-200", rail: "bg-rose-400", value: "text-rose-950", Icon: XCircle }
};

function StatusCard({ label, value, helper, tone = "neutral", onClick }: { label: string; value: number; helper: string; tone?: StatusCardTone; onClick?: () => void }) {
  const toneClasses = STATUS_CARD_TONES[tone];
  const Icon = toneClasses.Icon;
  const cardClass = cn(
    "group relative min-h-28 overflow-hidden rounded-lg p-4 text-left shadow-sm ring-1 transition",
    toneClasses.card,
    onClick && "cursor-pointer hover:-translate-y-0.5 hover:shadow-md focus:outline-none focus:ring-2 focus:ring-blue-500"
  );
  const content = <>
    <span aria-hidden="true" className={cn("absolute inset-x-0 bottom-0 h-1", toneClasses.rail)} />
    <span className="flex items-start justify-between gap-3">
      <span className={cn("text-xs font-extrabold uppercase tracking-wide", toneClasses.label)}>{label}</span>
      <span className={cn("grid h-9 w-9 shrink-0 place-items-center rounded-md transition group-hover:scale-105", toneClasses.icon)}>
        <Icon className="h-4 w-4" aria-hidden="true" />
      </span>
    </span>
    <span className={cn("mt-1 block font-display text-3xl font-extrabold", toneClasses.value)}>{value}</span>
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

function ReviewStatusModal({ config, items, selectedId, isDemo, onClose, onSelect, onOpenDetail, onChange }: { config: (typeof REVIEW_STATUS_MODAL_CONFIGS)[ReviewStatusModalKey]; items: ContentReviewItem[]; selectedId: string; isDemo?: boolean; onClose: () => void; onSelect: (id: string) => void; onOpenDetail: (id: string) => void; onChange: (id: string, field: keyof ContentReviewItem, value: string | number | boolean | null) => void }) {
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
    className="fixed left-1/2 top-1/2 z-50 block w-[calc(100%-2rem)] max-w-4xl -translate-x-1/2 -translate-y-1/2 rounded-xl bg-white p-0 text-foreground shadow-2xl backdrop:bg-gray-950/60"
  >
    <div className="flex max-h-[calc(100vh-2rem)] flex-col">
      <header className={cn("flex shrink-0 items-start justify-between gap-4 border-b p-5 sm:p-7", toneClasses.card)}>
        <div>
          <p className={cn("text-xs font-extrabold uppercase tracking-wide", toneClasses.label)}>{items.length} {config.eyebrow}{items.length === 1 ? "" : "s"}</p>
          <h2 id={titleId} className="font-display text-3xl font-extrabold">{config.title}</h2>
          <p className={cn("mt-1 text-sm font-medium", toneClasses.helper)}>{config.description}</p>
        </div>
        <button type="button" onClick={closeDialog} aria-label={`Close ${config.title} reviews`} className="rounded-md bg-white p-3 text-foreground shadow-sm ring-1 ring-gray-200 transition-colors hover:bg-gray-100">
          <X className="h-5 w-5" aria-hidden="true" />
        </button>
      </header>
      <div data-testid={config.testId} className="grid min-h-0 gap-2 overflow-y-auto p-5 sm:p-7">
        {items.length ? items.map((item) => <ReviewSummaryRow key={item.id} item={item} active={selectedId === item.id} isDemo={isDemo} onSelect={onSelect} onOpenDetail={onOpenDetail} onChange={onChange} />) : <p className="rounded-lg bg-gray-100 p-5 font-bold text-muted">{config.empty}</p>}
      </div>
      <footer className="flex shrink-0 justify-end border-t border-gray-200 p-4 sm:px-7">
        <button type="button" onClick={closeDialog} className="min-h-12 rounded-md px-5 py-3 text-sm font-extrabold uppercase tracking-wide text-muted hover:bg-gray-100">Close</button>
      </footer>
    </div>
  </dialog>, document.body);
}

function matchesQueueFilters(item: ContentReviewItem, filters: QueueFilters) {
  // An unsaved draft always stays visible so it cannot disappear mid-edit behind a filter.
  if (item.id === "draft") return true;

  const search = filters.search.trim().toLowerCase();
  if (search && !(item.title ?? "").toLowerCase().includes(search)) return false;
  if (filters.status !== "all" && item.reviewStatus !== filters.status) return false;
  if (filters.provider !== "all" && (item.provider ?? "").trim() !== filters.provider) return false;
  return true;
}

const filterControlClass = "min-h-10 w-full rounded-md border-0 bg-white px-3 text-sm font-bold text-foreground shadow-sm ring-1 ring-gray-200 outline-none focus:ring-2 focus:ring-blue-400";

function QueueFilterBar({ filters, providerOptions, matchCount, totalCount, isFiltering, onChange, onClear }: { filters: QueueFilters; providerOptions: string[]; matchCount: number; totalCount: number; isFiltering: boolean; onChange: (filters: QueueFilters) => void; onClear: () => void }) {
  return <div data-testid="content-review-queue-filters" className="mb-4 grid gap-2 rounded-lg bg-white/70 p-3 ring-1 ring-gray-200">
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
      <p aria-live="polite" className="text-xs font-extrabold uppercase tracking-wide text-muted">
        {isFiltering ? `Showing ${matchCount} of ${totalCount}` : `${totalCount} ${totalCount === 1 ? "review" : "reviews"}`}
      </p>
      {isFiltering ? <button type="button" onClick={onClear} className="inline-flex min-h-8 items-center gap-1 rounded-md bg-gray-100 px-3 text-xs font-extrabold uppercase tracking-wide text-muted transition hover:bg-gray-200 hover:text-foreground focus:outline-none focus:ring-2 focus:ring-blue-400">
        <X className="h-3.5 w-3.5" aria-hidden="true" />Clear filters
      </button> : null}
    </div>
  </div>;
}

function isFinalReviewStatus(status: ReviewStatus) {
  return status === "approved" || status === "rejected";
}

function isDecisionQueueStatus(status: ReviewStatus) {
  return !isFinalReviewStatus(status) && status !== "on_the_radar";
}

function ReviewSummaryRow({ item, active, isDemo, onSelect, onOpenDetail, onChange }: { item: ContentReviewItem; active: boolean; isDemo?: boolean; onSelect: (id: string) => void; onOpenDetail?: (id: string) => void; onChange: (id: string, field: keyof ContentReviewItem, value: string | number | boolean | null) => void }) {
  const status = REVIEW_STATUSES.find((option) => option.value === item.reviewStatus) ?? REVIEW_STATUSES[0];
  return (
    <div aria-current={active ? "true" : undefined} className={cn("relative grid overflow-hidden gap-2 rounded-lg border-l-4 border-y border-r border-y-gray-200 border-r-gray-200 bg-white p-4 shadow-sm transition", decisionQueueGridClass, TONE_CLASSES[status.tone].accent, active && "ring-2 ring-blue-500")}>
      {item.isCoproductionOpportunity ? <span aria-label="Potential co-production opportunity" title="Potential co-production opportunity" className="absolute right-3 top-0 z-10 rounded-b-md bg-slate-700 px-2 py-1 text-[9px] font-extrabold uppercase leading-none tracking-wide text-white shadow-sm">Co-prod</span> : null}
      <button
        type="button"
        aria-label={`Select ${item.title || "Untitled review"}`}
        onClick={() => (onOpenDetail ?? onSelect)(item.id)}
        className={cn(
          "min-h-10 rounded-md px-3 text-left text-xs font-extrabold uppercase tracking-wide transition",
          active ? "bg-blue-600 text-white" : "bg-gray-900 text-white hover:bg-gray-800"
        )}
      >
        Select
      </button>
      <input aria-label="Summary Title" value={item.title} placeholder="Untitled review" disabled={isDemo} onFocus={() => onSelect(item.id)} onChange={(event) => onChange(item.id, "title", event.target.value)} className="min-h-10 min-w-0 w-full rounded-md border-0 bg-gray-50 px-3 text-sm font-extrabold" />
      <select aria-label="Summary Review Status" value={item.reviewStatus} disabled={isDemo} onFocus={() => onSelect(item.id)} onChange={(event) => { onChange(item.id, "reviewStatus", event.target.value as ReviewStatus); }} className={cn("min-h-10 min-w-0 w-full rounded-md border-0 px-2 text-xs font-bold", TONE_CLASSES[status.tone].field)}>{REVIEW_STATUSES.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}</select>
      <CurrencyInput ariaLabel="Summary Proposed Yearly Rate" value={item.proposedRateCents} disabled={isDemo} onFocus={() => onSelect(item.id)} onChange={(value) => onChange(item.id, "proposedRateCents", value)} className="min-h-10 min-w-0 w-full rounded-md border-0 bg-gray-50 px-3 text-sm" />
      <input aria-label="Summary Provider" value={item.provider ?? ""} disabled={isDemo} onFocus={() => onSelect(item.id)} onChange={(event) => onChange(item.id, "provider", event.target.value)} className="min-h-10 min-w-0 w-full rounded-md border-0 bg-blue-50 px-3 text-sm font-bold text-blue-800" />
    </div>
  );
}

function ContentReviewGroup({ title, count, testId, tone, open, children }: { title: string; count: number; testId: string; tone?: keyof typeof TONE_CLASSES; open?: boolean; children: ReactNode }) {
  return <details data-testid={testId} open={open} className={cn("rounded-md bg-gray-100 py-3", tone && cn("border-l-4", TONE_CLASSES[tone].accent))}>
    <summary className="flex cursor-pointer list-none items-center justify-between gap-3 px-3 pb-1 text-sm font-extrabold">
      <span>{title}</span>
      <span className="rounded-full bg-gray-100 px-2 py-1 text-[10px] uppercase tracking-wide text-muted">{count}</span>
    </summary>
    <div className="mt-2 grid gap-3 px-3">{count ? children : <p className="rounded-md bg-white p-3 text-sm font-bold text-muted">No items.</p>}</div>
  </details>;
}

function ReviewEditor({ item, providerOptions, isDemo, isPending, saveState, onChange, onSave, fiscalYearId }: { item: ContentReviewItem; providerOptions: string[]; isDemo?: boolean; isPending: boolean; saveState: SaveState; onChange: (field: keyof ContentReviewItem, value: string | number | boolean | null) => void; onSave: () => void; fiscalYearId: string }) {
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
    <div className="flex items-start justify-between gap-4"><div><p className="text-xs font-extrabold uppercase tracking-wide text-blue-600">Selected Review</p><h2 className="font-display text-2xl font-extrabold">{item.id === "draft" ? "New Content Review" : item.title}</h2></div><span aria-live="polite" className="text-xs font-extrabold uppercase text-muted">{saveState === "idle" ? "" : saveState}</span></div>
    {item.isCoproductionOpportunity ? <p className="inline-flex w-fit rounded-full bg-slate-100 px-3 py-1 text-xs font-extrabold text-slate-700 ring-1 ring-slate-200">Potential co-production opportunity</p> : null}
    <div className="grid gap-1 border-y border-gray-200">
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
    <div className="flex flex-wrap items-center justify-between gap-3">
      <div className="flex flex-wrap gap-2">
        {item.id !== "draft" ? <form action={deleteContentReviewItem} onSubmit={(event) => { if (!window.confirm(`Delete ${item.title}? This cannot be undone.`)) event.preventDefault(); }}><input type="hidden" name="fiscalYearId" value={fiscalYearId} /><input type="hidden" name="itemId" value={item.id} /><SoftButton type="submit" variant="ghost" className="text-red-700" disabled={isDemo}><Trash2 className="h-4 w-4" />Delete Review</SoftButton></form> : null}
        {item.id !== "draft" && item.reviewStatus === "approved" ? <SoftButton type="button" variant="ghost" disabled={isDemo || isPipelinePending} onClick={sendToRoadmap}><ArrowRight className="h-4 w-4" />{isPipelinePending ? "Sending..." : "Send to Roadmap"}</SoftButton> : null}
      </div>
      <SoftButton type="button" variant="primary" onClick={onSave} disabled={isDemo || isPending || !item.title.trim()}><Save className="h-4 w-4" />Save Changes</SoftButton>
    </div>
    {pipelineMessage ? <p role="status" className="rounded-md bg-green-50 px-4 py-3 text-sm font-bold text-green-800">{pipelineMessage}</p> : null}
  </div>;
}

function CompactField({ label, children }: { label: string; children: ReactNode }) {
  return <div className="grid gap-3 border-t border-gray-100 py-2 first:border-t-0 sm:grid-cols-[7.5rem_minmax(0,1fr)] sm:items-center">
    <span className="text-[11px] font-extrabold uppercase tracking-wide text-muted">{label}</span>
    <div className="min-w-0">{children}</div>
  </div>;
}

function Field({ label, value, onChange, disabled, hideLabel, type = "text" }: { label: string; value: string; onChange: (value: string) => void; disabled?: boolean; hideLabel?: boolean; type?: string }) {
  const input = <input aria-label={label} type={type} value={value} onChange={(event) => onChange(event.target.value)} disabled={disabled} className={hideLabel ? compactControlClass : "min-h-11 rounded-md border-0 bg-gray-100 px-3 text-sm font-medium normal-case tracking-normal"} />;

  if (hideLabel) return input;

  return <label className="grid gap-2 text-xs font-extrabold uppercase tracking-wide">{label}{input}</label>;
}

function LinkField({ label, value, onChange, disabled, hideLabel }: { label: string; value: string; onChange: (value: string) => void; disabled?: boolean; hideLabel?: boolean }) {
  const trimmedValue = value.trim();
  const canOpen = /^https?:\/\//.test(trimmedValue);

  const field = <div className="flex flex-wrap gap-2">
    <input aria-label={label} type="url" value={value} onChange={(event) => onChange(event.target.value)} disabled={disabled} className={cn("min-w-0 flex-1", hideLabel ? compactControlClass : "min-h-11 rounded-md border-0 bg-gray-100 px-3 text-sm font-medium normal-case tracking-normal")} />
    {canOpen ? <a href={trimmedValue} target="_blank" rel="noreferrer" className={cn("inline-flex items-center justify-center gap-2 rounded-md bg-blue-50 text-xs font-extrabold uppercase tracking-wide text-blue-700 ring-1 ring-blue-100 hover:bg-blue-100", hideLabel ? "min-h-9 px-3" : "min-h-11 px-4")}><ExternalLink className="h-4 w-4" aria-hidden="true" />Open</a> : null}
  </div>;

  if (hideLabel) return field;

  return <label className="grid gap-2 text-xs font-extrabold uppercase tracking-wide">{label}{field}</label>;
}

function SelectField({ label, value, options, onChange, disabled, hideLabel }: { label: string; value: string; options: readonly { label: string; value: string }[]; onChange: (value: string) => void; disabled?: boolean; hideLabel?: boolean }) {
  const select = <select aria-label={label} value={value} onChange={(event) => onChange(event.target.value)} disabled={disabled} className={hideLabel ? compactControlClass : "min-h-11 rounded-md border-0 bg-gray-100 px-3 text-sm font-medium normal-case tracking-normal"}>{options.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}</select>;

  if (hideLabel) return select;

  return <label className="grid gap-2 text-xs font-extrabold uppercase tracking-wide">{label}{select}</label>;
}

function CurrencyField({ label, value, onChange, disabled, hideLabel }: { label: string; value: number | null; onChange: (value: number | null) => void; disabled?: boolean; hideLabel?: boolean }) {
  const input = <CurrencyInput ariaLabel={label} value={value} onChange={onChange} disabled={disabled} className={hideLabel ? compactControlClass : "min-h-11 rounded-md border-0 bg-gray-100 px-3 text-sm font-medium normal-case tracking-normal"} />;

  if (hideLabel) return input;

  return <label className="grid gap-2 text-xs font-extrabold uppercase tracking-wide">{label}{input}</label>;
}

function OpportunityField({ checked, disabled, onChange }: { checked: boolean; disabled?: boolean; onChange: (value: boolean) => void }) {
  return <label className="inline-flex min-h-9 w-fit items-center gap-2 rounded-full bg-slate-100 px-3 text-xs font-extrabold text-slate-700 ring-1 ring-slate-200">
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
