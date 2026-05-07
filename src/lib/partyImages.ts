// Single source of truth for which image goes where on the page.
// Settings tab keys: invite_image_url (portrait), banner_image_url
// (landscape), hero_image_url (deprecated alias for invite).

import type { PartyData } from "./sheets";

/** Portrait invitation: envelope card + thanks page. */
export function inviteImage(party: PartyData): string | null {
  return party.invite_image_url || party.hero_image_url || null;
}

/** Landscape hero on the party page. Falls back to the invite if no banner. */
export function bannerImage(party: PartyData): string | null {
  return party.banner_image_url || inviteImage(party);
}
