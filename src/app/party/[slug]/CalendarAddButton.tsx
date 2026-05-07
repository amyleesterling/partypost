"use client";

import { useEffect, useMemo, useState } from "react";
import type { PartyData } from "@/lib/sheets";
import { googleCalendarUrl, partyToIcs } from "@/lib/ics";

export function CalendarAddButton({ slug, party }: { slug: string; party: PartyData }) {
  const [siteUrl, setSiteUrl] = useState<string>("");

  useEffect(() => {
    setSiteUrl(window.location.origin);
  }, []);

  const icsParty = useMemo(
    () => ({
      slug,
      party_title: party.party_title,
      description: party.description,
      date: party.date,
      start_time: party.start_time,
      end_time: party.end_time,
      location_name: party.location_name,
      location_address: party.location_address,
    }),
    [slug, party],
  );
  const gcal = useMemo(
    () => (siteUrl ? googleCalendarUrl(icsParty, siteUrl) : ""),
    [icsParty, siteUrl],
  );
  const icsContent = useMemo(() => partyToIcs(icsParty), [icsParty]);

  if (!party.date) return null;

  function downloadIcs() {
    const blob = new Blob([icsContent], { type: "text/calendar;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${slug}.ics`;
    a.click();
    URL.revokeObjectURL(url);
  }

  return (
    <>
      {/* Render the Google Calendar link only after mount, so the href matches
          between server and client (server has no window.location.origin). */}
      {gcal ? (
        <a
          href={gcal}
          target="_blank"
          rel="noopener noreferrer"
          className="rounded-full border border-zinc-300 bg-white px-3 py-1.5 text-sm hover:bg-zinc-50"
        >
          📅 Add to Google Calendar
        </a>
      ) : (
        <span
          className="rounded-full border border-zinc-300 bg-white px-3 py-1.5 text-sm opacity-60"
          aria-hidden="true"
        >
          📅 Add to Google Calendar
        </span>
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
