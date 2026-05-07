// HTTP client for the Apps Script web app that backs each party.

import type { ThemeKey } from "./themes";

export interface PartyData {
  birthday_child_name: string;
  birthday_age: number | null;
  party_title: string;
  description: string | null;
  date: string | null;
  start_time: string | null;
  end_time: string | null;
  timezone: string | null;
  location_name: string | null;
  location_address: string | null;
  map_url: string | null;
  rsvp_deadline: string | null;
  host_name: string | null;
  host_email: string | null;
  host_phone: string | null;
  gift_note: string | null;
  food_note: string | null;
  rain_plan: string | null;
  theme: ThemeKey | string;
  /** The portrait/square invitation image — shown inside the envelope and
      on the thanks page. */
  invite_image_url?: string | null;
  /** Legacy alias for invite_image_url (older sheets used "hero_image_url").
      Code reads invite_image_url first, then falls back to hero_image_url. */
  hero_image_url?: string | null;
  /** Optional landscape banner used on the party page hero. Falls back to
      invite_image_url if not set. */
  banner_image_url?: string | null;
  profile_image_url: string | null;
}

export interface PublicNote {
  id: string;
  display_name: string;
  message: string;
  created_at: string;
}

export interface RsvpRecord {
  id: string;
  edit_token: string;
  status: "yes" | "no" | "maybe";
  parent_names: string;
  email: string;
  phone: string | null;
  child_names: string | null;
  kids_count: number;
  adults_count: number;
  allergy_notes: string | null;
  private_note: string | null;
  public_note: string | null;
  public_note_consent: boolean;
  created_at: string;
  updated_at: string;
}

interface AppsScriptResponse<T> {
  ok: boolean;
  data?: T;
  error?: string;
}

async function callGet<T>(
  scriptUrl: string,
  params: Record<string, string>,
  init?: { revalidate?: number; cache?: RequestCache },
): Promise<T> {
  const url = new URL(scriptUrl);
  Object.entries(params).forEach(([k, v]) => url.searchParams.set(k, v));
  const res = await fetch(url.toString(), {
    redirect: "follow",
    next: init?.revalidate !== undefined ? { revalidate: init.revalidate } : undefined,
    cache: init?.cache,
  });
  if (!res.ok) throw new Error(`Apps Script HTTP ${res.status}`);
  const body = (await res.json()) as AppsScriptResponse<T>;
  if (!body.ok) throw new Error(body.error || "Apps Script error");
  return body.data as T;
}

async function callPost<T>(scriptUrl: string, body: unknown): Promise<T> {
  // Use text/plain so the browser doesn't fire a CORS preflight (Apps Script
  // 302-redirects which doesn't include CORS headers on OPTIONS).
  const res = await fetch(scriptUrl, {
    method: "POST",
    headers: { "Content-Type": "text/plain;charset=utf-8" },
    body: JSON.stringify(body),
    redirect: "follow",
  });
  if (!res.ok) throw new Error(`Apps Script HTTP ${res.status}`);
  const data = (await res.json()) as AppsScriptResponse<T>;
  if (!data.ok) throw new Error(data.error || "Apps Script error");
  return data.data as T;
}

// Server-side: fetch party + approved notes. Cached via ISR.
export async function fetchPartyBundle(
  scriptUrl: string,
): Promise<{ party: PartyData; notes: PublicNote[] }> {
  return callGet<{ party: PartyData; notes: PublicNote[] }>(
    scriptUrl,
    { action: "getParty" },
    { revalidate: 60 },
  );
}

// Server-side: fresh fetch of an RSVP by token (no cache).
export async function fetchRsvpByToken(
  scriptUrl: string,
  token: string,
): Promise<RsvpRecord> {
  return callGet<RsvpRecord>(
    scriptUrl,
    { action: "getRsvpByToken", token },
    { cache: "no-store" },
  );
}

// Server-side: just party data (used by thanks page for theme).
export async function fetchPartyOnly(scriptUrl: string): Promise<PartyData> {
  const bundle = await callGet<{ party: PartyData }>(
    scriptUrl,
    { action: "getParty" },
    { revalidate: 60 },
  );
  return bundle.party;
}

// Client-side calls (browser → Apps Script directly).

export async function submitRsvp(
  scriptUrl: string,
  data: unknown,
  ctx: { siteUrl: string; slug: string },
): Promise<{ id: string; edit_token: string }> {
  return callPost(scriptUrl, {
    action: "submitRsvp",
    data,
    siteUrl: ctx.siteUrl,
    slug: ctx.slug,
  });
}

export async function editRsvp(
  scriptUrl: string,
  token: string,
  data: unknown,
): Promise<{ ok: true }> {
  return callPost(scriptUrl, { action: "editRsvp", token, data });
}

export async function submitNote(
  scriptUrl: string,
  data: { display_name: string; message: string },
): Promise<{ ok: true }> {
  return callPost(scriptUrl, { action: "submitNote", data });
}
