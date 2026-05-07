"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import type { PartyRow, RsvpRow } from "@/lib/supabase/types";

export function RsvpsTab({ party, rsvps }: { party: PartyRow; rsvps: RsvpRow[] }) {
  const router = useRouter();
  const [busy, setBusy] = useState<string | null>(null);

  const yesCount = rsvps.filter((r) => r.status === "yes").length;
  const maybeCount = rsvps.filter((r) => r.status === "maybe").length;
  const noCount = rsvps.filter((r) => r.status === "no").length;
  const goingRsvps = rsvps.filter((r) => r.status !== "no");
  const kidsTotal = goingRsvps.reduce((s, r) => s + r.kids_count, 0);
  const adultsTotal = goingRsvps.reduce((s, r) => s + r.adults_count, 0);
  const allergyCount = rsvps.filter((r) => r.allergy_notes && r.allergy_notes.trim()).length;

  async function handleDelete(id: string) {
    if (!confirm("Delete this RSVP? This can't be undone.")) return;
    setBusy(id);
    await fetch(`/api/parties/${party.id}/rsvps/${id}`, { method: "DELETE" });
    setBusy(null);
    router.refresh();
  }

  function copy(text: string) {
    navigator.clipboard.writeText(text).catch(() => {});
  }

  return (
    <div>
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4 lg:grid-cols-7">
        <SummaryCard label="Yes" value={yesCount} tone="emerald" />
        <SummaryCard label="Maybe" value={maybeCount} tone="amber" />
        <SummaryCard label="No" value={noCount} tone="zinc" />
        <SummaryCard label="Kids going" value={kidsTotal} tone="sky" />
        <SummaryCard label="Adults going" value={adultsTotal} tone="sky" />
        <SummaryCard label="Total going" value={kidsTotal + adultsTotal} tone="indigo" />
        <SummaryCard label="Allergy notes" value={allergyCount} tone="rose" />
      </div>

      <div className="mt-6 flex flex-wrap gap-2">
        <a
          href={`/api/parties/${party.id}/rsvps/export`}
          className="rounded-full bg-zinc-900 px-4 py-2 text-sm font-medium text-white hover:bg-zinc-800"
          download
        >
          Download CSV
        </a>
      </div>

      <div className="mt-4 overflow-x-auto rounded-xl ring-1 ring-zinc-200">
        <table className="min-w-full text-sm">
          <thead className="bg-zinc-50 text-left text-xs uppercase tracking-wider text-zinc-500">
            <tr>
              <th className="px-3 py-2">Status</th>
              <th className="px-3 py-2">Parent(s)</th>
              <th className="px-3 py-2">Children</th>
              <th className="px-3 py-2">Kids</th>
              <th className="px-3 py-2">Adults</th>
              <th className="px-3 py-2">Total</th>
              <th className="px-3 py-2">Allergies</th>
              <th className="px-3 py-2">Notes</th>
              <th className="px-3 py-2">Submitted</th>
              <th className="px-3 py-2"></th>
            </tr>
          </thead>
          <tbody className="divide-y divide-zinc-100">
            {rsvps.length === 0 ? (
              <tr>
                <td colSpan={10} className="px-3 py-12 text-center text-zinc-500">
                  No RSVPs yet. Share your party link!
                </td>
              </tr>
            ) : (
              rsvps.map((r) => (
                <tr key={r.id} className="align-top">
                  <td className="px-3 py-3">
                    <StatusPill status={r.status} />
                  </td>
                  <td className="px-3 py-3">
                    <div className="font-medium">{r.parent_names}</div>
                    <button
                      type="button"
                      onClick={() => copy(r.email)}
                      className="text-xs text-zinc-500 hover:text-zinc-800"
                      title="Copy email"
                    >
                      {r.email}
                    </button>
                    {r.phone && (
                      <div className="text-xs text-zinc-500">{r.phone}</div>
                    )}
                  </td>
                  <td className="px-3 py-3">{r.child_names ?? "—"}</td>
                  <td className="px-3 py-3 tabular-nums">{r.kids_count}</td>
                  <td className="px-3 py-3 tabular-nums">{r.adults_count}</td>
                  <td className="px-3 py-3 tabular-nums font-medium">{r.total_count}</td>
                  <td className="px-3 py-3 text-zinc-600">{r.allergy_notes ?? "—"}</td>
                  <td className="px-3 py-3 text-zinc-600">
                    {r.private_note && <div>{r.private_note}</div>}
                    {r.public_note && (
                      <div className="text-zinc-500">
                        🎁 <em>{r.public_note}</em>
                      </div>
                    )}
                    {!r.private_note && !r.public_note && "—"}
                  </td>
                  <td className="px-3 py-3 text-xs text-zinc-500">
                    {new Date(r.created_at).toLocaleDateString()}
                    {r.updated_at !== r.created_at && (
                      <div>edited {new Date(r.updated_at).toLocaleDateString()}</div>
                    )}
                  </td>
                  <td className="px-3 py-3 text-right">
                    <button
                      type="button"
                      onClick={() => handleDelete(r.id)}
                      disabled={busy === r.id}
                      className="text-xs text-zinc-500 hover:text-red-700"
                    >
                      Delete
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function SummaryCard({
  label,
  value,
  tone,
}: {
  label: string;
  value: number;
  tone: "emerald" | "amber" | "zinc" | "sky" | "indigo" | "rose";
}) {
  const tones: Record<typeof tone, string> = {
    emerald: "bg-emerald-50 text-emerald-900",
    amber: "bg-amber-50 text-amber-900",
    zinc: "bg-zinc-100 text-zinc-800",
    sky: "bg-sky-50 text-sky-900",
    indigo: "bg-indigo-50 text-indigo-900",
    rose: "bg-rose-50 text-rose-900",
  };
  return (
    <div className={`rounded-xl px-3 py-2.5 ${tones[tone]}`}>
      <div className="text-xs uppercase tracking-wide opacity-70">{label}</div>
      <div className="text-2xl font-semibold tabular-nums">{value}</div>
    </div>
  );
}

function StatusPill({ status }: { status: "yes" | "no" | "maybe" }) {
  const cls =
    status === "yes"
      ? "bg-emerald-100 text-emerald-800"
      : status === "maybe"
        ? "bg-amber-100 text-amber-900"
        : "bg-zinc-100 text-zinc-700";
  return <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${cls}`}>{status}</span>;
}
