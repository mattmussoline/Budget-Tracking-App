"use client";

import { MessageSquarePlus, X } from "lucide-react";
import { type KeyboardEvent, type MouseEvent, type SyntheticEvent, useCallback, useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { cn } from "@/components/ui/soft-surface";
import { formatRelativeTime } from "@/features/planning/content-review-activity";
import { TONE_CLASSES } from "@/features/planning/planning-constants";
import { formatCurrencyWholeDollars } from "@/lib/currency";
import {
  BENCHMARK_VERDICT_LABEL,
  GRADE_TIER_TONE,
  benchmarkVerdict,
  formatCompactCurrency,
  stageLabel,
  stageOption,
  type GradedOpportunity
} from "../coproduction-model";
import type { CoproductionUpdate, NoteBlock } from "../coproduction-types";
import { CoproductionScorecard } from "./coproduction-scorecard";
import { LikelihoodDial } from "./likelihood-dial";
import { OpportunityArtPanel } from "./opportunity-art";

const verdictClass = {
  under: "text-tone-green-ink",
  at: "text-tone-amber-ink",
  over: "text-tone-orange-ink"
} as const;

function NoteBlocks({ notes }: { notes: NoteBlock[] }) {
  return (
    <div className="grid max-w-[66ch] gap-3 rounded-lg bg-white p-5 text-sm font-medium leading-relaxed shadow-sm ring-1 ring-hairline">
      {notes.map((block, index) => block.kind === "bullets" ? (
        <ul key={index} className="grid list-disc gap-1.5 pl-5">
          {block.items.map((item) => <li key={item}>{item}</li>)}
        </ul>
      ) : (
        <p key={index}>
          {block.lead ? <strong className="font-semibold">{block.lead} </strong> : null}
          {block.body}
        </p>
      ))}
    </div>
  );
}

function UpdateEntry({ update }: { update: CoproductionUpdate }) {
  const fromTone = update.fromStage ? TONE_CLASSES[stageOption(update.fromStage).tone].chip : "bg-panel-warm text-muted";
  const toTone = update.toStage ? TONE_CLASSES[stageOption(update.toStage).tone].chip : "bg-panel-warm text-muted";

  return (
    <li className="grid gap-1.5 rounded-md bg-panel-warm px-3.5 py-2.5">
      <div className="flex flex-wrap items-center gap-2.5 text-[10px] font-semibold uppercase tracking-wide text-muted">
        <span>{formatRelativeTime(update.createdAt)}</span>
        {update.authorEmail ? <span className="font-bold normal-case tracking-normal">{update.authorEmail}</span> : null}
      </div>

      {update.kind === "stage_change" ? (
        <p className="flex flex-wrap items-center gap-1.5 text-[13px] font-bold">
          <span className={cn("rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide", fromTone)}>
            {stageLabel(update.fromStage)}
          </span>
          <span aria-hidden="true" className="text-muted">→</span>
          <span className={cn("rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide", toTone)}>
            {stageLabel(update.toStage)}
          </span>
        </p>
      ) : update.kind === "created" ? (
        <p className="text-sm font-bold text-muted">Added to the co-production slate</p>
      ) : (
        <p className="text-sm font-medium leading-relaxed">{update.body}</p>
      )}
    </li>
  );
}

type CoproductionDetailModalProps = {
  opportunity: GradedOpportunity;
  isDemo?: boolean;
  onClose: () => void;
};

/**
 * The detail view as a pop-out over the slate rather than an in-place
 * expansion, so the surrounding cards stay put and the reader keeps their place
 * in the grid. The header carries the glance-level figures; the panels below
 * carry the reasoning, the log, and the deal metadata.
 */
export function CoproductionDetailModal({ opportunity, isDemo, onClose }: CoproductionDetailModalProps) {
  const [mounted, setMounted] = useState(false);
  const dialogRef = useRef<HTMLDialogElement>(null);
  const stage = stageOption(opportunity.stage);
  const gradeTone = TONE_CLASSES[GRADE_TIER_TONE[opportunity.tier]];
  const rate = opportunity.costPerHourCents;

  useEffect(() => setMounted(true), []);

  const close = useCallback(() => {
    const dialog = dialogRef.current;
    if (dialog?.open && typeof dialog.close === "function") dialog.close();
    else dialog?.removeAttribute("open");
    onClose();
  }, [onClose]);

  useEffect(() => {
    if (!mounted) return;
    const dialog = dialogRef.current;
    if (!dialog) return;
    if (typeof dialog.showModal === "function" && !dialog.open) dialog.showModal();
    else dialog.setAttribute("open", "");
  }, [mounted]);

  useEffect(() => {
    function closeFromDocumentEscape(event: globalThis.KeyboardEvent) {
      if (event.key !== "Escape") return;
      event.preventDefault();
      close();
    }

    document.addEventListener("keydown", closeFromDocumentEscape);
    return () => document.removeEventListener("keydown", closeFromDocumentEscape);
  }, [close]);

  if (!mounted) return null;

  function closeFromBackdrop(event: MouseEvent<HTMLDialogElement>) {
    if (event.target === event.currentTarget) close();
  }

  function closeFromEscape(event: KeyboardEvent<HTMLDialogElement>) {
    if (event.key !== "Escape") return;
    event.preventDefault();
    close();
  }

  function closeFromCancel(event: SyntheticEvent<HTMLDialogElement>) {
    event.preventDefault();
    close();
  }

  return createPortal(
    <dialog
      ref={dialogRef}
      open
      style={{ display: "block", visibility: "visible" }}
      aria-labelledby="coproduction-detail-title"
      onClick={closeFromBackdrop}
      onKeyDown={closeFromEscape}
      onCancel={closeFromCancel}
      className={cn(
        "fixed left-1/2 top-1/2 z-50 block max-h-[88vh] w-[calc(100%-2rem)] max-w-6xl -translate-x-1/2 -translate-y-1/2 overflow-y-auto overscroll-contain rounded-xl border-l-4 bg-white p-0 text-foreground shadow-2xl backdrop:bg-augustine-blue/50 backdrop:backdrop-blur-md md:w-[calc(100%-3rem)]",
        stage.tone === "slate" ? "border-hairline-strong" : TONE_CLASSES[stage.tone].accent
      )}
    >
      <button
        type="button"
        onClick={close}
        aria-label={`Close ${opportunity.title}`}
        className="absolute right-4 top-4 z-20 grid h-9 w-9 place-items-center rounded-md bg-panel-warm text-muted transition hover:bg-hairline hover:text-foreground focus:outline-none focus-visible:ring-2 focus-visible:ring-formed-blue"
      >
        <X className="h-4 w-4" aria-hidden="true" />
      </button>

      <header className="sticky top-0 z-10 grid grid-cols-[auto_minmax(0,1fr)] items-center gap-4 border-b border-hairline bg-white p-5 pr-16 md:grid-cols-[auto_minmax(0,1fr)_auto] md:gap-6">
        <div className="aspect-[16/9] w-[8.5rem] overflow-hidden rounded-md ring-1 ring-hairline">
          <OpportunityArtPanel
            art={opportunity.art}
            title={opportunity.title}
            variant="thumb"
            isMuted={opportunity.stage === "passed"}
          />
        </div>

        <div className="grid min-w-0 gap-2">
          <div className="flex flex-wrap items-center gap-2.5">
            <span aria-hidden="true" className="grid h-7 w-7 shrink-0 place-items-center rounded-md bg-panel-warm text-[10px] font-semibold text-muted">
              {initials(opportunity.partner)}
            </span>
            <span className="truncate text-xs font-semibold text-muted">{opportunity.partner}</span>
            <span className={cn("rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide", TONE_CLASSES[stage.tone].chip)}>
              {stage.label}
            </span>
          </div>

          <h2 id="coproduction-detail-title" className="font-display text-2xl tracking-tight">
            {opportunity.title}
          </h2>

          <p className="text-xs font-bold text-muted">
            {opportunity.format} · {opportunity.genre} · {opportunity.episodes}
            {rate ? (
              <>
                {" · "}
                <b className="font-semibold">{formatCompactCurrency(rate)}</b> per finished hour ·{" "}
                <span className={verdictClass[benchmarkVerdict(rate)]}>{BENCHMARK_VERDICT_LABEL[benchmarkVerdict(rate)]}</span>
              </>
            ) : null}
          </p>
        </div>

        <div className="col-span-full flex items-center gap-7 md:col-span-1">
          <div className="grid gap-0.5">
            <span className="text-[9px] font-semibold uppercase tracking-wider text-muted">Asking price</span>
            <span className="font-display text-[1.375rem] tracking-tight tabular-nums">
              {formatCurrencyWholeDollars(opportunity.askCents)}
            </span>
          </div>
          <LikelihoodDial value={opportunity.likelihood} />
          <div className={cn("grid h-14 w-14 place-items-center rounded-lg font-display text-2xl tracking-tighter", gradeTone.chip)}>
            {opportunity.letter}
            <small className="text-center text-[8px] font-semibold uppercase tracking-widest opacity-75">Rating</small>
          </div>
        </div>
      </header>

      <div className="grid gap-7 bg-panel-warm p-5 pb-7 lg:grid-cols-[minmax(0,1.15fr)_minmax(0,1.3fr)_minmax(0,0.85fr)] lg:gap-8 lg:p-7">
        <CoproductionScorecard opportunity={opportunity} />

        <section className="grid content-start gap-4" aria-labelledby="coproduction-notes-heading">
          <h3
            id="coproduction-notes-heading"
            className="flex items-baseline justify-between gap-3 text-xs font-semibold uppercase tracking-wide text-muted"
          >
            Notes &amp; update log
            <span className="text-[10px] font-semibold">
              {opportunity.updates.length} {opportunity.updates.length === 1 ? "entry" : "entries"}
            </span>
          </h3>

          <NoteBlocks notes={opportunity.notes} />

          <div className="relative flex items-center">
            <MessageSquarePlus className="pointer-events-none absolute left-3 h-4 w-4 text-muted" aria-hidden="true" />
            <input
              type="text"
              disabled={isDemo}
              aria-label={`Log an update on ${opportunity.title}`}
              placeholder={isDemo ? "Updates are read-only in the demo" : "Type an update and press Enter"}
              className="min-h-11 w-full rounded-md border-0 bg-panel-warm pl-9 pr-3 text-sm font-medium outline-none focus:ring-2 focus:ring-formed-blue disabled:opacity-60"
            />
          </div>

          <ul className="grid gap-2.5">
            {opportunity.updates.map((update) => <UpdateEntry key={update.id} update={update} />)}
          </ul>
        </section>

        <section className="grid content-start gap-4" aria-labelledby="coproduction-metadata-heading">
          <h3 id="coproduction-metadata-heading" className="text-xs font-semibold uppercase tracking-wide text-muted">
            Metadata
          </h3>

          <dl className="grid rounded-lg bg-white px-4 py-2 shadow-sm ring-1 ring-hairline">
            <MetadataRow label="Partner" value={opportunity.partner} />
            <MetadataRow label="Format" value={`${opportunity.format} · ${opportunity.episodes}`} />
            <MetadataRow label="Genre" value={opportunity.genre} />
            <MetadataRow label="Key art" value="Placeholder — awaiting partner assets" />
            <MetadataRow label="Asking price" value={formatCurrencyWholeDollars(opportunity.askCents)} isNumeric />
            <MetadataRow
              label="Expected cost"
              value={`${formatCurrencyWholeDollars(opportunity.expectedCents)} (ask × ${opportunity.likelihood}%)`}
              isNumeric
            />
            {opportunity.metadata.map((field) => (
              <MetadataRow key={field.label} label={field.label} value={field.value} isNumeric={/\d/.test(field.value)} />
            ))}
          </dl>
        </section>
      </div>
    </dialog>,
    document.body
  );
}

function MetadataRow({ label, value, isNumeric }: { label: string; value: string; isNumeric?: boolean }) {
  return (
    <div className="grid grid-cols-[minmax(0,8.5rem)_minmax(0,1fr)] items-baseline gap-3 border-b border-hairline py-2.5 last:border-b-0">
      <dt className="text-[9px] font-semibold uppercase tracking-wider text-muted">{label}</dt>
      <dd className={cn("break-words text-[13px] font-bold leading-snug", isNumeric && "tabular-nums")}>{value}</dd>
    </div>
  );
}

export function initials(name: string) {
  return name
    .split(/\s+/)
    .filter((word) => /[A-Za-z]/.test(word))
    .slice(0, 2)
    .map((word) => word.charAt(0).toUpperCase())
    .join("");
}
