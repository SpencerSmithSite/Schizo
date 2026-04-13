import type { Config } from "tailwindcss";

export default {
  content: ["./index.html", "./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        cork: {
          50: "#fdf6ee",
          100: "#f8e9d4",
          200: "#f0d0a8",
          300: "#e6b57a",
          400: "#da9450",
          500: "#c97a32",
          600: "#a85e24",
          700: "#854520",
          800: "#623220",
          900: "#431f14",
        },
      },
      fontFamily: {
        handwriting: ["'Caveat'", "cursive"],
        mono: ["'Courier Prime'", "monospace"],
      },
    },
  },
  plugins: [],
} satisfies Config;
