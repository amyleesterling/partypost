# PartyPost

A **FREE** Paperless-Post-style invite site for kids' birthday parties. Each party gets a beautiful page; RSVPs land in a Google Sheet you own. No monthly bill. No accounts for guests.

**Live demo:** [partypost.vercel.app/party/sophia-7](https://partypost.vercel.app/party/sophia-7)

## How to use it

You don't need to be a developer. Open this repo in any AI assistant (Claude, ChatGPT, Cursor) and say:

> *"Help me set up PartyPost for my kid's birthday. [Name] is turning [age] on [date] at [place]. Banner image is at [path]."*

The AI walks you through forking the repo, deploying on Vercel, creating the Google Sheet, and adding the party. **~1 hour for the first party, ~10 minutes for each one after.**

You need: a Google account, a free [GitHub](https://github.com) account, a free [Vercel](https://vercel.com) account.

Click-by-click setup: [`apps-script/SETUP.md`](apps-script/SETUP.md).

## Where the data lives

Your Google Sheet's **RSVPs** tab. Sort, filter, export to CSV — all native. Edit the **Settings** tab to change anything on the public page (changes show up within a minute).

## Make it yours

Ask your AI to swap the banner, change colors, tweak wording, add a section. [`AGENTS.md`](AGENTS.md) tells the AI the rules of the road for this codebase.
