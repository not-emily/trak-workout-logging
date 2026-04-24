// Read/write the JWT token in localStorage. Kept in one place so every
// call site uses the same key and we can observe changes.

const TOKEN_KEY = "trak.auth.token";
const USER_KEY = "trak.auth.user";

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
  const raw = localStorage.getItem(USER_KEY);
  if (!raw) return null;
  try {
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

export function setCachedUser(user: unknown): void {
  localStorage.setItem(USER_KEY, JSON.stringify(user));
  emitChange();
}

// --- Subscription ---
// Emits whenever the token or cached user changes. Used by useAuth.

type Listener = () => void;
const listeners = new Set<Listener>();

function emitChange() {
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
