import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./app/**/*.{ts,tsx}", "./components/**/*.{ts,tsx}", "./lib/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        bg: "var(--color-bg)",
        "bg-raised": "var(--color-bg-raised)",
        "bg-sunken": "var(--color-bg-sunken)",
        border: "var(--color-border)",
        "border-strong": "var(--color-border-strong)",
        text: "var(--color-text)",
        "text-secondary": "var(--color-text-secondary)",
        "text-faint": "var(--color-text-faint)",
        accent: {
          DEFAULT: "var(--color-accent)",
          strong: "var(--color-accent-strong)",
          soft: "var(--color-accent-soft)",
          on: "var(--color-accent-text-on)",
        },
        status: {
          "low-bg": "var(--color-status-low-bg)",
          "low-fg": "var(--color-status-low-fg)",
          "significant-bg": "var(--color-status-significant-bg)",
          "significant-fg": "var(--color-status-significant-fg)",
          "critical-bg": "var(--color-status-critical-bg)",
          "critical-fg": "var(--color-status-critical-fg)",
        },
        cool: {
          DEFAULT: "var(--color-cool)",
          soft: "var(--color-cool-soft)",
        },
      },
      fontFamily: {
        sans: ["var(--font-display)", "ui-sans-serif", "system-ui", "sans-serif"],
        mono: ["var(--font-outlier)", "ui-monospace", "monospace"],
      },
      borderRadius: {
        sm: "var(--radius-sm)",
        md: "var(--radius-md)",
        lg: "var(--radius-lg)",
        pill: "var(--radius-pill)",
        card: "var(--radius-card)",
      },
      boxShadow: {
        sm: "var(--shadow-sm)",
        md: "var(--shadow-md)",
        lg: "var(--shadow-lg)",
      },
      transitionTimingFunction: {
        "out-exp": "var(--ease-out-exp)",
      },
      maxWidth: {
        measure: "72ch",
      },
    },
  },
  plugins: [],
};

export default config;
