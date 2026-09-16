"use client";

import Link from "next/link";
import type { Route } from "next";
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
  /** Licensing Summary for this fiscal year, where the cost side of the roadmap lives. */
  summaryHref?: string;
  summaryLabel?: string;
};

export function RoadmapMix({ lists, rankedTitleCount, isFiltered, activeFilter, onPick, summaryHref, summaryLabel }: RoadmapMixProps) {
  return (
    <section data-testid="roadmap-mix" className="grid min-w-0 gap-4 border-t border-hairline pt-6">
      <div className="flex flex-wrap items-baseline justify-between gap-3">
        <div className="grid min-w-0 gap-1">
          <h2 className="font-display text-[26px] leading-[1.15]">How the roadmap breaks down</h2>
          <p className="text-[13px] text-muted [text-wrap:pretty]">
            {isFiltered ? "Filtered view" : `All ${rankedTitleCount} ${rankedTitleCount === 1 ? "title" : "titles"}`} · ranked by minutes — click any row to filter the roadmap above.
          </p>
        </div>
        {activeFilter ? (
          <SoftButton type="button" variant="ghost" className="rounded-none" onClick={() => onPick(null)}>
            <X className="h-4 w-4" aria-hidden="true" />
            Clear filter
          </SoftButton>
        ) : null}
      </div>

      <div className="grid items-start gap-4 [grid-template-columns:repeat(auto-fit,minmax(248px,1fr))]">
        {lists.map((list) => (
          <section key={list.key} data-testid={`roadmap-mix-${list.key}`} className="grid h-[400px] min-w-0 grid-rows-[auto_minmax(0,1fr)] overflow-hidden border border-hairline bg-panel">
            <div className="grid gap-1 border-b border-hairline bg-panel-warm px-4 py-3">
              <h3 className="font-display text-[19px] leading-tight">{list.label}</h3>
              <p className="text-[11px] font-semibold text-faint">{list.note}</p>
            </div>
            <div className="roadmap-scroll min-h-0 overflow-y-auto">
              {list.rows.length ? (
                list.rows.map((row) => <MixRowButton key={row.value || "__none__"} list={list} row={row} onPick={onPick} />)
              ) : (
                <p className="px-4 py-3 text-xs text-faint">Nothing to rank yet.</p>
              )}
            </div>
          </section>
        ))}
      </div>

      {summaryHref ? (
        <p className="text-[13px] text-muted">
          Cost and licensing totals stay on the Licensing Summary dashboard.{" "}
          <Link href={summaryHref as Route} className="font-semibold text-formed-blue transition-colors hover:text-formed-blue-hover">
            Open {summaryLabel ?? "the"} summary
          </Link>
        </p>
      ) : null}
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
      className={cn("grid w-full grid-cols-[16px_minmax(0,1fr)_48px] items-center gap-3 border-b border-hairline px-4 py-3 text-left transition-colors", row.isActive ? "bg-formed-blue-soft" : "hover:bg-panel-warm")}
    >
      <span className={cn("text-[11px] font-bold", row.isActive ? "text-formed-blue" : "text-tone-slate-line")}>{row.rank}</span>
      <span className="grid min-w-0 gap-2">
        {/* Truncation matters here — names like "Christian Formation" overflow 248px otherwise. */}
        <span className={cn("block truncate text-[13.5px] font-semibold leading-snug", row.isActive && "text-tone-blue-ink")}>{row.name}</span>
        <span className="h-[3px] min-w-0 bg-tone-slate-bg">
          <span className={cn("block h-[3px]", row.isActive ? "bg-formed-blue" : "bg-deep-teal")} style={{ width: `${row.percent}%` }} />
        </span>
      </span>
      <span className="text-right font-display text-[19px] leading-none text-deep-teal">{row.minutes.toLocaleString()}</span>
    </button>
  );
}
