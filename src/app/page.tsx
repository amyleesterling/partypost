import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

export default async function Home() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (user) redirect("/admin");

  return (
    <main className="relative isolate min-h-screen overflow-hidden bg-gradient-to-br from-pink-50 via-amber-50 to-sky-50">
      <div className="mx-auto max-w-3xl px-6 pt-16 pb-24 sm:pt-24">
        <div className="text-5xl">🎂</div>
        <h1 className="mt-4 font-[family-name:var(--font-playful)] text-5xl font-bold leading-tight text-zinc-900 sm:text-6xl">
          Beautiful birthday invites,
          <br />
          easy RSVPs.
        </h1>
        <p className="mt-6 max-w-xl text-lg text-zinc-700">
          PartyPost makes a charming little party page in minutes.
          Share one link. Collect RSVPs. Count cupcakes. Keep the magic.
        </p>
        <div className="mt-10 flex flex-wrap gap-3">
          <Link
            href="/login"
            className="rounded-full bg-zinc-900 px-6 py-3 text-base font-medium text-white shadow-md hover:bg-zinc-800"
          >
            Get started
          </Link>
          <Link
            href="/login"
            className="rounded-full border border-zinc-300 bg-white/80 px-6 py-3 text-base font-medium text-zinc-800 backdrop-blur hover:bg-white"
          >
            Sign in
          </Link>
        </div>
        <div className="mt-16 grid gap-6 sm:grid-cols-3">
          {[
            { icon: "✨", title: "Polished invite page", body: "Hero image, party details, themed look." },
            { icon: "📋", title: "Clear RSVP counts", body: "Adults, kids, allergies, totals — all live." },
            { icon: "💌", title: "Easy guest messaging", body: "Copy-paste filtered email lists in one tap." },
          ].map((f) => (
            <div key={f.title} className="rounded-2xl bg-white/70 p-5 shadow-sm backdrop-blur">
              <div className="text-2xl">{f.icon}</div>
              <div className="mt-2 font-semibold text-zinc-900">{f.title}</div>
              <div className="mt-1 text-sm text-zinc-600">{f.body}</div>
            </div>
          ))}
        </div>
      </div>
    </main>
  );
}
