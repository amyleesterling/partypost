import { NextResponse, type NextRequest } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { isAllowedAdmin } from "@/lib/auth";
import { partyUpdateSchema } from "@/lib/validation";

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
  if (!user) return NextResponse.json({ error: "Not signed in" }, { status: 401 });
  if (!isAllowedAdmin(user.email)) {
    return NextResponse.json({ error: "Not authorized" }, { status: 403 });
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const parsed = partyUpdateSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Validation failed", issues: parsed.error.issues },
      { status: 400 },
    );
  }

  const { data, error } = await supabase
    .from("parties")
    .update(parsed.data)
    .eq("id", id)
    .eq("host_user_id", user.id)
    .select("id")
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  if (!data) return NextResponse.json({ error: "Not found" }, { status: 404 });
  return NextResponse.json(data);
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<Params> },
) {
  const { id } = await params;
  const { supabase, user } = await authedSupabase();
  if (!user) return NextResponse.json({ error: "Not signed in" }, { status: 401 });
  if (!isAllowedAdmin(user.email)) {
    return NextResponse.json({ error: "Not authorized" }, { status: 403 });
  }

  const { error } = await supabase
    .from("parties")
    .delete()
    .eq("id", id)
    .eq("host_user_id", user.id);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return new NextResponse(null, { status: 204 });
}
