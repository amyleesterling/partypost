import { NextResponse, type NextRequest } from "next/server";
import { createServiceClient } from "@/lib/supabase/service";
import { rsvpSchema } from "@/lib/validation";

type Params = { token: string };

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<Params> },
) {
  const { token } = await params;
  const svc = createServiceClient();
  const { data, error } = await svc
    .from("rsvps")
    .select("*")
    .eq("edit_token", token)
    .maybeSingle();
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  if (!data) return NextResponse.json({ error: "Not found" }, { status: 404 });
  return NextResponse.json(data);
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<Params> },
) {
  const { token } = await params;

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
  const updatePayload = {
    status: parsed.data.status,
    parent_names: parsed.data.parent_names,
    phone: parsed.data.phone || null,
    child_names: parsed.data.child_names || null,
    kids_count: parsed.data.kids_count,
    adults_count: parsed.data.adults_count,
    allergy_notes: parsed.data.allergy_notes || null,
    private_note: parsed.data.private_note || null,
    public_note: parsed.data.public_note || null,
    public_note_consent: !!parsed.data.public_note_consent,
    // Don't allow email changes via token to avoid leaking RSVPs to a different inbox.
  };

  const { data, error } = await svc
    .from("rsvps")
    .update(updatePayload)
    .eq("edit_token", token)
    .select("id, party_id")
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  if (!data) return NextResponse.json({ error: "Not found" }, { status: 404 });
  return NextResponse.json(data);
}
