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
    birthday_child_name: "Lily",
    birthday_age: 6,
    party_title: "Lily's 6th Birthday Party",
    description:
      "Come celebrate Lily's 6th birthday with sandcastles, snacks, and a heroic quantity of sprinkles. This is a public PartyPost demo — fork the repo to make your own.",
    date: "2026-09-12",
    start_time: "13:00",
    end_time: "16:00",
    timezone: "America/New_York",
    location_name: "Riverside Park (Pavilion 3)",
    location_address: "475 Riverside Dr, New York, NY 10027",
    map_url: null,
    rsvp_deadline: "2026-09-05",
    host_name: "The Demo Family",
    host_email: null,
    host_phone: null,
    gift_note: "No gifts please — your presence is the present.",
    food_note: "Pizza, fruit, and a giant rainbow cake",
    rain_plan: "We'll move to the indoor pavilion if it's wet.",
    theme: "beach",
    hero_image_url: "/demo-banner.svg",
    banner_image_url: "/demo-banner.svg",
    profile_image_url: null,
  },
  notes: [
    {
      id: "demo-1",
      display_name: "The Park Family",
      message: "Happy birthday Lily! See you at the park 🎉",
      created_at: new Date(Date.now() - 4 * 24 * 60 * 60 * 1000).toISOString(),
    },
    {
      id: "demo-2",
      display_name: "Sam & Friends",
      message: "Six is the best year. Trust us.",
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
