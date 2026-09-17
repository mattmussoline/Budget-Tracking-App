"use client";

import { X } from "lucide-react";
import { cn } from "@/components/ui/soft-surface";
import {
  LANE_LABELS,
  PRIORITY_LIMIT,
  QUEUE_GROUP_ORDER,
  type QueueLane,
  needsDecisionItems,
  radarFollowUpCount
} from "../content-review-queue";
import { REVIEW_STATUSES, TONE_BORDER_L_CLASSES, TONE_INK_CLASSES, TONE_SWATCH_CLASSES } from "../planning-constants";
import type { ContentReviewItem } from "../planning-types";
import { TitleCaps } from "./title-caps";

type ContentReviewRailProps = {
  items: ContentReviewItem[];
  priorities: ContentReviewItem[];
  lane: QueueLane;
  canEdit: boolean;
  onSelectLane: (lane: QueueLane) => void;
  onSelectPriority: (id: string) => void;
  onRemovePriority: (id: string) => void;
  onAddPriority: () => void;
};

const laneAccent: Record<"needs" | "priorities" | "all", string> = {
  needs: "border-l-formed-blue",
  priorities: "border-l-tone-amber-line",
  all: "border-l-ink"
};

export function ContentReviewRail({ items, priorities, lane, canEdit, onSelectLane, onSelectPriority, onRemovePriority, onAddPriority }: ContentReviewRailProps) {
  const totalCount = items.filter((item) => item.id !== "draft").length;
  const needsCount = needsDecisionItems(items).length;
  const radarCount = radarFollowUpCount(items);

  return (
    <aside className="w-full shrink-0 self-stretch border-b border-hairline bg-panel-warm px-4 pb-8 pt-6 md:w-[234px] md:border-b-0 md:border-r">
      <section aria-labelledby="content-review-priorities-heading" className="mb-6">
        <div className="mb-1 flex items-center justify-between">
          <h2 id="content-review-priorities-heading" className="font-display text-lg leading-none">Priorities</h2>
          <span className="text-[11px] font-semibold text-muted">{priorities.length} of {PRIORITY_LIMIT}</span>
        </div>
        <ol className="border-t border-hairline">
          {priorities.map((item, index) => {
            const status = REVIEW_STATUSES.find((option) => option.value === item.reviewStatus) ?? REVIEW_STATUSES[0];
            const label = item.title || "Untitled review";
            return (
              <li key={item.id} className="flex items-center gap-2 border-b border-hairline py-2.5">
                <span aria-hidden="true" className="w-[9px] shrink-0 font-display text-[14px] leading-none text-muted">{index + 1}</span>
                <span aria-hidden="true" className={cn("h-1.5 w-1.5 shrink-0", TONE_SWATCH_CLASSES[status.tone])} />
                <button
                  type="button"
                  onClick={() => onSelectPriority(item.id)}
                  style={{ fontFamily: "var(--font-cormorant-garamond)" }}
                  className="min-w-0 flex-1 truncate text-left text-[13.5px] font-semibold leading-[1.35] [overflow-wrap:anywhere] hover:text-formed-blue focus:outline-none focus-visible:ring-2 focus-visible:ring-formed-blue"
                >
                  {item.title ? <TitleCaps text={item.title} /> : label}
                </button>
                <button
                  type="button"
                  disabled={!canEdit}
                  onClick={() => onRemovePriority(item.id)}
                  aria-label={`Remove ${label} from Priorities`}
                  className="flex h-[14px] w-[14px] shrink-0 items-center justify-center text-faint transition hover:text-foreground disabled:opacity-40"
                >
                  <X className="h-3 w-3" aria-hidden="true" />
                </button>
              </li>
            );
          })}
          {priorities.length < PRIORITY_LIMIT ? (
            <li className="border-b border-hairline py-[7px]">
              <button
                type="button"
                disabled={!canEdit}
                onClick={onAddPriority}
                className="flex w-full items-center gap-2 text-left text-[11.5px] font-semibold text-formed-blue disabled:opacity-40"
              >
                <span aria-hidden="true" className="flex h-[15px] w-[15px] shrink-0 items-center justify-center border border-formed-blue-border bg-formed-blue-soft text-[11px] leading-none">+</span>
                Add another priority
              </button>
            </li>
          ) : null}
        </ol>
      </section>

      <section aria-labelledby="content-review-queue-lanes-heading">
        <h2 id="content-review-queue-lanes-heading" className="mb-1.5 text-[10.5px] font-semibold uppercase tracking-[.08em] text-muted">Queue</h2>
        <div className="flex flex-col gap-px">
          <LaneButton
            label={LANE_LABELS.needs}
            count={needsCount}
            selected={lane === "needs"}
            accentClass={laneAccent.needs}
            onClick={() => onSelectLane("needs")}
          />
          <LaneButton
            label={LANE_LABELS.priorities}
            count={priorities.length}
            selected={lane === "priorities"}
            accentClass={laneAccent.priorities}
            onClick={() => onSelectLane("priorities")}
          />
          <LaneButton
            label={LANE_LABELS.all}
            count={totalCount}
            selected={lane === "all"}
            accentClass={laneAccent.all}
            onClick={() => onSelectLane("all")}
          />
          {QUEUE_GROUP_ORDER.map((statusValue) => {
            const status = REVIEW_STATUSES.find((option) => option.value === statusValue) ?? REVIEW_STATUSES[0];
            const count = items.filter((item) => item.reviewStatus === statusValue).length;
            const badge =
              statusValue === "on_the_radar" && radarCount > 0
                ? `${radarCount} to follow up`
                : null;
            return (
              <LaneButton
                key={statusValue}
                label={status.label}
                count={count}
                selected={lane === statusValue}
                restingInkClass={TONE_INK_CLASSES[status.tone]}
                accentLineClass={TONE_BORDER_L_CLASSES[status.tone]}
                badge={badge}
                onClick={() => onSelectLane(statusValue)}
              />
            );
          })}
        </div>
      </section>
    </aside>
  );
}

function LaneButton({
  label,
  count,
  selected,
  accentClass,
  accentLineClass,
  restingInkClass,
  badge,
  onClick
}: {
  label: string;
  count: number;
  selected: boolean;
  accentClass?: string;
  accentLineClass?: string;
  restingInkClass?: string;
  badge?: string | null;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-current={selected ? "true" : undefined}
      className={cn(
        "flex flex-col gap-[5px] border-l-[3px] px-2.5 py-2 text-left transition-colors hover:bg-panel",
        selected ? cn(accentLineClass ?? accentClass, "bg-panel") : "border-l-transparent bg-transparent"
      )}
    >
      <span className="flex items-center gap-2">
        <span className={cn("min-w-0 flex-1 truncate text-[13px]", selected ? "font-semibold text-foreground" : cn("font-medium", restingInkClass ?? "text-muted"))}>{label}</span>
        <span className={cn("text-[13px] font-bold tabular-nums", selected ? "text-foreground" : (restingInkClass ?? "text-muted"))}>{count}</span>
      </span>
      {badge ? (
        <span className="w-fit self-start whitespace-nowrap border border-tone-amber-line bg-tone-amber-bg px-1.5 py-[3px] text-[9.5px] font-bold text-tone-amber-ink">{badge}</span>
      ) : null}
    </button>
  );
}
