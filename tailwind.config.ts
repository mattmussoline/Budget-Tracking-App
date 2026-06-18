import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        surface: "#E0E5EC",
        foreground: "#3D4852",
        muted: "#6B7280",
        accent: "#6C63FF",
        "accent-light": "#8B84FF",
        success: "#38B2AC"
      },
      fontFamily: {
        body: ["var(--font-outfit)", "system-ui", "sans-serif"],
        display: ["var(--font-outfit)", "system-ui", "sans-serif"]
      },
      borderRadius: {
        soft: "32px"
      }
    }
  },
  plugins: []
};

export default config;
