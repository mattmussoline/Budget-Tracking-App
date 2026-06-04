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
    <SoftSurface className="bg-gray-100 p-6 md:p-8">
      <div className="mb-6 flex items-center gap-4">
        <div className="grid h-12 w-12 shrink-0 place-items-center rounded-lg bg-emerald-500">
          <Users className="h-5 w-5 text-white" aria-hidden="true" />
        </div>
        <div>
          <h2 className="font-display text-2xl font-extrabold tracking-tight">Collaborators</h2>
          <p className="text-sm font-medium text-muted">
            {isDemo
              ? "Connect Supabase to invite your boss as an editor."
              : "Share the app link. They sign in with an Augustine email once, then you add that email here."}
          </p>
        </div>
      </div>
      <form action={addCollaborator} className="grid gap-4">
        <input type="hidden" name="fiscalYearId" value={fiscalYearId} />
        <SoftInput
          label="Collaborator email"
          name="email"
          type="email"
          placeholder="name@augustineinstitute.org"
          required
          disabled={isDemo}
        />
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
