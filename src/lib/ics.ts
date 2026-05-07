// Calendar helpers. Accept any object with the party-event-relevant fields.

export interface IcsPartyShape {
  id?: string;
  slug?: string;
  party_title: string;
  description?: string | null;
  date?: string | null;
  start_time?: string | null;
  end_time?: string | null;
  location_name?: string | null;
  location_address?: string | null;
}

function pad(n: number) {
  return n.toString().padStart(2, "0");
}

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

function partyDateTime(party: IcsPartyShape, time: string | null | undefined): Date | null {
  if (!party.date) return null;
  const t = (time && /^\d{1,2}:\d{2}/.test(time)) ? time.slice(0, 5) : "12:00";
  const iso = `${party.date}T${t}:00`;
  const d = new Date(iso);
  return Number.isNaN(d.getTime()) ? null : d;
}

function escapeIcs(s: string): string {
  return s.replace(/\\/g, "\\\\").replace(/\n/g, "\\n").replace(/,/g, "\\,").replace(/;/g, "\\;");
}

export function partyToIcs(party: IcsPartyShape): string {
  const start = partyDateTime(party, party.start_time);
  if (!start) return "";

  const end =
    partyDateTime(party, party.end_time) ??
    new Date(start.getTime() + 2 * 60 * 60 * 1000);

  const now = new Date();
  const uid = (party.id || party.slug || "partypost") + "@partypost";
  const lines = [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    "PRODID:-//PartyPost//EN",
    "CALSCALE:GREGORIAN",
    "METHOD:PUBLISH",
    "BEGIN:VEVENT",
    `UID:${uid}`,
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

export function googleCalendarUrl(party: IcsPartyShape, siteUrl: string): string {
  const start = partyDateTime(party, party.start_time);
  if (!start) return "";
  const end =
    partyDateTime(party, party.end_time) ??
    new Date(start.getTime() + 2 * 60 * 60 * 1000);
  const slugPart = party.slug ? `${siteUrl}/party/${party.slug}` : siteUrl;
  const params = new URLSearchParams({
    action: "TEMPLATE",
    text: party.party_title,
    dates: `${utcStamp(start)}/${utcStamp(end)}`,
    details: [party.description ?? "", slugPart].filter(Boolean).join("\n\n"),
    location: [party.location_name, party.location_address].filter(Boolean).join(", "),
  });
  return `https://calendar.google.com/calendar/render?${params.toString()}`;
}
