module.exports = {
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  theme: {
    extend: {
      colors: {
        "exchange-bg": "#1a1a1a",
        "exchange-surface": "#2a2a2a",
        buy: "#16a34a",
        sell: "#dc2626",
        neutral: "#6b7280",
      },
      fontFamily: {
        sans: ["system-ui", "sans-serif"],
      },
    },
  },
  plugins: [],
};
