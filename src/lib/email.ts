// Resend wrapper for Phase 2 confirmation emails. No-op if RESEND_API_KEY unset.

import { Resend } from "resend";
import type { PartyRow, RsvpRow } from "./supabase/types";
import { formatPartyDateLong, formatTimeRange } from "./format";

let cached: Resend | null = null;
function client(): Resend | null {
  if (cached) return cached;
  const key = process.env.RESEND_API_KEY;
  if (!key) return null;
  cached = new Resend(key);
  return cached;
}

const FROM = process.env.RESEND_FROM_EMAIL || "PartyPost <onboarding@resend.dev>";

export async function sendRsvpConfirmation(opts: {
  party: PartyRow;
  rsvp: RsvpRow;
  siteUrl: string;
}): Promise<void> {
  const r = client();
  if (!r) return;
  const { party, rsvp, siteUrl } = opts;
  const editUrl = `${siteUrl}/party/${party.slug}/rsvp/edit/${rsvp.edit_token}`;
  const partyUrl = `${siteUrl}/party/${party.slug}`;
  const when = [formatPartyDateLong(party.date), formatTimeRange(party.start_time, party.end_time)]
    .filter(Boolean).join(" · ");
  const where = [party.location_name, party.location_address].filter(Boolean).join(", ");

  const subject = `RSVP saved: ${party.party_title}`;
  const text = [
    `Hi! Your RSVP for ${party.party_title} is saved.`,
    "",
    `Status: ${rsvp.status}`,
    `Adults: ${rsvp.adults_count}, Kids: ${rsvp.kids_count}`,
    when ? `When: ${when}` : "",
    where ? `Where: ${where}` : "",
    "",
    `Need to update? ${editUrl}`,
    `Party page: ${partyUrl}`,
  ].filter(Boolean).join("\n");

  try {
    await r.emails.send({ from: FROM, to: rsvp.email, subject, text });
  } catch (err) {
    console.error("[partypost] sendRsvpConfirmation failed", err);
  }
}

export async function sendHostNotification(opts: {
  party: PartyRow;
  rsvp: RsvpRow;
  siteUrl: string;
  hostEmail: string;
}): Promise<void> {
  const r = client();
  if (!r) return;
  const { party, rsvp, siteUrl, hostEmail } = opts;
  if (!hostEmail) return;
  const dashboardUrl = `${siteUrl}/admin/party/${party.id}`;

  const subject = `New RSVP for ${party.party_title}: ${rsvp.parent_names} (${rsvp.status})`;
  const text = [
    `${rsvp.parent_names} just RSVP'd "${rsvp.status}" for ${party.party_title}.`,
    "",
    `Adults: ${rsvp.adults_count}, Kids: ${rsvp.kids_count}, Total: ${rsvp.total_count}`,
    `Email: ${rsvp.email}${rsvp.phone ? ` · Phone: ${rsvp.phone}` : ""}`,
    rsvp.child_names ? `Children: ${rsvp.child_names}` : "",
    rsvp.allergy_notes ? `Allergies: ${rsvp.allergy_notes}` : "",
    rsvp.private_note ? `Note to host: ${rsvp.private_note}` : "",
    rsvp.public_note ? `Public birthday wish: ${rsvp.public_note}` : "",
    "",
    `Manage: ${dashboardUrl}`,
  ].filter(Boolean).join("\n");

  try {
    await r.emails.send({ from: FROM, to: hostEmail, subject, text });
  } catch (err) {
    console.error("[partypost] sendHostNotification failed", err);
  }
}
