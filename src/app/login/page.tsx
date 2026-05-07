import Link from "next/link";
import { LoginButton } from "./LoginButton";

type SearchParams = Promise<{ next?: string; error?: string }>;

export default async function LoginPage({ searchParams }: { searchParams: SearchParams }) {
  const params = await searchParams;
  const next = params.next || "/admin";
  return (
    <main className="flex min-h-screen items-center justify-center bg-gradient-to-br from-pink-50 via-amber-50 to-sky-50 px-4">
      <div className="w-full max-w-md rounded-3xl bg-white p-8 shadow-xl">
        <Link href="/" className="mb-6 block text-sm text-zinc-500 hover:text-zinc-800">
          ← back home
        </Link>
        <div className="mb-2 text-3xl">🎉</div>
        <h1 className="mb-2 text-2xl font-semibold text-zinc-900">Sign in to PartyPost</h1>
        <p className="mb-6 text-sm text-zinc-600">
          Sign in with Google to create and manage party invites.
        </p>
        {params.error && (
          <div className="mb-4 rounded-lg bg-red-50 p-3 text-sm text-red-700">{params.error}</div>
        )}
        <LoginButton next={next} />
      </div>
    </main>
  );
}
