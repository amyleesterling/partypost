import type { PartyData, PublicNote } from "@/lib/sheets";

// Each party = one Google Sheet + one Apps Script web app, OR a static
// fixture (used for the public demo so the repo can be deployed without
// any Google setup at all). See apps-script/SETUP.md for the real-party
// flow.

export interface PartyEntry {
  slug: string;
  /** URL of the Apps Script Web App that backs this party. Required for
   *  real parties. Leave undefined for `fixture`-mode demo entries. */
  scriptUrl?: string;
  /** Static demo data. When set, RSVPs and notes are not persisted —
   *  they're acknowledged in-memory and a "demo mode" hint is shown. */
  fixture?: PartyFixture;
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
    gift_note: "No gifts please — bring your most fearsome pirate name.",
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

export const PARTIES: PartyEntry[] = [
  { slug: "demo", fixture: DEMO_FIXTURE },
  // Add real parties here. Example:
  // { slug: "sophia-7", scriptUrl: "https://script.google.com/macros/s/.../exec" },
  {
    slug: "sophia-7",
    scriptUrl:
      "https://script.google.com/macros/s/AKfycbz3cDmGpPmcIESHovbNnWJWE2cgU_4rGfeJTRks0a5EyuV5DMgIkNxDoQnqc12JfFpF/exec",
  },
];

export function findParty(slug: string): PartyEntry | undefined {
  return PARTIES.find((p) => p.slug === slug);
}
