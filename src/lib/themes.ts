// Theme tokens for the public party page. Applied as CSS variables on the page root.
// Per spec §3.4 and §12.

export type ThemeKey =
  | "default"
  | "beach"
  | "princess"
  | "woodland"
  | "space"
  | "rainbow"
  | "science"
  | "garden-tea"
  | "arcade"
  | "dinosaur";

export interface ThemeTokens {
  key: ThemeKey;
  name: string;
  background: string;
  card: string;
  accent: string;
  secondary: string;
  ink: string;
  mutedInk: string;
  headingFont: string;
  bodyFont: string;
  buttonRadius: string;
  motif: string;
  emoji: string;
}

export const THEMES: Record<ThemeKey, ThemeTokens> = {
  default: {
    key: "default",
    name: "Soft Default",
    background: "linear-gradient(160deg, #fff7f9, #f0f4ff)",
    card: "#ffffff",
    accent: "#E94F8A",
    secondary: "#6F8AF5",
    ink: "#2A1B3D",
    mutedInk: "#6B6080",
    headingFont: "var(--font-playful), 'Geist', system-ui, sans-serif",
    bodyFont: "var(--font-body), 'Geist', system-ui, sans-serif",
    buttonRadius: "9999px",
    motif: "confetti-stars",
    emoji: "🎉",
  },
  beach: {
    key: "beach",
    name: "Beach Birthday",
    background: "linear-gradient(180deg, #87CEEB 0%, #B3E0FF 45%, #E0F2FF 75%, #FFF5D6 100%)",
    card: "#ffffff",
    accent: "#2F80ED",
    secondary: "#FFD166",
    ink: "#0E3F5F",
    mutedInk: "#5A7187",
    headingFont: "var(--font-playful), 'Geist', system-ui, sans-serif",
    bodyFont: "var(--font-body), 'Geist', system-ui, sans-serif",
    buttonRadius: "9999px",
    motif: "shells-waves-wildflowers",
    emoji: "🌊",
  },
  princess: {
    key: "princess",
    name: "Princess Picnic",
    background: "linear-gradient(160deg, #fff0f7, #ffe6ee)",
    card: "#fffbfd",
    accent: "#D6336C",
    secondary: "#FFD6E8",
    ink: "#4A1E3A",
    mutedInk: "#8A6479",
    headingFont: "var(--font-playful), 'Geist', system-ui, sans-serif",
    bodyFont: "var(--font-body), 'Geist', system-ui, sans-serif",
    buttonRadius: "9999px",
    motif: "crowns-roses-ribbons",
    emoji: "👑",
  },
  woodland: {
    key: "woodland",
    name: "Woodland Party",
    background: "linear-gradient(170deg, #f0f5e8, #e6f0d6)",
    card: "#fbfaf3",
    accent: "#5C7A3C",
    secondary: "#C7935C",
    ink: "#2C3A1E",
    mutedInk: "#5E6B4A",
    headingFont: "var(--font-playful), 'Geist', system-ui, sans-serif",
    bodyFont: "var(--font-body), 'Geist', system-ui, sans-serif",
    buttonRadius: "16px",
    motif: "leaves-mushrooms-foxes",
    emoji: "🍄",
  },
  space: {
    key: "space",
    name: "Space Adventure",
    background: "linear-gradient(180deg, #1a1346, #0f0a2e)",
    card: "#2a2257",
    accent: "#FFD166",
    secondary: "#7B5BFF",
    ink: "#F5F2FF",
    mutedInk: "#B8B0DB",
    headingFont: "var(--font-playful), 'Geist', system-ui, sans-serif",
    bodyFont: "var(--font-body), 'Geist', system-ui, sans-serif",
    buttonRadius: "12px",
    motif: "stars-rockets-planets",
    emoji: "🚀",
  },
  rainbow: {
    key: "rainbow",
    name: "Rainbow Art Party",
    background: "linear-gradient(135deg, #ffe5ec, #fff5d6, #d6f5e0, #e0e7ff, #f5d6ff)",
    card: "#ffffff",
    accent: "#E94F8A",
    secondary: "#6F8AF5",
    ink: "#2A1B3D",
    mutedInk: "#6B6080",
    headingFont: "var(--font-playful), 'Geist', system-ui, sans-serif",
    bodyFont: "var(--font-body), 'Geist', system-ui, sans-serif",
    buttonRadius: "9999px",
    motif: "rainbows-paintbrushes-stars",
    emoji: "🌈",
  },
  science: {
    key: "science",
    name: "Science Party",
    background: "linear-gradient(170deg, #e6f4ff, #f0e6ff)",
    card: "#ffffff",
    accent: "#1E88E5",
    secondary: "#9C27B0",
    ink: "#1A2438",
    mutedInk: "#5A6680",
    headingFont: "var(--font-playful), 'Geist', system-ui, sans-serif",
    bodyFont: "var(--font-body), 'Geist', system-ui, sans-serif",
    buttonRadius: "12px",
    motif: "atoms-test-tubes-sparks",
    emoji: "🧪",
  },
  "garden-tea": {
    key: "garden-tea",
    name: "Garden Tea Party",
    background: "linear-gradient(170deg, #fdf6e8, #f0e8d6)",
    card: "#fffdf7",
    accent: "#A4654E",
    secondary: "#8FA86E",
    ink: "#3D2E20",
    mutedInk: "#7A6A55",
    headingFont: "var(--font-playful), 'Geist', system-ui, sans-serif",
    bodyFont: "var(--font-body), 'Geist', system-ui, sans-serif",
    buttonRadius: "16px",
    motif: "teacups-flowers-butterflies",
    emoji: "🫖",
  },
  arcade: {
    key: "arcade",
    name: "Arcade Party",
    background: "linear-gradient(180deg, #1a0f3d, #2d1b5c)",
    card: "#2a1f5c",
    accent: "#FF3DA5",
    secondary: "#3DD9FF",
    ink: "#FFFFFF",
    mutedInk: "#C8BEFF",
    headingFont: "var(--font-playful), 'Geist', system-ui, sans-serif",
    bodyFont: "var(--font-body), 'Geist', system-ui, sans-serif",
    buttonRadius: "8px",
    motif: "pixels-coins-controllers",
    emoji: "🕹️",
  },
  dinosaur: {
    key: "dinosaur",
    name: "Dinosaur Bash",
    background: "linear-gradient(170deg, #f0e8d6, #d6e0c0)",
    card: "#fbf6e6",
    accent: "#3E7B3E",
    secondary: "#D97706",
    ink: "#2A2418",
    mutedInk: "#6B5F45",
    headingFont: "var(--font-playful), 'Geist', system-ui, sans-serif",
    bodyFont: "var(--font-body), 'Geist', system-ui, sans-serif",
    buttonRadius: "12px",
    motif: "dinos-volcanoes-ferns",
    emoji: "🦖",
  },
};

export function getTheme(key: string | null | undefined): ThemeTokens {
  if (!key) return THEMES.default;
  return (THEMES as Record<string, ThemeTokens>)[key] ?? THEMES.default;
}

// CSS vars to spread into the page root style attribute.
export function themeCssVars(theme: ThemeTokens): React.CSSProperties {
  return {
    ["--bg" as string]: theme.background,
    ["--card" as string]: theme.card,
    ["--accent" as string]: theme.accent,
    ["--secondary" as string]: theme.secondary,
    ["--ink" as string]: theme.ink,
    ["--muted-ink" as string]: theme.mutedInk,
    ["--heading-font" as string]: theme.headingFont,
    ["--body-font" as string]: theme.bodyFont,
    ["--button-radius" as string]: theme.buttonRadius,
  } as React.CSSProperties;
}
