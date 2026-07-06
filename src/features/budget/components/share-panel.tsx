"use client";

import { ChevronDown, Trash2, UserPlus, Users } from "lucide-react";
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
    <SoftSurface className="overflow-hidden border border-gray-200 bg-white">
      <details className="group">
        <summary className="flex cursor-pointer list-none flex-col gap-4 p-5 marker:hidden sm:flex-row sm:items-start sm:justify-between md:p-6">
          <div className="flex min-w-0 items-start gap-3">
            <div className="grid h-10 w-10 shrink-0 place-items-center rounded-md bg-emerald-500">
              <Users className="h-5 w-5 text-white" aria-hidden="true" />
            </div>
            <div className="min-w-0">
              <h2 className="font-display text-xl font-extrabold tracking-tight">Collaborators</h2>
              <p className="max-w-xl text-sm font-medium leading-6 text-muted">
                {isDemo
                  ? "Connect Supabase to manage who can sign in."
                  : "Add an approved work email, then share the app link and shared password."}
              </p>
            </div>
          </div>
          <div className="flex w-fit shrink-0 items-center gap-2">
            <div className="rounded-md bg-gray-100 px-3 py-2 text-xs font-extrabold uppercase tracking-wide text-muted">
              {allowedEmails.length} {allowedEmails.length === 1 ? "person" : "people"}
            </div>
            <ChevronDown className="h-4 w-4 text-muted transition-transform group-open:rotate-180" aria-hidden="true" />
          </div>
        </summary>
        <div className="grid gap-5 border-t border-gray-200 p-5 pt-4 md:p-6 md:pt-5">
          <form action={addCollaborator} className="grid gap-3 rounded-lg bg-gray-100 p-3">
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
              <h3 className="text-xs font-extrabold uppercase tracking-wide text-muted">Can sign in</h3>
              <span className="hidden text-xs font-bold text-muted sm:inline">Augustine email required</span>
            </div>
            {allowedEmails.length > 0 ? (
              <ul className="divide-y divide-gray-200 overflow-hidden rounded-lg border border-gray-200 bg-white">
                {allowedEmails.map((email) => {
                  const isCurrentUser = email === currentUserEmail;

                  return (
                    <li key={email} className="flex min-h-14 items-center justify-between gap-3 px-4 py-3">
                      <div className="min-w-0">
                        <span className="block truncate text-sm font-bold text-foreground">{email}</span>
                        {isCurrentUser ? <span className="text-xs font-bold text-muted">You</span> : null}
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
                          className="min-h-9 rounded-full px-3 py-2 hover:bg-red-50 hover:text-red-600 disabled:hover:bg-transparent"
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
              <p className="rounded-lg border border-dashed border-gray-300 bg-gray-50 px-4 py-4 text-sm font-semibold text-muted">
                No collaborators have been added yet.
              </p>
            )}
          </div>
        </div>
      </details>
    </SoftSurface>
  );
}
