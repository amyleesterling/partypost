# PartyPost

Cheerful, lightweight birthday-party invitations and RSVPs.
Each party gets a unique shareable link. Guests RSVP without making accounts.
Hosts get a clean dashboard with RSVP totals, allergy notes, CSV export, and a one-click message-guests panel.

## Stack

Next.js 16 (App Router) · React 19 · TypeScript · Tailwind v4 · Supabase (Postgres + Storage + Auth) · Resend (optional emails) · Vercel.

## First-time setup

1. **Clone & install**
   ```bash
   git clone https://github.com/amyleesterling/partypost.git
   cd partypost
   npm install
   ```

2. **Create a Supabase project** at https://supabase.com (free tier is fine).

3. **Run the schema**: open Supabase → SQL Editor → paste `supabase/migrations/0001_initial.sql` → Run.
   This creates 4 tables (`parties`, `rsvps`, `notes`, `party_images`), row-level-security policies, and the `party-images` storage bucket.

4. **Enable Google OAuth**:
   - Supabase dashboard → Authentication → Providers → Google → enable.
   - Follow the wizard (creates a Google Cloud OAuth client).
   - Add redirect URL: `https://YOUR-PROJECT-REF.supabase.co/auth/v1/callback`.
   - Add `http://localhost:3000` (for dev) and your Vercel URL (for prod) to the allowed redirect URLs in Supabase.

5. **Env vars** — copy `.env.example` to `.env.local` and fill in:
   - `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_ANON_KEY` (from Project Settings → API)
   - `SUPABASE_SERVICE_ROLE_KEY` (same page, **server-only**, never commit)
   - `ADMIN_EMAIL_ALLOWLIST` (your email; comma-separated for multiple, blank to allow any signed-in Google account)
   - `RESEND_API_KEY` and `RESEND_FROM_EMAIL` (optional — confirmation emails are skipped if missing)
   - `NEXT_PUBLIC_SITE_URL` = `http://localhost:3000` for dev, your prod URL otherwise

6. **Run dev server**
   ```bash
   npm run dev
   ```
   Open http://localhost:3000 → sign in with Google → create your first party.

## Deploy to Vercel

1. Push this repo to GitHub (already done).
2. Import the repo at https://vercel.com.
3. Set the same env vars in the Vercel dashboard (Project Settings → Environment Variables).
4. Update Supabase Auth → URL Configuration → add your Vercel URL to "Redirect URLs".
5. Update `NEXT_PUBLIC_SITE_URL` env var to your prod URL so RSVP confirmation emails contain working links.

## What's in the box

**Phase 1 — Bare Magic**
- Multi-party admin dashboard, create/edit/delete parties
- Hero + birthday-child profile image upload (Supabase Storage)
- Public invite page at `/party/[slug]` (themed, mobile-first)
- RSVP form: yes/maybe/no, parent + kid names, counts, allergy + private + public notes
- Admin RSVP table with summary cards (yes/maybe/no, kid/adult totals, allergy count)
- CSV export of RSVPs with all spec columns
- Publish/unpublish toggle, draft mode
- 9 themes (Default / Beach / Princess / Woodland / Space / Rainbow / Science / Garden Tea / Arcade / Dinosaur)

**Phase 2 — Delight Layer**
- Note wall: guest birthday wishes with admin moderation
- Confetti animation on RSVP submit
- Add to Google Calendar + .ics download
- Magic-link RSVP edits (no account required)
- Resend confirmation emails (guest + host) — opt-in via env var
- Mobile sticky RSVP bar
- Tap-to-call / tap-to-maps on guest details

**v2 spec — Guest Messaging**
- Messages tab: copy filtered email lists (all/yes/maybe/no) in three formats (comma / line / `Name <email>`)
- 3 prewritten message templates (reminder / update / weather) auto-filled with party link
- Download emails as CSV

## Routes

Public:
- `/` — landing
- `/login` — Google OAuth
- `/party/[slug]` — public invite
- `/party/[slug]/rsvp/thanks` — confirmation
- `/party/[slug]/rsvp/edit/[token]` — guest RSVP edit

Admin (gated by middleware + email allowlist):
- `/admin` — party list
- `/admin/party/new` — create
- `/admin/party/[id]` — manage (Details / Images / RSVPs / Notes / Messages / Settings tabs)
- `/admin/party/[id]/preview` — preview unpublished page

## Privacy

- Party pages live at unguessable slugs (e.g. `/party/sophia-7-x8k2m`).
- Public pages never expose guest emails, phone numbers, or private notes.
- Note wall messages require admin approval before they show publicly.
- Image uploads are admin-only; guest uploads are not in MVP.
- Storage RLS scopes uploads to the party's host user.

## Future work (Phase 3)

- Reminder emails (cron job for guests who haven't RSVP'd)
- Password-protected parties
- Guest photo gallery (post-party)
- Print-friendly party checklist (favors, food, snacks)
- Native send from Messages panel
