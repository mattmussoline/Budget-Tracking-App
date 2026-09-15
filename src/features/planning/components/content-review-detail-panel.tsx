"use client";

import { ExternalLink, X } from "lucide-react";
import { useCallback, useEffect, useRef, useState, useTransition } from "react";
import { cn } from "@/components/ui/soft-surface";
import { isPriorityListFull } from "../content-review-queue";
import { sendReviewToRoadmap } from "../planning-actions";
import { CONTENT_FORMATS, CONTENT_GENRES, REVIEW_STATUSES, TONE_CLASSES } from "../planning-constants";
import { dollarsToOptionalCents, formatOptionalCurrency } from "../planning-model";
import type { ContentReviewItem, ContentReviewUpdate, ReviewStatus } from "../planning-types";
import { notesHtmlToPlainText } from "../rich-text";
import { ColoredSelect } from "./colored-select";
import { ContentReviewUpdateLog } from "./content-review-update-log";
import { ProviderCombobox } from "./provider-combobox";

/** The panel can be widened by dragging its left edge; the chosen width is remembered per browser. */
const PANEL_MIN_WIDTH = 320;
const PANEL_MAX_WIDTH = 860;
const PANEL_DEFAULT_WIDTH = 352;
const PANEL_WIDTH_STORAGE_KEY = "content-review:detail-width";

/** The rail and the queue keep this much room between them, so the panel can never swallow the page. */
const RESERVED_WIDTH = 234 + 520;

function clampPanelWidth(value: number) {
  if (!Number.isFinite(value)) return PANEL_DEFAULT_WIDTH;
  const viewportCeiling = typeof window === "undefined" ? PANEL_MAX_WIDTH : window.innerWidth - RESERVED_WIDTH;
  const ceiling = Math.max(PANEL_MIN_WIDTH, Math.min(PANEL_MAX_WIDTH, viewportCeiling));
  return Math.min(ceiling, Math.max(PANEL_MIN_WIDTH, Math.round(value)));
}

/** Inline fields sit on the panel background until hovered or focused, so the panel still reads as a summary. */
const INLINE_FIELD_CLASS =
  "min-h-9 w-full border-0 bg-transparent px-1.5 -mx-1.5 text-[13px] font-bold normal-case tracking-normal outline-none transition placeholder:font-normal placeholder:text-faint hover:bg-panel focus:bg-panel focus:ring-2 focus:ring-formed-blue disabled:cursor-not-allowed disabled:hover:bg-transparent";

type ContentReviewDetailPanelProps = {
  item: ContentReviewItem;
  allItems: ContentReviewItem[];
  fiscalYearId: string;
  providerOptions?: string[];
  isDemo?: boolean;
  updates: ContentReviewUpdate[];
  onClose: () => void;
  onStatusChange: (status: ReviewStatus) => void;
  onFieldCommit: (patch: Partial<ContentReviewItem>) => void;
  onTogglePriority: () => void;
  onDelete: () => void;
  onUpdateAdded: (update: ContentReviewUpdate) => void;
  onUpdateDeleted: (updateId: string) => void;
};

export function ContentReviewDetailPanel({
  item,
  allItems,
  fiscalYearId,
  providerOptions = [],
  isDemo,
  updates,
  onClose,
  onStatusChange,
  onFieldCommit,
  onTogglePriority,
  onDelete,
  onUpdateAdded,
  onUpdateDeleted
}: ContentReviewDetailPanelProps) {
  const status = REVIEW_STATUSES.find((option) => option.value === item.reviewStatus) ?? REVIEW_STATUSES[0];
  const [titleDraft, setTitleDraft] = useState(item.title);
  const [rateDraft, setRateDraft] = useState(formatOptionalCurrency(item.proposedRateCents));
  const [providerDraft, setProviderDraft] = useState(item.provider ?? "");
  const [minutesDraft, setMinutesDraft] = useState(item.minutes != null ? String(item.minutes) : "");
  const [linkDraft, setLinkDraft] = useState(item.reviewLink ?? "");
  const [noteDraft, setNoteDraft] = useState(notesHtmlToPlainText(item.notes));
  const [showMore, setShowMore] = useState(false);
  const [pipelineMessage, setPipelineMessage] = useState<string | null>(null);
  const [isPipelinePending, startPipelineTransition] = useTransition();
  const priorityFull = isPriorityListFull(allItems) && !item.inFocus;
  const [panelWidth, setPanelWidth] = useState(PANEL_DEFAULT_WIDTH);
  const panelWidthRef = useRef(PANEL_DEFAULT_WIDTH);

  // Restore the remembered width after mount so the server and client markup match.
  useEffect(() => {
    try {
      const stored = window.localStorage.getItem(PANEL_WIDTH_STORAGE_KEY);
      if (stored) {
        const next = clampPanelWidth(Number(stored));
        panelWidthRef.current = next;
        setPanelWidth(next);
      }
    } catch {
      // Private browsing can block storage; the default width is fine.
    }
  }, []);

  const applyPanelWidth = useCallback((next: number) => {
    const clamped = clampPanelWidth(next);
    panelWidthRef.current = clamped;
    setPanelWidth(clamped);
  }, []);

  const persistPanelWidth = useCallback(() => {
    try {
      window.localStorage.setItem(PANEL_WIDTH_STORAGE_KEY, String(panelWidthRef.current));
    } catch {
      // Ignore storage failures; the width still applies for this session.
    }
  }, []);

  /** Dragging left grows the panel, so the delta is measured from the start point backwards. */
  function startResize(event: React.PointerEvent<HTMLDivElement>) {
    if (event.button !== 0) return;
    event.preventDefault();
    const startX = event.clientX;
    const startWidth = panelWidthRef.current;
    const handleMove = (moveEvent: PointerEvent) => applyPanelWidth(startWidth + (startX - moveEvent.clientX));
    const handleUp = () => {
      window.removeEventListener("pointermove", handleMove);
      window.removeEventListener("pointerup", handleUp);
      document.body.style.removeProperty("cursor");
      document.body.style.removeProperty("user-select");
      persistPanelWidth();
    };
    window.addEventListener("pointermove", handleMove);
    window.addEventListener("pointerup", handleUp);
    document.body.style.setProperty("cursor", "col-resize");
    document.body.style.setProperty("user-select", "none");
  }

  function resizeKeyDown(event: React.KeyboardEvent<HTMLDivElement>) {
    const step = event.shiftKey ? 48 : 16;
    if (event.key === "ArrowLeft") {
      event.preventDefault();
      applyPanelWidth(panelWidthRef.current + step);
      persistPanelWidth();
    }
    if (event.key === "ArrowRight") {
      event.preventDefault();
      applyPanelWidth(panelWidthRef.current - step);
      persistPanelWidth();
    }
  }

  // Selecting a different review resets drafts and collapses "More fields".
  useEffect(() => {
    setTitleDraft(item.title);
    setRateDraft(formatOptionalCurrency(item.proposedRateCents));
    setProviderDraft(item.provider ?? "");
    setMinutesDraft(item.minutes != null ? String(item.minutes) : "");
    setLinkDraft(item.reviewLink ?? "");
    setNoteDraft(notesHtmlToPlainText(item.notes));
    setShowMore(false);
    setPipelineMessage(null);
  }, [item.id]); // eslint-disable-line react-hooks/exhaustive-deps

  /** Enter commits the field; Escape abandons the edit and restores the saved value. */
  function fieldKeyDown(event: React.KeyboardEvent<HTMLInputElement>, revert: () => void) {
    if (event.key === "Enter") event.currentTarget.blur();
    if (event.key === "Escape") {
      revert();
      event.currentTarget.blur();
    }
  }

  function commitTitle() {
    const next = titleDraft.trim();
    // A review with no title is unfindable in the queue, so a blank entry restores the saved one.
    if (next === "") {
      setTitleDraft(item.title);
      return;
    }
    if (next !== item.title) onFieldCommit({ title: next });
  }

  function commitRate() {
    if (rateDraft.trim() === "") {
      if (item.proposedRateCents !== null) onFieldCommit({ proposedRateCents: null });
      return;
    }
    const parsed = dollarsToOptionalCents(rateDraft);
    if (parsed === null || Number.isNaN(parsed)) {
      setRateDraft(formatOptionalCurrency(item.proposedRateCents));
      return;
    }
    setRateDraft(formatOptionalCurrency(parsed));
    if (parsed !== item.proposedRateCents) onFieldCommit({ proposedRateCents: parsed });
  }

  function commitProvider(value: string) {
    const next = value.trim();
    if (next !== (item.provider ?? "")) onFieldCommit({ provider: next || null });
  }

  function commitMinutes() {
    const trimmed = minutesDraft.trim();
    if (trimmed === "") {
      if (item.minutes != null) onFieldCommit({ minutes: null });
      return;
    }
    const parsed = Number(trimmed);
    if (!Number.isFinite(parsed) || parsed < 0) {
      setMinutesDraft(item.minutes != null ? String(item.minutes) : "");
      return;
    }
    const rounded = Math.round(parsed);
    setMinutesDraft(String(rounded));
    if (rounded !== item.minutes) onFieldCommit({ minutes: rounded });
  }

  function commitLink() {
    const next = linkDraft.trim();
    if (next !== (item.reviewLink ?? "")) onFieldCommit({ reviewLink: next || null });
  }

  function sendToRoadmap() {
    if (isDemo) return;
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

  const trimmedLink = (item.reviewLink ?? "").trim();
  const canOpenLink = /^https?:\/\//.test(trimmedLink);

  return (
    <aside
      style={{ "--cr-detail-width": `${panelWidth}px` } as React.CSSProperties}
      className="relative w-full shrink-0 self-stretch border-t border-hairline bg-panel-warm px-[22px] pb-[60px] pt-[30px] min-[1126px]:w-[var(--cr-detail-width)] min-[1126px]:border-t-0 min-[1126px]:border-l"
    >
      <div
        role="separator"
        aria-orientation="vertical"
        aria-label="Resize selected review panel"
        aria-valuenow={panelWidth}
        aria-valuemin={PANEL_MIN_WIDTH}
        aria-valuemax={PANEL_MAX_WIDTH}
        tabIndex={0}
        onPointerDown={startResize}
        onKeyDown={resizeKeyDown}
        onDoubleClick={() => {
          applyPanelWidth(PANEL_DEFAULT_WIDTH);
          persistPanelWidth();
        }}
        title="Drag to resize (double-click to reset)"
        className="absolute left-0 top-0 z-10 hidden h-full w-[9px] -translate-x-1/2 cursor-col-resize touch-none after:absolute after:inset-y-0 after:left-1/2 after:w-px after:-translate-x-1/2 after:bg-transparent hover:after:bg-formed-blue focus-visible:outline-none focus-visible:after:bg-formed-blue min-[1126px]:block"
      />
      <div className="sticky top-[90px] grid min-w-0 gap-1">
        <div className="mb-2 flex items-center justify-between">
          <p className="text-[11.5px] font-semibold text-formed-blue">Selected review</p>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close selected review"
            className="flex h-6 w-6 items-center justify-center border border-hairline bg-panel text-muted transition hover:bg-panel-warm"
          >
            <X className="h-[13px] w-[13px]" aria-hidden="true" />
          </button>
        </div>

        <h2 className="mb-2">
          <input
            aria-label="Review title"
            placeholder="Untitled review"
            disabled={isDemo}
            value={titleDraft}
            onChange={(event) => setTitleDraft(event.target.value)}
            onBlur={commitTitle}
            onKeyDown={(event) => fieldKeyDown(event, () => setTitleDraft(item.title))}
            className="-mx-1.5 w-[calc(100%+12px)] border-0 bg-transparent px-1.5 py-0.5 font-display text-[26px] leading-[1.15] normal-case tracking-normal outline-none transition placeholder:text-faint hover:bg-panel focus:bg-panel focus:ring-2 focus:ring-formed-blue disabled:cursor-not-allowed disabled:hover:bg-transparent"
          />
        </h2>

        <DetailRow label="Status">
          <select
            aria-label="Review Status"
            value={item.reviewStatus}
            disabled={isDemo}
            onChange={(event) => onStatusChange(event.target.value as ReviewStatus)}
            className={cn("min-h-9 w-full border px-2 text-sm font-bold", TONE_CLASSES[status.tone].field, TONE_CLASSES[status.tone].accent)}
          >
            {REVIEW_STATUSES.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}
          </select>
        </DetailRow>

        <DetailRow label="Proposed rate">
          <input
            aria-label="Proposed Yearly Rate"
            inputMode="decimal"
            placeholder="$0.00"
            disabled={isDemo}
            value={rateDraft}
            onChange={(event) => setRateDraft(event.target.value)}
            onBlur={commitRate}
            onKeyDown={(event) => fieldKeyDown(event, () => setRateDraft(formatOptionalCurrency(item.proposedRateCents)))}
            className={INLINE_FIELD_CLASS}
          />
        </DetailRow>

        <DetailRow label="Provider">
          <ProviderCombobox
            id={`detail-provider-${item.id}`}
            options={providerOptions}
            value={providerDraft}
            disabled={isDemo}
            hideLabel
            onChange={setProviderDraft}
            onCommit={commitProvider}
            inputClassName={INLINE_FIELD_CLASS}
            placeholder="Add a provider"
          />
        </DetailRow>

        <DetailRow label="Genre">
          <ColoredSelect
            compact
            label="Genre"
            aria-label="Genre"
            options={CONTENT_GENRES}
            value={item.genre ?? ""}
            disabled={isDemo}
            onChange={(event) => onFieldCommit({ genre: event.target.value || null })}
          />
        </DetailRow>

        <DetailRow label="Format">
          <ColoredSelect
            compact
            label="Format"
            aria-label="Format"
            options={CONTENT_FORMATS}
            value={item.format ?? ""}
            disabled={isDemo}
            onChange={(event) => onFieldCommit({ format: event.target.value || null })}
          />
        </DetailRow>

        <DetailRow label="Minutes">
          <input
            aria-label="Minutes"
            inputMode="numeric"
            placeholder="—"
            disabled={isDemo}
            value={minutesDraft}
            onChange={(event) => setMinutesDraft(event.target.value)}
            onBlur={commitMinutes}
            onKeyDown={(event) => fieldKeyDown(event, () => setMinutesDraft(item.minutes != null ? String(item.minutes) : ""))}
            className={INLINE_FIELD_CLASS}
          />
        </DetailRow>

        <DetailRow label="Link">
          <div className="flex min-w-0 items-center gap-1.5">
            <input
              aria-label="Review link"
              type="url"
              placeholder="https://"
              disabled={isDemo}
              value={linkDraft}
              onChange={(event) => setLinkDraft(event.target.value)}
              onBlur={commitLink}
              onKeyDown={(event) => fieldKeyDown(event, () => setLinkDraft(item.reviewLink ?? ""))}
              className={cn(INLINE_FIELD_CLASS, "text-[12.5px] font-semibold text-formed-blue")}
            />
            {canOpenLink ? (
              <a
                href={trimmedLink}
                target="_blank"
                rel="noreferrer"
                aria-label="Open review link in a new tab"
                className="shrink-0 text-formed-blue hover:text-formed-blue-hover"
              >
                <ExternalLink className="h-3.5 w-3.5" aria-hidden="true" />
              </a>
            ) : null}
          </div>
        </DetailRow>

        <div className="flex flex-wrap items-center gap-3 border-t border-hairline py-2.5">
          <button
            type="button"
            disabled={isDemo}
            title={priorityFull ? "Priorities is full — remove something first" : undefined}
            onClick={onTogglePriority}
            className="text-[12.5px] font-semibold text-formed-blue underline decoration-formed-blue-border underline-offset-2 hover:text-formed-blue-hover disabled:cursor-not-allowed disabled:text-faint disabled:no-underline"
          >
            {item.inFocus ? "Remove from Priorities" : "Add to Priorities"}
          </button>
          <button
            type="button"
            onClick={() => setShowMore((current) => !current)}
            className="text-[12.5px] font-semibold text-formed-blue hover:text-formed-blue-hover"
          >
            {showMore ? "Hide more fields" : "More fields"}
          </button>
        </div>

        {showMore ? (
          <div className="grid gap-3 border-t border-hairline py-3" style={{ animation: "fadein 150ms ease" }}>
            <label className="grid gap-1.5 text-xs font-semibold text-muted">
              Notes
              <textarea
                aria-label="Notes"
                rows={4}
                disabled={isDemo}
                value={noteDraft}
                onChange={(event) => setNoteDraft(event.target.value)}
                onBlur={() => onFieldCommit({ notes: noteDraft })}
                className="min-h-24 w-full resize-y border border-hairline bg-panel px-3 py-2 text-sm font-medium normal-case tracking-normal outline-none focus:ring-2 focus:ring-formed-blue box-border"
              />
            </label>
            <label className="flex items-center gap-2 text-xs font-semibold text-muted">
              <input
                type="checkbox"
                disabled={isDemo}
                checked={Boolean(item.isCoproductionOpportunity)}
                onChange={(event) => onFieldCommit({ isCoproductionOpportunity: event.target.checked })}
                className="h-3.5 w-3.5 accent-formed-blue"
              />
              Co-production opportunity
            </label>
            <div className="flex flex-wrap items-center gap-3">
              {item.reviewStatus === "contracted" ? (
                <button
                  type="button"
                  disabled={isDemo || isPipelinePending || !item.minutes || !item.proposedRateCents}
                  title={!item.minutes ? "Add the minutes of content before sending this to the roadmap." : !item.proposedRateCents ? "Add a proposed rate before sending this to the roadmap." : undefined}
                  onClick={sendToRoadmap}
                  className="text-[12.5px] font-semibold text-formed-blue hover:text-formed-blue-hover disabled:cursor-not-allowed disabled:text-faint"
                >
                  {isPipelinePending ? "Sending..." : "Send to roadmap"}
                </button>
              ) : null}
              <button
                type="button"
                disabled={isDemo}
                onClick={() => {
                  if (window.confirm(`Delete ${item.title || "this review"}? This cannot be undone.`)) onDelete();
                }}
                className="border border-danger-border bg-danger-soft px-3 py-1.5 text-[12px] font-semibold text-danger disabled:opacity-50"
              >
                Delete
              </button>
            </div>
            {pipelineMessage ? <p role="status" className="bg-deep-teal-soft px-3 py-2 text-xs font-bold text-deep-teal">{pipelineMessage}</p> : null}
          </div>
        ) : null}

        <div className="mt-3 border-t border-hairline pt-3">
          <ContentReviewUpdateLog
            fiscalYearId={fiscalYearId}
            itemId={item.id}
            updates={updates}
            isDemo={isDemo}
            onAdded={onUpdateAdded}
            onDeleted={onUpdateDeleted}
          />
        </div>
      </div>
    </aside>
  );
}

function DetailRow({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex min-w-0 items-center gap-3.5 border-t border-hairline py-2.5">
      <span className="w-24 shrink-0 text-xs font-medium text-muted">{label}</span>
      <div className="min-w-0 flex-1">{children}</div>
    </div>
  );
}
