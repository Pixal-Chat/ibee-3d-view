import type { Config } from "tailwindcss";

export default {
  content: ["./app/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        primary: "var(--color-primary)",
        "primary-hover": "var(--color-primary-hover)",
        outline: "var(--color-outline)",
        "outline-dark": "var(--color-outline-dark)",
        bg: "var(--color-bg)",
        panel: "var(--color-panel)",
      },
      boxShadow: {
        panel: "0 1px 2px rgba(15, 23, 42, 0.06), 0 10px 24px rgba(15, 23, 42, 0.04)",
      },
      backgroundImage: {
        "grid-fade":
          "radial-gradient(circle at top, rgba(249,115,22,0.08), transparent 32%), linear-gradient(to bottom, rgba(255,255,255,0.9), rgba(248,250,252,1))",
      },
    },
  },
  plugins: [],
} satisfies Config;
