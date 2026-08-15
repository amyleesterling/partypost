# Hype mode — the final-countdown party page

When a party is **within 48 hours of starting**, the party page automatically
swaps its hero (the banner + small countdown card) for **hype mode**: a
full-width animated countdown built to get guests stoked.

No configuration needed — it turns itself on and off based on the party's
`date`, `start_time`, and `end_time` in the Sheet's Settings tab.

## What guests see

| When | Hero |
| :--- | :--- |
| More than 48h before start | Normal hero — banner art + compact countdown card |
| 48h → start | **Hype mode**: giant live `HH:MM:SS` countdown, animated theme-color gradient, floating party emoji, "🚨 FINAL COUNTDOWN 🚨" (or "⏰ IT'S ALMOST TIME ⏰" while >24h out) |
| During the party (start → `end_time`, or start + 2h if no end time) | "IT'S PARTY TIME!" takeover + an automatic confetti volley when the countdown hits zero |
| After the party | Back to the normal hero (the countdown card shows "Party's already happened") |

The rest of the page (RSVP, details, map, birthday wishes) stays put below
the hero in every state.

### Confetti, obviously

- **Tap anywhere** on the hype hero to fire a confetti burst from your finger.
- The **"Tap for confetti 🎉"** button does the same (and wobbles invitingly).
- Every **5th tap** fires a bigger star burst — and after 10 taps you're
  crowned **confetti master** with a running tap counter.
- All animation and confetti respect `prefers-reduced-motion`.

## Testing / demoing it

Hype mode is client-side and time-based, so you can preview it any time:

- `/party/<slug>?hype=1` — force hype mode on (regardless of date)
- `/party/<slug>?hype=0` — force it off

## Implementation notes

- `src/app/party/[slug]/HypeCountdown.tsx` — the hero component plus the
  `useHypeMode()` hook that decides when the window is active (checked on
  mount and every 30s, so a tab left open flips over on its own).
- `src/app/globals.css` — `pp-hype-*` styles: gradient shift, emoji float,
  digit pop, button wobble.
- Hydration-safe per the repo convention: the hook always returns `false`
  during SSR/hydration and only flips after mount, so the server-rendered
  page never disagrees with the first client render.
- The gradient uses the party's live theme colors (`--accent` /
  `--secondary`), so hype mode automatically matches every theme.

## Ideas for future versions

- **Live headcount hype** — "23 friends are coming!" pulled from the RSVP
  totals to build momentum (needs a lightweight public count endpoint in the
  Apps Script).
- **"Leave by" hint** — pair the map with a travel-time estimate so the
  during-party page can say "about 15 min away — leave by 12:15!"
- **Balloon-pop mini game** — floating balloons guests can pop while they
  wait; high-score board on the note wall.
- **Hype wishes ticker** — scroll the birthday wishes across the hype hero
  like a stadium jumbotron.
- **Sound toggle** — a tiny party-horn / cheer sound on confetti taps
  (off by default, obviously).
- **Day-of photo drop** — during the party, swap the RSVP card for a "share
  a photo" link pointing at a shared album the host configures in Settings.
- **Thank-you mode** — the day after the party, a warm "thanks for coming"
  page with the note wall front and center.
- **Configurable window** — a `hype_window_hours` Settings row for hosts
  who want the takeover sooner or later than 48h.
- **Countdown share card** — an "add the countdown to your home screen" or
  shareable image so kids can watch the clock on the fridge tablet.
