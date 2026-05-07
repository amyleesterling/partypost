"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import type { NoteRow, PartyRow, RsvpRow } from "@/lib/supabase/types";
import { DetailsTab } from "./tabs/DetailsTab";
import { ImagesTab } from "./tabs/ImagesTab";
import { RsvpsTab } from "./tabs/RsvpsTab";
import { NotesTab } from "./tabs/NotesTab";
import { MessagesTab } from "./tabs/MessagesTab";
import { SettingsTab } from "./tabs/SettingsTab";

type TabKey = "details" | "images" | "rsvps" | "notes" | "messages" | "settings";

const TABS: { key: TabKey; label: string }[] = [
  { key: "details", label: "Details" },
  { key: "images", label: "Images" },
  { key: "rsvps", label: "RSVPs" },
  { key: "notes", label: "Notes" },
  { key: "messages", label: "Messages" },
  { key: "settings", label: "Settings" },
];

export function PartyManager({
  party,
  rsvps,
  notes,
}: {
  party: PartyRow;
  rsvps: RsvpRow[];
  notes: NoteRow[];
}) {
  const router = useRouter();
  const [active, setActive] = useState<TabKey>("details");
  const [publishing, setPublishing] = useState(false);

  const shareUrl =
    typeof window !== "undefined"
      ? `${window.location.origin}/party/${party.slug}`
      : `/party/${party.slug}`;

  async function togglePublish() {
    setPublishing(true);
    await fetch(`/api/parties/${party.id}/publish`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ is_published: !party.is_published }),
    });
    setPublishing(false);
    router.refresh();
  }

  async function copyShareUrl() {
    try {
      await navigator.clipboard.writeText(shareUrl);
    } catch {
      /* ignore */
    }
  }

  return (
    <div>
      <div className="mb-6 flex flex-wrap items-end justify-between gap-3">
        <div>
          <Link href="/admin" className="text-sm text-zinc-500 hover:text-zinc-800">
            ← all parties
          </Link>
          <h1 className="mt-1 text-2xl font-semibold">{party.party_title}</h1>
          <p className="text-sm text-zinc-600">
            {party.is_published ? "Published" : "Draft"} · /party/{party.slug}
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Link
            href={`/admin/party/${party.id}/preview`}
            className="rounded-full border border-zinc-300 bg-white px-4 py-2 text-sm font-medium hover:bg-zinc-50"
          >
            Preview
          </Link>
          {party.is_published && (
            <button
              type="button"
              onClick={copyShareUrl}
              className="rounded-full border border-zinc-300 bg-white px-4 py-2 text-sm font-medium hover:bg-zinc-50"
            >
              Copy share link
            </button>
          )}
          <button
            type="button"
            onClick={togglePublish}
            disabled={publishing}
            className={`rounded-full px-4 py-2 text-sm font-medium text-white shadow ${
              party.is_published
                ? "bg-zinc-700 hover:bg-zinc-800"
                : "bg-emerald-600 hover:bg-emerald-700"
            } disabled:opacity-60`}
          >
            {publishing
              ? "Saving…"
              : party.is_published
                ? "Unpublish"
                : "Publish"}
          </button>
        </div>
      </div>

      <div className="mb-4 flex flex-wrap gap-1 border-b border-zinc-200">
        {TABS.map((t) => (
          <button
            key={t.key}
            type="button"
            onClick={() => setActive(t.key)}
            className={`-mb-px rounded-t-lg border-b-2 px-4 py-2 text-sm font-medium ${
              active === t.key
                ? "border-zinc-900 text-zinc-900"
                : "border-transparent text-zinc-500 hover:text-zinc-800"
            }`}
          >
            {t.label}
            {t.key === "rsvps" && rsvps.length > 0 && (
              <span className="ml-1 rounded-full bg-zinc-200 px-1.5 py-0.5 text-xs text-zinc-700">
                {rsvps.length}
              </span>
            )}
            {t.key === "notes" && notes.filter((n) => !n.is_approved).length > 0 && (
              <span className="ml-1 rounded-full bg-amber-200 px-1.5 py-0.5 text-xs text-amber-900">
                {notes.filter((n) => !n.is_approved).length}
              </span>
            )}
          </button>
        ))}
      </div>

      <div className="rounded-2xl bg-white p-6 shadow-sm ring-1 ring-zinc-200">
        {active === "details" && <DetailsTab party={party} />}
        {active === "images" && <ImagesTab party={party} />}
        {active === "rsvps" && <RsvpsTab party={party} rsvps={rsvps} />}
        {active === "notes" && <NotesTab party={party} notes={notes} />}
        {active === "messages" && <MessagesTab party={party} rsvps={rsvps} shareUrl={shareUrl} />}
        {active === "settings" && <SettingsTab party={party} />}
      </div>
    </div>
  );
}
