/** @type {import('tailwindcss').Config} */
export default {
  darkMode: "class",
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  theme: {
    extend: {
      colors: {
        shield: {
          bg: "#0b1220",
          panel: "#111a2e",
          accent: "#22d3ee",
          danger: "#f87171",
          warn: "#fbbf24",
          ok: "#34d399",
        },
      },
    },
  },
  plugins: [],
};
