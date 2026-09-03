"use client";

import { type KeyboardEvent, type MouseEvent, type ReactNode, type SyntheticEvent, useCallback, useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { Maximize2, X } from "lucide-react";
import { cn } from "@/components/ui/soft-surface";

type DashboardPopoutProps = {
  title: string;
  eyebrow?: string;
  description?: string;
  toneClassName?: string;
  triggerClassName: string;
  trigger: ReactNode;
  children: ReactNode;
};

export function DashboardPopout({
  title,
  eyebrow,
  description,
  toneClassName = "bg-panel-warm text-foreground",
  triggerClassName,
  trigger,
  children
}: DashboardPopoutProps) {
  const [open, setOpen] = useState(false);
  const [mounted, setMounted] = useState(false);
  const dialogRef = useRef<HTMLDialogElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const titleId = `dashboard-popout-${title.toLowerCase().replace(/[^a-z0-9]+/g, "-")}`;

  const closeDialog = useCallback(() => {
    const dialog = dialogRef.current;
    if (dialog?.open && typeof dialog.close === "function") dialog.close();
    else dialog?.removeAttribute("open");
    setOpen(false);
    triggerRef.current?.focus();
  }, []);

  useEffect(() => setMounted(true), []);

  useEffect(() => {
    if (!open) return;
    const dialog = dialogRef.current;
    if (!dialog) return;

    if (typeof dialog.showModal === "function" && !dialog.open) dialog.showModal();
    else dialog.setAttribute("open", "");
  }, [open]);

  useEffect(() => {
    if (!open) return;

    function closeFromDocumentEscape(event: globalThis.KeyboardEvent) {
      if (event.key !== "Escape") return;
      event.preventDefault();
      closeDialog();
    }

    document.addEventListener("keydown", closeFromDocumentEscape);
    return () => document.removeEventListener("keydown", closeFromDocumentEscape);
  }, [closeDialog, open]);

  function closeFromBackdrop(event: MouseEvent<HTMLDialogElement>) {
    if (event.target === event.currentTarget) closeDialog();
  }

  function closeFromEscape(event: KeyboardEvent<HTMLDialogElement>) {
    if (event.key !== "Escape") return;
    event.preventDefault();
    closeDialog();
  }

  function closeFromCancel(event: SyntheticEvent<HTMLDialogElement>) {
    event.preventDefault();
    closeDialog();
  }

  return (
    <>
      <button
        ref={triggerRef}
        type="button"
        onClick={() => setOpen(true)}
        aria-label={`Open ${title}`}
        className={cn("soft-raised group relative min-w-0 rounded-lg text-left shadow-none transition hover:-translate-y-0.5 focus:outline-none focus-visible:ring-2 focus-visible:ring-formed-blue focus-visible:ring-offset-2", triggerClassName)}
      >
        <div key="trigger" className="contents">
          {trigger}
        </div>
        <span key="expand-icon" className="absolute right-4 top-4 grid h-8 w-8 place-items-center rounded-md bg-white/80 text-current opacity-0 shadow-sm ring-1 ring-black/5 transition group-hover:opacity-100 group-focus-visible:opacity-100">
          <Maximize2 className="h-4 w-4" aria-hidden="true" />
        </span>
      </button>

      {mounted && open
        ? createPortal(
            <dialog
              ref={dialogRef}
              open
              style={{ display: "block", visibility: "visible" }}
              aria-labelledby={titleId}
              onClick={closeFromBackdrop}
              onKeyDown={closeFromEscape}
              onCancel={closeFromCancel}
              onClose={() => setOpen(false)}
              className="fixed left-1/2 top-1/2 z-50 block w-[calc(100%-2rem)] max-w-5xl -translate-x-1/2 -translate-y-1/2 rounded-xl bg-white p-0 text-foreground shadow-2xl backdrop:bg-augustine-blue/60"
            >
              <div className="flex max-h-[calc(100vh-2rem)] flex-col">
                <header className={cn("flex shrink-0 items-start justify-between gap-4 border-b p-5 sm:p-7", toneClassName)}>
                  <div className="min-w-0">
                    {eyebrow ? <p className="text-xs font-semibold uppercase tracking-wide opacity-75">{eyebrow}</p> : null}
                    <h2 id={titleId} className="font-display text-3xl tracking-tight">
                      {title}
                    </h2>
                    {description ? <p className="mt-1 text-sm font-bold opacity-75">{description}</p> : null}
                  </div>
                  <button
                    type="button"
                    onClick={closeDialog}
                    aria-label={`Close ${title}`}
                    className="rounded-md bg-white p-3 text-foreground shadow-sm ring-1 ring-hairline transition-colors hover:bg-panel-warm"
                  >
                    <X className="h-5 w-5" aria-hidden="true" />
                  </button>
                </header>
                <div className="min-h-0 overflow-y-auto p-5 sm:p-7">{children}</div>
                <footer className="flex shrink-0 justify-end border-t border-hairline p-4 sm:px-7">
                  <button type="button" onClick={closeDialog} className="min-h-12 rounded-md px-5 py-3 text-sm font-semibold uppercase tracking-wide text-muted hover:bg-panel-warm">
                    Close
                  </button>
                </footer>
              </div>
            </dialog>,
            document.body
          )
        : null}
    </>
  );
}
