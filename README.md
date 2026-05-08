# PartyPost

![PartyPost — Free birthday-party RSVP system](public/party-post.png)

A **FREE** Paperless-Post-style invite site for kids' birthday parties. Each party gets a beautiful page; RSVPs land in a Google Sheet you own. No monthly bill. No accounts for guests.

**Live demos:**
[partypost.vercel.app/party/demo](https://partypost.vercel.app/party/demo) (a beach party)
·
[partypost.vercel.app/party/ai-party](https://partypost.vercel.app/party/ai-party) (a robot's first birthday — yes really)

You don't need to be a developer. Any AI assistant (Claude Code, ChatGPT, Cursor, etc.) can get this running for you in 10 minutes. Follow the two steps below.

---

## Step 1 — Set up the site

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https%3A%2F%2Fgithub.com%2Famyleesterling%2Fpartypost)

Click that button → connect Vercel to your GitHub → click Deploy. ~90 seconds and you've got a live site at `your-name.vercel.app`. Now paste this into your AI assistant with your own party details:

```
Use this repository to make my kid's birthday party invitation:
https://github.com/amyleesterling/partypost/tree/main

Child's name: [CHILD NAME]
Age: [AGE]
Date: [DATE]
Time: [TIME]
Location: [LOCATION]
```

The AI will walk you through creating a Google Sheet for your party, pasting the script, and pasting **one** JSON line into your Vercel Environment Variables. **No code editing.** ~10 min for the first party, ~5 min for each one after.

Click-by-click reference: [`apps-script/SETUP.md`](apps-script/SETUP.md).

---

## Step 2 — Generate a banner image

Use this prompt with any AI image generator (ChatGPT, Gemini, Midjourney, etc.). Fill in your details and pick a theme:

```
Create a birthday party invitation banner in a bright, cheerful
children's party style.

Use this party information:
Child's name: [CHILD NAME]
Age: [AGE]
Date: [DATE]
Time: [TIME]
Location: [LOCATION]

Theme: [e.g. "pirates" — or a longer custom description with
        specific elements and colors]
Favorite colors: [e.g. "pink, purple, gold"]

Design style:
Make it colorful, playful, and festive, with big glossy sticker-like
lettering, rounded shapes, cheerful party decorations, balloons,
bunting flags, confetti, and cute theme-related objects. Use bright
colors, soft shadows, thick outlines, and a polished children's
party invitation look.

Layout:
Put the title and party details near the center so they are easy to
read. Do not make the design too cluttered. Make all text large,
clear, and spelled correctly. Keep it cute, happy, and kid-friendly.
```

Save the generated image, then tell your AI to use it as the party banner.

---

## Where the data lives

Your Google Sheet's tabs:

- **Settings** — party details (title, date, location, theme, etc.). Edit any time; changes appear on the public page within ~1 minute.
- **RSVPs** — one row per RSVP. Sort, filter, COUNTIF, export to CSV — all native Sheets.
- **Invitations** — invitee tracking (sent / opened / clicked / RSVPd).
- **Notes** — birthday wishes from guests. Toggle `is_approved` to publish.

For most parties, the Sheet **is** your admin. The new `🎉 PartyPost` menu in your Sheet (added automatically when you open it) gives you one-click access to "Set up tabs", "Show Web App URL", "Send pending invitations", and a "What's left to fill in?" checklist — without ever opening the Apps Script editor again.

## Optional — Admin dashboard for sending invites

If you'd rather click buttons than edit a spreadsheet, you can deploy a one-page admin dashboard for your party (~3 min one-time setup). It lets you:

- Add an invitee by name + email (with duplicate detection)
- Bulk-paste a list of invitees
- Send invitations to everyone who hasn't received one yet
- See live status per invitee (Pending → Sent → Opened → Clicked → RSVPd)
- Approve birthday wishes with one click

Setup walkthrough: [`apps-script/SETUP.md#optional-admin-dashboard`](apps-script/SETUP.md). Skip this if your Sheet workflow is enough.

## Make it yours

Ask your AI to swap the banner, change colors, tweak wording, add a section. [`AGENTS.md`](AGENTS.md) tells the AI the rules of the road for this codebase so suggestions stay aligned with the design (no auth, no admin, no Postgres — just one Sheet per party).

---

## Accounts you'll need

To use this, you'll need three free accounts (none of them charge a cent for what we're doing):

- **[Google Drive](https://drive.google.com)** — every party needs a new Google spreadsheet that serves as the database for RSVPs.
- **[Vercel](https://vercel.com)** — hosts your party page on the public internet, free tier.
- **[GitHub](https://github.com)** — where the code lives. The Deploy button above forks the repo into your account automatically.

Sign up for any you don't already have — your AI assistant will walk you through using all three.
