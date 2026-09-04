"use client";

import { ChevronDown, Trash2, UserPlus } from "lucide-react";
import { SoftButton } from "@/components/ui/soft-button";
import { SoftInput } from "@/components/ui/soft-input";
import { SoftSurface } from "@/components/ui/soft-surface";
import { addCollaborator, removeCollaborator } from "../budget-actions";

type SharePanelProps = {
  allowedEmails: string[];
  currentUserEmail?: string;
  isDemo?: boolean;
};

export function SharePanel({ allowedEmails, currentUserEmail, isDemo }: SharePanelProps) {
  return (
    <SoftSurface className="overflow-hidden bg-panel-warm">
      <details className="group">
        <summary className="flex cursor-pointer list-none items-center justify-between gap-3.5 px-5 py-[18px] marker:hidden">
          <div className="grid min-w-0 gap-0.5">
            <h2 className="font-display text-lg">Collaborators</h2>
            <p className="text-xs text-muted [text-wrap:pretty]">
              {isDemo
                ? "Connect Supabase to manage who can sign in."
                : "Add an approved work email, then share the app link and shared password."}
            </p>
          </div>
          <div className="flex w-fit shrink-0 items-center gap-2">
            <span className="rounded-md bg-tone-slate-bg px-2 py-0.5 text-[11px] font-bold text-muted">
              {allowedEmails.length} {allowedEmails.length === 1 ? "person" : "people"}
            </span>
            <ChevronDown className="h-4 w-4 text-muted transition-transform group-open:rotate-180" aria-hidden="true" />
          </div>
        </summary>
        <div className="grid gap-5 border-t border-hairline p-5">
          <form action={addCollaborator} className="grid gap-2.5">
            <SoftInput
              label="Collaborator email"
              name="email"
              type="email"
              placeholder="name@augustineinstitute.org"
              required
              disabled={isDemo}
              surface="white"
            />
            <SoftButton type="submit" variant="primary" className="w-full" disabled={isDemo}>
              <UserPlus className="h-4 w-4" aria-hidden="true" />
              Allow access
            </SoftButton>
          </form>
          <div className="grid gap-3">
            <div className="flex items-center justify-between gap-3">
              <h3 className="text-xs font-semibold text-muted">Can sign in</h3>
              <span className="hidden text-xs text-faint sm:inline">Augustine email required</span>
            </div>
            {allowedEmails.length > 0 ? (
              <ul className="divide-y divide-hairline overflow-hidden rounded-lg border border-hairline bg-panel">
                {allowedEmails.map((email) => {
                  const isCurrentUser = email === currentUserEmail;

                  return (
                    <li key={email} className="flex min-h-14 items-center justify-between gap-3 px-4 py-3">
                      <div className="min-w-0">
                        <span className="block truncate text-sm font-semibold text-foreground">{email}</span>
                        {isCurrentUser ? <span className="text-xs text-muted">You</span> : null}
                      </div>
                      <form
                        action={removeCollaborator}
                        onSubmit={(event) => {
                          if (!window.confirm(`Remove ${email} from app access?`)) {
                            event.preventDefault();
                          }
                        }}
                      >
                        <input type="hidden" name="email" value={email} />
                        <SoftButton
                          type="submit"
                          variant="ghost"
                          className="min-h-9 rounded-full px-3 py-2 hover:bg-danger-soft hover:text-danger disabled:hover:bg-transparent"
                          disabled={isDemo || isCurrentUser}
                          title={isCurrentUser ? "You cannot remove your own access while signed in." : "Remove access"}
                        >
                          <Trash2 className="h-4 w-4" aria-hidden="true" />
                          <span className="sr-only">Remove {email}</span>
                        </SoftButton>
                      </form>
                    </li>
                  );
                })}
              </ul>
            ) : (
              <p className="rounded-lg border border-dashed border-hairline bg-panel-warm px-4 py-4 text-sm font-semibold text-muted">
                No collaborators have been added yet.
              </p>
            )}
          </div>
        </div>
      </details>
    </SoftSurface>
  );
}
