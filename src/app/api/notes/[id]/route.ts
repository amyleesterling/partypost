import { NextResponse, type NextRequest } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { isAllowedAdmin } from "@/lib/auth";

type Params = { id: string };

async function authedSupabase() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  return { supabase, user };
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<Params> },
) {
  const { id } = await params;
  const { supabase, user } = await authedSupabase();
  if (!user || !isAllowedAdmin(user.email)) {
    return NextResponse.json({ error: "Not authorized" }, { status: 403 });
  }

  const body = (await request.json().catch(() => ({}))) as {
    is_approved?: boolean;
    is_public?: boolean;
  };
  const update: Record<string, boolean> = {};
  if (typeof body.is_approved === "boolean") update.is_approved = body.is_approved;
  if (typeof body.is_public === "boolean") update.is_public = body.is_public;

  const { error } = await supabase.from("notes").update(update).eq("id", id);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true });
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<Params> },
) {
  const { id } = await params;
  const { supabase, user } = await authedSupabase();
  if (!user || !isAllowedAdmin(user.email)) {
    return NextResponse.json({ error: "Not authorized" }, { status: 403 });
  }
  const { error } = await supabase.from("notes").delete().eq("id", id);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return new NextResponse(null, { status: 204 });
}
