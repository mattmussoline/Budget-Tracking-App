export type PlanningTone = "blue" | "amber" | "green" | "purple" | "red" | "cyan" | "orange" | "slate";

export type PlanningOption<T extends string = string> = {
  label: string;
  value: T;
  tone: PlanningTone;
};

export const REVIEW_STATUSES = [
  { label: "Not Started", value: "not_started", tone: "slate" },
  { label: "On the Radar", value: "on_the_radar", tone: "cyan" },
  { label: "In Progress", value: "in_progress", tone: "purple" },
  { label: "Blocked", value: "blocked", tone: "red" },
  { label: "Rejected", value: "rejected", tone: "orange" },
  { label: "Approved", value: "approved", tone: "green" }
] as const satisfies ReadonlyArray<PlanningOption>;

export const CONTENT_GENRES = [
  "Scripture",
  "Christian Living",
  "International",
  "Christian Formation",
  "Talk Show",
  "Saints",
  "Liturgical Seasons",
  "Conference Talk",
  "Prayer",
  "Sacraments",
  "Music",
  "Fiction",
  "Biography"
].map((label, index) => ({ label, value: label, tone: (["orange", "blue", "cyan", "green", "purple", "amber", "red"] as const)[index % 7] }));

export const CONTENT_FORMATS = [
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
].map((label, index) => ({ label, value: label, tone: (["blue", "cyan", "green", "amber", "purple", "red", "orange"] as const)[index % 7] }));

export const ROADMAP_COLORS = [
  { label: "Blue", value: "blue", tone: "blue" },
  { label: "Amber", value: "amber", tone: "amber" },
  { label: "Green", value: "green", tone: "green" },
  { label: "Purple", value: "purple", tone: "purple" },
  { label: "Red", value: "red", tone: "red" },
  { label: "Cyan", value: "cyan", tone: "cyan" },
  { label: "Orange", value: "orange", tone: "orange" },
  { label: "Slate", value: "slate", tone: "slate" }
] as const satisfies ReadonlyArray<PlanningOption>;

export const TONE_CLASSES: Record<PlanningTone, { accent: string; field: string; chip: string }> = {
  blue: { accent: "border-tone-blue-line", field: "bg-tone-blue-bg text-tone-blue-ink", chip: "bg-tone-blue-bg text-tone-blue-ink" },
  amber: { accent: "border-tone-amber-line", field: "bg-tone-amber-bg text-tone-amber-ink", chip: "bg-tone-amber-bg text-tone-amber-ink" },
  green: { accent: "border-tone-green-line", field: "bg-tone-green-bg text-tone-green-ink", chip: "bg-tone-green-bg text-tone-green-ink" },
  purple: { accent: "border-tone-purple-line", field: "bg-tone-purple-bg text-tone-purple-ink", chip: "bg-tone-purple-bg text-tone-purple-ink" },
  red: { accent: "border-tone-red-line", field: "bg-tone-red-bg text-tone-red-ink", chip: "bg-tone-red-bg text-tone-red-ink" },
  cyan: { accent: "border-tone-cyan-line", field: "bg-tone-cyan-bg text-tone-cyan-ink", chip: "bg-tone-cyan-bg text-tone-cyan-ink" },
  orange: { accent: "border-tone-orange-line", field: "bg-tone-orange-bg text-tone-orange-ink", chip: "bg-tone-orange-bg text-tone-orange-ink" },
  slate: { accent: "border-tone-slate-line", field: "bg-tone-slate-bg text-tone-slate-ink", chip: "bg-tone-slate-bg text-tone-slate-ink" }
};
