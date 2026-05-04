import { useCallback, useEffect, useSyncExternalStore } from "react";
import { apiClient, onApiEvent } from "@/sync/apiClient";
import {
  clearDataOwner,
  clearToken,
  getAuthSnapshot,
  getDataOwner,
  setCachedUser,
  setDataOwner,
  setToken,
  subscribeAuth,
} from "@/sync/authStorage";
import { localStore } from "@/sync/localStore";
import { queue } from "@/sync/queue";
import { syncWorker } from "@/sync/syncWorker";
import type { ApiSuccess } from "@/types/api";
import type { AuthResponse, User } from "@/types/user";

// On login/signup: if the local data buckets belong to a *different* user
// than the one who just authenticated, wipe everything so we don't leak
// records across users on a shared device. If it's the same user re-logging
// in (e.g. after token expiry), keep their data so offline writes survive.
function reconcileLocalDataForUser(newUserId: string): void {
  const prevOwner = getDataOwner();
  if (prevOwner !== null && prevOwner !== newUserId) {
    queue.clear();
    localStore.clearAll();
  }
  setDataOwner(newUserId);
}

export function useAuth() {
  const snapshot = useSyncExternalStore(subscribeAuth, getAuthSnapshot, getAuthSnapshot);
  const token = snapshot.token;
  const user = snapshot.user as User | null;

  useEffect(() => {
    // If we have a token but no cached user, fetch it.
    if (token && !user) {
      apiClient
        .get("/api/v1/auth/me")
        .then((body) => setCachedUser((body as ApiSuccess<User>).data))
        .catch(() => void 0);
    }
  }, [token, user]);

  const login = useCallback(async (email: string, password: string) => {
    const body = (await apiClient.post("/api/v1/auth/login", { email, password })) as ApiSuccess<AuthResponse>;
    reconcileLocalDataForUser(body.data.user.id);
    setToken(body.data.token);
    setCachedUser(body.data.user);
    syncWorker.resume();
    return body.data.user;
  }, []);

  const signup = useCallback(async (email: string, password: string, name?: string) => {
    const body = (await apiClient.post("/api/v1/auth/signup", { email, password, name })) as ApiSuccess<AuthResponse>;
    reconcileLocalDataForUser(body.data.user.id);
    setToken(body.data.token);
    setCachedUser(body.data.user);
    syncWorker.resume();
    return body.data.user;
  }, []);

  const logout = useCallback(() => {
    // Wipe local data + queue so the next user signing in on this device
    // doesn't inherit the previous user's cached records. Trade-off: any
    // pending offline writes are dropped — the user explicitly chose
    // "log out", which we treat as "I'm done with this device."
    queue.clear();
    localStore.clearAll();
    clearDataOwner();
    clearToken();
  }, []);

  return { token, user, isAuthenticated: !!token, login, signup, logout };
}

// Registers a global listener that clears auth state when any API call
// returns 401. Call once at the app root.
export function useGlobalUnauthorizedHandler(onUnauthorized?: () => void) {
  useEffect(() => {
    return onApiEvent("unauthorized", () => {
      clearToken();
      onUnauthorized?.();
    });
  }, [onUnauthorized]);
}
