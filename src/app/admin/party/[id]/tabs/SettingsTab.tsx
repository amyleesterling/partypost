"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import type { PartyRow } from "@/lib/supabase/types";

export function SettingsTab({ party }: { party: PartyRow }) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleDelete() {
    if (
      !confirm(
        `Permanently delete "${party.party_title}" and all RSVPs/notes? This can't be undone.`,
      )
    ) {
      return;
    }
    setBusy(true);
    setError(null);
    const res = await fetch(`/api/parties/${party.id}`, { method: "DELETE" });
    if (res.ok) {
      router.replace("/admin");
      router.refresh();
    } else {
      const data = await res.json().catch(() => ({}));
      setError(data?.error || "Could not delete party");
      setBusy(false);
    }
  }

  return (
    <div className="space-y-8">
      <div>
        <h3 className="font-semibold">Slug</h3>
        <p className="mt-1 text-sm text-zinc-600">
          Public link: <code className="rounded bg-zinc-100 px-1">/party/{party.slug}</code>
        </p>
        <p className="mt-1 text-xs text-zinc-500">
          Slugs are generated when you create the party for privacy. Editing the slug is not yet supported.
        </p>
      </div>

      <div>
        <h3 className="font-semibold">Created</h3>
        <p className="mt-1 text-sm text-zinc-600">
          {new Date(party.created_at).toLocaleString()}
        </p>
      </div>

      <div className="rounded-xl border border-red-200 bg-red-50 p-4">
        <h3 className="font-semibold text-red-900">Danger zone</h3>
        <p className="mt-1 text-sm text-red-800">
          Deleting a party also deletes all RSVPs, notes, and uploaded image records.
        </p>
        {error && <p className="mt-2 text-sm text-red-700">{error}</p>}
        <button
          type="button"
          onClick={handleDelete}
          disabled={busy}
          className="mt-3 rounded-full bg-red-600 px-4 py-2 text-sm font-medium text-white hover:bg-red-700 disabled:opacity-60"
        >
          {busy ? "Deleting…" : "Delete this party"}
        </button>
      </div>
    </div>
  );
}
