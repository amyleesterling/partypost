import { notFound, redirect } from "next/navigation";
import { findParty } from "@/config/parties";

type Params = { slug: string };

// Short, memorable URL that redirects to the long Google Apps Script
// admin Web App URL. The Apps Script is deployed with "Only myself"
// access, so Google handles auth — non-owners hit Google's "no access"
// page after the redirect.
//
// Set on Vercel as part of PRIVATE_PARTIES_JSON:
//   { "slug": "...", "scriptUrl": "...", "adminUrl": "https://script.google.com/.../exec" }
export default async function AdminRedirect({ params }: { params: Promise<Params> }) {
  const { slug } = await params;
  const entry = findParty(slug);
  if (!entry) notFound();
  if (!entry.adminUrl) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-gradient-to-br from-pink-50 via-amber-50 to-sky-50 px-4">
        <div className="w-full max-w-md rounded-3xl bg-white p-8 text-center shadow-xl">
          <div className="text-4xl">🔧</div>
          <h1 className="mt-3 text-2xl font-semibold">No admin URL set</h1>
          <p className="mt-2 text-sm text-zinc-600">
            Add an <code className="rounded bg-zinc-100 px-1">adminUrl</code> field to this party
            in <code className="rounded bg-zinc-100 px-1">PRIVATE_PARTIES_JSON</code> on Vercel,
            then redeploy.
          </p>
        </div>
      </main>
    );
  }
  redirect(entry.adminUrl);
}
