import { useSyncExternalStore } from "react";
import { queue } from "@/sync/queue";

type SyncStatus = {
  pendingCount: number;
  failedCount: number;
};

let cachedStatus: SyncStatus | null = null;

function getSnapshot(): SyncStatus {
  if (cachedStatus === null) {
    cachedStatus = {
      pendingCount: queue.pending().length,
      failedCount: queue.failed().length,
    };
  }
  return cachedStatus;
}

const listeners = new Set<() => void>();

queue.subscribe(() => {
  cachedStatus = null;
  for (const cb of listeners) cb();
});

function subscribe(cb: () => void): () => void {
  listeners.add(cb);
  return () => listeners.delete(cb);
}

export function useSyncStatus(): SyncStatus {
  return useSyncExternalStore(subscribe, getSnapshot, getSnapshot);
}
