import { notFound } from "next/navigation";
import Link from "next/link";
import { findParty } from "@/config/parties";
import { fetchPartyOnly } from "@/lib/sheets";
import { inviteImage } from "@/lib/partyImages";
import { getTheme, themeCssVars, type ThemeTokens } from "@/lib/themes";
import { extractPaletteFromUrl, applyPaletteOverride } from "@/lib/extractPalette";
import { ThanksView } from "./ThanksView";
import { ThanksCopyButton } from "./ThanksCopyButton";

type Params = { slug: string };
type SearchParams = Promise<{ t?: string; demo?: string }>;

export default async function ThanksPage({
  params,
  searchParams,
}: {
  params: Promise<Params>;
  searchParams: SearchParams;
}) {
  const { slug } = await params;
  const { t: token, demo } = await searchParams;
  const entry = findParty(slug);
  if (!entry) notFound();
  const isDemo = !!entry.fixture || demo === "1";

  let party;
  if (entry.fixture) {
    party = entry.fixture.party;
  } else if (entry.scriptUrl) {
    try {
      party = await fetchPartyOnly(entry.scriptUrl);
    } catch {
      notFound();
    }
  } else {
    notFound();
  }

  const baseTheme = getTheme(party.theme);
  const invite = inviteImage(party);
  let theme: ThemeTokens = baseTheme;
  if (invite) {
    const palette = await extractPaletteFromUrl(absoluteUrl(invite));
    theme = { ...baseTheme, ...applyPaletteOverride(baseTheme, palette) };
  }

  const editPath = token ? `/party/${slug}/rsvp/edit/${token}` : null;

  return (
    <div className="themed" style={themeCssVars(theme)}>
      <main className="mx-auto max-w-xl px-4 pt-10 pb-16 sm:px-6">
        <div className="pp-card overflow-hidden">
          {invite && (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={invite}
              alt={party.party_title}
              className="block w-full h-auto"
            />
          )}
          <div className="px-6 py-8 text-center">
            <h1 className="text-3xl font-bold">Yay! Your RSVP is in.</h1>
            <p className="mt-2 text-base pp-muted">
              The snack-counting fairies have been notified.
            </p>

            {editPath && (
              <div className="mt-6 rounded-2xl bg-white/70 p-4 text-left">
                <div className="text-sm font-semibold">Need to change something?</div>
                <p className="mt-1 text-sm pp-muted">
                  Save this magic link — it lets you update your RSVP later without making an account.
                </p>
                <ThanksCopyButton path={editPath} />
              </div>
            )}

            {isDemo && (
              <div className="mt-6 rounded-2xl bg-white/85 p-4 text-left text-sm text-zinc-700">
                ✨ This is a demo. Your RSVP wasn&apos;t saved anywhere — but the
                real version sends a beautiful confirmation email with the
                invite art, calendar links, and a magic edit link.
              </div>
            )}

            <div className="mt-6 flex flex-wrap justify-center gap-2">
              <Link
                href={`/party/${slug}`}
                className="rounded-full border border-zinc-300 bg-white px-4 py-2 text-sm font-medium hover:bg-zinc-50"
              >
                Back to party
              </Link>
            </div>

            <p className="mt-8 text-xs pp-muted">
              This party invite system was built with Claude. The code is open
              source at{" "}
              <a
                href="https://github.com/amyleesterling/partypost"
                target="_blank"
                rel="noopener noreferrer"
                className="underline underline-offset-2 hover:opacity-70"
              >
                github.com/amyleesterling/partypost
              </a>
            </p>
          </div>
        </div>
      </main>
      <ThanksView />
    </div>
  );
}

function absoluteUrl(url: string): string {
  if (/^https?:\/\//i.test(url)) return url;
  const base = (process.env.NEXT_PUBLIC_SITE_URL || "https://partypost.vercel.app").replace(/\/$/, "");
  return base + (url.startsWith("/") ? url : "/" + url);
}
