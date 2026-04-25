// Bump SCHEMA_VERSION whenever the local cache shape changes incompatibly.
// On mismatch, all trak.data.* keys are cleared on boot. The sync queue
// is preserved so unsynced writes aren't lost.

export const SCHEMA_VERSION = 1;

const VERSION_KEY = "trak.sync.schemaVersion";

export function checkAndMigrateSchema(): void {
  const stored = localStorage.getItem(VERSION_KEY);
  const current = stored ? Number.parseInt(stored, 10) : 0;
  if (current === SCHEMA_VERSION) return;

  // Wipe data caches; preserve the queue and auth.
  for (let i = localStorage.length - 1; i >= 0; i--) {
    const key = localStorage.key(i);
    if (key && key.startsWith("trak.data.")) localStorage.removeItem(key);
  }
  localStorage.setItem(VERSION_KEY, String(SCHEMA_VERSION));
}
