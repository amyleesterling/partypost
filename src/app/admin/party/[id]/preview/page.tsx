import { notFound, redirect } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { getTheme, themeCssVars } from "@/lib/themes";
import { PublicPartyView } from "../../../../party/[slug]/PublicPartyView";

type Params = { id: string };

export default async function PartyPreview({ params }: { params: Promise<Params> }) {
  const { id } = await params;
  const supabase = await createClient();
  const { data: party } = await supabase.from("parties").select("*").eq("id", id).maybeSingle();
  if (!party) notFound();

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user || party.host_user_id !== user.id) redirect("/admin");

  const { data: notes } = await supabase
    .from("notes")
    .select("id, display_name, message, created_at")
    .eq("party_id", id)
    .eq("is_approved", true)
    .eq("is_public", true)
    .order("created_at", { ascending: false });

  const theme = getTheme(party.theme);

  return (
    <div className="themed" style={themeCssVars(theme)}>
      <div className="bg-amber-100 px-4 py-2 text-center text-sm text-amber-900">
        👁 Preview mode — only you can see this.{" "}
        <Link href={`/admin/party/${id}`} className="underline">
          back to manage
        </Link>
      </div>
      <PublicPartyView party={party} notes={notes ?? []} themeEmoji={theme.emoji} themeName={theme.name} />
    </div>
  );
}
