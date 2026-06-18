import { Users } from "lucide-react";
import { SoftButton } from "@/components/ui/soft-button";
import { SoftInput } from "@/components/ui/soft-input";
import { SoftSurface } from "@/components/ui/soft-surface";
import { inviteInternalUser } from "../auth-actions";

type SharePanelProps = {
  canInvite: boolean;
  isDemo?: boolean;
  invitedUsers: Array<{
    email: string;
    invited_by_email: string;
    created_at: string;
  }>;
};

export function SharePanel({ canInvite, invitedUsers, isDemo }: SharePanelProps) {
  const isDisabled = isDemo || !canInvite;

  return (
    <SoftSurface className="bg-gray-100 p-6 md:p-8">
      <div className="mb-6 flex items-center gap-4">
        <div className="grid h-12 w-12 shrink-0 place-items-center rounded-lg bg-emerald-500">
          <Users className="h-5 w-5 text-white" aria-hidden="true" />
        </div>
        <div>
          <h2 className="font-display text-2xl font-extrabold tracking-tight">Access</h2>
          <p className="text-sm font-medium text-muted">
            {canInvite ? "Invite approved internal emails." : "Matt manages invited users for now."}
          </p>
        </div>
      </div>
      <form action={inviteInternalUser} className="grid gap-4">
        <SoftInput
          label="Invite email"
          name="email"
          type="email"
          placeholder="name@augustineinstitute.org"
          required
          disabled={isDisabled}
        />
        <SoftButton type="submit" disabled={isDisabled}>
          Invite user
        </SoftButton>
      </form>
      {invitedUsers.length > 0 ? (
        <div className="mt-6 grid gap-2">
          <p className="text-xs font-extrabold uppercase tracking-wide text-muted">Invited users</p>
          <ul className="grid gap-2">
            {invitedUsers.map((user) => (
              <li className="rounded-md bg-white px-3 py-2 text-sm font-semibold text-foreground" key={user.email}>
                {user.email}
              </li>
            ))}
          </ul>
        </div>
      ) : null}
    </SoftSurface>
  );
}
