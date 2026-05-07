# Per-party setup (~5 min)

Each party = one Google Sheet + one Apps Script web app + one row in `src/config/parties.ts`.

## 1. Make the Sheet

1. https://sheets.new — creates a fresh blank Google Sheet
2. Rename it something like "Sophia's 7th Birthday — RSVPs"

## 2. Add the Apps Script

1. In the sheet: **Extensions → Apps Script**
2. Delete the default `function myFunction() {...}`
3. Open [`apps-script/Code.gs`](Code.gs) in this repo, copy the whole file, paste it into the Apps Script editor
4. Hit the disk icon to **Save** (name the project something like "Sophia 7 RSVPs" — doesn't matter what)

## 3. Initialize the tabs

1. In the Apps Script editor, the function dropdown (top toolbar) shows `setupSheet`
2. Click **Run**
3. First run: it will ask for permission to access your Sheet + send mail. Grant it (you may have to click **Advanced → Go to <project name> (unsafe)** because the script is unverified — it's *your* script, not really unsafe)
4. Switch back to the Sheet tab. You should see three new tabs: **Settings**, **RSVPs**, **Notes**

## 4. Fill in party details

In the **Settings** tab, edit the `Value` column. Required:

- `birthday_child_name`, `birthday_age`, `party_title`
- `date` (YYYY-MM-DD), `start_time` (HH:MM, 24h), `end_time` (HH:MM, 24h)
- `location_name`, `location_address`
- `theme` (one of: `default`, `beach`, `princess`, `woodland`, `space`, `rainbow`, `science`, `garden-tea`, `arcade`, `dinosaur`)

Optional but nice:
- `description`, `rsvp_deadline`, `gift_note`, `food_note`, `rain_plan`, `host_email` (for new-RSVP notifications), `host_phone`, `hero_image_url`, `profile_image_url`

`hero_image_url` and `profile_image_url`: paste a public image URL. Easiest is to upload to Google Drive → right-click → Share → Anyone with the link → grab the file ID and use `https://drive.google.com/uc?id=FILE_ID`. Or use Imgur, or any image host.

## 5. Deploy as Web App

1. In the Apps Script editor: **Deploy → New deployment**
2. Click the gear ⚙️ next to "Select type" → **Web app**
3. Description: anything (e.g. "Sophia 7 RSVP endpoint")
4. **Execute as: Me** (so it can write to your Sheet + send mail as you)
5. **Who has access: Anyone** (so guests can submit RSVPs without signing in)
6. Click **Deploy**
7. **Copy the Web app URL** — it looks like `https://script.google.com/macros/s/AKfy.../exec`

## 6. Wire up the frontend

Open [`src/config/parties.ts`](../src/config/parties.ts) and add an entry:

```ts
{
  slug: "sophia-7",
  scriptUrl: "https://script.google.com/macros/s/AKfy.../exec",
}
```

Pick any slug — it'll be the URL: `partypost.vercel.app/party/sophia-7`.

Commit + push. Vercel auto-deploys in ~30s. Done.

## Updating party details later

Just edit the Settings tab in the Sheet. Changes show up on the public page within ~1 minute (Next.js ISR cache).

If you change the **Apps Script code** (e.g. you pulled a new version of `Code.gs` from this repo): **Deploy → Manage deployments → ✏️ pencil → Version: New version → Deploy**. The Web app URL stays the same. If you create a *new deployment* instead, the URL changes and you'll need to update `parties.ts`.

## Where the data lives

- **Settings** tab — party config (date, location, theme, image URLs). Edit any cell to change the public page; changes show up within ~1 minute.
- **RSVPs** tab — one row per guest who RSVPs. Sort, filter, add SUMIF formulas, whatever you want.
- **Notes** tab — birthday wishes. New ones land with `is_approved=TRUE` automatically (kid party, no moderation needed).
- **Invitations** tab — the guest list you're sending invites to (see below).
- **CSV export**: File → Download → CSV (it's already a spreadsheet).
- **Email guests**: filter the RSVPs tab by status → copy the email column.

## Sending invitations (optional)

The Apps Script can email personalized invitations and track who opens / clicks / RSVPs.

### One-time setup

1. In the Sheet's **Settings** tab, fill in the `slug` row with your party's slug (e.g. `sophia-7`) — same value you use in `parties.ts`. The script needs this to build the invitation URL.

### Each time you want to invite people

1. Open the Sheet → **Invitations** tab
2. Add one row per guest. **Only fill in `name` and `email`** — leave everything else blank, the script populates them.
3. Open the Apps Script editor (Extensions → Apps Script) → in the function dropdown at the top, pick **`sendPendingInvitations`** → click ▶ Run
4. The script sends one personalized email per row that doesn't have `sent_at` yet. Each email contains a link like `partypost.vercel.app/party/sophia-7?i=<TOKEN>` plus a 1×1 tracking pixel.

### What gets tracked

After sending, the Invitations row updates as guests interact:

- `sent_at` — set when the email goes out
- `opened_at` — set when the email is opened (best-effort; depends on the email client loading remote images)
- `clicked_at` — set when the guest taps the link in the email and lands on the party page
- `rsvp_id` — set when the guest submits the RSVP form (links the invitation row to the RSVPs row)

### Re-sending

If you add more rows to the Invitations tab later and run `sendPendingInvitations` again, only the new rows (without `sent_at`) get emailed.

To re-send to someone, clear their `sent_at` cell and run `sendPendingInvitations` again.

## Troubleshooting

- **"Authorization required" when running setupSheet**: click through the warning. It's *your* script accessing *your* sheet — Google just doesn't know that.
- **RSVPs not arriving**: check the Apps Script editor → Executions tab for errors. Common causes: tab names changed, headers edited.
- **Email confirmations not sending**: Apps Script free quota is ~100 emails/day from a personal Gmail account. Plenty for kids' parties. If quota's hit, RSVPs still save — just no email goes out.
