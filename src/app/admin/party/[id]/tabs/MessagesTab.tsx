"use client";

import { useMemo, useState } from "react";
import type { PartyRow, RsvpRow, RsvpStatus } from "@/lib/supabase/types";

type Filter = "all" | RsvpStatus;
type Format = "comma" | "lines" | "named";

const FILTER_LABELS: Record<Filter, string> = {
  all: "All",
  yes: "Yes",
  maybe: "Maybe",
  no: "No",
};

function formatList(rsvps: RsvpRow[], format: Format): string {
  const seen = new Set<string>();
  const dedup = rsvps.filter((r) => {
    const e = r.email.trim().toLowerCase();
    if (!e || seen.has(e)) return false;
    seen.add(e);
    return true;
  });
  if (format === "comma") return dedup.map((r) => r.email).join(", ");
  if (format === "lines") return dedup.map((r) => r.email).join("\n");
  return dedup.map((r) => `${r.parent_names} <${r.email}>`).join(", ");
}

function templates(party: PartyRow, partyUrl: string) {
  const deadline = party.rsvp_deadline ? ` by ${party.rsvp_deadline}` : "";
  return [
    {
      key: "reminder",
      label: "Reminder",
      body: `Hi! Just a quick reminder to RSVP for ${party.party_title}${deadline} so we can plan snacks, cupcakes, and tiny joyful logistics. Here's the link: ${partyUrl}`,
    },
    {
      key: "update",
      label: "Party update",
      body: `Hi everyone! A quick update for ${party.party_title}: [host writes update here]. Full details are still available here: ${partyUrl}`,
    },
    {
      key: "weather",
      label: "Weather / rain plan",
      body: `Hi! We're watching the weather for ${party.party_title}. Current plan: ${party.rain_plan ?? "[describe rain plan]"}. We'll update everyone if anything changes. Details here: ${partyUrl}`,
    },
  ];
}

export function MessagesTab({
  party,
  rsvps,
  shareUrl,
}: {
  party: PartyRow;
  rsvps: RsvpRow[];
  shareUrl: string;
}) {
  const [filter, setFilter] = useState<Filter>("all");
  const [format, setFormat] = useState<Format>("comma");
  const [copied, setCopied] = useState<string | null>(null);

  const filtered = useMemo(
    () => (filter === "all" ? rsvps : rsvps.filter((r) => r.status === filter)),
    [rsvps, filter],
  );
  const list = formatList(filtered, format);
  const tpls = useMemo(() => templates(party, shareUrl), [party, shareUrl]);
  const uniqueCount = list ? list.split(format === "comma" ? "," : format === "lines" ? "\n" : ",").length : 0;

  async function copy(key: string, text: string) {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(key);
      setTimeout(() => setCopied(null), 1500);
    } catch {
      /* ignore */
    }
  }

  function downloadEmailsCsv() {
    const dedup = formatList(filtered, "lines").split("\n").filter(Boolean);
    const csv = "Email\n" + dedup.map((e) => e.replace(/"/g, '""')).join("\n") + "\n";
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${party.slug}-emails-${filter}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  }

  return (
    <div className="space-y-8">
      <div>
        <h3 className="text-sm font-semibold uppercase tracking-wider text-zinc-500">
          Email guests
        </h3>
        <p className="mt-1 text-sm text-zinc-600">
          Pick a group, pick a format, copy the list, then paste it into your email tool.
        </p>

        <div className="mt-4 flex flex-wrap items-center gap-2">
          <span className="text-xs uppercase text-zinc-500">Group</span>
          {(Object.keys(FILTER_LABELS) as Filter[]).map((f) => (
            <button
              key={f}
              type="button"
              onClick={() => setFilter(f)}
              className={`rounded-full px-3 py-1 text-sm ${
                filter === f
                  ? "bg-zinc-900 text-white"
                  : "border border-zinc-300 bg-white hover:bg-zinc-50"
              }`}
            >
              {FILTER_LABELS[f]} ({rsvps.filter((r) => f === "all" || r.status === f).length})
            </button>
          ))}
        </div>

        <div className="mt-3 flex flex-wrap items-center gap-2">
          <span className="text-xs uppercase text-zinc-500">Format</span>
          {([
            ["comma", "Comma-separated"],
            ["lines", "Line-separated"],
            ["named", "Name <email>"],
          ] as [Format, string][]).map(([f, label]) => (
            <button
              key={f}
              type="button"
              onClick={() => setFormat(f)}
              className={`rounded-full px-3 py-1 text-sm ${
                format === f
                  ? "bg-zinc-900 text-white"
                  : "border border-zinc-300 bg-white hover:bg-zinc-50"
              }`}
            >
              {label}
            </button>
          ))}
        </div>

        <div className="mt-4">
          <textarea
            readOnly
            rows={5}
            value={list}
            placeholder="No emails in this group yet."
            className="w-full rounded-xl border border-zinc-300 bg-zinc-50 p-3 font-mono text-sm"
          />
          <div className="mt-2 flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={() => copy("list", list)}
              disabled={!list}
              className="rounded-full bg-zinc-900 px-4 py-2 text-sm font-medium text-white hover:bg-zinc-800 disabled:opacity-40"
            >
              {copied === "list" ? "Copied!" : "Copy list"}
            </button>
            <button
              type="button"
              onClick={downloadEmailsCsv}
              disabled={!list}
              className="rounded-full border border-zinc-300 bg-white px-4 py-2 text-sm hover:bg-zinc-50 disabled:opacity-40"
            >
              Download CSV
            </button>
            {list && (
              <span className="text-xs text-zinc-500">
                {uniqueCount} unique email{uniqueCount === 1 ? "" : "s"}
              </span>
            )}
          </div>
        </div>
      </div>

      <div>
        <h3 className="text-sm font-semibold uppercase tracking-wider text-zinc-500">
          Message templates
        </h3>
        <p className="mt-1 text-sm text-zinc-600">
          Tap to copy a starter message. Edit before you send.
        </p>
        <ul className="mt-4 space-y-3">
          {tpls.map((t) => (
            <li key={t.key} className="rounded-xl bg-white p-4 ring-1 ring-zinc-200">
              <div className="flex items-center justify-between">
                <div className="font-medium">{t.label}</div>
                <button
                  type="button"
                  onClick={() => copy(`tpl-${t.key}`, t.body)}
                  className="rounded-full bg-zinc-900 px-3 py-1.5 text-xs font-medium text-white hover:bg-zinc-800"
                >
                  {copied === `tpl-${t.key}` ? "Copied!" : "Copy"}
                </button>
              </div>
              <p className="mt-2 whitespace-pre-wrap text-sm text-zinc-700">{t.body}</p>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
