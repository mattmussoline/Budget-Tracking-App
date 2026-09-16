import type { RoadmapItem } from "./planning-types";

export type MixDimensionKey = "provider" | "genre" | "format";

/**
 * One selected Mix row. `value` is the trimmed field this row groups on, with
 * "" meaning the item has no value for that dimension.
 */
export type MixFilter = { key: MixDimensionKey; value: string; label: string };

export type MixRow = {
  value: string;
  name: string;
  rank: number;
  minutes: number;
  /** Bar width, relative to the top row of this list rather than to the total. */
  percent: number;
  isActive: boolean;
};

export type MixList = {
  key: MixDimensionKey;
  label: string;
  note: string;
  rows: MixRow[];
};

const FALLBACK_NAMES: Record<MixDimensionKey, string> = {
  provider: "No provider",
  genre: "No genre",
  format: "No format"
};

/** The raw grouping key for one item on one dimension. "" means "no value". */
export function getMixValue(item: RoadmapItem, key: MixDimensionKey) {
  return (item[key] ?? "").trim();
}

export function matchesMixFilter(item: RoadmapItem, filter: MixFilter | null) {
  return !filter || getMixValue(item, filter.key) === filter.value;
}

/**
 * Rank the roadmap by provider, genre and format — summing minutes, sorting by
 * minutes then by how many titles contributed them. Category is deliberately
 * absent: the rail's key already ranks and filters by category.
 *
 * Pass the category-filtered items only. Ranking the Mix-filtered list would
 * collapse each list to the single row that is already selected.
 */
export function buildRoadmapMix(items: RoadmapItem[], activeFilter: MixFilter | null): MixList[] {
  const nameOf = (key: MixDimensionKey, value: string) => value || FALLBACK_NAMES[key];

  const dimension = (key: MixDimensionKey, label: string): MixList => {
    const totals = new Map<string, { titles: number; minutes: number }>();

    for (const item of items) {
      const value = getMixValue(item, key);
      const entry = totals.get(value) ?? { titles: 0, minutes: 0 };
      entry.titles += 1;
      entry.minutes += Number(item.minutes) || 0;
      totals.set(value, entry);
    }

    const sorted = [...totals.entries()].sort(([valueA, a], [valueB, b]) => b.minutes - a.minutes || b.titles - a.titles || nameOf(key, valueA).localeCompare(nameOf(key, valueB)));
    const topMinutes = Math.max(...sorted.map(([, entry]) => entry.minutes), 1);

    return {
      key,
      label,
      note: `${sorted.length} ${sorted.length === 1 ? "value" : "values"} · ranked by minutes`,
      rows: sorted.map(([value, entry], index) => ({
        value,
        name: nameOf(key, value),
        rank: index + 1,
        minutes: entry.minutes,
        percent: Math.round((entry.minutes / topMinutes) * 100),
        isActive: Boolean(activeFilter && activeFilter.key === key && activeFilter.value === value)
      }))
    };
  };

  return [dimension("provider", "Provider"), dimension("genre", "Genre"), dimension("format", "Format")];
}

export function buildMixFilter(list: MixList, row: MixRow): MixFilter {
  return { key: list.key, value: row.value, label: `${list.label}: ${row.name}` };
}
