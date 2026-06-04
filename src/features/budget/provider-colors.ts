const providerPalette = [
  { bg: "bg-blue-100", text: "text-blue-900", marker: "bg-blue-500", hex: "#3b82f6" },
  { bg: "bg-emerald-100", text: "text-emerald-900", marker: "bg-emerald-500", hex: "#10b981" },
  { bg: "bg-amber-100", text: "text-amber-900", marker: "bg-amber-500", hex: "#f59e0b" },
  { bg: "bg-rose-100", text: "text-rose-900", marker: "bg-rose-500", hex: "#f43f5e" },
  { bg: "bg-violet-100", text: "text-violet-900", marker: "bg-violet-500", hex: "#8b5cf6" },
  { bg: "bg-cyan-100", text: "text-cyan-900", marker: "bg-cyan-500", hex: "#06b6d4" },
  { bg: "bg-lime-100", text: "text-lime-900", marker: "bg-lime-500", hex: "#84cc16" }
];

export function getProviderColor(provider: string) {
  const normalized = provider.trim().toLowerCase();
  const hash = Array.from(normalized).reduce((total, character) => total + character.charCodeAt(0), 0);

  return providerPalette[hash % providerPalette.length];
}
