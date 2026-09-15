"use client";

import { X } from "lucide-react";
import { cn } from "@/components/ui/soft-surface";
import { SoftButton } from "@/components/ui/soft-button";
import { buildMixFilter, type MixFilter, type MixList, type MixRow } from "../roadmap-mix";

type RoadmapMixProps = {
  lists: MixList[];
  /** Titles the lists were built from — the category-filtered set, not the Mix-filtered one. */
  rankedTitleCount: number;
  isFiltered: boolean;
  activeFilter: MixFilter | null;
  onPick: (filter: MixFilter | null) => void;
};

export function RoadmapMix({ lists, rankedTitleCount, isFiltered, activeFilter, onPick }: RoadmapMixProps) {
  return (
    <section data-testid="roadmap-mix" className="grid min-w-0 gap-3 border-t border-hairline pt-4">
      <div className="flex flex-wrap items-baseline justify-between gap-3">
        <div className="grid min-w-0 gap-0.5">
          <h2 className="font-display text-[22px]">How the roadmap breaks down</h2>
          <p className="text-xs text-faint [text-wrap:pretty]">
            {isFiltered ? "Filtered view" : `All ${rankedTitleCount} ${rankedTitleCount === 1 ? "title" : "titles"}`} · ranked by minutes — click any row to filter the roadmap above.
          </p>
        </div>
        {activeFilter ? (
          <SoftButton type="button" variant="ghost" onClick={() => onPick(null)}>
            <X className="h-4 w-4" aria-hidden="true" />
            Clear filter
          </SoftButton>
        ) : null}
      </div>

      <div className="grid items-start gap-3.5 [grid-template-columns:repeat(auto-fit,minmax(248px,1fr))]">
        {lists.map((list) => (
          <section key={list.key} data-testid={`roadmap-mix-${list.key}`} className="grid h-[360px] min-w-0 grid-rows-[auto_minmax(0,1fr)] overflow-hidden rounded-soft border border-hairline bg-panel">
            <div className="grid gap-0.5 border-b border-hairline bg-panel-warm px-3.5 py-2.5">
              <h3 className="font-display text-[17px]">{list.label}</h3>
              <p className="text-[10.5px] font-semibold text-faint">{list.note}</p>
            </div>
            <div className="min-h-0 overflow-y-auto">
              {list.rows.length ? (
                list.rows.map((row) => <MixRowButton key={row.value || "__none__"} list={list} row={row} onPick={onPick} />)
              ) : (
                <p className="px-3.5 py-3 text-xs text-faint">Nothing to rank yet.</p>
              )}
            </div>
          </section>
        ))}
      </div>
    </section>
  );
}

function MixRowButton({ list, row, onPick }: { list: MixList; row: MixRow; onPick: (filter: MixFilter | null) => void }) {
  return (
    <button
      type="button"
      aria-pressed={row.isActive}
      aria-label={row.isActive ? `Clear ${list.label} ${row.name} filter` : `Filter by ${list.label} ${row.name}`}
      onClick={() => onPick(row.isActive ? null : buildMixFilter(list, row))}
      className={cn("grid w-full grid-cols-[15px_minmax(0,1fr)_44px] items-center gap-2.5 border-b border-hairline px-3.5 py-2.5 text-left transition-colors", row.isActive ? "bg-formed-blue-soft" : "hover:bg-panel-warm")}
    >
      <span className={cn("text-[11px] font-bold", row.isActive ? "text-formed-blue" : "text-tone-slate-line")}>{row.rank}</span>
      <span className="grid min-w-0 gap-1.5">
        {/* Truncation matters here — names like "Christian Formation" overflow 248px otherwise. */}
        <span className={cn("block truncate text-[13px] font-semibold leading-tight", row.isActive && "text-tone-blue-ink")}>{row.name}</span>
        <span className="flex min-w-0 items-center gap-2">
          <span className="h-1 min-w-0 flex-1 bg-tone-slate-bg">
            <span className={cn("block h-1", row.isActive ? "bg-formed-blue" : "bg-deep-teal")} style={{ width: `${row.percent}%` }} />
          </span>
          <span className="shrink-0 text-[10.5px] font-semibold text-faint">
            {row.titles} {row.titles === 1 ? "title" : "titles"}
          </span>
        </span>
      </span>
      <span className="text-right font-display text-[17px] text-deep-teal">{row.minutes.toLocaleString()}</span>
    </button>
  );
}
