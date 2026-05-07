import { notFound } from "next/navigation";
import { findParty } from "@/config/parties";
import { fetchPartyBundle } from "@/lib/sheets";
import { getTheme, themeCssVars } from "@/lib/themes";
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
  const theme = getTheme(party.theme);

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
