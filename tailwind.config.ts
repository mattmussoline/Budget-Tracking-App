import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        // Official Formed anchors
        "formed-blue": "var(--formed-blue)",
        "formed-blue-hover": "var(--formed-blue-hover)",
        "formed-blue-soft": "var(--formed-blue-soft)",
        "formed-blue-border": "var(--formed-blue-border)",
        "augustine-blue": "var(--augustine-blue)",
        "augustine-blue-raised": "var(--augustine-blue-raised)",

        // Approved support palette
        parchment: "var(--parchment)",
        "soft-slate": "var(--soft-slate)",
        "guild-gold": "var(--guild-gold)",
        "guild-gold-soft": "var(--guild-gold-soft)",
        "guild-gold-ink": "var(--guild-gold-ink)",
        "deep-teal": "var(--deep-teal)",
        "deep-teal-soft": "var(--deep-teal-soft)",
        ink: "var(--ink)",

        // Surfaces and text
        panel: "var(--panel)",
        "panel-warm": "var(--panel-warm)",
        hairline: "var(--border)",
        "hairline-strong": "var(--border-strong)",
        danger: "var(--danger)",
        "danger-soft": "var(--danger-soft)",
        "danger-border": "var(--danger-border)",

        "tone-blue-bg": "var(--tone-blue-bg)",
        "tone-blue-ink": "var(--tone-blue-ink)",
        "tone-blue-line": "var(--tone-blue-line)",
        "tone-cyan-bg": "var(--tone-cyan-bg)",
        "tone-cyan-ink": "var(--tone-cyan-ink)",
        "tone-cyan-line": "var(--tone-cyan-line)",
        "tone-green-bg": "var(--tone-green-bg)",
        "tone-green-ink": "var(--tone-green-ink)",
        "tone-green-line": "var(--tone-green-line)",
        "tone-amber-bg": "var(--tone-amber-bg)",
        "tone-amber-ink": "var(--tone-amber-ink)",
        "tone-amber-line": "var(--tone-amber-line)",
        "tone-orange-bg": "var(--tone-orange-bg)",
        "tone-orange-ink": "var(--tone-orange-ink)",
        "tone-orange-line": "var(--tone-orange-line)",
        "tone-red-bg": "var(--tone-red-bg)",
        "tone-red-ink": "var(--tone-red-ink)",
        "tone-red-line": "var(--tone-red-line)",
        "tone-purple-bg": "var(--tone-purple-bg)",
        "tone-purple-ink": "var(--tone-purple-ink)",
        "tone-purple-line": "var(--tone-purple-line)",
        "tone-slate-bg": "var(--tone-slate-bg)",
        "tone-slate-ink": "var(--tone-slate-ink)",
        "tone-slate-line": "var(--tone-slate-line)",

        // Legacy names used across existing components
        surface: "var(--panel)",
        foreground: "var(--ink)",
        muted: "var(--ink-muted)",
        faint: "var(--ink-faint)",
        accent: "var(--formed-blue)",
        "accent-light": "var(--accent-light)",
        success: "var(--deep-teal)"
      },
      fontFamily: {
        body: ["var(--font-manrope)", "Helvetica Neue", "Helvetica", "Arial", "sans-serif"],
        display: ["var(--font-instrument-serif)", "Georgia", "Times New Roman", "serif"]
      },
      borderRadius: {
        soft: "12px"
      }
    }
  },
  plugins: []
};

export default config;
