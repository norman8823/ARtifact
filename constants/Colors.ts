export const UniversalColors = {
  // Grays
  lightGray: "#f5f5f5",
  medLightGray: "#eee",
  medGray: "#999",
  darkMedGray: "#666",
  darkGray: "#333",

  // Yellows
  lightYellow: "#fef3c7",
  darkYellow: "#f59e0b",

  // Greens
  lightGreen: "#f0fdf4",
  darkGreen: "#16a34a",

  // Reds
  metRed: "#b60021",
  favoriteRed: "#ff4444",

  // Basic colors
  white: "#ffffff",
  black: "#000000",
} as const;

export const Colors = {
  ...UniversalColors,

  light: {
    text: "black",
    background: "white",
  },
  dark: {
    text: "white",
    background: "black",
  },
};

export type ColorName = keyof typeof UniversalColors;
