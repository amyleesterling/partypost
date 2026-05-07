"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";

export function LoginButton({ next }: { next: string }) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSignIn() {
    setLoading(true);
    setError(null);
    const supabase = createClient();
    const origin = window.location.origin;
    const { error } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: {
        redirectTo: `${origin}/auth/callback?next=${encodeURIComponent(next)}`,
      },
    });
    if (error) {
      setError(error.message);
      setLoading(false);
    }
  }

  return (
    <>
      <button
        type="button"
        onClick={handleSignIn}
        disabled={loading}
        className="flex w-full items-center justify-center gap-3 rounded-2xl bg-zinc-900 px-5 py-3 text-base font-medium text-white shadow-md hover:bg-zinc-800 disabled:opacity-60"
      >
        <GoogleMark />
        {loading ? "Opening Google…" : "Continue with Google"}
      </button>
      {error && <p className="mt-3 text-sm text-red-700">{error}</p>}
    </>
  );
}

function GoogleMark() {
  return (
    <svg viewBox="0 0 24 24" className="h-5 w-5" aria-hidden="true">
      <path
        fill="#fff"
        d="M21.35 11.1H12v3.2h5.35c-.23 1.45-1.7 4.25-5.35 4.25-3.22 0-5.85-2.66-5.85-5.95s2.63-5.95 5.85-5.95c1.83 0 3.06.78 3.76 1.45l2.56-2.45C16.7 3.95 14.6 3 12 3 6.95 3 2.85 7.07 2.85 12.1S6.95 21.2 12 21.2c6.93 0 9.15-4.85 9.15-7.35 0-.5-.05-.85-.15-1.25"
      />
    </svg>
  );
}
