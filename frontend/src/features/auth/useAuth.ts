import { useCallback, useEffect, useSyncExternalStore } from "react";
import { apiClient, onApiEvent } from "@/sync/apiClient";
import {
  clearToken,
  getCachedUser,
  getToken,
  setCachedUser,
  setToken,
  subscribeAuth,
} from "@/sync/authStorage";
import type { ApiSuccess } from "@/types/api";
import type { AuthResponse, User } from "@/types/user";

type AuthSnapshot = {
  token: string | null;
  user: User | null;
};

function getSnapshot(): AuthSnapshot {
  return {
    token: getToken(),
    user: getCachedUser() as User | null,
  };
}

export function useAuth() {
  const { token, user } = useSyncExternalStore(subscribeAuth, getSnapshot, getSnapshot);

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
    return body.data.user;
  }, []);

  const signup = useCallback(async (email: string, password: string, name?: string) => {
    const body = (await apiClient.post("/api/v1/auth/signup", { email, password, name })) as ApiSuccess<AuthResponse>;
    setToken(body.data.token);
    setCachedUser(body.data.user);
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
