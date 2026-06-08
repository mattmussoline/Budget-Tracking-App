import { cn } from "@/components/ui/soft-surface";
import { getReleaseColor } from "../release-colors";
import type { RoadmapRelease } from "../roadmap-types";

type ReleaseCardProps = {
  release: RoadmapRelease;
  onEdit: () => void;
};

export function ReleaseCard({ release, onEdit }: ReleaseCardProps) {
  const dateIsRisk = release.releaseDate.toLowerCase().includes("tbd") || release.releaseDate.toLowerCase().includes("needs");
  const color = getReleaseColor(release);

  return (
    <button
      type="button"
      className={cn(
        "group relative w-full overflow-hidden rounded-lg bg-white p-3 pl-4 text-left transition-all duration-200 hover:scale-[1.015]",
        color.hover
      )}
      onClick={onEdit}
    >
      <span className={cn("absolute inset-y-0 left-0 w-2", color.strip)} aria-hidden="true" />
      <h3 className="font-display text-sm font-extrabold leading-tight tracking-tight text-gray-950">{release.title || "Untitled Release"}</h3>
      <div className="mt-2 flex flex-wrap gap-1.5">
        {release.audience ? <Tag className={color.tag}>{release.audience}</Tag> : null}
        {release.format ? <Tag className="bg-blue-100 text-blue-800">{release.format}</Tag> : null}
        {release.releaseDate ? <Tag className={dateIsRisk ? "bg-red-100 text-red-800" : "bg-cyan-100 text-cyan-800"}>{release.releaseDate}</Tag> : null}
      </div>
      <div className="mt-2 flex flex-wrap gap-1.5">
        {release.status ? <Tag className={color.tag}>{release.status}</Tag> : null}
        {release.series ? <Tag className="bg-indigo-100 text-indigo-800">{release.series}</Tag> : null}
      </div>
      {release.notes ? <p className="mt-2 text-xs font-semibold leading-5 text-gray-600">{release.notes}</p> : null}
    </button>
  );
}

function Tag({ children, className }: { children: React.ReactNode; className: string }) {
  return <span className={cn("rounded-full px-2 py-0.5 text-[10px] font-extrabold uppercase tracking-wide", className)}>{children}</span>;
}
