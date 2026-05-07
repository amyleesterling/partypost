// Each party = one Google Sheet + one Apps Script web app.
// Add an entry here per party. See apps-script/SETUP.md.

export interface PartyEntry {
  slug: string;
  scriptUrl: string;
}

export const PARTIES: PartyEntry[] = [
  // Example:
  // {
  //   slug: "sophia-7",
  //   scriptUrl: "https://script.google.com/macros/s/AKfy.../exec",
  // },
];

export function findParty(slug: string): PartyEntry | undefined {
  return PARTIES.find((p) => p.slug === slug);
}
