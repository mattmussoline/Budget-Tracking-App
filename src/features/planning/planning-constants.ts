export type PlanningTone = "blue" | "amber" | "green" | "purple" | "red" | "cyan" | "orange" | "slate";

export type PlanningOption<T extends string = string> = {
  label: string;
  value: T;
  tone: PlanningTone;
};

export const REVIEW_STATUSES = [
  { label: "Not Started", value: "not_started", tone: "slate" },
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
  blue: { accent: "border-blue-500", field: "bg-blue-50 text-blue-800", chip: "bg-blue-100 text-blue-800" },
  amber: { accent: "border-amber-500", field: "bg-amber-50 text-amber-900", chip: "bg-amber-100 text-amber-900" },
  green: { accent: "border-emerald-500", field: "bg-emerald-50 text-emerald-800", chip: "bg-emerald-100 text-emerald-800" },
  purple: { accent: "border-violet-500", field: "bg-violet-50 text-violet-800", chip: "bg-violet-100 text-violet-800" },
  red: { accent: "border-red-500", field: "bg-red-50 text-red-800", chip: "bg-red-100 text-red-800" },
  cyan: { accent: "border-cyan-500", field: "bg-cyan-50 text-cyan-900", chip: "bg-cyan-100 text-cyan-900" },
  orange: { accent: "border-orange-500", field: "bg-orange-50 text-orange-900", chip: "bg-orange-100 text-orange-900" },
  slate: { accent: "border-slate-500", field: "bg-slate-100 text-slate-800", chip: "bg-slate-200 text-slate-800" }
};
