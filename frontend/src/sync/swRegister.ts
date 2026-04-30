// Registers the production service worker (built from `src/sw.template.js`
// by the trak-sw Vite plugin → `dist/sw.js`).
//
// Skipped during dev (no SW file is emitted) and in browsers without
// service worker support. Update-detection wiring lives here so the app
// has a single source of truth for "is a new SW waiting?" — the UI in
// step 6 will subscribe to `swUpdateStore`.

let waitingWorker: ServiceWorker | null = null;
const listeners = new Set<() => void>();

function notify(): void {
  for (const cb of listeners) cb();
}

export const swUpdateStore = {
  subscribe(cb: () => void): () => void {
    listeners.add(cb);
    return () => listeners.delete(cb);
  },
  hasUpdate(): boolean {
    return waitingWorker !== null;
  },
  // Tells the waiting SW to activate immediately, then reloads so the new
  // version takes control. Call from the update banner's "Refresh" button.
  applyUpdate(): void {
    if (!waitingWorker) return;
    waitingWorker.postMessage({ type: "SKIP_WAITING" });
    // The new SW activates → controllerchange fires → reload below.
  },
};

export function registerServiceWorker(): void {
  if (!import.meta.env.PROD) return;
  if (!("serviceWorker" in navigator)) return;

  window.addEventListener("load", () => {
    navigator.serviceWorker
      .register("/sw.js")
      .then((registration) => {
        // If a waiting worker is already there at registration time, it's
        // an update from a previous session that the user never accepted.
        if (registration.waiting) {
          waitingWorker = registration.waiting;
          notify();
        }

        registration.addEventListener("updatefound", () => {
          const next = registration.installing;
          if (!next) return;
          next.addEventListener("statechange", () => {
            if (next.state === "installed" && navigator.serviceWorker.controller) {
              // A new SW is installed and an old one is in control —
              // surface the "update available" state.
              waitingWorker = next;
              notify();
            }
          });
        });
      })
      .catch((err) => {
        console.error("[sw] registration failed", err);
      });

    // Fired when the active SW changes (i.e., a skipWaiting + activate
    // completed). Reload once so the new bundle's references take effect.
    let reloaded = false;
    navigator.serviceWorker.addEventListener("controllerchange", () => {
      if (reloaded) return;
      reloaded = true;
      window.location.reload();
    });
  });
}
