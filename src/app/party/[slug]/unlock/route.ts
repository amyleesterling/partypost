import { NextResponse, type NextRequest } from "next/server";
import { cookies } from "next/headers";
import { findParty } from "@/config/parties";

type Params = { slug: string };

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<Params> },
) {
  const { slug } = await params;
  const entry = findParty(slug);
  if (!entry) {
    return NextResponse.json({ error: "Party not found" }, { status: 404 });
  }
  if (!entry.passwordEnv) {
    return NextResponse.json({ error: "Party is not password-protected" }, { status: 400 });
  }

  const expected = process.env[entry.passwordEnv];
  if (!expected) {
    return NextResponse.json(
      { error: "Server is missing the password — ask the host." },
      { status: 500 },
    );
  }

  let body: { password?: unknown };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid request" }, { status: 400 });
  }

  const submitted = String(body.password || "");
  if (submitted !== expected) {
    return NextResponse.json({ error: "Wrong password." }, { status: 401 });
  }

  const cookieStore = await cookies();
  cookieStore.set(`pp-unlock-${slug}`, expected, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60 * 24 * 90, // 90 days
  });

  return NextResponse.json({ ok: true });
}
