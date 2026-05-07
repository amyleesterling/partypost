import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { PartyManager } from "./PartyManager";

type Params = { id: string };

export default async function PartyManagePage({ params }: { params: Promise<Params> }) {
  const { id } = await params;
  const supabase = await createClient();

  const [{ data: party }, { data: rsvps }, { data: notes }] = await Promise.all([
    supabase.from("parties").select("*").eq("id", id).maybeSingle(),
    supabase.from("rsvps").select("*").eq("party_id", id).order("created_at", { ascending: false }),
    supabase.from("notes").select("*").eq("party_id", id).order("created_at", { ascending: false }),
  ]);

  if (!party) notFound();

  return (
    <PartyManager
      party={party}
      rsvps={rsvps ?? []}
      notes={notes ?? []}
    />
  );
}
