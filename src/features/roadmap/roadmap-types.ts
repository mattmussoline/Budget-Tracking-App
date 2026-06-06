export type ReleaseCategory = "parish" | "adult" | "kids" | "progress" | "risk" | "discussion";

export type RoadmapFilter =
  | "All"
  | "Parish"
  | "Adult"
  | "Kids"
  | "In Progress"
  | "Strategic Need"
  | "Needs Date"
  | "In Discussion";

export type RoadmapRelease = {
  id: string;
  title: string;
  audience: string;
  format: string;
  releaseDate: string;
  status: string;
  category: ReleaseCategory;
  notes: string;
  feast?: string;
  host?: string;
};

export type RoadmapMonth = {
  id: string;
  label: string;
  monthStart: string;
  launchCount: number;
  releases: RoadmapRelease[];
};

export type RoadmapStat = {
  label: string;
  value: string;
  colorClass: string;
};

export type OngoingSeries = {
  id: string;
  series: string;
  startDate: string;
  endDate: string;
  cadence: string;
  notes: string;
};
