// Server-side palette extraction. Pulls dominant colors out of the hero image
// and returns a theme override that the public party page can apply.
//
// Caches per-URL in a module-level Map; survives within a single Vercel
// serverless instance (cold-starts re-extract, which is fine).

import { Vibrant } from "node-vibrant/node";

export interface PaletteOverride {
  bg: string;
  card: string;
  accent: string;
  secondary: string;
  ink: string;
  mutedInk: string;
}

const cache = new Map<string, PaletteOverride>();

function hex(swatch: { hex?: string } | null | undefined, fallback: string): string {
  return swatch && swatch.hex ? swatch.hex : fallback;
}

function lighten(hexColor: string, amount: number): string {
  const c = hexColor.replace("#", "");
  const r = parseInt(c.slice(0, 2), 16);
  const g = parseInt(c.slice(2, 4), 16);
  const b = parseInt(c.slice(4, 6), 16);
  const blend = (v: number) => Math.round(v + (255 - v) * amount);
  return `#${[blend(r), blend(g), blend(b)]
    .map((v) => v.toString(16).padStart(2, "0"))
    .join("")}`;
}

export async function extractPaletteFromUrl(
  imageUrl: string,
): Promise<PaletteOverride | null> {
  if (!imageUrl) return null;
  if (cache.has(imageUrl)) return cache.get(imageUrl)!;

  try {
    const palette = await Vibrant.from(imageUrl).getPalette();

    const vibrant = hex(palette.Vibrant, "#E94F8A");
    const lightVibrant = hex(palette.LightVibrant, lighten(vibrant, 0.55));
    const darkVibrant = hex(palette.DarkVibrant, "#2A1B3D");
    const muted = hex(palette.Muted, "#6B6080");
    const lightMuted = hex(palette.LightMuted, lighten(muted, 0.5));

    const override: PaletteOverride = {
      bg: `linear-gradient(160deg, ${lighten(lightVibrant, 0.45)}, ${lighten(lightMuted, 0.55)})`,
      card: "#ffffff",
      accent: vibrant,
      secondary: lightVibrant,
      ink: darkVibrant,
      mutedInk: muted,
    };
    cache.set(imageUrl, override);
    return override;
  } catch (err) {
    console.warn("[partypost] palette extraction failed", imageUrl, err);
    return null;
  }
}

export function applyPaletteOverride(
  base: {
    background: string;
    card: string;
    accent: string;
    secondary: string;
    ink: string;
    mutedInk: string;
  },
  override: PaletteOverride | null,
) {
  if (!override) return base;
  return {
    ...base,
    background: override.bg,
    card: override.card,
    accent: override.accent,
    secondary: override.secondary,
    ink: override.ink,
    mutedInk: override.mutedInk,
  };
}
