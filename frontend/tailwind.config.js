/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        surface: {
          DEFAULT: "#0d0f1a",
          card: "#161927",
          card2: "#1e2235",
          border: "#2a2d3e",
        },
      },
    },
  },
  plugins: [],
};
