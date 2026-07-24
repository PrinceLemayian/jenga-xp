/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,jsx}"],
  theme: {
    extend: {
      colors: {
        app: "#0B0B0D",
        elevated: "#16161A",
        "elevated-2": "#1E1E23",
        subtle: "#2A2A30",
        primary: "#F5F5F7",
        secondary: "#9B9BA3",
        tertiary: "#5C5C64",
        amber: "#F59E0B",
      },
      boxShadow: {
        ios: "0 1px 2px rgba(0,0,0,0.4), 0 0 0 1px rgba(255,255,255,0.04) inset",
      },
      backgroundImage: {
        "card-sheen": "linear-gradient(135deg, rgba(255,255,255,0.18), rgba(255,255,255,0) 38%)",
      },
    },
  },
  plugins: [],
};
