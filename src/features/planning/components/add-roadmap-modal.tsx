"use client";

import { type MouseEvent, type ReactNode, useRef } from "react";
import { CalendarPlus, X } from "lucide-react";

type AddRoadmapModalProps = {
  children: ReactNode;
};

export function AddRoadmapModal({ children }: AddRoadmapModalProps) {
  const dialogRef = useRef<HTMLDialogElement>(null);

  const openDialog = () => {
    const dialog = dialogRef.current;
    if (!dialog) return;

    if (typeof dialog.showModal === "function") dialog.showModal();
    else dialog.setAttribute("open", "");
  };

  const closeDialog = () => {
    const dialog = dialogRef.current;
    if (!dialog) return;

    if (typeof dialog.close === "function") dialog.close();
    else dialog.removeAttribute("open");
  };

  const closeFromBackdrop = (event: MouseEvent<HTMLDialogElement>) => {
    if (event.target === event.currentTarget) closeDialog();
  };

  return <>
    <button type="button" onClick={openDialog} className="inline-flex min-h-12 items-center justify-center gap-2 rounded-md bg-blue-500 px-5 py-3 text-sm font-extrabold uppercase tracking-wide text-white transition-all duration-200 hover:scale-[1.03] hover:bg-blue-600 active:scale-[0.98]">
      <CalendarPlus className="h-4 w-4" aria-hidden="true" />
      Add Roadmap Item
    </button>
    <dialog ref={dialogRef} aria-labelledby="add-roadmap-title" onClick={closeFromBackdrop} className="m-auto w-[calc(100%-2rem)] max-w-2xl rounded-xl bg-white p-0 text-foreground shadow-2xl backdrop:bg-gray-950/60">
      <div className="max-h-[calc(100vh-2rem)] overflow-y-auto p-5 sm:p-7">
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="text-xs font-extrabold uppercase tracking-wide text-blue-600">Roadmap</p>
            <h2 id="add-roadmap-title" className="font-display text-3xl font-extrabold">Add Roadmap Item</h2>
          </div>
          <button type="button" onClick={closeDialog} aria-label="Close add roadmap modal" className="rounded-md bg-gray-100 p-3 text-muted transition-colors hover:bg-gray-200 hover:text-foreground">
            <X className="h-5 w-5" aria-hidden="true" />
          </button>
        </div>
        {children}
        <div className="mt-3 flex justify-end">
          <button type="button" onClick={closeDialog} className="min-h-12 rounded-md px-5 py-3 text-sm font-extrabold uppercase tracking-wide text-muted hover:bg-gray-100">Cancel</button>
        </div>
      </div>
    </dialog>
  </>;
}
