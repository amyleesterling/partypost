import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { cookies } from "next/headers";
import { findParty } from "@/config/parties";
import { fetchPartyBundle, fetchPartyOnly } from "@/lib/sheets";
import { formatPartyDateLong } from "@/lib/format";
import { bannerImage } from "@/lib/partyImages";
import { getTheme, themeCssVars, type ThemeTokens } from "@/lib/themes";
import { extractPaletteFromUrl, applyPaletteOverride } from "@/lib/extractPalette";
import { PublicPartyView } from "./PublicPartyView";
import { PasswordGate } from "./PasswordGate";

type Params = { slug: string };
type SearchParams = Promise<{ i?: string }>;

export const revalidate = 60; // re-fetch sheet at most every 60s

export async function generateMetadata({
  params,
}: {
  params: Promise<Params>;
}): Promise<Metadata> {
  const { slug } = await params;
  const entry = findParty(slug);
  if (!entry) return {};

  let party;
  if (entry.fixture) {
    party = entry.fixture.party;
  } else if (entry.scriptUrl) {
    try {
      party = await fetchPartyOnly(entry.scriptUrl);
    } catch {
      return {};
    }
  } else {
    return {};
  }

  const title = party.party_title || `${party.birthday_child_name}'s Birthday`;
  const when = formatPartyDateLong(party.date);
  const description =
    party.description ||
    [when, party.location_name].filter(Boolean).join(" · ") ||
    "You're invited!";
  // Landscape banner crops better than the portrait invite in link previews.
  const image = bannerImage(party);
  const url = `${siteUrl()}/party/${slug}`;

  return {
    title,
    description,
    openGraph: {
      title,
      description,
      url,
      type: "website",
      images: image ? [{ url: absoluteUrl(image), alt: title }] : undefined,
    },
    twitter: {
      card: image ? "summary_large_image" : "summary",
      title,
      description,
      images: image ? [absoluteUrl(image)] : undefined,
    },
  };
}

function siteUrl(): string {
  const explicit = process.env.NEXT_PUBLIC_SITE_URL;
  if (explicit) return explicit.replace(/\/$/, "");
  const vercel = process.env.VERCEL_PROJECT_PRODUCTION_URL;
  if (vercel) return `https://${vercel}`;
  return "https://partypost.vercel.app";
}

function absoluteUrl(url: string): string {
  if (/^https?:\/\//i.test(url)) return url;
  return siteUrl() + (url.startsWith("/") ? url : "/" + url);
}

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

