import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./lib/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        surface: "var(--surface)",
        card: "var(--card)",
        stroke: "var(--stroke)",
        text: "var(--text)",
        muted: "var(--muted)",
        accent: "var(--accent)",
        accentSoft: "var(--accent-soft)",
        success: "var(--success)",
        warning: "var(--warning)",
      },
      fontFamily: {
        sans: [
          "\"SF Pro Display\"",
          "\"SF Pro Text\"",
          "\"Helvetica Neue\"",
          "Helvetica",
          "Arial",
          "sans-serif",
        ],
      },
      boxShadow: {
        card: "0 12px 40px rgba(15, 23, 42, 0.08)",
        glow: "0 16px 48px rgba(91, 142, 255, 0.18)",
      },
      backgroundImage: {
        "app-light":
          "radial-gradient(circle at top left, rgba(255,255,255,0.95), rgba(244,247,251,0.92) 45%, rgba(236,240,246,0.94))",
        "app-dark":
          "radial-gradient(circle at top left, rgba(41,52,78,0.55), rgba(12,18,29,0.96) 45%, rgba(9,12,20,1))",
      },
      animation: {
        float: "float 7s ease-in-out infinite",
        "fade-up": "fadeUp 500ms ease-out",
      },
      keyframes: {
        float: {
          "0%, 100%": { transform: "translateY(0px)" },
          "50%": { transform: "translateY(-10px)" },
        },
        fadeUp: {
          from: { opacity: "0", transform: "translateY(12px)" },
          to: { opacity: "1", transform: "translateY(0)" },
        },
      },
    },
  },
  plugins: [],
};

export default config;
