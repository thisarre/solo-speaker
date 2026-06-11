import type { Config } from "tailwindcss";

const config: Config = {
  darkMode: "class",
  content: ["./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        background: "var(--bg)",
        bg: "var(--bg)",
        border: "var(--line)",
        panel: "var(--panel)",
        surface: "var(--surface)",
        foreground: "var(--ink)",
        line: "var(--line)",
        line2: "var(--line2)",
        ink: "var(--ink)",
        muted: "var(--mute)",
        mute: "var(--mute)",
        faint: "var(--faint)",
        accent: "var(--accent)",
        "accent-muted": "var(--accent-bg)",
        "accent-ink": "var(--accent-ink)",
        "accent-bg": "var(--accent-bg)",
        ok: "var(--ok)"
      },
      boxShadow: {
        studio: "var(--shadow)"
      },
      fontFamily: {
        sans: ["var(--font-geist-sans)", "Geist", "ui-sans-serif", "system-ui"],
        mono: ["var(--font-geist-mono)", "Geist Mono", "ui-monospace", "SFMono-Regular"]
      }
    }
  }
};

export default config;
