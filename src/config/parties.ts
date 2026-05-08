import type { PartyData, PublicNote } from "@/lib/sheets";

// Each party is either:
//  (a) a real party — backed by a Google Sheet + Apps Script web app,
//  (b) a "demo" — static fixture so the public deployment can show the
//      tool off without exposing real data.
//
// Public/demo entries live in this file (committed to the repo).
// Private real parties live in the PRIVATE_PARTIES_JSON env var on
// Vercel and are loaded at runtime — they don't appear in the public
// source code, so a forker never sees your slugs or sheet URLs.

export interface PartyEntry {
  slug: string;
  /** URL of the Apps Script Web App that backs this party. */
  scriptUrl?: string;
  /** Optional URL of the second "Only myself" Apps Script Web App that
   *  serves the admin dashboard for this party. /admin/<slug> redirects
   *  to this URL — Google's auth then gates it. */
  adminUrl?: string;
  /** Static demo data. When set, RSVPs and notes are not persisted. */
  fixture?: PartyFixture;
  /** Hide from any public listing (landing page, future indexes). */
  private?: boolean;
  /** Name of the env var holding this party's password. The actual
   *  password is set on Vercel (never in source). When set, the public
   *  party page renders a password gate before showing anything. */
  passwordEnv?: string;
}

export interface PartyFixture {
  party: PartyData;
  notes: PublicNote[];
}

const DEMO_FIXTURE: PartyFixture = {
  party: {
    birthday_child_name: "Oliver Twist",
    birthday_age: 8,
    party_title: "Oliver Twist's Pirate Birthday Party",
    description:
      "Ahoy! Come celebrate Oliver Twist's 8th birthday with a swashbuckling afternoon of treasure hunts, snacks, and far too much cake. This is a public PartyPost demo — fork the repo to make your own.",
    date: "2026-05-31",
    start_time: "13:00",
    end_time: "16:00",
    timezone: "America/New_York",
    location_name: "1 Pirate Bay",
    location_address: "1 Pirate Bay, Neverland",
    map_url: null,
    rsvp_deadline: "2026-05-24",
    host_name: "The Crew",
    host_email: null,
    host_phone: null,
    gift_note: null,
    food_note: "Treasure-chest sandwiches, fruit cannons, and a rum-cake (kid version)",
    rain_plan: "We'll move belowdecks (the indoor pavilion) if the weather mutinies.",
    theme: "beach",
    invite_image_url: "/demo-invite.png",
    banner_image_url: "/demo-banner.png",
    profile_image_url: null,
  },
  notes: [
    {
      id: "demo-1",
      display_name: "Captain Hook",
      message: "May your birthday be more delightful than my last encounter with a clock.",
      created_at: new Date(Date.now() - 4 * 24 * 60 * 60 * 1000).toISOString(),
    },
    {
      id: "demo-2",
      display_name: "Tinkerbell",
      message: "✨ Eight is a very magical number. Trust me, I've counted.",
      created_at: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(),
    },
  ],
};

/** Public, shipped-in-repo parties. */
const PUBLIC_PARTIES: PartyEntry[] = [
  { slug: "demo", fixture: DEMO_FIXTURE },
];

/** Private parties loaded from the PRIVATE_PARTIES_JSON env var on Vercel.
 *  Format (JSON-encoded): an array of PartyEntry objects.
 *  Example value to set on Vercel:
 *    [{"slug":"sophia-7","scriptUrl":"https://script.google.com/macros/s/.../exec","private":true,"passwordEnv":"PARTY_SOPHIA_7_PASSWORD"}]
 */
function loadPrivateParties(): PartyEntry[] {
  try {
    const raw = process.env.PRIVATE_PARTIES_JSON;
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return parsed as PartyEntry[];
  } catch (err) {
    console.warn("[partypost] Failed to parse PRIVATE_PARTIES_JSON:", err);
    return [];
  }
}

export const PARTIES: PartyEntry[] = [...PUBLIC_PARTIES, ...loadPrivateParties()];

export function findParty(slug: string): PartyEntry | undefined {
  return PARTIES.find((p) => p.slug === slug);
}

/** Parties safe to list on public pages (landing, etc.). */
export function publicParties(): PartyEntry[] {
  return PARTIES.filter((p) => !p.private);
}
