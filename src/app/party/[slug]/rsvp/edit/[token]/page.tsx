import { notFound } from "next/navigation";
import Link from "next/link";
import { createServiceClient } from "@/lib/supabase/service";
import { getTheme, themeCssVars } from "@/lib/themes";
import { RsvpForm } from "../../../RsvpForm";

type Params = { slug: string; token: string };

export default async function EditRsvpPage({ params }: { params: Promise<Params> }) {
  const { slug, token } = await params;
  const svc = createServiceClient();

  const { data: rsvp } = await svc
    .from("rsvps")
    .select("*")
    .eq("edit_token", token)
    .maybeSingle();
  if (!rsvp) notFound();

  const { data: party } = await svc
    .from("parties")
    .select("*")
    .eq("id", rsvp.party_id)
    .maybeSingle();
  if (!party || party.slug !== slug || !party.is_published) notFound();

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
            <RsvpForm party={party} initial={rsvp} editToken={token} />
          </div>
        </div>
      </main>
    </div>
  );
}
