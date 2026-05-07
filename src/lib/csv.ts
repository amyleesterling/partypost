import type { RsvpRow } from "./supabase/types";

const COLUMNS = [
  "RSVP Status",
  "Parent Name(s)",
  "Email",
  "Phone",
  "Child Name(s)",
  "Kids Count",
  "Adults Count",
  "Total Count",
  "Allergy Notes",
  "Private Note",
  "Public Birthday Wish",
  "Created At",
  "Updated At",
] as const;

function escape(value: unknown): string {
  if (value === null || value === undefined) return "";
  const s = String(value);
  if (/[",\n\r]/.test(s)) return `"${s.replace(/"/g, '""')}"`;
  return s;
}

export function rsvpsToCsv(rsvps: RsvpRow[]): string {
  const header = COLUMNS.join(",");
  const rows = rsvps.map((r) =>
    [
      r.status,
      r.parent_names,
      r.email,
      r.phone,
      r.child_names,
      r.kids_count,
      r.adults_count,
      r.total_count,
      r.allergy_notes,
      r.private_note,
      r.public_note,
      r.created_at,
      r.updated_at,
    ]
      .map(escape)
      .join(","),
  );
  return [header, ...rows].join("\r\n") + "\r\n";
}
