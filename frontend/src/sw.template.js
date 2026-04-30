// Hand-rolled service worker for trak. The Vite build plugin
// (`buildSwPlugin` in vite.config.ts) substitutes the build-version and
// app-shell placeholder tokens at build time and emits `dist/sw.js`.
//
// Caching:
// - App shell + static assets: cache-first, populated lazily on miss.
// - Navigation: network-first, falls back to /index.html for SPA routing.
// - /api/*: pass through entirely. localStore is our API cache.
//
// Updates: a new build's SW installs to "waiting" state. The app detects
// this and shows an update banner. On user tap, the app posts
// { type: 'SKIP_WAITING' } and reloads — new SW takes control.

const CACHE_NAME = "trak-v__BUILD_VERSION__";
const APP_SHELL = __APP_SHELL__;

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(APP_SHELL)),
  );
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((names) =>
        Promise.all(
          names.filter((n) => n !== CACHE_NAME).map((n) => caches.delete(n)),
        ),
      )
      .then(() => self.clients.claim()),
  );
});

self.addEventListener("message", (event) => {
  if (event.data && event.data.type === "SKIP_WAITING") {
    self.skipWaiting();
  }
});

self.addEventListener("fetch", (event) => {
  const req = event.request;
  if (req.method !== "GET") return;
  const url = new URL(req.url);

  // API: never cached. localStore is our API cache.
  if (url.pathname.startsWith("/api/")) return;

  // Cross-origin requests pass through.
  if (url.origin !== self.location.origin) return;

  // Navigation: network-first, fall back to cached index.html so the SPA
  // can boot offline.
  if (req.mode === "navigate") {
    event.respondWith(
      fetch(req).catch(() => caches.match("/index.html")),
    );
    return;
  }

  // Static: cache-first, populate on miss.
  event.respondWith(
    caches.match(req).then(
      (cached) =>
        cached ||
        fetch(req).then((res) => {
          if (res.ok && res.type === "basic") {
            const copy = res.clone();
            caches.open(CACHE_NAME).then((cache) => cache.put(req, copy));
          }
          return res;
        }),
    ),
  );
});
