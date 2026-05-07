import { NextResponse, type NextRequest } from "next/server";
import { createServiceClient } from "@/lib/supabase/service";
import { rsvpSchema } from "@/lib/validation";
import { generateEditToken } from "@/lib/slug";
import { sendHostNotification, sendRsvpConfirmation } from "@/lib/email";

type Params = { slug: string };

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<Params> },
) {
  const { slug } = await params;

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const parsed = rsvpSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Validation failed", issues: parsed.error.issues },
      { status: 400 },
    );
  }

  const svc = createServiceClient();
  const { data: party, error: partyErr } = await svc
    .from("parties")
    .select("*")
    .eq("slug", slug)
    .maybeSingle();

  if (partyErr || !party) {
    return NextResponse.json({ error: "Party not found" }, { status: 404 });
  }
  if (!party.is_published) {
    return NextResponse.json({ error: "Party is not published yet" }, { status: 403 });
  }

  const editToken = generateEditToken();
  const insertPayload = {
    party_id: party.id,
    edit_token: editToken,
    status: parsed.data.status,
    parent_names: parsed.data.parent_names,
    email: parsed.data.email,
    phone: parsed.data.phone || null,
    child_names: parsed.data.child_names || null,
    kids_count: parsed.data.kids_count,
    adults_count: parsed.data.adults_count,
    allergy_notes: parsed.data.allergy_notes || null,
    private_note: parsed.data.private_note || null,
    public_note: parsed.data.public_note || null,
    public_note_consent: !!parsed.data.public_note_consent,
  };

  const { data: rsvp, error: insErr } = await svc
    .from("rsvps")
    .insert(insertPayload)
    .select("*")
    .single();

  if (insErr || !rsvp) {
    return NextResponse.json({ error: insErr?.message ?? "Could not save RSVP" }, { status: 500 });
  }

  if (parsed.data.public_note && parsed.data.public_note_consent) {
    await svc.from("notes").insert({
      party_id: party.id,
      rsvp_id: rsvp.id,
      display_name: parsed.data.parent_names,
      message: parsed.data.public_note,
      is_public: true,
      is_approved: false,
    });
  }

  const siteUrl =
    process.env.NEXT_PUBLIC_SITE_URL?.replace(/\/$/, "") ||
    new URL(request.url).origin;
  sendRsvpConfirmation({ party, rsvp, siteUrl }).catch(() => {});
  if (party.host_email) {
    sendHostNotification({ party, rsvp, siteUrl, hostEmail: party.host_email }).catch(() => {});
  }

  return NextResponse.json({ id: rsvp.id, edit_token: rsvp.edit_token }, { status: 201 });
}
