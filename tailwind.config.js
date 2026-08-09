/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        panel: {
          50: "#f7f8fb",
          100: "#eef1f7",
          200: "#d8ddea",
          800: "#1e2330",
          900: "#131722",
        },
      },
    },
  },
  plugins: [],
};
