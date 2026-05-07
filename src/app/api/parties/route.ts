import { NextResponse, type NextRequest } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { isAllowedAdmin } from "@/lib/auth";
import { partyCreateSchema } from "@/lib/validation";
import { buildPartySlug } from "@/lib/slug";

export async function POST(request: NextRequest) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
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

  const parsed = partyCreateSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Validation failed", issues: parsed.error.issues },
      { status: 400 },
    );
  }

  const slug = buildPartySlug(parsed.data.birthday_child_name, parsed.data.birthday_age);

  const insertPayload = {
    ...parsed.data,
    slug,
    host_user_id: user.id,
    host_email: parsed.data.host_email || user.email || null,
    host_name: parsed.data.host_name || (user.user_metadata?.full_name as string | undefined) || null,
  };

  const { data, error } = await supabase
    .from("parties")
    .insert(insertPayload)
    .select("id, slug")
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
  return NextResponse.json(data, { status: 201 });
}
