import type { PartyRow } from "./supabase/types";

function pad(n: number) {
  return n.toString().padStart(2, "0");
}

// Build a UTC datetime stamp in YYYYMMDDTHHMMSSZ form.
function utcStamp(d: Date): string {
  return (
    d.getUTCFullYear().toString() +
    pad(d.getUTCMonth() + 1) +
    pad(d.getUTCDate()) +
    "T" +
    pad(d.getUTCHours()) +
    pad(d.getUTCMinutes()) +
    pad(d.getUTCSeconds()) +
    "Z"
  );
}

// Construct a Date from a date (YYYY-MM-DD) + optional HH:MM time, treating
// the inputs as wall time in the party's timezone. We convert to UTC by
// approximating with the host timezone offset at that date.
function partyDateTime(party: PartyRow, time: string | null | undefined): Date | null {
  if (!party.date) return null;
  const t = (time && /^\d{1,2}:\d{2}/.test(time)) ? time.slice(0, 5) : "12:00";
  // Build an ISO-ish string and let the runtime parse it as local; this is a
  // best-effort approximation since we don't have full TZ database lookup.
  const iso = `${party.date}T${t}:00`;
  const d = new Date(iso);
  return Number.isNaN(d.getTime()) ? null : d;
}

function escapeIcs(s: string): string {
  return s.replace(/\\/g, "\\\\").replace(/\n/g, "\\n").replace(/,/g, "\\,").replace(/;/g, "\\;");
}

export function partyToIcs(party: PartyRow): string {
  const start = partyDateTime(party, party.start_time);
  if (!start) return "";

  const end =
    partyDateTime(party, party.end_time) ??
    new Date(start.getTime() + 2 * 60 * 60 * 1000); // default 2h

  const now = new Date();
  const lines = [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    "PRODID:-//PartyPost//EN",
    "CALSCALE:GREGORIAN",
    "METHOD:PUBLISH",
    "BEGIN:VEVENT",
    `UID:${party.id}@partypost`,
    `DTSTAMP:${utcStamp(now)}`,
    `DTSTART:${utcStamp(start)}`,
    `DTEND:${utcStamp(end)}`,
    `SUMMARY:${escapeIcs(party.party_title)}`,
    party.location_address
      ? `LOCATION:${escapeIcs([party.location_name, party.location_address].filter(Boolean).join(", "))}`
      : party.location_name
        ? `LOCATION:${escapeIcs(party.location_name)}`
        : "",
    party.description ? `DESCRIPTION:${escapeIcs(party.description)}` : "",
    "END:VEVENT",
    "END:VCALENDAR",
  ].filter(Boolean);
  return lines.join("\r\n") + "\r\n";
}

export function googleCalendarUrl(party: PartyRow, siteUrl: string): string {
  const start = partyDateTime(party, party.start_time);
  if (!start) return "";
  const end =
    partyDateTime(party, party.end_time) ??
    new Date(start.getTime() + 2 * 60 * 60 * 1000);
  const params = new URLSearchParams({
    action: "TEMPLATE",
    text: party.party_title,
    dates: `${utcStamp(start)}/${utcStamp(end)}`,
    details: [party.description ?? "", `${siteUrl}/party/${party.slug}`].filter(Boolean).join("\n\n"),
    location: [party.location_name, party.location_address].filter(Boolean).join(", "),
  });
  return `https://calendar.google.com/calendar/render?${params.toString()}`;
}
