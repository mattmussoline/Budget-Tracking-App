import type { RoadmapMonth, RoadmapRelease, RoadmapStat } from "./roadmap-types";

const fiscalYearStartMonthIndex = 6;

export function getCurrentFiscalYear(date = new Date()) {
  const year = date.getUTCFullYear();
  const monthIndex = date.getUTCMonth();
  const fiscalEndYear = monthIndex >= fiscalYearStartMonthIndex ? year + 1 : year;

  return {
    label: `FY${String(fiscalEndYear).slice(-2)}`,
    start: `${fiscalEndYear - 1}-07-01`,
    end: `${fiscalEndYear}-06-30`
  };
}

export function getVisibleRoadmapMonths(months: RoadmapMonth[], date = new Date(), includePastMonths: boolean) {
  if (includePastMonths) {
    return months;
  }

  const currentMonthStart = Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), 1);
  return months.filter((month) => Date.parse(`${month.monthStart}T00:00:00Z`) >= currentMonthStart);
}

export function buildFiscalYearStats(months: RoadmapMonth[], date = new Date()): RoadmapStat[] {
  const fiscalYear = getCurrentFiscalYear(date);
  const fiscalStart = Date.parse(`${fiscalYear.start}T00:00:00Z`);
  const fiscalEnd = Date.parse(`${fiscalYear.end}T23:59:59Z`);
  const releases = months.flatMap((month) => {
    const monthTime = Date.parse(`${month.monthStart}T00:00:00Z`);
    return monthTime >= fiscalStart && monthTime <= fiscalEnd ? month.releases : [];
  });

  return [
    { label: "Planned Releases", value: String(releases.length), colorClass: "text-blue-500" },
    { label: "Kids / Family", value: String(releases.filter(isKidsOrFamilyRelease).length), colorClass: "text-emerald-500" },
    { label: "Strategic Needs", value: String(releases.filter(isStrategicNeedRelease).length), colorClass: "text-amber-500" },
    { label: "At Risk / TBD", value: String(releases.filter(isAtRiskOrTbdRelease).length), colorClass: "text-red-400" }
  ];
}

function isKidsOrFamilyRelease(release: RoadmapRelease) {
  const audience = release.audience.toLowerCase();
  return release.category === "kids" || audience.includes("kids") || audience.includes("family");
}

function isStrategicNeedRelease(release: RoadmapRelease) {
  return release.category === "risk" || release.status.toLowerCase().includes("strategic");
}

function isAtRiskOrTbdRelease(release: RoadmapRelease) {
  const status = release.status.toLowerCase();
  const date = release.releaseDate.toLowerCase();

  return release.category === "risk" || status.includes("risk") || status.includes("needs date") || date.includes("tbd") || date.includes("needs");
}
