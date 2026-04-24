# Phase 7: PWA Polish

> **Depends on:** All prior phases (1-6)
> **Enables:** Final v1 release; trak installable and reliable on iOS/Android
>
> See: [Full Plan](../plan.md)

## Goal

Make trak feel like a real installable app. Write a hand-rolled service worker that caches the app shell and handles offline asset fallback. Polish the install flow, offline UX, and sync-issues surfaces.

## Key Deliverables

- Hand-written service worker (`public/sw.js`) — no Workbox, no `vite-plugin-pwa`
- Properly configured `manifest.webmanifest` with icons in all required sizes
- Install guidance for iOS ("Add to Home Screen") and Android
- Offline banner shown when network is down
- "Sync issues" inbox for queue entries that hit a permanent 4xx
- Reconnect toast ("X updates synced") after queue drains
- End-to-end testing on real iPhone and Android devices

## Files to Create

**Frontend:**
- `frontend/public/sw.js` — The service worker
- `frontend/public/manifest.webmanifest` — Proper PWA manifest
- `frontend/public/icon-*.png` — Icon set: 192, 512, 180 (Apple), 72, 96, 144, 256
- `frontend/public/offline.html` — Fallback page if SW can't serve a route
- `frontend/src/main.tsx` — Register the SW
- `frontend/src/sync/swMessages.ts` — postMessage contract between app ↔ SW
- `frontend/src/components/layout/OfflineBanner.tsx`
- `frontend/src/components/layout/ReconnectToast.tsx`
- `frontend/src/routes/settings/SyncIssuesPage.tsx` — Lists permanent-failure queue entries with "Retry" and "Discard" buttons
- `frontend/src/routes/settings/SettingsPage.tsx` — Minimal: version, install guide links, sign out, sync issues
- `frontend/src/features/install/useInstallPrompt.ts` — Handles `beforeinstallprompt` on Android

**Icon generation:**
- `scripts/generate_icons.sh` — Script taking a master 1024×1024 icon and emitting all needed sizes (optional convenience)

## Dependencies

**Internal:** All previous phases — this phase wraps them.

**External:** None.

## Implementation Notes

### Service worker design

Scope: `/` — serves the whole app.

Cache strategy:

- **App shell (`/`, `/index.html`, built JS/CSS bundles):** cache-first. Pre-cache on `install` event. Serve from cache, fall back to network.
- **Static assets (fonts, icons):** cache-first with network fallback. Populated lazily.
- **API requests (`/api/v1/*`):** **network-only**. The SW does *not* cache API responses — `localStore` is our client-side API cache. The SW just lets requests pass through. If offline, the request fails as normal and the sync layer handles it.
- **Navigation requests:** network-first with cache fallback to `/index.html` (SPA fallback).

Cache versioning:
- `const CACHE_NAME = 'trak-v{buildVersion}';`
- On `activate`, delete any caches not matching `CACHE_NAME`
- `buildVersion` is injected at build time via Vite env (`VITE_BUILD_VERSION`)

Service worker outline:

```javascript
const CACHE_NAME = 'trak-v__BUILD_VERSION__';
const APP_SHELL = ['/', '/index.html', /* injected at build time */];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(APP_SHELL))
  );
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((names) =>
      Promise.all(names.filter((n) => n !== CACHE_NAME).map((n) => caches.delete(n)))
    )
  );
  self.clients.claim();
});

self.addEventListener('fetch', (event) => {
  const url = new URL(event.request.url);

  // API: pass through, no caching
  if (url.pathname.startsWith('/api/')) return;

  // Navigation: network-first with index.html fallback
  if (event.request.mode === 'navigate') {
    event.respondWith(
      fetch(event.request).catch(() => caches.match('/index.html'))
    );
    return;
  }

  // Static: cache-first
  event.respondWith(
    caches.match(event.request).then(
      (cached) => cached || fetch(event.request).then((res) => {
        const copy = res.clone();
        caches.open(CACHE_NAME).then((cache) => cache.put(event.request, copy));
        return res;
      })
    )
  );
});
```

Target: ~80-120 LOC total in `sw.js`.

### Build integration

Vite plugin to inject `APP_SHELL` list and `BUILD_VERSION` into `sw.js` during build. Simple plugin, ~30 LOC, lives in `vite.config.ts` or a tiny local file.

Alternative: use Vite's `transformIndexHtml` + a raw text-replacement approach in the output `sw.js`.

### Manifest

```json
{
  "name": "trak",
  "short_name": "trak",
  "description": "Workout tracker",
  "start_url": "/",
  "display": "standalone",
  "background_color": "#ffffff",
  "theme_color": "#000000",
  "orientation": "portrait",
  "icons": [
    { "src": "/icon-192.png", "sizes": "192x192", "type": "image/png" },
    { "src": "/icon-512.png", "sizes": "512x512", "type": "image/png" },
    { "src": "/icon-512.png", "sizes": "512x512", "type": "image/png", "purpose": "maskable" }
  ]
}
```

Apple-specific:
- `<link rel="apple-touch-icon" href="/icon-180.png">` in index.html
- `<meta name="apple-mobile-web-app-capable" content="yes">`
- `<meta name="apple-mobile-web-app-status-bar-style" content="default">`

### Offline banner

- Uses `useOnlineStatus()` from Phase 3
- Renders a top-of-screen slim banner when offline: "Offline — your logs are safe"
- Fades in/out with a short transition

### Reconnect toast

- Triggered by `useSyncStatus` going from `pending > 0` to `pending === 0` while online
- Toast: "X updates synced" (where X = number of successful drains since the last notification)
- Don't show if `X === 0`

### Sync issues

- A queue entry that hits a permanent 4xx (not 401) is marked failed
- `SyncIssuesPage` lists them with:
  - Description of the action ("Log set on Bench Press, 2025-06-03")
  - Error message from server
  - "Retry" button (requeues)
  - "Discard" button (removes from queue, loses the change)
- Icon badge on settings tab if there are any failed entries

### Install prompt

- Android: listen for `beforeinstallprompt`, stash the event, show a subtle "Install trak" button in settings. On tap, call `.prompt()`.
- iOS: no programmatic install prompt available. Show a static guide in Settings: "On iPhone, tap the share button and choose 'Add to Home Screen'."

### Testing checklist

Real-device testing required for this phase, not just desktop Chrome:
- iPhone (Safari + installed PWA)
- Android (Chrome + installed PWA)
- Offline toggles (airplane mode)
- Cold-start from home screen
- Background/foreground app switches (iOS can unload PWA quickly; confirm state recovery)
- Update flow: deploy a new version, confirm old SW is replaced

### Update flow UX

When a new SW is available:
- Show a small banner: "Update available — tap to refresh"
- On tap, `skipWaiting()` via postMessage, then reload
- Don't force-update silently; let the user finish their set first

## Validation

- [ ] App installs on iPhone via "Add to Home Screen"; launches standalone
- [ ] App installs on Android via install prompt; launches standalone
- [ ] Going offline: `OfflineBanner` appears; existing cached routes still navigate
- [ ] Going online after logging offline: reconnect toast shows count of synced updates
- [ ] A deliberately broken PUT (e.g., forged payload) surfaces in SyncIssuesPage
- [ ] Retry button in SyncIssuesPage re-queues the entry
- [ ] Discard button removes the entry and clears the badge
- [ ] Deploying a new version: existing users see the update banner; tapping it reloads with new SW
- [ ] SW cache stays under a few MB
- [ ] App shell loads offline after first visit (cold start from home screen)
- [ ] API requests are NOT cached by the SW (verify via DevTools → Network → offline → API call fails as expected)
