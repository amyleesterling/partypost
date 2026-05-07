import { notFound } from "next/navigation";
import { findParty } from "@/config/parties";
import { fetchPartyBundle } from "@/lib/sheets";
import { bannerImage } from "@/lib/partyImages";
import { getTheme, themeCssVars, type ThemeTokens } from "@/lib/themes";
import { extractPaletteFromUrl, applyPaletteOverride } from "@/lib/extractPalette";
import { PublicPartyView } from "./PublicPartyView";

type Params = { slug: string };

export const revalidate = 60; // re-fetch sheet at most every 60s

export default async function PublicPartyPage({ params }: { params: Promise<Params> }) {
  const { slug } = await params;
  const entry = findParty(slug);
  if (!entry) notFound();

  let party;
  let notes;
  if (entry.fixture) {
    party = entry.fixture.party;
    notes = entry.fixture.notes;
  } else if (entry.scriptUrl) {
    try {
      const bundle = await fetchPartyBundle(entry.scriptUrl);
      party = bundle.party;
      notes = bundle.notes;
    } catch {
      notFound();
    }
  } else {
    notFound();
  }
  const baseTheme = getTheme(party.theme);

  // Auto-derive theme colors from the banner image (falls back to invite if
  // no banner). Falls through to the static theme if extraction fails.
  const sourceImage = bannerImage(party);
  let theme: ThemeTokens = baseTheme;
  if (sourceImage) {
    const url = absoluteUrl(sourceImage);
    const palette = await extractPaletteFromUrl(url);
    theme = { ...baseTheme, ...applyPaletteOverride(baseTheme, palette) };
  }

  return (
    <div className="themed" style={themeCssVars(theme)}>
      <PublicPartyView
        slug={slug}
        scriptUrl={entry.scriptUrl}
        isDemo={!!entry.fixture}
        party={party}
        notes={notes}
      />
    </div>
  );
}

function absoluteUrl(url: string): string {
  if (/^https?:\/\//i.test(url)) return url;
  const base = (process.env.NEXT_PUBLIC_SITE_URL || "https://partypost.vercel.app").replace(/\/$/, "");
  return base + (url.startsWith("/") ? url : "/" + url);
}
