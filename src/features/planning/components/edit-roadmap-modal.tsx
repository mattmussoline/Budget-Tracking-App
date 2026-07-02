"use client";

import { type KeyboardEvent, type MouseEvent, type ReactNode, useEffect, useRef, useState } from "react";
import { X } from "lucide-react";
import { cn } from "@/components/ui/soft-surface";
import { TONE_CLASSES, type PlanningTone } from "../planning-constants";
import { formatRoadmapDate } from "../planning-model";
import type { RoadmapCategory, RoadmapItem } from "../planning-types";

type EditRoadmapModalProps = {
  item: RoadmapItem;
  category?: RoadmapCategory;
  children: ReactNode;
};

export function EditRoadmapModal({ item, category, children }: EditRoadmapModalProps) {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const [isOpen, setIsOpen] = useState(false);
  const tone = (category?.colorKey && category.colorKey in TONE_CLASSES ? category.colorKey : "slate") as PlanningTone;

  useEffect(() => {
    if (!isOpen) return;
    const dialog = dialogRef.current;
    if (!dialog) return;

    if (typeof dialog.showModal === "function" && !dialog.open) dialog.showModal();
    else dialog.setAttribute("open", "");
  }, [isOpen]);

  const openDialog = () => {
    setIsOpen(true);
  };

  const closeDialog = () => {
    const dialog = dialogRef.current;
    if (dialog?.open && typeof dialog.close === "function") dialog.close();
    else dialog?.removeAttribute("open");

    setIsOpen(false);
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

  return <>
    <button
      ref={triggerRef}
      type="button"
      onClick={openDialog}
      aria-label={`Edit ${item.title}`}
      className={cn("w-full rounded-md border-l-4 bg-white p-3 text-left transition-transform hover:-translate-y-0.5", TONE_CLASSES[tone].accent)}
    >
      <p className="font-extrabold leading-tight">{item.title}</p>
      <div className="mt-2 flex flex-wrap gap-2">
        {category ? <span className={cn("rounded-full px-2 py-1 text-[9px] font-extrabold uppercase", TONE_CLASSES[tone].chip)}>{category.name}</span> : null}
        {item.provider ? <span className="rounded-full bg-gray-100 px-2 py-1 text-[9px] font-bold">{item.provider}</span> : null}
        {item.releaseDate ? <span className={cn("rounded-full px-2 py-1 text-[9px] font-bold", item.releaseDate === "TBD" ? "bg-red-100 text-red-700" : "bg-gray-100")}>{item.releaseDate === "TBD" ? "TBD" : formatRoadmapDate(item.releaseDate)}</span> : null}
      </div>
    </button>
    {isOpen ? <dialog
      ref={dialogRef}
      aria-labelledby={`edit-roadmap-title-${item.id}`}
      onClick={closeFromBackdrop}
      onKeyDown={closeFromEscape}
      onClose={() => {
        setIsOpen(false);
        triggerRef.current?.focus();
      }}
      className="m-auto w-[calc(100%-2rem)] max-w-2xl rounded-xl bg-white p-0 text-foreground shadow-2xl backdrop:bg-gray-950/60"
    >
      <div className="flex max-h-[calc(100vh-2rem)] flex-col">
        <header className="flex shrink-0 items-start justify-between gap-4 border-b border-gray-200 p-5 sm:p-7">
          <div>
            <p className="text-xs font-extrabold uppercase tracking-wide text-blue-600">Roadmap</p>
            <h2 id={`edit-roadmap-title-${item.id}`} className="font-display text-3xl font-extrabold">Edit Roadmap Item</h2>
          </div>
          <button type="button" onClick={closeDialog} aria-label="Close edit roadmap modal" className="rounded-md bg-gray-100 p-3 text-muted transition-colors hover:bg-gray-200 hover:text-foreground">
            <X className="h-5 w-5" aria-hidden="true" />
          </button>
        </header>
        <div className="min-h-0 overflow-y-auto px-5 sm:px-7">{children}</div>
        <footer className="flex shrink-0 justify-end border-t border-gray-200 p-4 sm:px-7">
          <button type="button" onClick={closeDialog} className="min-h-12 rounded-md px-5 py-3 text-sm font-extrabold uppercase tracking-wide text-muted hover:bg-gray-100">Cancel</button>
        </footer>
      </div>
    </dialog> : null}
  </>;
}
