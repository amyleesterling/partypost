import Link from "next/link";

export default function PartyNotFound() {
  return (
    <main className="flex min-h-screen items-center justify-center bg-gradient-to-br from-pink-50 via-amber-50 to-sky-50 px-4">
      <div className="w-full max-w-md rounded-3xl bg-white p-8 text-center shadow-xl">
        <div className="text-5xl">🎈</div>
        <h1 className="mt-3 text-2xl font-semibold">This party isn&apos;t ready yet</h1>
        <p className="mt-2 text-sm text-zinc-600">
          The link might be wrong, or the host hasn&apos;t published the page yet.
          Check back soon!
        </p>
        <Link
          href="/"
          className="mt-5 inline-block rounded-full bg-zinc-900 px-4 py-2 text-sm font-medium text-white"
        >
          Back home
        </Link>
      </div>
    </main>
  );
}
