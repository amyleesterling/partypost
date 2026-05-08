import { notFound } from "next/navigation";
import { cookies } from "next/headers";
import { findParty } from "@/config/parties";
import { fetchPartyBundle } from "@/lib/sheets";
import { bannerImage } from "@/lib/partyImages";
import { getTheme, themeCssVars, type ThemeTokens } from "@/lib/themes";
import { extractPaletteFromUrl, applyPaletteOverride } from "@/lib/extractPalette";
import { PublicPartyView } from "./PublicPartyView";
import { PasswordGate } from "./PasswordGate";

type Params = { slug: string };
type SearchParams = Promise<{ i?: string }>;

export const revalidate = 60; // re-fetch sheet at most every 60s

export default async function PublicPartyPage({
  params,
  searchParams,
}: {
  params: Promise<Params>;
  searchParams: SearchParams;
}) {
  const { slug } = await params;
  const { i: inviteToken } = await searchParams;
  const entry = findParty(slug);
  if (!entry) notFound();

  // Password gate. Bypassed when:
  //  - the party isn't password-protected (no passwordEnv), OR
  //  - the visitor has a valid invitation token in the URL (?i=...), OR
  //  - the visitor previously unlocked and has the matching cookie.
  if (entry.passwordEnv && !inviteToken) {
    const expected = process.env[entry.passwordEnv];
    const cookieStore = await cookies();
    const unlock = cookieStore.get(`pp-unlock-${slug}`)?.value;
    if (!expected || unlock !== expected) {
      return <PasswordGate slug={slug} />;
    }
  }

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
        inviteToken={inviteToken || null}
      />
    </div>
  );
}

function absoluteUrl(url: string): string {
  if (/^https?:\/\//i.test(url)) return url;
  const base = (process.env.NEXT_PUBLIC_SITE_URL || "https://partypost.vercel.app").replace(/\/$/, "");
  return base + (url.startsWith("/") ? url : "/" + url);
}
