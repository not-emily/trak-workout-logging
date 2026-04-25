import { useCallback, useEffect, useSyncExternalStore } from "react";
import { apiClient, onApiEvent } from "@/sync/apiClient";
import {
  clearToken,
  getAuthSnapshot,
  setCachedUser,
  setToken,
  subscribeAuth,
} from "@/sync/authStorage";
import { syncWorker } from "@/sync/syncWorker";
import type { ApiSuccess } from "@/types/api";
import type { AuthResponse, User } from "@/types/user";

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
    setToken(body.data.token);
    setCachedUser(body.data.user);
    syncWorker.resume();
    return body.data.user;
  }, []);

  const signup = useCallback(async (email: string, password: string, name?: string) => {
    const body = (await apiClient.post("/api/v1/auth/signup", { email, password, name })) as ApiSuccess<AuthResponse>;
    setToken(body.data.token);
    setCachedUser(body.data.user);
    syncWorker.resume();
    return body.data.user;
  }, []);

  const logout = useCallback(() => {
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
