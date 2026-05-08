import Link from "next/link";
import { publicParties } from "@/config/parties";

export default function Home() {
  const visible = publicParties();
  return (
    <main className="relative isolate min-h-screen overflow-hidden bg-gradient-to-br from-pink-50 via-amber-50 to-sky-50">
      <div className="mx-auto max-w-2xl px-6 pt-16 pb-24 sm:pt-24">
        <div className="text-5xl">🎂</div>
        <h1 className="mt-4 font-[family-name:var(--font-playful)] text-4xl font-bold leading-tight text-zinc-900 sm:text-5xl">
          PartyPost
        </h1>
        <p className="mt-3 text-lg text-zinc-700">
          A tiny, cheerful birthday-party RSVP site. Each party gets its own page and a Google Sheet to collect responses.
        </p>

        {visible.length > 0 ? (
          <div className="mt-10">
            <h2 className="text-xs uppercase tracking-wider text-zinc-500">Active parties</h2>
            <ul className="mt-3 grid gap-3 sm:grid-cols-2">
              {visible.map((p) => (
                <li key={p.slug}>
                  <Link
                    href={`/party/${p.slug}`}
                    className="block rounded-2xl bg-white/80 p-4 shadow-sm hover:bg-white"
                  >
                    <div className="font-semibold text-zinc-900">/party/{p.slug}</div>
                    <div className="mt-1 text-xs text-zinc-500">Tap to view invite</div>
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        ) : (
          <div className="mt-10 rounded-2xl border border-dashed border-zinc-300 bg-white/70 p-6 text-sm text-zinc-700">
            <div className="font-semibold">No parties yet.</div>
            <p className="mt-2">
              Add one in <code className="rounded bg-zinc-100 px-1">src/config/parties.ts</code>{" "}
              after running through the setup in <code className="rounded bg-zinc-100 px-1">apps-script/SETUP.md</code>.
            </p>
          </div>
        )}

        <div className="mt-10 text-xs text-zinc-500">
          Backed by Google Sheets. No accounts required for guests.
        </div>
      </div>
    </main>
  );
}
