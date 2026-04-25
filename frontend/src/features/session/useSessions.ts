import { useEffect, useSyncExternalStore } from "react";
import { localStore } from "@/sync/localStore";
import { hydrateAllSessions } from "./sessionActions";
import type { Session } from "@/types/session";

function subscribe(cb: () => void): () => void {
  return localStore.subscribe("sessions", cb);
}

function getSnapshot(): Session[] {
  return localStore.list<Session>("sessions");
}

export function useSessions() {
  const sessions = useSyncExternalStore(subscribe, getSnapshot, getSnapshot);

  useEffect(() => {
    hydrateAllSessions();
  }, []);

  // Most recent first
  return [...sessions].sort((a, b) => b.startedAt.localeCompare(a.startedAt));
}

// Returns the in-progress session (most recent without endedAt), if any.
export function useActiveSession(): Session | null {
  const sessions = useSessions();
  return sessions.find((s) => s.endedAt === null) ?? null;
}
