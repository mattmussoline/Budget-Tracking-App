"use client";

import Link from "next/link";
import { ArrowLeft, CalendarDays, ClipboardCheck, Eye, EyeOff } from "lucide-react";
import { useMemo, useState } from "react";
import { cn } from "@/components/ui/soft-surface";
import { RoadmapFilters } from "./roadmap-filters";
import { RoadmapHero } from "./roadmap-hero";
import { RoadmapStats } from "./roadmap-stats";
import { MonthColumn } from "./month-column";
import { OngoingSeriesTable } from "./ongoing-series-table";
import { RoadmapEditDialog, type ReleaseFieldOptions } from "./roadmap-edit-dialog";
import { filterRoadmapMonths } from "../roadmap-filter";
import { ongoingSeries as initialOngoingSeries, roadmapFilters, roadmapMonths as initialRoadmapMonths } from "../roadmap-data";
import { buildFiscalYearStats, getCurrentFiscalYear, getVisibleRoadmapMonths } from "../roadmap-model";
import type { OngoingSeries, RoadmapFilter, RoadmapMonth, RoadmapRelease } from "../roadmap-types";

type EditorState =
  | { mode: "release"; monthLabel: string; releaseId: string; draft: RoadmapRelease; isNew: boolean }
  | { mode: "series"; seriesId: string; draft: OngoingSeries };

type ViewMode = "board" | "timeline";

const genreStrip: Record<string, string> = {
  parish: "bg-blue-500",
  adult: "bg-amber-500",
  kids: "bg-emerald-500",
  progress: "bg-violet-500",
  risk: "bg-red-500",
  discussion: "bg-gray-500"
};

const genreLegendItems = [
  { label: "Adult", colorClass: "bg-amber-500" },
  { label: "Parish", colorClass: "bg-blue-500" },
  { label: "Kids", colorClass: "bg-emerald-500" },
  { label: "In Discussion", colorClass: "bg-violet-500" },
  { label: "Strategic Need", colorClass: "bg-red-500" }
];

const audienceOptions = ["Kids", "Teens/YA", "Adults"];

const formatOptions = [
  "Movie",
  "Documentary",
  "Prayer",
  "Kids Movie",
  "Music Video",
  "Presentation",
  "TV Show",
  "Docu-Series",
  "Conversations",
  "Kids Show",
  "Reflection",
  "Formation Series",
  "Sacramental Prep",
  "Small Group Study",
  "Ministry Resource"
];

const statusOptions = ["In Discussion", "Strategic Need", "In Progress", "Finalized"];

const useCaseOptions = ["Individual", "Parish"];

const genreOptions = [
  "Scripture Reflection",
  "Spanish",
  "Scripture Reading",
  "Scripture Study",
  "Everyday Living",
  "Interview Show",
  "Kids' Christian Living",
  "Catechism of the Catholic Church",
  "Apologetics",
  "Women's Conference",
  "Spanish Kids",
  "Second Millennium Saints",
  "Lent and Easter",
  "Leader Formation",
  "Kids' Scripture",
  "Advent and Christmas",
  "Prayer Recordings",
  "First Millennium Saints",
  "Church History",
  "Evangelization",
  "Portuguese",
  "Kids' Saints",
  "Pro-Life",
  "How to Pray",
  "Scripture Conference",
  "Sacraments of Healing",
  "Kids' Education",
  "Testimony",
  "Kids' Music",
  "Morality and Virtue",
  "Mental Health",
  "Parenting and Family Life",
  "Vocational Discernment",
  "Faith and Science",
  "Human Sexuality",
  "Narrative Fiction",
  "Liturgy",
  "Sacraments of Initiation",
  "Path to Sainthood",
  "Third Millennium Saints",
  "Sacraments of Service",
  "Liturgical Living",
  "Sacred Art",
  "Biography",
  "Young Adult Conference",
  "Scripture Drama",
  "Christian Music",
  "Hymns",
  "French",
  "Historical Fiction",
  "Men's Conference",
  "Polish",
  "Italian",
  "Ordinary Time",
  "Kids' Prayer"
];

export function RoadmapPage() {
  const [activeFilter, setActiveFilter] = useState<RoadmapFilter>("All");
  const [searchTerm, setSearchTerm] = useState("");
  const [showPastMonths, setShowPastMonths] = useState(false);
  const [viewMode, setViewMode] = useState<ViewMode>("board");
  const [roadmapMonths, setRoadmapMonths] = useState<RoadmapMonth[]>(initialRoadmapMonths);
  const [ongoingSeries, setOngoingSeries] = useState<OngoingSeries[]>(initialOngoingSeries);
  const [editor, setEditor] = useState<EditorState | null>(null);
  const [currentDate] = useState(() => new Date());
  const fiscalYear = useMemo(() => getCurrentFiscalYear(currentDate), [currentDate]);
  const roadmapStats = useMemo(() => buildFiscalYearStats(roadmapMonths, currentDate), [roadmapMonths, currentDate]);
  const visibleMonths = useMemo(() => getVisibleRoadmapMonths(roadmapMonths, currentDate, showPastMonths), [roadmapMonths, currentDate, showPastMonths]);
  const hiddenPastMonthCount = roadmapMonths.length - getVisibleRoadmapMonths(roadmapMonths, currentDate, false).length;
  const filteredMonths = useMemo(() => filterRoadmapMonths(visibleMonths, activeFilter, searchTerm), [visibleMonths, activeFilter, searchTerm]);
  const releaseFieldOptions = useMemo(() => getReleaseFieldOptions(roadmapMonths), [roadmapMonths]);
  const isFiltered = activeFilter !== "All" || searchTerm.trim().length > 0;
  const boardTitle = showPastMonths ? "Roadmap Months" : "Upcoming Months";

  return (
    <main className="min-h-screen bg-white px-5 py-5 md:px-8">
      <div className="mx-auto grid max-w-7xl gap-5">
        <RoadmapHero
          onAddRelease={() => setEditor(createNewReleaseEditor(visibleMonths[0] ?? roadmapMonths[0]))}
          viewMode={viewMode}
          onToggleView={() => setViewMode((current) => (current === "board" ? "timeline" : "board"))}
        />
        <div className="flex flex-wrap items-center justify-between gap-3">
          <Link
            href="/dashboard"
            className="inline-flex items-center gap-2 rounded-md bg-gray-900 px-4 py-3 text-sm font-extrabold uppercase tracking-wide text-white transition-all duration-200 hover:scale-[1.03] hover:bg-gray-800"
          >
            <ArrowLeft className="h-4 w-4" aria-hidden="true" />
            Back to budget tracker
          </Link>
          <Link
            href="/content-review"
            className="inline-flex items-center gap-2 rounded-md bg-gray-100 px-4 py-3 text-sm font-extrabold uppercase tracking-wide text-gray-950 transition-all duration-200 hover:scale-[1.03] hover:bg-gray-200"
          >
            <ClipboardCheck className="h-4 w-4" aria-hidden="true" />
            Content Review
          </Link>
          <p className="text-xs font-extrabold uppercase tracking-wide text-gray-500">
            Stats scoped to {fiscalYear.label}: July {Number(fiscalYear.start.slice(0, 4))} - June {Number(fiscalYear.end.slice(0, 4))}
          </p>
        </div>
        <RoadmapStats stats={roadmapStats} fiscalYearLabel={fiscalYear.label} />
        <RoadmapFilters
          filters={roadmapFilters}
          activeFilter={activeFilter}
          searchTerm={searchTerm}
          onFilterChange={setActiveFilter}
          onSearchChange={setSearchTerm}
        />
        {viewMode === "board" ? (
          <RoadmapBoard
            boardTitle={boardTitle}
            filteredMonths={filteredMonths}
            hiddenPastMonthCount={hiddenPastMonthCount}
            isFiltered={isFiltered}
            showPastMonths={showPastMonths}
            onTogglePastMonths={() => setShowPastMonths((current) => !current)}
            onEditRelease={openReleaseEditor}
          />
        ) : (
          <RoadmapTimeline months={filteredMonths} isFiltered={isFiltered} onEditRelease={openReleaseEditor} />
        )}
        <OngoingSeriesTable series={ongoingSeries} onEditSeries={openSeriesEditor} />
      </div>
      {editor?.mode === "release" ? (
        <RoadmapEditDialog
          mode="release"
          title={editor.isNew ? "Add Release" : editor.draft.title}
          value={editor.draft}
          months={roadmapMonths}
          options={releaseFieldOptions}
          selectedMonthLabel={editor.monthLabel}
          onMonthChange={(monthLabel) => setEditor({ ...editor, monthLabel })}
          onChange={(draft) => setEditor({ ...editor, draft })}
          onSave={saveReleaseEditor}
          onClose={() => setEditor(null)}
        />
      ) : null}
      {editor?.mode === "series" ? (
        <RoadmapEditDialog
          mode="series"
          title={editor.draft.series}
          value={editor.draft}
          onChange={(draft) => setEditor({ ...editor, draft })}
          onSave={saveSeriesEditor}
          onClose={() => setEditor(null)}
        />
      ) : null}
    </main>
  );

  function openReleaseEditor(monthId: string, releaseId: string) {
    const month = roadmapMonths.find((item) => item.id === monthId);
    const release = month?.releases.find((item) => item.id === releaseId);
    if (!month || !release) {
      return;
    }

    setEditor({ mode: "release", monthLabel: month.label, releaseId, draft: { ...release }, isNew: false });
  }

  function openSeriesEditor(seriesId: string) {
    const series = ongoingSeries.find((item) => item.id === seriesId);
    if (!series) {
      return;
    }

    setEditor({ mode: "series", seriesId, draft: { ...series } });
  }

  function saveReleaseEditor() {
    if (editor?.mode !== "release") {
      return;
    }

    setRoadmapMonths((months) => {
      const targetMonthLabel = normalizeMonthLabel(editor.monthLabel);
      const originalMonthId = months.find((month) => month.releases.some((release) => release.id === editor.releaseId))?.id;
      const targetMonth = months.find((month) => month.label.toLowerCase() === targetMonthLabel.toLowerCase());
      const targetMonthId = targetMonth?.id ?? createMonthId(targetMonthLabel, months);
      const monthsWithTarget = targetMonth
        ? months
        : [
            ...months,
            {
              id: targetMonthId,
              label: targetMonthLabel,
              monthStart: getMonthStart(targetMonthLabel),
              launchCount: 0,
              releases: []
            }
          ];

      return monthsWithTarget
        .map((month) => {
          const isOriginalMonth = month.id === originalMonthId;
          const isTargetMonth = month.id === targetMonthId;
          const hasRelease = month.releases.some((release) => release.id === editor.releaseId);

          if (isTargetMonth) {
            return {
              ...month,
              launchCount: hasRelease ? month.launchCount : month.launchCount + 1,
              releases: hasRelease
                ? month.releases.map((release) => (release.id === editor.releaseId ? editor.draft : release))
                : [...month.releases, editor.draft]
            };
          }

          if (isOriginalMonth) {
            return {
              ...month,
              launchCount: Math.max(0, month.launchCount - 1),
              releases: month.releases.filter((release) => release.id !== editor.releaseId)
            };
          }

          return month;
        })
        .sort((left, right) => Date.parse(`${left.monthStart}T00:00:00Z`) - Date.parse(`${right.monthStart}T00:00:00Z`));
    });
    setEditor(null);
  }

  function saveSeriesEditor() {
    if (editor?.mode !== "series") {
      return;
    }

    setOngoingSeries((series) => series.map((item) => (item.id === editor.seriesId ? editor.draft : item)));
    setEditor(null);
  }
}

function RoadmapBoard({
  boardTitle,
  filteredMonths,
  hiddenPastMonthCount,
  isFiltered,
  showPastMonths,
  onTogglePastMonths,
  onEditRelease
}: {
  boardTitle: string;
  filteredMonths: RoadmapMonth[];
  hiddenPastMonthCount: number;
  isFiltered: boolean;
  showPastMonths: boolean;
  onTogglePastMonths: () => void;
  onEditRelease: (monthId: string, releaseId: string) => void;
}) {
  return (
    <section className="grid gap-4">
      <div className="flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
        <div>
          <h2 className="font-display text-2xl font-extrabold tracking-tight text-gray-950">{boardTitle}</h2>
          {hiddenPastMonthCount > 0 ? (
            <button
              type="button"
              className="mt-2 inline-flex items-center gap-2 rounded-md bg-gray-100 px-3 py-2 text-xs font-extrabold uppercase tracking-wide text-gray-700 transition hover:scale-[1.03] hover:bg-gray-200"
              onClick={onTogglePastMonths}
            >
              {showPastMonths ? <EyeOff className="h-4 w-4" aria-hidden="true" /> : <Eye className="h-4 w-4" aria-hidden="true" />}
              {showPastMonths ? "Hide Past Months" : `Show ${hiddenPastMonthCount} Past Months`}
            </button>
          ) : null}
        </div>
        <GenreLegend />
      </div>
      {filteredMonths.length > 0 ? (
        <div className="-mx-5 overflow-x-auto px-5 pb-2 md:-mx-8 md:px-8 lg:-mx-10 lg:px-10">
          <div className="flex min-w-max gap-4">
            {filteredMonths.map((month) => (
              <MonthColumn key={month.id} month={month} isFiltered={isFiltered} onEditRelease={onEditRelease} />
            ))}
          </div>
        </div>
      ) : (
        <EmptyRoadmapState isFiltered={isFiltered} />
      )}
    </section>
  );
}

function RoadmapTimeline({
  months,
  isFiltered,
  onEditRelease
}: {
  months: RoadmapMonth[];
  isFiltered: boolean;
  onEditRelease: (monthId: string, releaseId: string) => void;
}) {
  const releases = months.flatMap((month) =>
    month.releases.map((release) => ({
      month,
      release
    }))
  );

  return (
    <section className="grid gap-4">
      <div className="flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
        <div>
          <p className="inline-flex items-center gap-2 text-xs font-extrabold uppercase tracking-wide text-blue-600">
            <CalendarDays className="h-4 w-4" aria-hidden="true" />
            Monthly Launch Timing
          </p>
          <h2 className="font-display text-2xl font-extrabold tracking-tight text-gray-950">Timeline View</h2>
        </div>
        <GenreLegend />
      </div>
      {releases.length > 0 ? (
        <div className="grid gap-2 rounded-lg bg-gray-100 p-3">
          {releases.map(({ month, release }, index) => (
            <button
              key={`${month.id}-${release.id}`}
              type="button"
              className={cn(
                "group relative grid gap-3 overflow-hidden rounded-md p-3 pl-5 text-left transition-all duration-200 hover:scale-[1.01] hover:bg-cyan-100 focus-visible:bg-cyan-100 md:grid-cols-[120px_1fr_130px_130px]",
                index % 2 === 0 ? "bg-white" : "bg-sky-100"
              )}
              onClick={() => onEditRelease(month.id, release.id)}
            >
              <span className={cn("absolute inset-y-0 left-0 w-2", getGenreStripClass(release.genre))} aria-hidden="true" />
              <span className="text-xs font-extrabold uppercase tracking-wide text-gray-500">{month.label}</span>
              <span>
                <span className="block font-display text-sm font-extrabold leading-tight tracking-tight text-gray-950">{release.title}</span>
                <span className="mt-1 block text-xs font-semibold leading-5 text-gray-600">{release.notes}</span>
              </span>
              <span className="text-xs font-extrabold uppercase tracking-wide text-gray-700">{release.releaseDate}</span>
              <span className="text-xs font-extrabold uppercase tracking-wide text-gray-700">{release.audience} / {release.status}</span>
            </button>
          ))}
        </div>
      ) : (
        <EmptyRoadmapState isFiltered={isFiltered} />
      )}
    </section>
  );
}

function GenreLegend() {
  return (
    <div className="flex flex-wrap items-center justify-end gap-2" aria-label="Roadmap color key">
      {genreLegendItems.map((item) => (
        <span
          key={item.label}
          className={cn(
            "inline-flex min-h-10 min-w-[5.25rem] items-center justify-center rounded-md px-3 py-2 text-center text-xs font-bold leading-tight text-white shadow-sm ring-2 ring-white",
            item.colorClass
          )}
          title={item.label}
        >
          {item.label}
        </span>
      ))}
    </div>
  );
}

function EmptyRoadmapState({ isFiltered }: { isFiltered: boolean }) {
  return (
    <div className="rounded-lg bg-gray-100 p-6 text-sm font-bold text-gray-600">
      No releases match {isFiltered ? "the current roadmap filters." : "this roadmap data set."}
    </div>
  );
}

function createNewReleaseEditor(month: RoadmapMonth | undefined): EditorState {
  const monthLabel = month?.label ?? "June 26";
  const releaseId = `release-${Date.now()}`;

  return {
    mode: "release",
    monthLabel,
    releaseId,
    isNew: true,
    draft: {
      id: releaseId,
      title: "New Release",
      audience: "Adults",
      format: "Formation Series",
      releaseDate: "TBD",
      status: "In Discussion",
      genre: "Scripture Study",
      useCase: "Individual",
      notes: "Add planning notes here."
    }
  };
}

function getReleaseFieldOptions(months: RoadmapMonth[]): ReleaseFieldOptions {
  const releases = months.flatMap((month) => month.releases);

  return {
    audiences: mergeReleaseValues(audienceOptions, releases.map((release) => release.audience)),
    formats: mergeReleaseValues(formatOptions, releases.map((release) => release.format)),
    statuses: mergeReleaseValues(statusOptions, releases.map((release) => release.status)),
    genres: mergeReleaseValues(genreOptions, releases.map((release) => release.genre)),
    useCases: mergeReleaseValues(useCaseOptions, releases.map((release) => release.useCase)),
    series: uniqueReleaseValues(releases.map((release) => release.series ?? ""))
  };
}

function mergeReleaseValues(preferredValues: string[], savedValues: Array<string | undefined>) {
  const preferredKeys = new Set(preferredValues.map((value) => value.toLowerCase()));
  const extraValues = uniqueReleaseValues(savedValues).filter((value) => !preferredKeys.has(value.toLowerCase()));

  return [...preferredValues, ...extraValues];
}

function uniqueReleaseValues(values: Array<string | undefined>) {
  return Array.from(new Set(values.map((value) => value?.trim() ?? "").filter(Boolean))).sort((a, b) => a.localeCompare(b));
}

function getGenreStripClass(genre: string) {
  return genreStrip[genre.toLowerCase()] ?? "bg-slate-500";
}

function normalizeMonthLabel(monthLabel: string) {
  const trimmed = monthLabel.trim();
  return trimmed.length > 0 ? trimmed : "Unscheduled";
}

function createMonthId(monthLabel: string, months: RoadmapMonth[]) {
  const baseId =
    monthLabel
      .trim()
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-|-$/g, "") || "month";
  let id = baseId;
  let suffix = 2;

  while (months.some((month) => month.id === id)) {
    id = `${baseId}-${suffix}`;
    suffix += 1;
  }

  return id;
}

function getMonthStart(monthLabel: string) {
  const [monthName, yearText] = monthLabel.trim().split(/\s+/);
  const monthIndex = monthName ? monthNames.findIndex((name) => name.toLowerCase().startsWith(monthName.toLowerCase())) : -1;
  const parsedYear = Number(yearText);

  if (monthIndex < 0 || !Number.isFinite(parsedYear)) {
    return "2099-01-01";
  }

  const fullYear = parsedYear < 100 ? 2000 + parsedYear : parsedYear;
  return `${fullYear}-${String(monthIndex + 1).padStart(2, "0")}-01`;
}

const monthNames = [
  "January",
  "February",
  "March",
  "April",
  "May",
  "June",
  "July",
  "August",
  "September",
  "October",
  "November",
  "December"
];
