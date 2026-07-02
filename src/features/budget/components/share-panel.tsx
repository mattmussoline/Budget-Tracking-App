"use client";

import { Trash2, UserPlus, Users } from "lucide-react";
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
    <SoftSurface className="bg-gray-100 p-6 md:p-8">
      <div className="mb-6 flex items-center gap-4">
        <div className="grid h-12 w-12 shrink-0 place-items-center rounded-lg bg-emerald-500">
          <Users className="h-5 w-5 text-white" aria-hidden="true" />
        </div>
        <div>
          <h2 className="font-display text-2xl font-extrabold tracking-tight">Collaborators</h2>
          <p className="text-sm font-medium text-muted">
            {isDemo
              ? "Connect Supabase to manage who can sign in."
              : "Add a work email here, then share the app link and shared password with that person."}
          </p>
        </div>
      </div>
      <form action={addCollaborator} className="grid gap-4">
        <SoftInput
          label="Collaborator email"
          name="email"
          type="email"
          placeholder="name@augustineinstitute.org"
          required
          disabled={isDemo}
        />
        <SoftButton type="submit" disabled={isDemo}>
          <UserPlus className="h-4 w-4" aria-hidden="true" />
          Allow access
        </SoftButton>
      </form>
      <div className="mt-6 grid gap-3">
        <h3 className="text-sm font-extrabold uppercase tracking-wide text-muted">Can sign in</h3>
        {allowedEmails.length > 0 ? (
          <ul className="grid gap-2">
            {allowedEmails.map((email) => {
              const isCurrentUser = email === currentUserEmail;

              return (
                <li key={email} className="flex min-h-12 items-center justify-between gap-3 rounded-md bg-white px-4 py-3">
                  <span className="min-w-0 truncate text-sm font-bold text-foreground">{email}</span>
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
                      className="min-h-10 px-3 py-2"
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
          <p className="rounded-md bg-white px-4 py-3 text-sm font-semibold text-muted">No collaborators have been added yet.</p>
        )}
      </div>
    </SoftSurface>
  );
}
