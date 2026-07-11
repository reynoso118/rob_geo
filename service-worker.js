/* Robert & Geo Take On Yellowstone & Grand Teton — service worker
   Cache-first app shell so the itinerary, route map, and photos stay
   available with no signal. Third-party map links are never cached —
   they simply pass through to the network and fail offline as expected. */

const CACHE_VERSION = "v1";
const CACHE_NAME = "yellowstone-2026-" + CACHE_VERSION;

// Paths are relative to this file's location so the app works correctly
// when hosted from a GitHub Pages project subdirectory, e.g.
// https://USERNAME.github.io/yellowstone-2026/
const PRECACHE_URLS = [
  "./",
  "./index.html",
  "./404.html",
  "./manifest.webmanifest",
  "./assets/css/styles.css",
  "./assets/js/app.js",
  "./assets/data/itinerary.json",
  "./assets/icons/icon-192.png",
  "./assets/icons/icon-512.png",
  "./assets/icons/icon-512-maskable.png",
  "./assets/icons/apple-touch-icon.png",
  "./assets/icons/favicon.svg",
  "./assets/images/route-map.png",
  "./assets/images/hero.svg",
  "./assets/images/grand-teton.svg",
  "./assets/images/yellowstone-lake.svg",
  "./assets/images/grand-prismatic.svg",
  "./assets/images/lamar-valley.svg",
  "./assets/images/mammoth-hot-springs.svg",
  "./assets/images/artist-point.svg",
];

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => cache.addAll(PRECACHE_URLS))
      .then(() => self.skipWaiting())
  );
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys()
      .then((names) => Promise.all(
        names.filter((n) => n.startsWith("yellowstone-2026-") && n !== CACHE_NAME)
          .map((n) => caches.delete(n))
      ))
      .then(() => self.clients.claim())
  );
});

self.addEventListener("fetch", (event) => {
  const req = event.request;

  if (req.method !== "GET") return;

  const url = new URL(req.url);
  if (url.origin !== self.location.origin) return; // never cache third-party requests (maps, etc.)

  // HTML navigations: network-first so updates are picked up, falling back
  // to the cached shell when offline.
  if (req.mode === "navigate") {
    event.respondWith(
      fetch(req)
        .then((res) => {
          const copy = res.clone();
          caches.open(CACHE_NAME).then((cache) => cache.put(req, copy));
          return res;
        })
        .catch(() => caches.match(req).then((res) => res || caches.match("./index.html")))
    );
    return;
  }

  // Everything else in scope: cache-first, then network, then cache the result.
  event.respondWith(
    caches.match(req).then((cached) => {
      if (cached) return cached;
      return fetch(req).then((res) => {
        if (res && res.ok) {
          const copy = res.clone();
          caches.open(CACHE_NAME).then((cache) => cache.put(req, copy));
        }
        return res;
      }).catch(() => cached);
    })
  );
});

self.addEventListener("message", (event) => {
  if (event.data === "skipWaiting") self.skipWaiting();
});
