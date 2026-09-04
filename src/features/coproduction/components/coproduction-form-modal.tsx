"use client";

import { type MouseEvent, type ReactNode, useEffect, useId, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { Plus, X } from "lucide-react";
import { cn } from "@/components/ui/soft-surface";

type CoproductionFormModalProps = {
  children: ReactNode;
  eyebrow: string;
  heading: string;
  triggerLabel: string;
  triggerAriaLabel?: string;
  triggerClassName?: string;
  triggerIcon?: ReactNode;
};

/** Same pop-out shell as {@link AddRoadmapModal}, generalized so co-production's add and edit forms can both use it. */
export function CoproductionFormModal({
  children,
  eyebrow,
  heading,
  triggerLabel,
  triggerAriaLabel,
  triggerClassName,
  triggerIcon = <Plus className="h-4 w-4" aria-hidden="true" />
}: CoproductionFormModalProps) {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const [isOpen, setIsOpen] = useState(false);
  const titleId = `${useId()}-coproduction-form-title`;

  useEffect(() => {
    if (!isOpen) return;
    const dialog = dialogRef.current;
    if (!dialog) return;

    if (typeof dialog.showModal === "function" && !dialog.open) dialog.showModal();
    else dialog.setAttribute("open", "");
  }, [isOpen]);

  const openDialog = () => setIsOpen(true);

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

  return <>
    <button
      ref={triggerRef}
      type="button"
      onClick={openDialog}
      aria-label={triggerAriaLabel}
      className={cn("inline-flex min-h-10 items-center justify-center gap-2 rounded-lg border border-formed-blue bg-formed-blue px-3.5 py-2 text-[13px] font-semibold text-white transition-colors hover:border-formed-blue-hover hover:bg-formed-blue-hover", triggerClassName)}
    >
      {triggerIcon}
      {triggerLabel}
    </button>
    {isOpen ? createPortal(<dialog
      ref={dialogRef}
      open={isOpen}
      style={{ display: "block", visibility: "visible" }}
      aria-labelledby={titleId}
      onClick={closeFromBackdrop}
      onClose={() => {
        setIsOpen(false);
        triggerRef.current?.focus();
      }}
      className="fixed left-1/2 top-1/2 z-50 block w-[calc(100%-2rem)] max-w-3xl -translate-x-1/2 -translate-y-1/2 rounded-xl bg-white p-0 text-foreground shadow-2xl backdrop:bg-augustine-blue/60"
    >
      <div className="max-h-[calc(100vh-2rem)] overflow-y-auto p-5 sm:p-7">
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wide text-formed-blue">{eyebrow}</p>
            <h2 id={titleId} className="font-display text-3xl">{heading}</h2>
          </div>
          <button type="button" onClick={closeDialog} aria-label="Close" className="rounded-md bg-panel-warm p-3 text-muted transition-colors hover:bg-hairline hover:text-foreground">
            <X className="h-5 w-5" aria-hidden="true" />
          </button>
        </div>
        {children}
        <div className="mt-3 flex justify-end">
          <button type="button" onClick={closeDialog} className="min-h-12 rounded-md px-5 py-3 text-sm font-semibold uppercase tracking-wide text-muted hover:bg-panel-warm">Close</button>
        </div>
      </div>
    </dialog>, document.body) : null}
  </>;
}
