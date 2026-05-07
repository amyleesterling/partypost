# PartyPost

A tiny, FREE cheerful birthday-party invitation + RSVP site. Each party = one Google Sheet (your "database") + one Google Apps Script web app (your "API") + one entry in `src/config/parties.ts`. Guests RSVP without signing in. You see RSVPs by opening the Sheet.

This effectively replaces Paperless Post for personal use.

Built for managing kids' birthday parties — not a SaaS. No accounts, no bill, powered by free tier Google Drive.

## Stack

Next.js 16 (App Router) · React 19 · TypeScript · Tailwind v4 · canvas-confetti · react-hook-form + zod · **Google Sheets + Apps Script** as the backend · Vercel for hosting.

## How a party works

```
guest's phone ──→ partypost.vercel.app/party/sophia-7
                       │
                       ├─ Server-side: fetch party config + approved notes from Apps Script (cached 60s)
                       │
                       ├─ RSVP form → POST direct to Apps Script Web App URL
                       │              → Apps Script appends row to RSVPs tab in your Sheet
                       │              → Apps Script sends confirmation email via your Gmail
                       │
                       └─ Note wall   → POST direct to Apps Script
                                       → Appends to Notes tab (is_approved=FALSE)
                                       → You set is_approved=TRUE in the Sheet to publish

You manage everything by opening the Google Sheet.
```

## First-party setup (~10 min, one-time per party)

Detailed walk-through in [`apps-script/SETUP.md`](apps-script/SETUP.md). The short version:

1. **Create a Google Sheet** (https://sheets.new)
2. **Extensions → Apps Script** → paste in [`apps-script/Code.gs`](apps-script/Code.gs) → Save
3. Run **`setupSheet`** once → grants permissions, creates Settings/RSVPs/Notes tabs
4. Fill in the **Settings tab** (party_title, date, location, theme, etc.)
5. **Deploy → Web app**, "Execute as: Me", "Anyone has access" → copy the URL
6. Add the slug + URL to [`src/config/parties.ts`](src/config/parties.ts)
7. Push to GitHub → Vercel auto-deploys → party page is live at `/party/<slug>`

## Where the data lives

- **Settings** tab — all the party details (title, date, theme, etc.). Edit here to change the public page; updates show up within ~1 min.
- **RSVPs** tab — one row per RSVP. Sort, filter, COUNTIF whatever you need. Native CSV export via File → Download.
- **Notes** tab — birthday wishes from guests. New ones land with `is_approved=FALSE`. Set to `TRUE` for the ones you want on the public page.

## What the public page has

- Themed hero card (10 themes: beach / princess / woodland / space / rainbow / science / garden tea / arcade / dinosaur / default)
- Birthday-child profile photo
- Party details (when, where, RSVP-by, gifts, food, rain plan, host)
- Tap-to-call host phone, tap-to-Google-Maps address
- RSVP form (yes / maybe / no, kids + adults counts, allergies, private + public notes)
- Confetti animation on submit 🎉
- "Add to Google Calendar" + .ics download
- Magic edit link (no account needed)
- Birthday wishes wall (host-moderated)
- Mobile sticky RSVP bar

## Local dev

```bash
npm install
npm run dev
```

Add at least one party to `src/config/parties.ts` first or `/` will be empty. Visit http://localhost:3000.

## Deploy

```bash
git push origin main
```

Vercel auto-deploys (after you've imported the repo at vercel.com once). No env vars required.

## Limits / quotas

- **Apps Script email**: ~100/day from a personal Gmail account. Plenty for kids' parties — that's 100 RSVP confirmations + 100 host notifications per party per day.
- **Apps Script execution**: 90 min/day total compute, 6 min per request. Each RSVP submit takes maybe 500ms. You'd need ~10,000 RSVPs/day to hit the daily cap.
- **Sheets API rate**: 60 reads/min per user. The party page is cached server-side for 60s, so guests don't hit this even at moderate traffic.

## Routes

- `/` — landing page (lists active parties from the registry)
- `/party/[slug]` — public invite page
- `/party/[slug]/rsvp/thanks` — confirmation page with edit link
- `/party/[slug]/rsvp/edit/[token]` — guest updates their own RSVP via magic token

## Where things live in the code

```
apps-script/
├── Code.gs               # The Apps Script template (paste into each new sheet)
└── SETUP.md              # Per-party setup walkthrough

src/
├── config/parties.ts     # The registry: { slug → scriptUrl }
├── lib/
│   ├── sheets.ts         # HTTP client for the Apps Script web app
│   ├── themes.ts         # 10 theme definitions
│   ├── format.ts         # Date / time / address formatters
│   ├── ics.ts            # Calendar (Google + .ics) helpers
│   └── validation.ts     # zod schemas for RSVP form
└── app/
    ├── page.tsx          # Landing
    └── party/[slug]/     # Public party page + RSVP + thanks + edit
```

## Why Google Sheets

- You already have it. No DB to manage, no monthly cost.
- The data is where you can sort/filter/share/export it natively.
- Apps Script handles email confirmations using your Gmail quota.
- Concurrency is fine for party-scale traffic. `LockService` serializes writes.

## Future ideas (not built)

- Native send for "message all yes RSVPs" via MailApp (currently you copy emails out of the Sheet)
- Guest photo gallery after the party (Drive folder)
- Print-friendly checklist (party favors, food counts)
- Password-protected parties
