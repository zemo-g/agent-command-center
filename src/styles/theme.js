// ─── GRUVBOX DARK THEME ───────────────────────────────────
// One source of truth for all colors. No inline hex codes.

export const T = {
  // Backgrounds
  bg0:    "#1d2021",
  bg1:    "#282828",
  bg2:    "#3c3836",
  bg3:    "#504945",
  bg4:    "#665c54",

  // Foregrounds
  fg0:    "#fbf1c7",
  fg1:    "#ebdbb2",
  fg2:    "#d5c4a1",
  fg3:    "#bdae93",
  fg4:    "#a89984",

  // Accents
  red:    "#cc241d",
  green:  "#98971a",
  yellow: "#d79921",
  blue:   "#458588",
  purple: "#b16286",
  aqua:   "#689d6a",
  orange: "#fe8019",

  // Bright accents
  bRed:    "#fb4934",
  bGreen:  "#b8bb26",
  bYellow: "#fabd2f",
  bBlue:   "#83a598",
  bPurple: "#d3869b",
  bAqua:   "#8ec07c",
  bOrange: "#fe8019",

  // Fonts
  mono:  "'IBM Plex Mono', 'Fira Code', monospace",
  display: "'Space Mono', 'IBM Plex Mono', monospace",

  // Shared styles
  radius: 8,
  radiusSm: 6,
};

// Category colors for buildings
export const CATEGORY_COLORS = {
  workforce: T.orange,
  infra:     T.blue,
  upgrade:   T.purple,
  command:   T.bYellow,
};
