"use client";

import { Search } from "lucide-react";
import { cn } from "@/components/ui/soft-surface";
import type { RoadmapFilter } from "../roadmap-types";

type RoadmapFiltersProps = {
  filters: RoadmapFilter[];
  activeFilter: RoadmapFilter;
  searchTerm: string;
  onFilterChange: (filter: RoadmapFilter) => void;
  onSearchChange: (searchTerm: string) => void;
};

export function RoadmapFilters({
  filters,
  activeFilter,
  searchTerm,
  onFilterChange,
  onSearchChange
}: RoadmapFiltersProps) {
  return (
    <section className="flex flex-col gap-4 rounded-lg bg-gray-900 p-4 text-white lg:flex-row lg:items-center lg:justify-between">
      <div className="flex flex-wrap gap-2">
        {filters.map((filter) => {
          const isActive = filter === activeFilter;

          return (
            <button
              key={filter}
              type="button"
              aria-pressed={isActive}
              className={cn(
                "min-h-11 rounded-full px-4 py-2 text-sm font-extrabold transition-all duration-200 hover:scale-[1.04] active:scale-[0.98]",
                isActive ? "bg-amber-400 text-gray-950" : "bg-white text-gray-950 hover:bg-blue-50"
              )}
              onClick={() => onFilterChange(filter)}
            >
              {filter}
            </button>
          );
        })}
      </div>
      <label className="relative block w-full lg:max-w-md">
        <span className="sr-only">Search roadmap releases</span>
        <Search className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-300" aria-hidden="true" />
        <input
          value={searchTerm}
          onChange={(event) => onSearchChange(event.target.value)}
          className="min-h-12 w-full rounded-md border-0 bg-gray-700 py-3 pl-11 pr-4 text-sm font-bold text-white shadow-none placeholder:text-gray-400 focus:bg-gray-600"
          placeholder="Search title, genre, series, use case, format, or notes..."
        />
      </label>
    </section>
  );
}
