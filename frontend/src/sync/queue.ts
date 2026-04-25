// Append-only queue of pending mutations. The sync worker drains this
// FIFO; entries that hit a permanent 4xx are flagged failed and surface
// in a "sync issues" UI.

import { uuid } from "@/lib/uuid";

export type QueueEntry = {
  id: string;
  method: "PUT" | "DELETE";
  path: string;
  body?: unknown;
  createdAt: string;
  attempts: number;
  lastError?: string;
  failed?: boolean;
};

const STORAGE_KEY = "trak.sync.queue";

let memo: QueueEntry[] | null = null;
const listeners = new Set<() => void>();

function readEntries(): QueueEntry[] {
  if (memo) return memo;
  const raw = localStorage.getItem(STORAGE_KEY);
  memo = raw ? (JSON.parse(raw) as QueueEntry[]) : [];
  return memo;
}

function persist(): void {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(readEntries()));
  for (const cb of listeners) cb();
}

export const queue = {
  enqueue(method: QueueEntry["method"], path: string, body?: unknown): QueueEntry {
    const entry: QueueEntry = {
      id: uuid(),
      method,
      path,
      body,
      createdAt: new Date().toISOString(),
      attempts: 0,
    };
    readEntries().push(entry);
    persist();
    return entry;
  },

  pending(): QueueEntry[] {
    return readEntries().filter((e) => !e.failed);
  },

  failed(): QueueEntry[] {
    return readEntries().filter((e) => e.failed);
  },

  all(): QueueEntry[] {
    return [...readEntries()];
  },

  remove(id: string): void {
    const entries = readEntries();
    const idx = entries.findIndex((e) => e.id === id);
    if (idx >= 0) {
      entries.splice(idx, 1);
      persist();
    }
  },

  markRetryable(id: string, error: string): void {
    const entry = readEntries().find((e) => e.id === id);
    if (!entry) return;
    entry.attempts++;
    entry.lastError = error;
    persist();
  },

  markFailed(id: string, error: string): void {
    const entry = readEntries().find((e) => e.id === id);
    if (!entry) return;
    entry.failed = true;
    entry.lastError = error;
    persist();
  },

  // User-triggered retry of a permanently-failed entry.
  retry(id: string): void {
    const entry = readEntries().find((e) => e.id === id);
    if (!entry) return;
    entry.failed = false;
    entry.attempts = 0;
    entry.lastError = undefined;
    persist();
  },

  // User-triggered discard of a failed entry.
  discard(id: string): void {
    this.remove(id);
  },

  subscribe(cb: () => void): () => void {
    listeners.add(cb);
    return () => listeners.delete(cb);
  },

  clear(): void {
    memo = [];
    persist();
  },
};
