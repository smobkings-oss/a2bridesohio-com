import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./app/**/*.{js,ts,jsx,tsx,mdx}", "./components/**/*.{js,ts,jsx,tsx,mdx}"],
  theme: {
    extend: {
      colors: {
        brand: {
          black: "#0a0a0a",
          gold: "#d4af37",
          "gold-light": "#f0d78c",
          "gold-dark": "#a67c00",
          charcoal: "#1a1a1a",
        },
      },
    },
  },
  plugins: [],
};
export default config;
