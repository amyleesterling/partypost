import { NextResponse, type NextRequest } from "next/server";
import { z } from "zod";
import { createServiceClient } from "@/lib/supabase/service";

type Params = { slug: string };

const noteSchema = z.object({
  display_name: z.string().trim().min(1).max(80),
  message: z.string().trim().min(1).max(500),
});

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

  const parsed = noteSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Validation failed" }, { status: 400 });
  }

  const svc = createServiceClient();
  const { data: party } = await svc
    .from("parties")
    .select("id, is_published")
    .eq("slug", slug)
    .maybeSingle();
  if (!party || !party.is_published) {
    return NextResponse.json({ error: "Party not available" }, { status: 404 });
  }

  const { error } = await svc.from("notes").insert({
    party_id: party.id,
    display_name: parsed.data.display_name,
    message: parsed.data.message,
    is_public: true,
    is_approved: false,
  });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true }, { status: 201 });
}
