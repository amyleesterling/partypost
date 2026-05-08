"use client";

import { useState } from "react";

export function PasswordGate({ slug }: { slug: string }) {
  const [password, setPassword] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!password.trim()) return;
    setSubmitting(true);
    setError(null);
    try {
      const res = await fetch(`/party/${slug}/unlock`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ password }),
      });
      if (res.ok) {
        window.location.reload();
        return;
      }
      const data = await res.json().catch(() => ({}));
      setError(data?.error || "Wrong password.");
      setSubmitting(false);
    } catch {
      setError("Something went wrong. Try again.");
      setSubmitting(false);
    }
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-gradient-to-br from-pink-50 via-amber-50 to-sky-50 px-4">
      <div className="w-full max-w-md rounded-3xl bg-white p-8 shadow-xl">
        <div className="text-4xl">🔒</div>
        <h1 className="mt-3 font-[family-name:var(--font-playful)] text-2xl font-bold text-zinc-900">
          Private invitation
        </h1>
        <p className="mt-2 text-sm text-zinc-600">
          The host has shared a password with you. Enter it below to view the invite.
        </p>
        <form onSubmit={handleSubmit} className="mt-5 space-y-3">
          <input
            type="password"
            placeholder="Password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            disabled={submitting}
            autoFocus
            className="w-full rounded-xl border border-zinc-300 px-4 py-3 text-base focus:border-zinc-500 focus:outline-none"
          />
          {error && (
            <p className="text-sm text-red-600">{error}</p>
          )}
          <button
            type="submit"
            disabled={submitting || !password.trim()}
            className="w-full rounded-full bg-zinc-900 px-5 py-3 text-base font-semibold text-white hover:bg-zinc-800 disabled:opacity-60"
          >
            {submitting ? "Checking…" : "Unlock"}
          </button>
        </form>
        <p className="mt-4 text-xs text-zinc-500">
          Don&apos;t have the password? Ask the host directly.
        </p>
      </div>
    </main>
  );
}
