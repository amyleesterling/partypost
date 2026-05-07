"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import type { NoteRow, PartyRow } from "@/lib/supabase/types";

export function NotesTab({ party, notes }: { party: PartyRow; notes: NoteRow[] }) {
  const router = useRouter();
  const [busy, setBusy] = useState<string | null>(null);

  const pending = notes.filter((n) => !n.is_approved);
  const approved = notes.filter((n) => n.is_approved);

  async function setApproved(id: string, value: boolean) {
    setBusy(id);
    await fetch(`/api/notes/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ is_approved: value }),
    });
    setBusy(null);
    router.refresh();
  }

  async function handleDelete(id: string) {
    if (!confirm("Delete this note?")) return;
    setBusy(id);
    await fetch(`/api/notes/${id}`, { method: "DELETE" });
    setBusy(null);
    router.refresh();
  }

  return (
    <div className="space-y-8">
      <Section
        title="Pending notes"
        empty={`No notes waiting. New birthday wishes will appear here for your approval.`}
        count={pending.length}
      >
        {pending.map((n) => (
          <NoteCard
            key={n.id}
            note={n}
            busy={busy === n.id}
            actions={
              <>
                <button
                  type="button"
                  onClick={() => setApproved(n.id, true)}
                  className="rounded-full bg-emerald-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-emerald-700"
                >
                  Approve
                </button>
                <button
                  type="button"
                  onClick={() => handleDelete(n.id)}
                  className="rounded-full border border-zinc-300 px-3 py-1.5 text-xs hover:bg-zinc-50"
                >
                  Delete
                </button>
              </>
            }
          />
        ))}
      </Section>

      <Section
        title="Approved notes"
        empty="Approved notes appear on the public party page."
        count={approved.length}
      >
        {approved.map((n) => (
          <NoteCard
            key={n.id}
            note={n}
            busy={busy === n.id}
            actions={
              <>
                <button
                  type="button"
                  onClick={() => setApproved(n.id, false)}
                  className="rounded-full border border-zinc-300 px-3 py-1.5 text-xs hover:bg-zinc-50"
                >
                  Hide
                </button>
                <button
                  type="button"
                  onClick={() => handleDelete(n.id)}
                  className="rounded-full border border-zinc-300 px-3 py-1.5 text-xs hover:bg-zinc-50 hover:text-red-700"
                >
                  Delete
                </button>
              </>
            }
          />
        ))}
      </Section>

      {!party.is_published && (
        <div className="rounded-lg bg-amber-50 p-3 text-sm text-amber-900">
          Heads up: notes only show on the party page once it&apos;s published.
        </div>
      )}
    </div>
  );
}

function Section({
  title,
  count,
  empty,
  children,
}: {
  title: string;
  count: number;
  empty: string;
  children: React.ReactNode;
}) {
  return (
    <div>
      <h3 className="mb-3 text-sm font-semibold uppercase tracking-wider text-zinc-500">
        {title} {count > 0 && <span className="ml-1 text-zinc-700">({count})</span>}
      </h3>
      {count === 0 ? (
        <p className="rounded-xl bg-zinc-50 p-4 text-sm text-zinc-600">{empty}</p>
      ) : (
        <ul className="space-y-3">{children}</ul>
      )}
    </div>
  );
}

function NoteCard({
  note,
  busy,
  actions,
}: {
  note: NoteRow;
  busy: boolean;
  actions: React.ReactNode;
}) {
  return (
    <li
      className={`rounded-xl bg-white p-4 ring-1 ring-zinc-200 ${busy ? "opacity-60" : ""}`}
    >
      <div className="flex items-start justify-between gap-3">
        <div>
          <div className="text-sm font-medium text-zinc-900">{note.display_name}</div>
          <div className="text-xs text-zinc-500">
            {new Date(note.created_at).toLocaleString()}
            {!note.is_public && " · private"}
          </div>
        </div>
        <div className="flex gap-2">{actions}</div>
      </div>
      <p className="mt-2 whitespace-pre-wrap text-sm text-zinc-700">{note.message}</p>
    </li>
  );
}
