"use client";

import { ExternalLink, X } from "lucide-react";
import { useEffect, useState, useTransition } from "react";
import { cn } from "@/components/ui/soft-surface";
import { isPriorityListFull } from "../content-review-queue";
import { sendReviewToRoadmap } from "../planning-actions";
import { REVIEW_STATUSES, TONE_CLASSES } from "../planning-constants";
import { dollarsToOptionalCents, formatOptionalCurrency } from "../planning-model";
import type { ContentReviewItem, ContentReviewUpdate, ReviewStatus } from "../planning-types";
import { notesHtmlToPlainText } from "../rich-text";
import { ContentReviewUpdateLog } from "./content-review-update-log";

type ContentReviewDetailPanelProps = {
  item: ContentReviewItem;
  allItems: ContentReviewItem[];
  fiscalYearId: string;
  isDemo?: boolean;
  updates: ContentReviewUpdate[];
  onClose: () => void;
  onStatusChange: (status: ReviewStatus) => void;
  onRateCommit: (cents: number | null) => void;
  onNotesCommit: (notes: string) => void;
  onTogglePriority: () => void;
  onDelete: () => void;
  onUpdateAdded: (update: ContentReviewUpdate) => void;
  onUpdateDeleted: (updateId: string) => void;
};

export function ContentReviewDetailPanel({
  item,
  allItems,
  fiscalYearId,
  isDemo,
  updates,
  onClose,
  onStatusChange,
  onRateCommit,
  onNotesCommit,
  onTogglePriority,
  onDelete,
  onUpdateAdded,
  onUpdateDeleted
}: ContentReviewDetailPanelProps) {
  const status = REVIEW_STATUSES.find((option) => option.value === item.reviewStatus) ?? REVIEW_STATUSES[0];
  const [rateDraft, setRateDraft] = useState(formatOptionalCurrency(item.proposedRateCents));
  const [noteDraft, setNoteDraft] = useState(notesHtmlToPlainText(item.notes));
  const [showMore, setShowMore] = useState(false);
  const [pipelineMessage, setPipelineMessage] = useState<string | null>(null);
  const [isPipelinePending, startPipelineTransition] = useTransition();
  const priorityFull = isPriorityListFull(allItems) && !item.inFocus;

  // Selecting a different review resets drafts and collapses "More fields".
  useEffect(() => {
    setRateDraft(formatOptionalCurrency(item.proposedRateCents));
    setNoteDraft(notesHtmlToPlainText(item.notes));
    setShowMore(false);
    setPipelineMessage(null);
  }, [item.id]); // eslint-disable-line react-hooks/exhaustive-deps

  function commitRate() {
    const parsed = dollarsToOptionalCents(rateDraft);
    if (rateDraft.trim() === "" ) {
      onRateCommit(null);
      return;
    }
    if (parsed === null || Number.isNaN(parsed)) {
      setRateDraft(formatOptionalCurrency(item.proposedRateCents));
      return;
    }
    onRateCommit(parsed);
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
    <aside className="w-full shrink-0 self-stretch border-t border-hairline bg-panel-warm px-[22px] pb-[60px] pt-[30px] min-[1126px]:w-[352px] min-[1126px]:border-t-0 min-[1126px]:border-l">
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

        <h2 className="mb-2 font-display text-[26px] leading-[1.15]">{item.title || "Untitled review"}</h2>

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
            onKeyDown={(event) => { if (event.key === "Enter") { event.currentTarget.blur(); } }}
            className="min-h-9 w-full border-0 bg-transparent px-0 text-[13px] font-bold outline-none focus:ring-2 focus:ring-formed-blue"
          />
        </DetailRow>

        <DetailRow label="Provider">
          <p className="text-[13px] font-bold">{item.provider || <span className="font-normal text-faint">—</span>}</p>
        </DetailRow>

        <DetailRow label="Metadata">
          <div className="flex flex-wrap gap-1.5">
            {item.genre ? <span className="bg-tone-amber-bg px-1.5 py-0.5 text-[10px] font-bold text-tone-amber-ink">{item.genre}</span> : null}
            {item.format ? <span className="bg-tone-blue-bg px-1.5 py-0.5 text-[10px] font-bold text-tone-blue-ink">{item.format}</span> : null}
            {item.minutes ? <span className="bg-panel px-1.5 py-0.5 text-[10px] font-bold text-muted ring-1 ring-hairline">{item.minutes} min</span> : null}
            {!item.genre && !item.format && !item.minutes ? <span className="text-[12px] text-faint">—</span> : null}
          </div>
        </DetailRow>

        <DetailRow label="Link">
          {canOpenLink ? (
            <a href={trimmedLink} target="_blank" rel="noreferrer" className="flex min-w-0 items-center gap-1.5 text-[12.5px] font-semibold text-formed-blue hover:text-formed-blue-hover">
              <ExternalLink className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />
              <span className="min-w-0 flex-1 truncate">{trimmedLink}</span>
            </a>
          ) : (
            <span className="text-[12px] text-faint">—</span>
          )}
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
                onBlur={() => onNotesCommit(noteDraft)}
                className="min-h-24 w-full resize-y border border-hairline bg-panel px-3 py-2 text-sm font-medium normal-case tracking-normal outline-none focus:ring-2 focus:ring-formed-blue box-border"
              />
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
