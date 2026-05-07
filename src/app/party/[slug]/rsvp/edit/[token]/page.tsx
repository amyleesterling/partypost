import { notFound } from "next/navigation";
import Link from "next/link";
import { findParty } from "@/config/parties";
import { fetchPartyOnly, fetchRsvpByToken } from "@/lib/sheets";
import { getTheme, themeCssVars } from "@/lib/themes";
import { RsvpForm } from "../../../RsvpForm";

type Params = { slug: string; token: string };

export default async function EditRsvpPage({ params }: { params: Promise<Params> }) {
  const { slug, token } = await params;
  const entry = findParty(slug);
  if (!entry) notFound();

  let party;
  let rsvp;
  try {
    [party, rsvp] = await Promise.all([
      fetchPartyOnly(entry.scriptUrl),
      fetchRsvpByToken(entry.scriptUrl, token),
    ]);
  } catch {
    notFound();
  }

  const theme = getTheme(party.theme);

  return (
    <div className="themed" style={themeCssVars(theme)}>
      <main className="mx-auto max-w-xl px-4 py-10 sm:px-6">
        <Link href={`/party/${slug}`} className="text-sm pp-muted hover:underline">
          ← back to party
        </Link>
        <div className="mt-3 pp-card px-6 py-6">
          <h1 className="text-2xl font-bold">Update your RSVP</h1>
          <p className="mt-1 text-sm pp-muted">
            For {party.party_title}. Changes save instantly.
          </p>
          <div className="mt-5">
            <RsvpForm slug={slug} scriptUrl={entry.scriptUrl} initial={rsvp} editToken={token} />
          </div>
        </div>
      </main>
    </div>
  );
}
