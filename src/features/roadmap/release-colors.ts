import type { RoadmapRelease } from "./roadmap-types";

export const releaseColorOptions = [
  { key: "orange", label: "Orange", strip: "bg-amber-500", tag: "bg-amber-100 text-amber-800", hover: "hover:bg-amber-50 focus-visible:bg-amber-50" },
  { key: "green", label: "Green", strip: "bg-emerald-500", tag: "bg-emerald-100 text-emerald-800", hover: "hover:bg-emerald-50 focus-visible:bg-emerald-50" },
  { key: "purple", label: "Purple", strip: "bg-violet-500", tag: "bg-violet-100 text-violet-800", hover: "hover:bg-violet-50 focus-visible:bg-violet-50" },
  { key: "red", label: "Red", strip: "bg-red-500", tag: "bg-red-100 text-red-800", hover: "hover:bg-red-50 focus-visible:bg-red-50" },
  { key: "blue", label: "Blue", strip: "bg-blue-500", tag: "bg-blue-100 text-blue-800", hover: "hover:bg-blue-50 focus-visible:bg-blue-50" },
  { key: "teal", label: "Teal", strip: "bg-teal-500", tag: "bg-teal-100 text-teal-800", hover: "hover:bg-teal-50 focus-visible:bg-teal-50" },
  { key: "rose", label: "Rose", strip: "bg-rose-500", tag: "bg-rose-100 text-rose-800", hover: "hover:bg-rose-50 focus-visible:bg-rose-50" },
  { key: "slate", label: "Slate", strip: "bg-slate-500", tag: "bg-slate-100 text-slate-800", hover: "hover:bg-slate-50 focus-visible:bg-slate-50" }
] as const;

export type ReleaseColorKey = (typeof releaseColorOptions)[number]["key"];

export function getReleaseColor(release: RoadmapRelease) {
  const override = releaseColorOptions.find((option) => option.key === release.colorOverride);
  if (override) {
    return override;
  }

  const status = release.status.trim().toLowerCase();
  if (status === "in discussion") {
    return colorByKey("purple");
  }
  if (status === "strategic need") {
    return colorByKey("red");
  }

  const audience = release.audience.trim().toLowerCase();
  if (audience === "adults" || audience === "adult") {
    return colorByKey("orange");
  }
  if (audience === "kids" || audience === "teens/ya") {
    return colorByKey("green");
  }

  const hash = Array.from(`${release.genre}-${release.format}-${release.title}`).reduce((total, character) => total + character.charCodeAt(0), 0);
  return releaseColorOptions[hash % releaseColorOptions.length];
}

function colorByKey(key: ReleaseColorKey) {
  return releaseColorOptions.find((option) => option.key === key) ?? releaseColorOptions[0];
}
