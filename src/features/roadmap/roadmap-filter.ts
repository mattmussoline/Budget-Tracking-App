import type { RoadmapFilter, RoadmapMonth, RoadmapRelease } from "./roadmap-types";

export function filterRoadmapMonths(months: RoadmapMonth[], activeFilter: RoadmapFilter, searchTerm: string) {
  const normalizedSearch = searchTerm.trim().toLowerCase();

  return months
    .map((month) => ({
      ...month,
      releases: month.releases.filter((release) => matchesFilter(release, activeFilter) && matchesSearch(release, normalizedSearch))
    }))
    .filter((month) => month.releases.length > 0);
}

function matchesFilter(release: RoadmapRelease, activeFilter: RoadmapFilter) {
  switch (activeFilter) {
    case "All":
      return true;
    case "Parish":
      return release.category === "parish" || includesAny(release.audience, ["parish"]);
    case "Adult":
      return release.category === "adult" || includesAny(release.audience, ["adult", "teens"]);
    case "Kids":
      return release.category === "kids" || includesAny(release.audience, ["kids", "family"]);
    case "In Progress":
      return release.category === "progress" || includesAny(release.status, ["progress"]);
    case "Strategic Need":
      return release.category === "risk" || includesAny(release.status, ["strategic", "risk", "at risk"]);
    case "Needs Date":
      return includesAny(release.releaseDate, ["tbd", "needs"]) || includesAny(release.status, ["needs date"]);
    case "In Discussion":
      return release.category === "discussion" || includesAny(release.status, ["discussion"]);
  }
}

function matchesSearch(release: RoadmapRelease, normalizedSearch: string) {
  if (!normalizedSearch) {
    return true;
  }

  const searchableText = [release.title, release.feast, release.host, release.format, release.notes]
    .filter(Boolean)
    .join(" ")
    .toLowerCase();

  return searchableText.includes(normalizedSearch);
}

function includesAny(value: string, terms: string[]) {
  const normalizedValue = value.toLowerCase();

  return terms.some((term) => normalizedValue.includes(term));
}
