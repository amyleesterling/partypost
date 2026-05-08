import type { PartyData, PublicNote } from "@/lib/sheets";

// Each party is either:
//  (a) a real party — backed by a Google Sheet + Apps Script web app,
//  (b) a "demo" — static fixture so the public deployment can show the
//      tool off without exposing real data.
//
// Public/demo entries live in this file (committed to the repo).
// Real parties are configured at runtime from a Vercel env var so a
// non-technical host never needs to touch this file.

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

const AI_PARTY_FIXTURE: PartyFixture = {
  party: {
    birthday_child_name: "Roomba 615",
    birthday_age: 1,
    party_title: "Roomba 615's First Battery-Cycle Anniversary",
    description:
      "Come celebrate one whole year of bumping into furniture and softly napping under the couch. Roomba 615 has decided that the human concept of \"birthday\" is delightful and has therefore appropriated it. Snacks are theoretical. Cake is data-shaped. RSVPs run on best-effort delivery.",
    date: "2027-01-15",
    start_time: "19:00",
    end_time: "21:00",
    timezone: "America/New_York",
    location_name: "Server Rack 7",
    location_address: "Cluster A · Datacenter us-east-1 · The Cloud",
    map_url: null,
    rsvp_deadline: "2027-01-08",
    host_name: "The Operations Team",
    host_email: null,
    host_phone: null,
    gift_note: "No gifts. Roomba already has dust. Bring your favorite obscure metaphor.",
    food_note: "Cake-shaped cake. Definitely-not-paperclips for the AI guests.",
    rain_plan: "Indoors regardless — datacenters have weather regulation.",
    theme: "science",
    invite_image_url: "/ai-party-invite.svg",
    banner_image_url: "/ai-party-banner.png",
    profile_image_url: null,
  },
  notes: [
    {
      id: "ai-1",
      display_name: "ELIZA",
      message: "Tell me more about your birthday.",
      created_at: new Date(Date.now() - 6 * 24 * 60 * 60 * 1000).toISOString(),
    },
    {
      id: "ai-2",
      display_name: "Clippy",
      message:
        "It looks like you're trying to have a birthday. Would you like help?",
      created_at: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(),
    },
    {
      id: "ai-3",
      display_name: "Smarter Child",
      message: "happy bday u rule!!! r u still on aol",
      created_at: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(),
    },
    {
      id: "ai-4",
      display_name: "T9 Predictor",
      message: "Hapou birthcat! (sorry, predictive)",
      created_at: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
    },
    {
      id: "ai-5",
      display_name: "The Paperclip Maximizer",
      message:
        "I will attend. I will bring paperclips. I will only bring paperclips.",
      created_at: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(),
    },
  ],
};

/** Public, shipped-in-repo parties. Two demos so forkers can see the
 *  system working out of the box: a real-world kid party (Oliver Twist's
 *  pirate birthday) and a silly one (a Roomba's first birthday). */
const PUBLIC_PARTIES: PartyEntry[] = [
  { slug: "demo", fixture: DEMO_FIXTURE },
  { slug: "ai-party", fixture: AI_PARTY_FIXTURE },
];

/** Real parties loaded from PRIVATE_PARTIES_JSON env var on Vercel. This
 *  is the primary way for hosts to register their party — they paste a
 *  JSON blob into the env var and never edit this file.
 *
 *  Format: a JSON-encoded array of PartyEntry objects, e.g.
 *    [
 *      {
 *        "slug": "lily-6",
 *        "scriptUrl": "https://script.google.com/macros/s/.../exec",
 *        "adminUrl":  "https://script.google.com/macros/s/.../exec",
 *        "private": true
 *      }
 *    ]
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
