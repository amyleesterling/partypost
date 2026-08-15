// Pure formatting helpers for dates, times, and addresses.

const WEEKDAYS = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
const MONTHS = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December",
];

export function formatPartyDate(date: string | null | undefined): string {
  if (!date) return "";
  // Treat as wall-clock date (no timezone shifts).
  const [y, m, d] = date.split("-").map(Number);
  if (!y || !m || !d) return date;
  const local = new Date(y, m - 1, d);
  return `${WEEKDAYS[local.getDay()]}, ${MONTHS[m - 1]} ${d}`;
}

export function formatPartyDateLong(date: string | null | undefined): string {
  if (!date) return "";
  const [y, m, d] = date.split("-").map(Number);
  if (!y || !m || !d) return date;
  const local = new Date(y, m - 1, d);
  return `${WEEKDAYS[local.getDay()]}, ${MONTHS[m - 1]} ${d}, ${y}`;
}

function fmtTime12(t: string | null | undefined): string {
  if (!t) return "";
  const [hStr, mStr] = t.split(":");
  let h = Number(hStr);
  const m = Number(mStr ?? "0");
  if (Number.isNaN(h) || Number.isNaN(m)) return t;
  const period = h >= 12 ? "PM" : "AM";
  h = h % 12 || 12;
  return m === 0 ? `${h} ${period}` : `${h}:${m.toString().padStart(2, "0")} ${period}`;
}

export function formatTimeRange(start: string | null | undefined, end: string | null | undefined): string {
  if (!start && !end) return "";
  if (start && end) return `${fmtTime12(start)} – ${fmtTime12(end)}`;
  return fmtTime12(start ?? end);
}

export function googleMapsUrl(address: string | null | undefined, name?: string | null): string | null {
  const q = (address || name || "").trim();
  if (!q) return null;
  return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(q)}`;
}

// Keyless Google Maps embed — no API key needed for the output=embed iframe.
export function googleMapsEmbedUrl(address: string | null | undefined, name?: string | null): string | null {
  const q = (address || name || "").trim();
  if (!q) return null;
  return `https://maps.google.com/maps?q=${encodeURIComponent(q)}&z=15&output=embed`;
}
