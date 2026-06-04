import { Users } from "lucide-react";
import { SoftButton } from "@/components/ui/soft-button";
import { SoftInput } from "@/components/ui/soft-input";
import { SoftSelect } from "@/components/ui/soft-select";
import { SoftSurface } from "@/components/ui/soft-surface";
import { addCollaborator } from "../budget-actions";

type SharePanelProps = {
  fiscalYearId: string;
  isDemo?: boolean;
};

export function SharePanel({ fiscalYearId, isDemo }: SharePanelProps) {
  return (
    <SoftSurface className="p-6 md:p-8">
      <div className="mb-6 flex items-center gap-4">
        <div className="grid h-12 w-12 shrink-0 place-items-center rounded-2xl soft-inset-deep">
          <Users className="h-5 w-5 text-accent" aria-hidden="true" />
        </div>
        <div>
          <h2 className="font-display text-2xl font-extrabold tracking-tight">Share</h2>
          <p className="text-sm font-medium text-muted">
            {isDemo ? "Connect Supabase to invite your boss as an editor." : "Add your boss after he signs in once."}
          </p>
        </div>
      </div>
      <form action={addCollaborator} className="grid gap-4">
        <input type="hidden" name="fiscalYearId" value={fiscalYearId} />
        <SoftInput label="Collaborator user id" name="userId" placeholder="Supabase user id" required disabled={isDemo} />
        <SoftSelect
          label="Role"
          name="role"
          defaultValue="editor"
          disabled={isDemo}
          options={[
            { label: "Editor", value: "editor" },
            { label: "Viewer", value: "viewer" }
          ]}
        />
        <SoftButton type="submit" disabled={isDemo}>
          Add collaborator
        </SoftButton>
      </form>
    </SoftSurface>
  );
}
