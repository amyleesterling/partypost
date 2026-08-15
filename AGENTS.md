# AGENTS.md — read me first

This file is for any AI coding assistant (Claude, ChatGPT/Codex, Cursor, GitHub Copilot, Aider, etc.) helping a human customize this repo. The conventions here override your training data when they conflict.

## What this is

PartyPost is a personal-use birthday-party RSVP site. **One Google Sheet per party + one Apps Script Web App per party** acts as the database. The Next.js frontend is a public read-only invite page that POSTs RSVPs back to the Sheet via the Apps Script. There is no Postgres, no auth, no admin dashboard — the host opens the Sheet to see RSVPs. Designed to be forked, customized, and deployed by anyone.

If the user is asking you to "add Postgres", "add user accounts", "set up an admin dashboard", or anything that grows the surface area beyond a single-host kid party tool, push back and confirm — that's not the design intent.

## Tech stack (don't substitute)

- **Next.js 16 App Router** — file-based routing under `src/app/`. Note: this version has API differences from older Next.js docs in your training data. Read `node_modules/next/dist/docs/` if a Next.js API behaves unexpectedly. `params` and `searchParams` are now `Promise<...>` and must be `await`ed in pages and route handlers.
- **React 19** — Server Components by default; mark client components with `"use client"`.
- **TypeScript** — strict mode, no `any` unless unavoidable.
- **Tailwind v4** — `@import "tailwindcss"` in globals.css, theme tokens via `@theme inline`. No tailwind.config.js — config lives in CSS.
- **react-hook-form + zod** — `useForm<InputType, unknown, OutputType>` + `zodResolver`, with `SubmitHandler<OutputType>` for the submit handler. zod schemas in `src/lib/validation.ts`.
- **canvas-confetti** — used for RSVP submit, idle ambient, and Yes-toggle bursts. Always check `prefers-reduced-motion` before animating.
- **node-vibrant/node** — server-side palette extraction from the hero image. Module-level cache by URL.
- **Vercel** — auto-deploys on push to `main`.

## Architecture

```
guest's phone ──→ vercel-app/party/<slug>
                      │
                      ├─ SSR (revalidate: 60): fetch party + approved notes
                      │     from Apps Script web app via fetchPartyBundle()
                      │
                      ├─ Browser → POST direct to Apps Script (text/plain
                      │     body to skip CORS preflight on Apps Script's 302)
                      │
                      └─ host opens the Google Sheet → sees all data
```

`src/config/parties.ts` is the registry mapping `{ slug → scriptUrl }`. To add a party, append an entry there. To remove one, delete the entry.

## Per-party setup the human will do

See `apps-script/SETUP.md` for the full walk-through. Roughly:
1. Create a Google Sheet
2. Extensions → Apps Script → paste `apps-script/Code.gs`
3. Run `setupSheet` once to create Settings/RSVPs/Notes tabs
4. Fill in the Settings tab values
5. Deploy as Web App (Execute as: Me, Anyone has access) → copy URL
6. Add `{ slug, scriptUrl }` to `src/config/parties.ts`
7. `git push` → Vercel auto-deploys

**Critical**: editing `apps-script/Code.gs` and saving does NOT update what the deployed Web App serves. The user must "Deploy → Manage deployments → ✏️ → New version → Deploy" to push code changes. The URL stays the same.

## Code conventions

- **No comments unless the why is non-obvious.** Don't narrate what code does. Don't add JSDoc to obvious functions.
- **No new abstractions** for hypothetical future needs. Copy a few lines instead of premature DRY.
- **No backwards-compat shims** when changing things. Delete dead code completely.
- **No host approval flows for the note wall** — guests' birthday wishes auto-publish. This is a kid party, not a moderation system.
- **No "Maybe" RSVP option** — yes / no only.
- **Theme system**: tokens in `src/lib/themes.ts`, applied via CSS variables on `.themed`. The hero image's dominant color drives `--accent` and `--secondary` only; `--bg`, `--ink`, `--heading`, `--muted-ink` come from the theme tokens themselves.
- **Hydration-safe time/window code**: anything depending on `Date.now()` or `window.*` must defer to `useEffect` and render a stable placeholder server-side. See `Countdown.tsx` and `CalendarAddButton.tsx` for the pattern.

## File organization

```
apps-script/
├── Code.gs           # The Apps Script. Paste into each new sheet.
└── SETUP.md          # Per-party setup walk-through

src/
├── config/parties.ts # Registry: { slug → scriptUrl }
├── lib/
│   ├── sheets.ts     # HTTP client for the Apps Script web app
│   ├── themes.ts     # 10 theme presets + CSS-var helper
│   ├── extractPalette.ts  # node-vibrant wrapper, server-side cache
│   ├── format.ts     # Date/time/address formatters
│   ├── ics.ts        # Google Cal URL + .ics generators
│   └── validation.ts # zod schemas (party + RSVP)
├── app/
│   ├── icon.svg      # Browser tab icon
│   ├── page.tsx      # Landing page
│   ├── globals.css   # Theme + animation styles
│   └── party/[slug]/
│       ├── page.tsx              # Public invite page (server component)
│       ├── PublicPartyView.tsx   # Layout shell (client)
│       ├── RsvpForm.tsx          # Yes/no form + confetti + funny-no toast
│       ├── NoteWall.tsx          # Birthday-wish wall + submit form
│       ├── CalendarAddButton.tsx # gcal URL + .ics download
│       ├── Countdown.tsx         # Live d/h/m/s ticker
│       ├── RisingBubbles.tsx     # Ambient bubble particles
│       ├── IdleConfetti.tsx      # Periodic confetti puffer
│       ├── StickyRsvpBar.tsx     # Mobile-only bottom CTA
│       └── rsvp/
│           ├── thanks/page.tsx + ThanksCopyButton + ThanksView
│           └── edit/[token]/page.tsx
└── public/           # Static assets (hero images per party)
```

## Banner + invite art — prompt the user, but DON'T halt

The party page has two image slots: a **landscape banner** (hero on the public page) and a **portrait invite** (shown on the RSVP thanks page). These need to look polished and on-theme — they're the most visible part of the page.

**Do not auto-generate SVG, ASCII, emoji-collage, or other placeholder art.** A hand-rolled SVG of balloons looks like a hand-rolled SVG of balloons. The whole point of the README's Step 2 is that any consumer image generator (ChatGPT/DALL·E, Gemini, Midjourney, etc.) produces beautiful kid-party art in seconds, and the user can iterate until they love it.

The right pattern is **prompt-and-continue**, not halt-and-wait:

1. When you reach the banner/invite step, **prompt the user inline**: paste the image-generation prompt from the README's "Step 2 — Generate a banner image" section, filled in with their party's specifics (child's name, age, date, location, theme, favorite colors). Tell them to drop the resulting image(s) into `public/<slug>-banner.png` and `public/<slug>-invite.png` whenever they're ready.
2. **Don't block on it.** Keep going — finish the Sheet/Apps Script setup, register the party in `parties.ts`, push, deploy. The site can ship with empty image fields; it degrades gracefully (theme-color background).
3. When the user comes back with their image, wire it up: either commit the file to `public/` and reference `/<slug>-banner.png` in the Settings tab's `banner_image_url` / `invite_image_url`, or paste a hosted URL directly into Settings. The image takes effect on the next deploy (or within ~60s of editing the Sheet).

The goal: the user starts generating art in a separate tab while you're getting the rest of the party live. By the time the site deploys, they have art ready to paste in.

## Things to NOT do

- Don't introduce server-side databases (Postgres, MongoDB, Firebase) — Sheets is the database
- Don't add admin auth or sign-in flows — there is no admin UI; the Sheet is the admin
- Don't add image upload UIs — hosts paste an image URL into the Settings tab (or commit a file under `public/` and use a relative URL)
- Don't auto-generate banner/invite art (SVG, ASCII, emoji collage, etc.) — see the section above. Prompt the user to generate real art with an image-gen tool, then keep going (don't block on it; the site ships fine with empty image fields).
- Don't add "host approval" gating to the note wall — auto-publish
- Don't add Maybe RSVPs back
- Don't generate slugs — hosts pick them in `parties.ts`
- Don't fetch from Apps Script in client components for data the page already has — pass it down as props
- Don't bypass the hydration-safe pattern for time/window-dependent UI

## Asking for clarification

If the user requests something ambiguous, ask once before changing scope. Their default mode is "ship it, iterate fast" — but for changes that delete or move sheet data, prompt for confirmation.
