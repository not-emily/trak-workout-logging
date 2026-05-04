// Read/write the JWT token in localStorage. Kept in one place so every
// call site uses the same key and we can observe changes.

const TOKEN_KEY = "trak.auth.token";
const USER_KEY = "trak.auth.user";
// Records which user the local data buckets belong to. Used to wipe the
// store when a *different* user logs in on this device. Survives clearToken.
const DATA_OWNER_KEY = "trak.data.owner";

export type AuthSnapshot = {
  token: string | null;
  user: unknown | null;
};

let cachedSnapshot: AuthSnapshot | null = null;

function readCachedUser(): unknown | null {
  const raw = localStorage.getItem(USER_KEY);
  if (!raw) return null;
  try {
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

// Stable snapshot getter for useSyncExternalStore. Must return the same
// reference between calls as long as the underlying state hasn't changed,
// or React will throw "The result of getSnapshot should be cached".
export function getAuthSnapshot(): AuthSnapshot {
  if (cachedSnapshot === null) {
    cachedSnapshot = {
      token: localStorage.getItem(TOKEN_KEY),
      user: readCachedUser(),
    };
  }
  return cachedSnapshot;
}

export function getToken(): string | null {
  return localStorage.getItem(TOKEN_KEY);
}

export function setToken(token: string): void {
  localStorage.setItem(TOKEN_KEY, token);
  emitChange();
}

export function clearToken(): void {
  localStorage.removeItem(TOKEN_KEY);
  localStorage.removeItem(USER_KEY);
  emitChange();
}

export function getCachedUser(): unknown | null {
  return readCachedUser();
}

export function setCachedUser(user: unknown): void {
  localStorage.setItem(USER_KEY, JSON.stringify(user));
  emitChange();
}

export function getDataOwner(): string | null {
  return localStorage.getItem(DATA_OWNER_KEY);
}

export function setDataOwner(userId: string): void {
  localStorage.setItem(DATA_OWNER_KEY, userId);
}

export function clearDataOwner(): void {
  localStorage.removeItem(DATA_OWNER_KEY);
}

// --- Subscription ---

type Listener = () => void;
const listeners = new Set<Listener>();

function emitChange() {
  cachedSnapshot = null;
  for (const cb of listeners) cb();
}

export function subscribeAuth(cb: Listener): () => void {
  listeners.add(cb);
  return () => listeners.delete(cb);
}

// Sync across tabs
window.addEventListener("storage", (e) => {
  if (e.key === TOKEN_KEY || e.key === USER_KEY) emitChange();
});
