// Local cache of resource records keyed by id. Backed by localStorage,
// kept in memory as Maps for fast reads. UI components subscribe per
// resource; subscribers fire on any change.
//
// list() returns a stable array reference between mutations. This is
// required for useSyncExternalStore snapshots — returning a fresh array
// per call would trigger React's "infinite loop" detection.

export type Resource =
  | "exercises"
  | "routines"
  | "sessions"
  | "session_exercises"
  | "sets"
  | "body_measurements"
  | "goals";

type RecordWithId = { id: string };

const STORAGE_KEY = (resource: Resource) => `trak.data.${resource}`;

const cache: Partial<Record<Resource, Map<string, unknown>>> = {};
const arrayCache: Partial<Record<Resource, unknown[]>> = {};
const listeners: Partial<Record<Resource, Set<() => void>>> = {};

function getBucket(resource: Resource): Map<string, unknown> {
  if (!cache[resource]) {
    const raw = localStorage.getItem(STORAGE_KEY(resource));
    const obj = raw ? (JSON.parse(raw) as Record<string, unknown>) : {};
    cache[resource] = new Map(Object.entries(obj));
  }
  return cache[resource]!;
}

function persist(resource: Resource): void {
  const bucket = cache[resource];
  if (!bucket) return;
  const obj = Object.fromEntries(bucket);
  localStorage.setItem(STORAGE_KEY(resource), JSON.stringify(obj));
}

function notify(resource: Resource): void {
  delete arrayCache[resource];
  const set = listeners[resource];
  if (!set) return;
  for (const cb of set) cb();
}

export const localStore = {
  get<T>(resource: Resource, id: string): T | null {
    return (getBucket(resource).get(id) as T) ?? null;
  },

  // Returns a stable array reference between mutations. Don't pass a
  // filter from a useSyncExternalStore snapshot — filter at the caller
  // via useMemo. The unfiltered array is cached and reused.
  list<T>(resource: Resource, filter?: (r: T) => boolean): T[] {
    if (!arrayCache[resource]) {
      arrayCache[resource] = Array.from(getBucket(resource).values());
    }
    const items = arrayCache[resource] as T[];
    return filter ? items.filter(filter) : items;
  },

  put<T extends RecordWithId>(resource: Resource, record: T): void {
    getBucket(resource).set(record.id, record);
    persist(resource);
    notify(resource);
  },

  bulkPut<T extends RecordWithId>(resource: Resource, records: T[]): void {
    const bucket = getBucket(resource);
    for (const r of records) bucket.set(r.id, r);
    persist(resource);
    notify(resource);
  },

  remove(resource: Resource, id: string): void {
    const bucket = getBucket(resource);
    if (bucket.delete(id)) {
      persist(resource);
      notify(resource);
    }
  },

  // Replace the entire bucket. Used after a hydrating fetch (e.g.
  // GET /api/v1/sessions) to reflect server truth.
  replace<T extends RecordWithId>(resource: Resource, records: T[]): void {
    cache[resource] = new Map(records.map((r) => [r.id, r as unknown]));
    persist(resource);
    notify(resource);
  },

  subscribe(resource: Resource, cb: () => void): () => void {
    if (!listeners[resource]) listeners[resource] = new Set();
    listeners[resource]!.add(cb);
    return () => listeners[resource]!.delete(cb);
  },

  // Wipe all cached data buckets. Auth + queue preserved.
  clearAll(): void {
    for (const key of Object.keys(cache) as Resource[]) {
      cache[key] = new Map();
      localStorage.removeItem(STORAGE_KEY(key));
      notify(key);
    }
  },
};
