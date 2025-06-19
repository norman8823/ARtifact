export const UniversalColors = {
  lightGray: "#f5f5f5",
  medLightGray: "#eee",
  medGray: "#999",
  darkMedGray: "#666",
  darkGray: "#333",

  lightYellow: "#fef3c7",
  darkYellow: "#d97706",

  lightGreen: "#f0fdf4",
  darkGreen: "#16a34a",

  metRed: "#b60021",
  favoriteRed: "#ff4444",
} as const;

export const Colors = {
  ...UniversalColors,

  light: {
    text: UniversalColors.darkGray,
    background: UniversalColors.lightGray,
  },
  dark: {
    text: "white",
    background: "black",
  },
};

export type ColorName = keyof typeof UniversalColors;
