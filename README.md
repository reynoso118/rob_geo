# Robert & Geo Take On Yellowstone & Grand Teton

A mobile-first, installable Progressive Web App for a personal five-day
camper road trip through Grand Teton and Yellowstone (August 15–19, 2026).
Semantic HTML, modern CSS, and vanilla JavaScript — no framework, no build
step, no server, no API keys. Built to run entirely from a GitHub Pages URL
and to keep working with no signal once it's been opened once.

## Overview

- **Home** — hero, live countdown to departure, trip stats, quick links.
- **Route** — the offline master route map (a bundled screenshot), ordered
  stop list, and one-tap links into Apple Maps or Google Maps.
- **Flights** — boarding-pass-style cards for the outbound and return Delta
  flights.
- **RV rental** — Cruise America pickup/return details and a walkthrough
  checklist.
- **Days** — five collapsible day cards with timelines, highlights, "From
  the trail" notes, reservation details, cancellation policies, warnings,
  and Maps/call/reviewed actions.
- **Checklist** — 47 items across five groups (Urgent, Reservations &
  logistics, RV inspection, Packing, Daily habits), persisted per-device.
- **Reservations** — every confirmation number in one place, hidden by
  default and revealed on tap for the current browser session only.

## Screenshots

_Add screenshots here after your first deploy — a phone-width capture of
the Home section and the Days section works well. Drop image files into
`docs/` (e.g. `docs/screenshot-home.png`) and reference them from this
section with standard Markdown image syntax._

## Local preview

No build step is required. Any static file server works:

```bash
cd yellowstone-2026
python3 -m http.server 8080
# then open http://localhost:8080/ in a browser
```

Or, in VS Code, use the "Live Server" extension and open `index.html`.

Opening `index.html` directly via a `file://` URL will render the page, but
the service worker (and therefore offline support) only registers over
`http://` or `https://`, so use a local server for a full test.

## GitHub Pages deployment

Full step-by-step instructions are in [`docs/deployment.md`](docs/deployment.md).
Short version:

1. Create a GitHub repository and push this project to the `main` branch.
2. In the repository, go to **Settings → Pages**.
3. Under **Build and deployment**, set **Source** to **Deploy from a
   branch**.
4. Set **Branch** to `main` and the folder to **`/ (root)`**, then **Save**.
5. Your app will be live at:
   ```
   https://USERNAME.github.io/yellowstone-2026/
   ```

This repo publishes from the **repository root**, not `/docs` — see
[`docs/deployment.md`](docs/deployment.md) for why, and how to switch if
you'd prefer the `/docs` convention. Every path in the app (`manifest.webmanifest`,
`service-worker.js` registration, image `src` attributes, map links) is
relative, so the app works correctly whether it's hosted at a domain root
or in a `/yellowstone-2026/` subdirectory — nothing assumes the site lives
at the domain root.

## How to update the itinerary

Day content, flights, RV details, reservations, and the checklist all live
directly in `index.html` as plain HTML — edit the relevant `<section>` or
`<article class="day-card">` and the change is live on your next deploy.
Search for the day's title (e.g. `Grand Teton National Park`) to jump to
the right block.

`assets/data/itinerary.json` holds the same trip facts in a structured,
machine-readable form (dates, mileage, stops, reservations). It isn't
fetched at runtime by `app.js` — it exists as a clean data export you can
use for backups, sharing with someone building their own version, or a
future automation. If you change a fact in `index.html`, update the
matching field in `itinerary.json` too so the two stay in sync.

## How to replace images

The bundled photos are original illustrations, not photographs — see
[`docs/image-attributions.md`](docs/image-attributions.md) for why and for
suggested public-domain/Creative-Commons sources. To swap one in:

1. Save your image into `assets/images/` (WebP or a compressed JPEG,
   ideally under ~300KB).
2. Update the matching `<img src="...">` in `index.html`.
3. Update the filename in the `PRECACHE_URLS` array in `service-worker.js`
   so the service worker caches the new file instead of the old one.
4. Add a row to the attribution table in `docs/image-attributions.md`.
5. Bump `CACHE_VERSION` in `service-worker.js` (see "force a service worker
   update" below) so visitors who already installed the app pick up the
   new image.

## How to change confirmation numbers

Each confirmation/reservation number lives inside a `<span class="reveal-value" data-secret="...">` element. Update the `data-secret` attribute's
value — that's the only place each number is stored. The visible text is
always masked by JavaScript on load, so there's no separate "hidden" copy
to keep in sync.

The Wi-Fi password for the West Gate KOA works the same way (Day 4's
`day4wifi` reveal group).

To disable revealing sensitive details entirely (for example, before
making the repository public), open `assets/js/app.js` and set:

```js
const SHOW_SENSITIVE_DETAILS = false;
```

With that flag off, every "Reveal" button is disabled and confirmation
numbers/the Wi-Fi password stay masked no matter what.

## How localStorage works

The app never talks to a server — everything persists on-device:

| Data | Storage | Key prefix |
|---|---|---|
| Checklist item checked state | `localStorage` | `rg-yellowstone-<item-key>` |
| Which days are expanded | `localStorage` | `rg-yellowstone-expanded-days` |
| Which days are marked reviewed | `localStorage` | `rg-yellowstone-reviewed-<day-id>` |
| Revealed confirmation numbers | `sessionStorage` (cleared when the tab/app closes) | `rg-yellowstone-reveal-<group>` |

Clearing Safari's site data for the installed app (or using a private
window) resets all of the above. "Reset checklist" in the Checklist section
only clears checklist items, not expanded/reviewed state.

## How offline caching works

`service-worker.js` precaches the HTML, CSS, JS, manifest, icons, the route
map screenshot, and all bundled illustrations on first load. After that:

- HTML pages are served **network-first** (so you always get the latest
  content when online) and fall back to the cached copy when offline.
- Every other bundled file (CSS, JS, images, `itinerary.json`) is served
  **cache-first** for instant loads, with the network used only to fetch
  anything not yet cached.
- Third-party pages — the "Open in Maps" links and the "Official
  references" cards (NPS, Cruise America, campground sites) — are **never**
  cached and are not expected to work offline. The bundled route map image
  always works offline; live map links need a connection.

The colored dot next to the app name shows the current state: gray (not
yet cached), amber (installing offline files), green (available offline),
red (an update failed to install).

## How to force a service worker update

Browsers only check for a new service worker file when the page loads, and
even then a new version won't take over until all open tabs of the app are
closed (or you explicitly skip waiting). If you've deployed a change and
don't see it:

1. Bump the version string in `service-worker.js`:
   ```js
   const CACHE_VERSION = "v2"; // was "v1"
   ```
   This forces browsers to treat it as a new worker and re-cache everything
   under a new cache name (the old cache is deleted on activate).
2. On iPhone Safari: close the app (swipe it away from the app switcher if
   installed to the Home Screen, or fully close the Safari tab) and reopen
   it.
3. On desktop: hard-refresh (`Cmd+Shift+R` / `Ctrl+Shift+R`), or open
   DevTools → Application → Service Workers → **Update** / **Unregister**,
   then reload.

## How to test on iPhone

1. Deploy to GitHub Pages (or run a local server and access it from your
   iPhone over the same Wi-Fi network, e.g. `http://<your-computer-ip>:8080/`).
2. Open the URL in **Safari** (Add to Home Screen only works from Safari,
   not Chrome/Firefox on iOS).
3. Confirm: no horizontal scrolling, day accordions expand on tap, the
   bottom navigation sits above the home indicator (safe-area padding),
   and map/phone links open the right app.
4. Check a checklist item, background Safari, reopen it, and confirm the
   item is still checked.

## Add to iPhone Home Screen

1. Open the site in Safari.
2. Tap the **Share** icon (square with an arrow) in the toolbar.
3. Scroll down and tap **Add to Home Screen**.
4. Confirm the name ("Yellowstone") and tap **Add**.
5. Launch it from the Home Screen icon — it opens in standalone mode (no
   Safari address bar) using the theme color set in `manifest.webmanifest`.

## Privacy warning

**GitHub Pages sites are public by default.** Anyone with the URL can view
this app, including the itinerary, addresses, and (if revealed) any
confirmation numbers, unless you configure a private hosting setup instead
(GitHub Pages doesn't support authentication on its own). This project
already limits exposure by:

- Masking every confirmation number and the campground Wi-Fi password by
  default, with reveal state stored only for the current browser session.
- Never printing confirmation numbers, the Wi-Fi password, or other
  sensitive values in page metadata, headings, `<title>`, or the meta
  description used for social link previews.
- Leaving out airline ticket numbers, home addresses, and financial
  details entirely.

If you'd like the trip details to stay private, don't share the deployed
URL publicly, or move to a hosting provider that supports access control.

## License and attribution

Code and original illustrations are MIT-licensed — see [`LICENSE`](LICENSE).
The trip content itself (dates, reservations, addresses, confirmation
numbers) is personal information, not open content. Image sourcing and
licensing details are in [`docs/image-attributions.md`](docs/image-attributions.md).

## Project structure

```text
yellowstone-2026/
├── index.html
├── 404.html
├── manifest.webmanifest
├── service-worker.js
├── README.md
├── LICENSE
├── .gitignore
├── assets/
│   ├── css/styles.css
│   ├── js/app.js
│   ├── icons/            (192, 512, maskable, apple-touch, favicon)
│   ├── images/           (route map + original illustrations)
│   └── data/itinerary.json
└── docs/
    ├── image-attributions.md
    └── deployment.md
```
