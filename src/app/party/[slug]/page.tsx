import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getTheme, themeCssVars } from "@/lib/themes";
import { PublicPartyView } from "./PublicPartyView";

type Params = { slug: string };

export const revalidate = 30; // Re-fetch at most every 30s.

export default async function PublicPartyPage({ params }: { params: Promise<Params> }) {
  const { slug } = await params;
  const supabase = await createClient();
  const { data: party } = await supabase
    .from("parties")
    .select("*")
    .eq("slug", slug)
    .maybeSingle();

  if (!party || !party.is_published) notFound();

  const { data: notes } = await supabase
    .from("notes")
    .select("id, display_name, message, created_at")
    .eq("party_id", party.id)
    .eq("is_approved", true)
    .eq("is_public", true)
    .order("created_at", { ascending: false });

  const theme = getTheme(party.theme);

  return (
    <div className="themed" style={themeCssVars(theme)}>
      <PublicPartyView party={party} notes={notes ?? []} themeEmoji={theme.emoji} themeName={theme.name} />
    </div>
  );
}
