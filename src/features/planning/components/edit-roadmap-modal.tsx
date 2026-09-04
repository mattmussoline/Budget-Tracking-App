"use client";

import { type KeyboardEvent, type MouseEvent, type ReactNode, useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { Star, X } from "lucide-react";
import { cn } from "@/components/ui/soft-surface";
import { TONE_CLASSES, type PlanningTone } from "../planning-constants";
import { formatRoadmapDateLabel, isMonthTbdRoadmapDate } from "../planning-model";
import type { RoadmapCategory, RoadmapItem } from "../planning-types";

type EditRoadmapModalProps = {
  item: RoadmapItem;
  category?: RoadmapCategory;
  isDemo?: boolean;
  isOpen?: boolean;
  onOpen?: () => void;
  onClose?: () => void;
  /** "card" (default) is the full backlog/month-column trigger; "chip" is a compact single-line trigger for calendar day cells. */
  variant?: "card" | "chip";
  children: ReactNode;
};

export function EditRoadmapModal({ item, category, isDemo, isOpen: controlledIsOpen, onOpen, onClose, variant = "card", children }: EditRoadmapModalProps) {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const [uncontrolledIsOpen, setUncontrolledIsOpen] = useState(false);
  const isOpen = controlledIsOpen ?? uncontrolledIsOpen;
  const tone = (category?.colorKey && category.colorKey in TONE_CLASSES ? category.colorKey : "slate") as PlanningTone;

  useEffect(() => {
    if (!isOpen) return;
    const dialog = dialogRef.current;
    if (!dialog) return;

    if (typeof dialog.showModal === "function" && !dialog.open) dialog.showModal();
    else dialog.setAttribute("open", "");
  }, [isOpen]);

  const openDialog = () => {
    onOpen?.();
    if (controlledIsOpen === undefined) setUncontrolledIsOpen(true);
  };

  const closeDialog = () => {
    const dialog = dialogRef.current;
    if (dialog?.open && typeof dialog.close === "function") dialog.close();
    else dialog?.removeAttribute("open");

    onClose?.();
    if (controlledIsOpen === undefined) setUncontrolledIsOpen(false);
    triggerRef.current?.focus();
  };

  const closeFromBackdrop = (event: MouseEvent<HTMLDialogElement>) => {
    if (event.target === event.currentTarget) closeDialog();
  };

  const closeFromEscape = (event: KeyboardEvent<HTMLDialogElement>) => {
    if (event.key !== "Escape") return;
    event.preventDefault();
    closeDialog();
  };

  const isTbd = item.releaseDate === "TBD" || isMonthTbdRoadmapDate(item.releaseDate);

  return <>
    {variant === "chip" ? <button
      ref={triggerRef}
      type="button"
      onClick={openDialog}
      aria-label={`Edit ${item.title}`}
      title={item.title}
      className={cn("block w-full truncate rounded-md px-1.5 py-1 text-left text-[11px] font-semibold transition-colors hover:brightness-95", TONE_CLASSES[tone].chip, isTbd && "italic")}
    >
      {item.title}
    </button> : <button
      ref={triggerRef}
      type="button"
      onClick={openDialog}
      aria-label={`Edit ${item.title}`}
      className={cn("w-full rounded-md border-l-4 bg-white p-3 text-left transition-transform hover:-translate-y-0.5", TONE_CLASSES[tone].accent)}
    >
      <p className="font-semibold leading-tight">{item.title}</p>
      <div className="mt-2 flex flex-wrap gap-2">
        {item.featuredInIndividualMarketing ? <span className="inline-flex items-center gap-1 rounded-full bg-guild-gold-soft px-2 py-1 text-[9px] font-semibold uppercase text-guild-gold-ink ring-1 ring-guild-gold" title="Individual marketing campaign spotlight">
          <Star className="h-3 w-3 fill-amber-400 text-guild-gold-ink" aria-hidden="true" />
          Spotlight
        </span> : null}
        {category ? <span className={cn("rounded-full px-2 py-1 text-[9px] font-semibold uppercase", TONE_CLASSES[tone].chip)}>{category.name}</span> : null}
        {item.provider ? <span className="rounded-full bg-panel-warm px-2 py-1 text-[9px] font-bold">{item.provider}</span> : null}
        {item.releaseDate ? <span className={cn("rounded-full px-2 py-1 text-[9px] font-bold", isTbd ? "bg-danger-soft text-danger" : "bg-panel-warm")}>{formatRoadmapDateLabel(item.releaseDate)}</span> : null}
      </div>
    </button>}
    {isOpen ? createPortal(<dialog
      ref={dialogRef}
      open={isOpen}
      style={{ display: "block", visibility: "visible" }}
      aria-labelledby={`edit-roadmap-title-${item.id}`}
      onClick={closeFromBackdrop}
      onKeyDown={closeFromEscape}
      onClose={() => {
        onClose?.();
        if (controlledIsOpen === undefined) setUncontrolledIsOpen(false);
        triggerRef.current?.focus();
      }}
      className="fixed left-1/2 top-1/2 z-50 block w-[calc(100%-2rem)] max-w-4xl -translate-x-1/2 -translate-y-1/2 rounded-xl bg-white p-0 text-foreground shadow-2xl backdrop:bg-augustine-blue/60"
    >
      <div className="flex max-h-[calc(100vh-2rem)] flex-col">
        <header className="flex shrink-0 items-start justify-between gap-4 border-b border-hairline p-5 sm:px-7 sm:py-6">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wide text-formed-blue">Roadmap</p>
            <h2 id={`edit-roadmap-title-${item.id}`} className="font-display text-2xl sm:text-3xl">Edit Roadmap Item</h2>
          </div>
          <button type="button" onClick={closeDialog} aria-label="Close edit roadmap modal" className="rounded-md bg-panel-warm p-3 text-muted transition-colors hover:bg-hairline hover:text-foreground">
            <X className="h-5 w-5" aria-hidden="true" />
          </button>
        </header>
        <div className="min-h-0 overflow-y-auto px-5 sm:px-7">{children}</div>
        <footer className="flex shrink-0 justify-end gap-2 border-t border-hairline p-4 sm:px-7">
          <button
            type="submit"
            form={`edit-${item.id}-form`}
            disabled={isDemo}
            className="min-h-12 rounded-md bg-formed-blue px-5 py-3 text-sm font-semibold uppercase tracking-wide text-white transition-colors hover:bg-formed-blue-hover disabled:cursor-not-allowed disabled:opacity-50"
          >
            Save Item
          </button>
          <button type="button" onClick={closeDialog} className="min-h-12 rounded-md px-5 py-3 text-sm font-semibold uppercase tracking-wide text-muted hover:bg-panel-warm">Cancel</button>
        </footer>
      </div>
    </dialog>, document.body) : null}
  </>;
}
