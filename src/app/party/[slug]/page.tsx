import { notFound } from "next/navigation";
import { findParty } from "@/config/parties";
import { fetchPartyBundle } from "@/lib/sheets";
import { getTheme, themeCssVars, type ThemeTokens } from "@/lib/themes";
import { extractPaletteFromUrl, applyPaletteOverride } from "@/lib/extractPalette";
import { PublicPartyView } from "./PublicPartyView";

type Params = { slug: string };

export const revalidate = 60; // re-fetch sheet at most every 60s

export default async function PublicPartyPage({ params }: { params: Promise<Params> }) {
  const { slug } = await params;
  const entry = findParty(slug);
  if (!entry) notFound();

  let bundle;
  try {
    bundle = await fetchPartyBundle(entry.scriptUrl);
  } catch {
    notFound();
  }

  const { party, notes } = bundle;
  const baseTheme = getTheme(party.theme);

  // Auto-derive theme colors from the hero image (if any). Falls through to
  // the static theme if extraction fails.
  let theme: ThemeTokens = baseTheme;
  if (party.hero_image_url) {
    const heroUrl = absoluteUrl(party.hero_image_url, entry.scriptUrl);
    const palette = await extractPaletteFromUrl(heroUrl);
    theme = { ...baseTheme, ...applyPaletteOverride(baseTheme, palette) };
  }

  return (
    <div className="themed" style={themeCssVars(theme)}>
      <PublicPartyView
        slug={slug}
        scriptUrl={entry.scriptUrl}
        party={party}
        notes={notes}
        themeEmoji={theme.emoji}
        themeName={theme.name}
      />
    </div>
  );
}

function absoluteUrl(url: string, _scriptUrl: string): string {
  if (/^https?:\/\//i.test(url)) return url;
  // Site-relative URL like /sophia-7-invite.png — resolve against the site origin.
  const base = (process.env.NEXT_PUBLIC_SITE_URL || "https://partypost.vercel.app").replace(/\/$/, "");
  return base + (url.startsWith("/") ? url : "/" + url);
}
