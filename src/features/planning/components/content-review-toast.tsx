"use client";

import { useEffect } from "react";

export type ContentReviewToastState = { message: string; undo?: () => void } | null;

/** Bottom-center undo toast. Auto-dismisses after 5s; the undo action (when present) restores a full items snapshot. */
export function ContentReviewToast({ toast, onDismiss }: { toast: ContentReviewToastState; onDismiss: () => void }) {
  useEffect(() => {
    if (!toast) return;
    const timer = window.setTimeout(onDismiss, 5000);
    return () => window.clearTimeout(timer);
  }, [toast, onDismiss]);

  if (!toast) return null;

  return (
    <div
      role="status"
      className="fixed inset-x-0 bottom-6 z-[70] flex justify-center px-4"
      style={{ animation: "fadein 150ms ease" }}
    >
      <div className="flex items-center gap-4 bg-augustine-blue px-4 py-3 text-white shadow-[0_4px_20px_rgba(0,0,0,.2)]">
        <p className="text-[12.5px] font-medium">{toast.message}</p>
        {toast.undo ? (
          <button
            type="button"
            onClick={() => {
              toast.undo?.();
              onDismiss();
            }}
            className="border border-white/40 px-2.5 py-1 text-[12px] font-semibold text-white transition hover:bg-white/10"
          >
            Undo
          </button>
        ) : null}
      </div>
    </div>
  );
}
