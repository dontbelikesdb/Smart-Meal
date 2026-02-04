/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,jsx}"],
  theme: {
    extend: {
      fontFamily: {
        serif: ['"Playfair Display"', "serif"],
        display: ['"DM Serif Display"', "serif"],
        sans: ['"Inter"', "sans-serif"],
      },
      colors: {
        "brand-green": "#3E6D32",
        "cream-bg": "#F8F6F0",
        "forest-green": "#1E4620",
        "leaf-green": "#3B7D32",
        "filter-border": "#E5E0D6",
        "filter-text": "#1E4620",
      },
      boxShadow: {
        card: "0 10px 25px -5px rgba(0, 0, 0, 0.3), 0 8px 10px -6px rgba(0, 0, 0, 0.3)",
        btn: "0 4px 14px 0 rgba(62, 109, 50, 0.39)",
      },
    },
  },
  plugins: [],
};
