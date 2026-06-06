import { cn } from "@/components/ui/soft-surface";
import type { ReleaseCategory, RoadmapRelease } from "../roadmap-types";

type ReleaseCardProps = {
  release: RoadmapRelease;
  onEdit: () => void;
};

const categoryStrip: Record<ReleaseCategory, string> = {
  parish: "bg-blue-500",
  adult: "bg-amber-500",
  kids: "bg-emerald-500",
  progress: "bg-violet-500",
  risk: "bg-red-400",
  discussion: "bg-gray-500"
};

const tagTone: Record<ReleaseCategory, string> = {
  parish: "bg-blue-100 text-blue-800",
  adult: "bg-amber-100 text-amber-800",
  kids: "bg-emerald-100 text-emerald-800",
  progress: "bg-violet-100 text-violet-800",
  risk: "bg-red-100 text-red-800",
  discussion: "bg-gray-200 text-gray-800"
};

export function ReleaseCard({ release, onEdit }: ReleaseCardProps) {
  const dateIsRisk = release.releaseDate.toLowerCase().includes("tbd") || release.releaseDate.toLowerCase().includes("needs");

  return (
    <button
      type="button"
      className="group relative w-full overflow-hidden rounded-lg bg-white p-3 pl-4 text-left transition-all duration-200 hover:scale-[1.015] hover:bg-blue-50 focus-visible:bg-blue-50"
      onClick={onEdit}
    >
      <span className={cn("absolute inset-y-0 left-0 w-2", categoryStrip[release.category])} aria-hidden="true" />
      <h3 className="font-display text-sm font-extrabold leading-tight tracking-tight text-gray-950">{release.title}</h3>
      <div className="mt-2 flex flex-wrap gap-1.5">
        <Tag className={tagTone[release.category]}>{release.audience}</Tag>
        <Tag className="bg-blue-100 text-blue-800">{release.format}</Tag>
        <Tag className={dateIsRisk ? "bg-red-100 text-red-800" : "bg-gray-100 text-gray-700"}>{release.releaseDate}</Tag>
      </div>
      <div className="mt-2 flex flex-wrap gap-1.5">
        <Tag className={tagTone[release.category]}>{release.status}</Tag>
        {release.host ? <Tag className="bg-gray-100 text-gray-700">{release.host}</Tag> : null}
      </div>
      <p className="mt-2 text-xs font-semibold leading-5 text-gray-600">{release.notes}</p>
    </button>
  );
}

function Tag({ children, className }: { children: React.ReactNode; className: string }) {
  return <span className={cn("rounded-full px-2 py-0.5 text-[10px] font-extrabold uppercase tracking-wide", className)}>{children}</span>;
}
