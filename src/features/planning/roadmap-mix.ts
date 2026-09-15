import { TONE_CLASSES, type PlanningTone } from "./planning-constants";
import type { RoadmapCategory, RoadmapItem } from "./planning-types";

export type MixDimensionKey = "provider" | "genre" | "format" | "category";

/**
 * One selected Mix row. `value` is the raw grouping key — the trimmed field for
 * provider/genre/format, the category id for category — with "" meaning the
 * item has no value for that dimension.
 */
export type MixFilter = { key: MixDimensionKey; value: string; label: string };

export type MixRow = {
  value: string;
  name: string;
  rank: number;
  titles: number;
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
  format: "No format",
  category: "No category"
};

/** The raw grouping key for one item on one dimension. "" means "no value". */
export function getMixValue(item: RoadmapItem, key: MixDimensionKey) {
  if (key === "category") return item.categoryId ?? "";
  return (item[key] ?? "").trim();
}

export function matchesMixFilter(item: RoadmapItem, filter: MixFilter | null) {
  return !filter || getMixValue(item, filter.key) === filter.value;
}

/**
 * Rank the roadmap by provider, genre, format and category — summing minutes,
 * counting titles, sorting by minutes then by count.
 *
 * Pass the category-filtered items only. Ranking the Mix-filtered list would
 * collapse each list to the single row that is already selected.
 */
export function buildRoadmapMix(items: RoadmapItem[], categories: RoadmapCategory[], activeFilter: MixFilter | null): MixList[] {
  const categoryNameById = new Map(categories.map((category) => [category.id, category.name]));
  const nameOf = (key: MixDimensionKey, value: string) => {
    if (!value) return FALLBACK_NAMES[key];
    if (key === "category") return categoryNameById.get(value) ?? FALLBACK_NAMES.category;
    return value;
  };

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
        titles: entry.titles,
        minutes: entry.minutes,
        percent: Math.round((entry.minutes / topMinutes) * 100),
        isActive: Boolean(activeFilter && activeFilter.key === key && activeFilter.value === value)
      }))
    };
  };

  return [dimension("provider", "Provider"), dimension("genre", "Genre"), dimension("format", "Format"), dimension("category", "Category")];
}

export function buildMixFilter(list: MixList, row: MixRow): MixFilter {
  return { key: list.key, value: row.value, label: `${list.label}: ${row.name}` };
}

/** Tone for a category row, so the Category list can carry its key color. */
export function getCategoryTone(categories: RoadmapCategory[], categoryId: string): PlanningTone {
  const colorKey = categories.find((category) => category.id === categoryId)?.colorKey;
  return (colorKey && colorKey in TONE_CLASSES ? colorKey : "slate") as PlanningTone;
}
