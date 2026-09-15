"use client";

import { MessageSquarePlus, Trash2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { cn } from "@/components/ui/soft-surface";
import { errorMessage, isSessionExpiredError } from "@/lib/auth/session-error";
import { formatRelativeTime, reviewStatusLabel } from "../content-review-activity";
import { addContentReviewUpdate, deleteContentReviewUpdate } from "../planning-actions";
import { REVIEW_STATUSES, TONE_CLASSES } from "../planning-constants";
import type { ContentReviewUpdate, ReviewStatus } from "../planning-types";

type ContentReviewUpdateLogProps = {
  fiscalYearId: string;
  itemId: string;
  updates: ContentReviewUpdate[];
  isDemo?: boolean;
  onAdded: (update: ContentReviewUpdate) => void;
  onDeleted: (updateId: string) => void;
};

function statusChipClass(status: ReviewStatus | null) {
  const tone = REVIEW_STATUSES.find((option) => option.value === status)?.tone;
  return tone ? TONE_CLASSES[tone].chip : "bg-panel-warm text-muted";
}

export function ContentReviewUpdateLog({ fiscalYearId, itemId, updates, isDemo, onAdded, onDeleted }: ContentReviewUpdateLogProps) {
  const router = useRouter();
  const [body, setBody] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();
  const isDraft = itemId === "draft";
  const disabled = Boolean(isDemo) || isDraft || isPending;

  function submit() {
    const trimmed = body.trim();
    if (disabled || !trimmed) return;
    setError(null);
    const formData = new FormData();
    formData.set("fiscalYearId", fiscalYearId);
    formData.set("itemId", itemId);
    formData.set("body", trimmed);
    setBody("");
    startTransition(async () => {
      try {
        onAdded(await addContentReviewUpdate(formData));
      } catch (submitError) {
        setBody(trimmed);
        if (isSessionExpiredError(submitError)) {
          setError("Your session expired. Redirecting you to log in again...");
          router.push("/login");
          return;
        }
        setError(errorMessage(submitError, "Could not save that update."));
      }
    });
  }

  function remove(updateId: string) {
    if (isDemo || isPending) return;
    const formData = new FormData();
    formData.set("fiscalYearId", fiscalYearId);
    formData.set("updateId", updateId);
    onDeleted(updateId);
    startTransition(async () => {
      try {
        await deleteContentReviewUpdate(formData);
      } catch (deleteError) {
        if (isSessionExpiredError(deleteError)) {
          setError("Your session expired. Redirecting you to log in again...");
          router.push("/login");
          return;
        }
        setError(errorMessage(deleteError, "Could not delete that update."));
      }
    });
  }

  return <div className="grid gap-3" data-testid="content-review-update-log">
    <div className="flex items-center justify-between gap-3">
      <span className="text-xs font-semibold uppercase tracking-wide text-muted">Update Log</span>
      {updates.length ? <span className="text-[10px] font-semibold uppercase tracking-wide text-muted">{updates.length} {updates.length === 1 ? "entry" : "entries"}</span> : null}
    </div>

    <div className="flex items-center gap-2">
      <div className="relative min-w-0 flex-1">
        <MessageSquarePlus className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted" aria-hidden="true" />
        <input
          aria-label="Log an update"
          value={body}
          disabled={disabled}
          placeholder={isDraft ? "Save this review before logging updates" : "Type an update and press Enter"}
          onChange={(event) => setBody(event.target.value)}
          onKeyDown={(event) => {
            if (event.key !== "Enter" || event.shiftKey) return;
            event.preventDefault();
            submit();
          }}
          className="min-h-11 w-full rounded-md border-0 bg-panel-warm pl-9 pr-3 text-sm font-medium normal-case tracking-normal outline-none focus:ring-2 focus:ring-formed-blue disabled:opacity-60"
        />
      </div>
      <button
        type="button"
        disabled={disabled || !body.trim()}
        onClick={submit}
        className="shrink-0 rounded-md bg-formed-blue px-3 py-2.5 text-xs font-semibold text-white transition hover:bg-formed-blue-hover disabled:opacity-40"
      >
        Save
      </button>
    </div>

    {error ? <p role="status" className="rounded-md bg-danger-soft px-3 py-2 text-xs font-bold text-danger">{error}</p> : null}

    {updates.length === 0 ? (
      <p className="rounded-md bg-panel-warm px-3 py-3 text-sm font-bold text-muted">No updates logged yet.</p>
    ) : (
      <ul className="grid gap-2">
        {updates.map((update) => (
          <li key={update.id} className="group/entry grid gap-1 rounded-md bg-panel-warm px-3 py-2">
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-[10px] font-semibold uppercase tracking-wide text-muted">{formatRelativeTime(update.createdAt)}</span>
              {update.authorEmail ? <span className="text-[10px] font-bold text-muted">{update.authorEmail}</span> : null}
              {update.kind === "note" ? (
                <button
                  type="button"
                  aria-label={`Delete update from ${formatRelativeTime(update.createdAt)}`}
                  onClick={() => remove(update.id)}
                  disabled={isDemo || isPending}
                  className="ml-auto rounded p-1 text-muted opacity-0 transition hover:bg-hairline hover:text-danger focus:opacity-100 focus:outline-none focus:ring-2 focus:ring-formed-blue group-hover/entry:opacity-100"
                >
                  <Trash2 className="h-3.5 w-3.5" aria-hidden="true" />
                </button>
              ) : null}
            </div>
            {update.kind === "status_change" ? (
              <p className="flex flex-wrap items-center gap-2 text-sm font-bold">
                <span className={cn("rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide", statusChipClass(update.fromStatus))}>{reviewStatusLabel(update.fromStatus)}</span>
                <span aria-hidden="true" className="text-muted">→</span>
                <span className={cn("rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide", statusChipClass(update.toStatus))}>{reviewStatusLabel(update.toStatus)}</span>
              </p>
            ) : update.kind === "created" ? (
              <p className="text-sm font-bold text-muted">Added to the review queue</p>
            ) : (
              <p className="whitespace-pre-wrap text-sm font-medium">{update.body}</p>
            )}
          </li>
        ))}
      </ul>
    )}
  </div>;
}
