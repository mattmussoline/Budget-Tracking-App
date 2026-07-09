export const providerColorOptions = [
  { key: "blue", label: "Blue", bg: "bg-blue-100", text: "text-blue-900", marker: "bg-blue-500", hex: "#3b82f6" },
  { key: "emerald", label: "Emerald", bg: "bg-emerald-100", text: "text-emerald-900", marker: "bg-emerald-500", hex: "#10b981" },
  { key: "amber", label: "Amber", bg: "bg-amber-100", text: "text-amber-900", marker: "bg-amber-500", hex: "#f59e0b" },
  { key: "rose", label: "Rose", bg: "bg-rose-100", text: "text-rose-900", marker: "bg-rose-500", hex: "#f43f5e" },
  { key: "violet", label: "Violet", bg: "bg-violet-100", text: "text-violet-900", marker: "bg-violet-500", hex: "#8b5cf6" },
  { key: "cyan", label: "Cyan", bg: "bg-cyan-100", text: "text-cyan-900", marker: "bg-cyan-500", hex: "#06b6d4" },
  { key: "lime", label: "Lime", bg: "bg-lime-100", text: "text-lime-900", marker: "bg-lime-500", hex: "#84cc16" },
  { key: "teal", label: "Teal", bg: "bg-teal-100", text: "text-teal-900", marker: "bg-teal-500", hex: "#14b8a6" },
  { key: "sky", label: "Sky", bg: "bg-sky-100", text: "text-sky-900", marker: "bg-sky-500", hex: "#0ea5e9" },
  { key: "indigo", label: "Indigo", bg: "bg-indigo-100", text: "text-indigo-900", marker: "bg-indigo-500", hex: "#6366f1" },
  { key: "fuchsia", label: "Fuchsia", bg: "bg-fuchsia-100", text: "text-fuchsia-900", marker: "bg-fuchsia-500", hex: "#d946ef" },
  { key: "pink", label: "Pink", bg: "bg-pink-100", text: "text-pink-900", marker: "bg-pink-500", hex: "#ec4899" },
  { key: "orange", label: "Orange", bg: "bg-orange-100", text: "text-orange-900", marker: "bg-orange-500", hex: "#f97316" },
  { key: "yellow", label: "Yellow", bg: "bg-yellow-100", text: "text-yellow-900", marker: "bg-yellow-500", hex: "#eab308" },
  { key: "green", label: "Green", bg: "bg-green-100", text: "text-green-900", marker: "bg-green-500", hex: "#22c55e" },
  { key: "red", label: "Red", bg: "bg-red-100", text: "text-red-900", marker: "bg-red-500", hex: "#ef4444" },
  { key: "purple", label: "Purple", bg: "bg-purple-100", text: "text-purple-900", marker: "bg-purple-500", hex: "#a855f7" },
  { key: "slate", label: "Slate", bg: "bg-slate-100", text: "text-slate-900", marker: "bg-slate-500", hex: "#64748b" },
  { key: "zinc", label: "Zinc", bg: "bg-zinc-100", text: "text-zinc-900", marker: "bg-zinc-500", hex: "#71717a" },
  { key: "stone", label: "Stone", bg: "bg-stone-100", text: "text-stone-900", marker: "bg-stone-500", hex: "#78716c" },
  { key: "neutral", label: "Neutral", bg: "bg-neutral-100", text: "text-neutral-900", marker: "bg-neutral-500", hex: "#737373" },
  { key: "gray", label: "Gray", bg: "bg-gray-100", text: "text-gray-900", marker: "bg-gray-500", hex: "#6b7280" }
] as const;

export type ProviderColorKey = (typeof providerColorOptions)[number]["key"];
export type ProviderColorOverrides = Record<string, ProviderColorKey>;
export type ProviderColor = (typeof providerColorOptions)[number];
export type ProviderColorMap = Record<string, ProviderColor>;

export function getProviderColor(provider: string, overrides: ProviderColorOverrides = {}) {
  const override = providerColorOptions.find((color) => color.key === overrides[provider]);
  if (override) {
    return override;
  }

  const normalized = provider.trim().toLowerCase();
  const hash = Array.from(normalized).reduce(
    (total, character) => Math.imul(total ^ character.charCodeAt(0), 16777619) >>> 0,
    2166136261
  );

  return providerColorOptions[hash % providerColorOptions.length];
}

export function getProviderColorMap(providers: string[], overrides: ProviderColorOverrides = {}): ProviderColorMap {
  const uniqueProviders = Array.from(new Set(providers.map((provider) => provider.trim()).filter(Boolean))).sort((a, b) =>
    a.localeCompare(b)
  );
  const colorMap: ProviderColorMap = {};
  const usedColorKeys = new Set<ProviderColorKey>();

  for (const provider of uniqueProviders) {
    const override = providerColorOptions.find((color) => color.key === overrides[provider]);
    if (override) {
      colorMap[provider] = override;
      usedColorKeys.add(override.key);
    }
  }

  for (const provider of uniqueProviders) {
    if (colorMap[provider]) continue;

    const preferredColor = getProviderColor(provider);
    const color =
      !usedColorKeys.has(preferredColor.key)
        ? preferredColor
        : providerColorOptions.find((option) => !usedColorKeys.has(option.key)) ?? preferredColor;

    colorMap[provider] = color;
    usedColorKeys.add(color.key);
  }

  return colorMap;
}
