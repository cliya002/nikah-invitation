# Nikah Invitation Website

A single-file, mobile-first Nikah invitation. No build step, no dependencies beyond Google Fonts.

Guests first see a sealed gatefold envelope (rose vines, silk ribbon, wax seal). Tapping it opens the flaps to reveal the painted invitation while petals begin to fall; the Bismillah, a welcome line, and the hosts' line (if set) take turns in the panel before the names and date settle in. The rose archway carries a curtain of jasmine strands: touching the flowers fans them open with a puff of petals and shows the details button. Touching again closes it.

## Files

- `index.html` — the whole site (markup, styles, script, and the animated strands)
- `art.jpg` — the illustrated background (1080×2308): the couple seated beneath a Mughal arch at sunset. The sky inside the arch is left clear so the names and date render as live text on top of it, and the marble steps continue behind the garland pillar.
- `curtain.png` — the jasmine garland pillar cut out of the same illustration. The page slices it into thin strips that swing apart from the top when touched.
- `.nojekyll` — tells GitHub Pages to serve the folder as-is

To use different artwork, replace `art.jpg` with a 1080×2308 image (or any portrait image with the same 540:1154 proportions) whose upper middle (the sky inside the arch) is clear enough to hold the text.

## Filling in your details

Open `index.html` and edit the `CONFIG` block near the bottom of the file:

```js
const CONFIG = {
  groom: "",            // e.g. "Muhammad"
  bride: "",            // e.g. "Dr. Fatimah"
  hosts: "",            // e.g. "Mr. & Mrs. Ahmed invite you..."
  dateText: "...",      // shown on the card
  timeText: "...",
  eventISO: "",         // "2026-10-26T18:00:00" enables countdown + Add to Calendar
  venueName: "...",
  venueAddress: "",
  mapsUrl: "",          // enables the Open in Maps button
  rsvpEndpoint: "",     // Apps Script web app URL: enables the in-page RSVP form (see below)
  rsvpMaxGuests: 6,     // largest party a guest can choose
  rsvpDeadline: "",     // e.g. "15 October 2026", shown under the form
  rsvpUrl: "",          // optional "mailto:" fallback used only while rsvpEndpoint is empty
  rsvpText: "..."
};
```

Empty name strings render as blank lines. Empty URLs hide their buttons.

## RSVP tracking (Google Sheet)

Guests reply inside the invitation; every reply becomes a row in a Google Sheet you own. A "Summary" tab keeps live counts (accepting, declining, total guests). Free, no accounts beyond Google. One-time setup, about five minutes:

1. **Create the sheet.** Go to [sheets.new](https://sheets.new) and name it something like *Nikah guest list*.
2. **Add the script.** In the sheet, open **Extensions → Apps Script**. Delete the sample code, paste in the contents of [`apps-script/Code.gs`](apps-script/Code.gs) from this folder, and press **Save** (the disk icon).
3. **Test it once.** In the toolbar, choose the function `testPost` and press **Run**. Google will ask you to review permissions: pick your account, click **Advanced → Go to … (unsafe)** (it's your own script), then **Allow**. Switch back to the sheet: you should see an `RSVPs` tab with a *Test Guest* row and a `Summary` tab. Delete the test row.
4. **Deploy.** Back in Apps Script click **Deploy → New deployment**. Click the gear next to *Select type* and choose **Web app**. Set *Execute as*: **Me**, and *Who has access*: **Anyone**. Click **Deploy**, then **Copy** the *Web app URL* (it ends in `/exec`).
5. **Connect the card.** Open `index.html`, find `rsvpEndpoint` in `CONFIG`, and paste the URL between the quotes. Optionally set `rsvpMaxGuests` and `rsvpDeadline`.
6. **Try it.** Open the invitation, tap through to *View invitation details*, send yourself an RSVP, and watch the row appear.

Notes

- Opening the `/exec` URL in a browser shows `{"ok":true,...}`, which confirms the deployment is live.
- If you edit `Code.gs` later, you must **Deploy → Manage deployments → ✎ → Version: New version → Deploy** for the change to take effect. The URL stays the same.
- A guest who replies twice with the same name updates their earlier row (the *Updates* column counts how many times) so the Summary never double-counts.
- Each phone remembers that it replied and shows a thank-you with a *Change my reply* button.
- The sheet is private to your Google account; the script only ever appends rows, it never reads anything back to the website.
- The form is always visible. Until `rsvpEndpoint` is set, pressing *Send* shows a reminder that replies aren't being collected yet, or, if `rsvpUrl` is a `mailto:` address, opens the guest's email app with the reply filled in.

## Test locally

Double-click `index.html`, or from this folder:

```
python -m http.server 8000
```

then open http://localhost:8000.

## Publish to GitHub Pages

1. Create a new repo on GitHub and push this folder's contents to the `main` branch.
2. Repo Settings → Pages → Source: "Deploy from a branch", Branch: `main`, folder `/ (root)`.
3. The site will be live at `https://<username>.github.io/<repo>/` within a minute or two.
