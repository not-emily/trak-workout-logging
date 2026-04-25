// Drains the sync queue FIFO. Runs one request at a time so writes
// preserve order (a Set's session_exercise must be created before the
// Set itself). Backs off exponentially on network/5xx errors. Marks
// 4xx responses (except 401) as permanently failed.

import { apiClient, onApiEvent } from "./apiClient";
import { ApiError } from "@/types/api";
import { queue } from "./queue";

const BACKOFF_MS = [1000, 5000, 30000, 120000, 600000];

let inFlight = false;
let timer: ReturnType<typeof setTimeout> | null = null;
let paused = false;

function scheduleNext(delay = 0): void {
  if (timer) clearTimeout(timer);
  timer = setTimeout(drain, delay);
}

async function drain(): Promise<void> {
  if (inFlight || paused || !navigator.onLine) return;
  const next = queue.pending()[0];
  if (!next) return;

  inFlight = true;
  try {
    if (next.method === "PUT") {
      await apiClient.put(next.path, next.body);
    } else {
      await apiClient.delete(next.path);
    }
    queue.remove(next.id);
    scheduleNext(0); // chain immediately to drain remaining
  } catch (err) {
    if (err instanceof ApiError) {
      if (err.status === 401) {
        // apiClient already cleared the token + emitted 'unauthorized'.
        // Worker pauses; resumes after re-auth.
        paused = true;
      } else if (err.status >= 400 && err.status < 500) {
        // Permanent client error. Mark failed, continue with next entry.
        queue.markFailed(next.id, err.body?.error ?? `HTTP ${err.status}`);
        scheduleNext(0);
      } else {
        // 5xx: retry with backoff
        queue.markRetryable(next.id, err.body?.error ?? `HTTP ${err.status}`);
        scheduleNext(BACKOFF_MS[Math.min(next.attempts, BACKOFF_MS.length - 1)]);
      }
    } else {
      // Network failure
      queue.markRetryable(next.id, err instanceof Error ? err.message : "network error");
      scheduleNext(BACKOFF_MS[Math.min(next.attempts, BACKOFF_MS.length - 1)]);
    }
  } finally {
    inFlight = false;
  }
}

export const syncWorker = {
  start(): void {
    paused = false;
    scheduleNext(0);
  },

  stop(): void {
    if (timer) clearTimeout(timer);
    timer = null;
  },

  // Called from useGlobalUnauthorizedHandler. The queue stays intact —
  // when the user logs back in, resume() drains it.
  pause(): void {
    paused = true;
    if (timer) clearTimeout(timer);
    timer = null;
  },

  resume(): void {
    paused = false;
    scheduleNext(0);
  },

  // Pokes the worker — call after enqueueing a mutation or coming online.
  poke(): void {
    scheduleNext(0);
  },

  isPaused(): boolean {
    return paused;
  },
};

// Wire global lifecycle:

window.addEventListener("online", () => syncWorker.poke());
window.addEventListener("offline", () => {
  if (timer) clearTimeout(timer);
});

// 401 handling — apiClient emits this after clearing the token.
onApiEvent("unauthorized", () => {
  syncWorker.pause();
});

queue.subscribe(() => syncWorker.poke());
