const { heroui } = require("@heroui/react");

/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./index.html",
    "./src/**/*.{js,jsx}",
    "../node_modules/@heroui/**/theme/dist/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {},
  },
  darkMode: "class",
  plugins: [
    heroui({
      themes: {
        light: {
          colors: {
            primary: {
              50:  "#fefce8",
              100: "#f7f0b2",
              200: "#efe07a",
              300: "#ddc94a",
              400: "#cfc044",
              500: "#bdb23c",
              600: "#9b9b00",
              700: "#7f7800",
              800: "#5c5600",
              900: "#3d3900",
              DEFAULT: "#bdb23c",
              foreground: "#ffffff",
            },
          },
        },
        dark: {
          colors: {
            primary: {
              50:  "#fefce8",
              100: "#f7f0b2",
              200: "#efe07a",
              300: "#ddc94a",
              400: "#cfc044",
              500: "#bdb23c",
              600: "#9b9b00",
              700: "#7f7800",
              800: "#5c5600",
              900: "#3d3900",
              DEFAULT: "#bdb23c",
              foreground: "#ffffff",
            },
          },
        },
      },
    }),
  ],
};
