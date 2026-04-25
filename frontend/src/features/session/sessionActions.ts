// All write operations follow the same flow:
//   1. Update localStore immediately (optimistic).
//   2. Enqueue PUT/DELETE to the API.
// The sync worker drains the queue when online.

import { uuid } from "@/lib/uuid";
import { apiClient } from "@/sync/apiClient";
import { localStore } from "@/sync/localStore";
import { queue } from "@/sync/queue";
import { syncWorker } from "@/sync/syncWorker";
import type { ApiSuccess } from "@/types/api";
import type { Session, SessionExercise, WorkoutSet } from "@/types/session";

function nowIso(): string {
  return new Date().toISOString();
}

export function startEmptySession(opts: { startedAt?: string; name?: string | null } = {}): Session {
  const id = uuid();
  const now = nowIso();
  const startedAt = opts.startedAt ?? now;
  const session: Session = {
    id,
    userId: "",                    // server overwrites
    routineId: null,
    name: opts.name ?? null,
    startedAt,
    endedAt: null,
    notes: null,
    durationSeconds: null,
    createdAt: now,
    updatedAt: now,
  };
  localStore.put("sessions", session);
  queue.enqueue("PUT", `/api/v1/sessions/${id}`, {
    name: session.name,
    startedAt,
    notes: null,
  });
  syncWorker.poke();
  return session;
}

export function updateSession(id: string, patch: Partial<Pick<Session, "name" | "startedAt" | "endedAt" | "notes">>): void {
  const existing = localStore.get<Session>("sessions", id);
  if (!existing) return;
  const updated: Session = { ...existing, ...patch, updatedAt: nowIso() };
  localStore.put("sessions", updated);
  queue.enqueue("PUT", `/api/v1/sessions/${id}`, {
    name: updated.name,
    startedAt: updated.startedAt,
    endedAt: updated.endedAt,
    notes: updated.notes,
  });
  syncWorker.poke();
}

export function finishSession(id: string): void {
  updateSession(id, { endedAt: nowIso() });
}

export function deleteSession(id: string): void {
  // Cascade locally first.
  const ses = localStore.list<SessionExercise>("session_exercises").filter((se) => se.sessionId === id);
  for (const se of ses) {
    const sets = localStore.list<WorkoutSet>("sets").filter((s) => s.sessionExerciseId === se.id);
    for (const s of sets) localStore.remove("sets", s.id);
    localStore.remove("session_exercises", se.id);
  }
  localStore.remove("sessions", id);
  queue.enqueue("DELETE", `/api/v1/sessions/${id}`);
  syncWorker.poke();
}

export function addExerciseToSession(sessionId: string, exerciseId: string): SessionExercise {
  const id = uuid();
  const now = nowIso();
  const existing = localStore.list<SessionExercise>("session_exercises").filter((se) => se.sessionId === sessionId);
  const position = existing.length;
  const se: SessionExercise = {
    id,
    sessionId,
    exerciseId,
    position,
    notes: null,
    createdAt: now,
    updatedAt: now,
  };
  localStore.put("session_exercises", se);
  queue.enqueue("PUT", `/api/v1/session_exercises/${id}`, {
    sessionId,
    exerciseId,
    position,
    notes: null,
  });
  syncWorker.poke();
  return se;
}

export function removeSessionExercise(id: string): void {
  const sets = localStore.list<WorkoutSet>("sets").filter((s) => s.sessionExerciseId === id);
  for (const s of sets) localStore.remove("sets", s.id);
  localStore.remove("session_exercises", id);
  queue.enqueue("DELETE", `/api/v1/session_exercises/${id}`);
  syncWorker.poke();
}

export function addSet(sessionExerciseId: string, defaults: Partial<WorkoutSet> = {}): WorkoutSet {
  const id = uuid();
  const now = nowIso();
  const existing = localStore
    .list<WorkoutSet>("sets")
    .filter((s) => s.sessionExerciseId === sessionExerciseId);
  const position = existing.length;
  const set: WorkoutSet = {
    id,
    sessionExerciseId,
    position,
    reps: defaults.reps ?? null,
    weightLb: defaults.weightLb ?? null,
    durationSeconds: defaults.durationSeconds ?? null,
    distanceMeters: defaults.distanceMeters ?? null,
    rpe: defaults.rpe ?? null,
    isWarmup: defaults.isWarmup ?? false,
    completedAt: null,
    notes: null,
    createdAt: now,
    updatedAt: now,
  };
  localStore.put("sets", set);
  queue.enqueue("PUT", `/api/v1/sets/${id}`, {
    sessionExerciseId,
    position,
    reps: set.reps,
    weightLb: set.weightLb,
    durationSeconds: set.durationSeconds,
    distanceMeters: set.distanceMeters,
    rpe: set.rpe,
    isWarmup: set.isWarmup,
    completedAt: null,
    notes: null,
  });
  syncWorker.poke();
  return set;
}

export function updateSet(id: string, patch: Partial<WorkoutSet>): void {
  const existing = localStore.get<WorkoutSet>("sets", id);
  if (!existing) return;
  const updated: WorkoutSet = { ...existing, ...patch, updatedAt: nowIso() };
  localStore.put("sets", updated);
  queue.enqueue("PUT", `/api/v1/sets/${id}`, {
    sessionExerciseId: updated.sessionExerciseId,
    position: updated.position,
    reps: updated.reps,
    weightLb: updated.weightLb,
    durationSeconds: updated.durationSeconds,
    distanceMeters: updated.distanceMeters,
    rpe: updated.rpe,
    isWarmup: updated.isWarmup,
    completedAt: updated.completedAt,
    notes: updated.notes,
  });
  syncWorker.poke();
}

export function completeSet(id: string, values: Partial<WorkoutSet> = {}): void {
  updateSet(id, { ...values, completedAt: nowIso() });
}

export function uncompleteSet(id: string): void {
  updateSet(id, { completedAt: null });
}

export function removeSet(id: string): void {
  localStore.remove("sets", id);
  queue.enqueue("DELETE", `/api/v1/sets/${id}`);
  syncWorker.poke();
}

// Hydrates the local cache with a session and its nested resources from
// the server. Used on detail-page mount so partial offline data fills
// in once we're online.
export async function hydrateSession(id: string): Promise<void> {
  try {
    const body = (await apiClient.get(`/api/v1/sessions/${id}`)) as ApiSuccess<{
      sessionExercises: (SessionExercise & { sets: WorkoutSet[] })[];
    } & Session>;
    const data = body.data;
    const { sessionExercises, ...session } = data;
    localStore.put("sessions", session as Session);
    for (const se of sessionExercises ?? []) {
      const { sets, ...seBare } = se;
      localStore.put("session_exercises", seBare as SessionExercise);
      for (const s of sets ?? []) {
        localStore.put("sets", s as WorkoutSet);
      }
    }
  } catch {
    // Offline / not yet synced — just show what we have locally.
  }
}

export async function hydrateAllSessions(): Promise<void> {
  try {
    const body = (await apiClient.get("/api/v1/sessions")) as ApiSuccess<Session[]>;
    localStore.replace("sessions", body.data);
  } catch {
    // Offline — show what we have.
  }
}
