# Deployment guide

## Publishing directory: repo root (not `/docs`)

This project publishes GitHub Pages from the **root of the branch**
(`/`), not the `/docs` folder. `index.html`, `manifest.webmanifest`, and
`service-worker.js` all need to live at the site root so their relative
paths resolve correctly, and this repo's `/docs` folder is already used for
plain documentation (this file, `image-attributions.md`) rather than the
published site. Keeping the two separate avoids any confusion between
"GitHub Pages source folder" and "project docs."

If you'd rather publish from `/docs` (for example, to keep `main` free of
build output in a larger project), you can restructure by moving
`index.html`, `404.html`, `manifest.webmanifest`, `service-worker.js`, and
`assets/` into a `/docs` folder and renaming the current `/docs` folder to
something like `/project-docs`. That isn't necessary here since this is a
static site with no build step — root publishing is simpler.

## Step-by-step

1. **Create a GitHub repository.**
   - Go to github.com → New repository.
   - Name it `yellowstone-2026` (or anything you like — the app uses only
     relative paths, so it works under any repository name or subpath).
   - Leave it empty (no README/license/gitignore) if you're about to push
     an existing local folder.

2. **Push this project to the repository.**
   ```bash
   cd yellowstone-2026
   git init
   git add .
   git commit -m "Initial commit: Yellowstone 2026 trip PWA"
   git branch -M main
   git remote add origin https://github.com/USERNAME/yellowstone-2026.git
   git push -u origin main
   ```

3. **Open the repository on GitHub, then go to Settings → Pages.**

4. **Under "Build and deployment", set Source to "Deploy from a branch."**

5. **Set Branch to `main` and folder to `/ (root)`, then click Save.**

6. **Wait 1–2 minutes**, then refresh the Pages settings page. GitHub shows
   the live URL once the first deployment finishes — typically:
   ```
   https://USERNAME.github.io/yellowstone-2026/
   ```

7. **Open that URL on your phone and on a desktop browser to confirm it
   loads.** The first load requires a connection; after that, the service
   worker caches the app for offline use (see the Offline caching section
   in the main README).

## Updating the live site

Every `git push` to the branch/folder configured in step 4–5 triggers a new
Pages deployment automatically — there's no separate deploy command. Give
it a minute or two after pushing, then hard-refresh the site (see "How to
force a service worker update" in the main README) to make sure you're not
looking at a stale cached copy.

## Custom domain (optional)

If you later attach a custom domain in Settings → Pages, update
`start_url` and `scope` in `manifest.webmanifest` only if you move off a
subpath — the relative paths (`./`) already used throughout this project
work the same at a domain root or in a subdirectory, so no other changes
are required.
