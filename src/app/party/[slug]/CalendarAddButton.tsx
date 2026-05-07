"use client";

import { useMemo } from "react";
import type { PartyRow } from "@/lib/supabase/types";
import { googleCalendarUrl, partyToIcs } from "@/lib/ics";

export function CalendarAddButton({ party }: { party: PartyRow }) {
  const siteUrl = typeof window !== "undefined" ? window.location.origin : "";
  const gcal = useMemo(() => googleCalendarUrl(party, siteUrl), [party, siteUrl]);
  const icsContent = useMemo(() => partyToIcs(party), [party]);

  if (!party.date) return null;

  function downloadIcs() {
    const blob = new Blob([icsContent], { type: "text/calendar;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${party.slug}.ics`;
    a.click();
    URL.revokeObjectURL(url);
  }

  return (
    <>
      {gcal && (
        <a
          href={gcal}
          target="_blank"
          rel="noopener noreferrer"
          className="rounded-full border border-zinc-300 bg-white px-3 py-1.5 text-sm hover:bg-zinc-50"
        >
          📅 Add to Google Calendar
        </a>
      )}
      <button
        type="button"
        onClick={downloadIcs}
        className="rounded-full border border-zinc-300 bg-white px-3 py-1.5 text-sm hover:bg-zinc-50"
      >
        ⬇ Download .ics
      </button>
    </>
  );
}
