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

  // Premium only. Yellow already means "in progress" (active quest badge and
  // the progress-bar fill), so the premium badge must not reuse it — the two
  // were indistinguishable on the quest cards.
  lightPurple: "#f3e8ff",
  darkPurple: "#7e22ce",

  metRed: "#E4012A",
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
