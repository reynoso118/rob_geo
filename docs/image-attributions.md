# Image attributions

## Route map

| File | Subject | Source | License / notes |
|---|---|---|---|
| `assets/images/route-map.png` | Screenshot of the full Salt Lake City → Alpine → Grand Teton → Yellowstone → West Yellowstone → Salt Lake City driving loop | Google Maps, captured by Robert for personal trip planning | Personal screenshot, used here as the offline reference map for this specific trip. Map data © Google, used under fair-use/personal-reference terms for a non-commercial screenshot embedded in a personal itinerary. |

## Illustrated scenes

This build environment's outbound network access does not reach photo hosts
(Wikimedia Commons, NPS.gov, Unsplash, Library of Congress, etc. all returned
policy-blocked connections when this project was generated), so the seven
scenic images below are **original vector illustrations** created for this
project instead of photographs. This avoids the far worse alternative of
using unlicensed or placeholder stock photography.

| File | Subject | Source | License |
|---|---|---|---|
| `assets/images/hero.svg` | Camper van on a mountain road at sunset | Original illustration, created for this project | MIT (same as repository code) |
| `assets/images/grand-teton.svg` | Teton range reflected at Oxbow Bend | Original illustration, created for this project | MIT |
| `assets/images/yellowstone-lake.svg` | Yellowstone Lake at midday | Original illustration, created for this project | MIT |
| `assets/images/grand-prismatic.svg` | Grand Prismatic Spring, aerial view | Original illustration, created for this project | MIT |
| `assets/images/lamar-valley.svg` | Lamar Valley grassland with bison silhouettes | Original illustration, created for this project | MIT |
| `assets/images/mammoth-hot-springs.svg` | Travertine terraces at Mammoth | Original illustration, created for this project | MIT |
| `assets/images/artist-point.svg` | Grand Canyon of the Yellowstone from Artist Point | Original illustration, created for this project | MIT |
| `assets/icons/*.png`, `assets/icons/favicon.svg` | Mountain/sun app emblem | Original illustration, created for this project | MIT |

## Swapping in real photography

If you'd like real photographs instead of the illustrations, the National
Park Service and Wikimedia Commons both publish public-domain and
Commons-licensed images that are appropriate for this kind of project:

- NPS Yellowstone media gallery: `https://www.nps.gov/yell/learn/photosmultimedia/index.htm`
- NPS Grand Teton media gallery: `https://www.nps.gov/grte/learn/photosmultimedia/index.htm`
- Wikimedia Commons category search for "Yellowstone National Park" and
  "Grand Teton National Park" at `https://commons.wikimedia.org/`
- Library of Congress: `https://www.loc.gov/photos/`

When you add a real photo:

1. Save it into `assets/images/` using the same filename referenced in
   `index.html` (e.g. replace `hero.svg` with `hero.jpg`, then update the
   one `<img src="...">` reference in `index.html` and the matching entry
   in `service-worker.js`'s `PRECACHE_URLS` list).
2. Confirm the license permits reuse (NPS and most federal photography is
   public domain; Commons images typically require attribution — check the
   file's license tag).
3. Add a row to the table above with the filename, subject, photographer or
   source, source page URL, license, and required attribution text.
4. Keep the file under ~300KB where possible (convert to WebP or a
   well-compressed JPEG) so the installed app stays quick to cache.

## Fonts

No web fonts are loaded. The app uses the system font stacks
(`-apple-system`/Segoe UI/Roboto for body text, Georgia/Palatino for
display headings) so there is nothing to license or attribute, and nothing
to fetch from a CDN.
