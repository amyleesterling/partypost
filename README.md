# PartyPost

A **FREE** Paperless-Post-style invitation site for kids' birthday parties. Each party gets a beautiful page you share with one link. RSVPs land in a Google Sheet you own.

No monthly bill. No guest accounts. No marketing emails to your friends. Just your Google account + a free Vercel deployment.

**Built to be set up with help from any AI assistant** (Claude, ChatGPT, Cursor, etc.). Open this repo in your AI and ask it to walk you through it. The first party takes about an hour; each one after is ~10 minutes.

## See it in action

[partypost.vercel.app/party/sophia-7](https://partypost.vercel.app/party/sophia-7) — a themed invite with your banner art, a live countdown to the party, an RSVP form, a birthday-wishes wall, and an "Add to Google Calendar" button. Confetti when guests RSVP yes 🎉.

## What you'll need

- A Google account (Gmail + Drive)
- A free [GitHub](https://github.com) account
- A free [Vercel](https://vercel.com) account (signs in with GitHub)

## Setting up your first party

Tell your AI assistant something like:

> *"Help me set up PartyPost for my kid's birthday. Here are the details:*
> *Name: Sophia, turning 7*
> *Date: Sunday, August 16, 12:30–3:00pm*
> *Place: Arlington Reservoir Beach*
> *Theme: beach*
> *I have a banner image saved at ~/Downloads/sophia-banner.png."*

It will walk you through:

1. **Fork this repo** on GitHub (one click)
2. **Deploy on Vercel** — connect to your fork, click Deploy. ~90 seconds.
3. **Create a Google Sheet** for the party
4. **Paste in [`apps-script/Code.gs`](apps-script/Code.gs)** via Extensions → Apps Script, then run `setupSheet` once
5. **Fill in the Settings tab** with your party details
6. **Deploy the Apps Script as a Web App** ("Anyone has access"), copy the URL
7. **Add the URL + a slug** to [`src/config/parties.ts`](src/config/parties.ts)
8. **Commit + push** — your party page is live

The detailed click-by-click walkthrough is in [`apps-script/SETUP.md`](apps-script/SETUP.md).

## Seeing your RSVPs

Open your Google Sheet. The **RSVPs** tab has every response. Sort, filter, COUNTIF the cupcake math, whatever you want. CSV export: File → Download → CSV.

Want to change anything on the public page? Edit the **Settings** tab. Changes show up within a minute.

## Adding more parties later

A new party = a new Google Sheet + a new entry in `parties.ts`. Tell your AI: *"Add a new party for [name], [age], [date]. I have the banner at [path]."*

## Make it yours

Ask your AI to swap the banner, change colors, tweak wording, add a section, switch the theme. The repo is meant to be customized.

[`AGENTS.md`](AGENTS.md) is what your AI assistant should read first — it explains the architecture and conventions so the AI doesn't suggest unnecessary complexity (like adding accounts or a database).
