import { uuid } from "@/lib/uuid";
import { apiClient } from "@/sync/apiClient";
import { localStore } from "@/sync/localStore";
import { queue } from "@/sync/queue";
import { syncWorker } from "@/sync/syncWorker";
import type { ApiSuccess } from "@/types/api";
import type { Exercise } from "@/types/exercise";
import type { Routine, RoutineExercise } from "@/types/routine";
import type { Session, SessionExercise, WorkoutSet } from "@/types/session";

function nowIso(): string {
  return new Date().toISOString();
}

export function createRoutine(name: string, description?: string | null): Routine {
  const id = uuid();
  const now = nowIso();
  const allRoutines = localStore.list<Routine>("routines");
  const position = allRoutines.length;
  const routine: Routine = {
    id,
    userId: "",
    name,
    description: description ?? null,
    position,
    createdAt: now,
    updatedAt: now,
  };
  localStore.put("routines", routine);
  queue.enqueue("PUT", `/api/v1/routines/${id}`, {
    name,
    description,
    position,
  });
  syncWorker.poke();
  return routine;
}

export function updateRoutine(id: string, patch: Partial<Pick<Routine, "name" | "description" | "position">>): void {
  const existing = localStore.get<Routine>("routines", id);
  if (!existing) return;
  const updated: Routine = { ...existing, ...patch, updatedAt: nowIso() };
  localStore.put("routines", updated);
  queue.enqueue("PUT", `/api/v1/routines/${id}`, {
    name: updated.name,
    description: updated.description,
    position: updated.position,
  });
  syncWorker.poke();
}

export function deleteRoutine(id: string): void {
  const ros = localStore.list<RoutineExercise>("routine_exercises").filter((re) => re.routineId === id);
  for (const re of ros) localStore.remove("routine_exercises", re.id);
  localStore.remove("routines", id);
  queue.enqueue("DELETE", `/api/v1/routines/${id}`);
  syncWorker.poke();
}

type RoutineExerciseInput = {
  plannedSets?: number;
  plannedReps?: number | null;
  plannedWeightLb?: string | null;
  plannedDurationSeconds?: number | null;
  plannedDistanceMeters?: string | null;
  notes?: string | null;
};

export function addRoutineExercise(routineId: string, exerciseId: string, defaults: RoutineExerciseInput = {}): RoutineExercise {
  const id = uuid();
  const now = nowIso();
  const existing = localStore.list<RoutineExercise>("routine_exercises").filter((re) => re.routineId === routineId);
  const position = existing.length;
  const re: RoutineExercise = {
    id,
    routineId,
    exerciseId,
    position,
    plannedSets: defaults.plannedSets ?? 3,
    plannedReps: defaults.plannedReps ?? null,
    plannedWeightLb: defaults.plannedWeightLb ?? null,
    plannedDurationSeconds: defaults.plannedDurationSeconds ?? null,
    plannedDistanceMeters: defaults.plannedDistanceMeters ?? null,
    notes: defaults.notes ?? null,
    createdAt: now,
    updatedAt: now,
  };
  localStore.put("routine_exercises", re);
  queue.enqueue("PUT", `/api/v1/routine_exercises/${id}`, {
    routineId,
    exerciseId,
    position,
    plannedSets: re.plannedSets,
    plannedReps: re.plannedReps,
    plannedWeightLb: re.plannedWeightLb,
    plannedDurationSeconds: re.plannedDurationSeconds,
    plannedDistanceMeters: re.plannedDistanceMeters,
    notes: re.notes,
  });
  syncWorker.poke();
  return re;
}

export function updateRoutineExercise(id: string, patch: Partial<RoutineExercise>): void {
  const existing = localStore.get<RoutineExercise>("routine_exercises", id);
  if (!existing) return;
  const updated: RoutineExercise = { ...existing, ...patch, updatedAt: nowIso() };
  localStore.put("routine_exercises", updated);
  queue.enqueue("PUT", `/api/v1/routine_exercises/${id}`, {
    routineId: updated.routineId,
    exerciseId: updated.exerciseId,
    position: updated.position,
    plannedSets: updated.plannedSets,
    plannedReps: updated.plannedReps,
    plannedWeightLb: updated.plannedWeightLb,
    plannedDurationSeconds: updated.plannedDurationSeconds,
    plannedDistanceMeters: updated.plannedDistanceMeters,
    notes: updated.notes,
  });
  syncWorker.poke();
}

export function removeRoutineExercise(id: string): void {
  localStore.remove("routine_exercises", id);
  queue.enqueue("DELETE", `/api/v1/routine_exercises/${id}`);
  syncWorker.poke();
}

// Reorder by writing new positions. Caller passes the ordered ids.
export function reorderRoutineExercises(routineId: string, orderedIds: string[]): void {
  for (let i = 0; i < orderedIds.length; i++) {
    const re = localStore.get<RoutineExercise>("routine_exercises", orderedIds[i]);
    if (!re || re.routineId !== routineId || re.position === i) continue;
    updateRoutineExercise(re.id, { position: i });
  }
}

// Materialize a session from a routine: creates session, session_exercises,
// and pre-filled (uncompleted) sets. Routine template is unchanged.
export function startSessionFromRoutine(
  routine: Routine,
  exerciseLookup: (id: string) => Exercise | undefined
): Session {
  const sessionId = uuid();
  const now = nowIso();
  const session: Session = {
    id: sessionId,
    userId: "",
    routineId: routine.id,
    name: routine.name,
    startedAt: now,
    endedAt: null,
    notes: null,
    durationSeconds: null,
    createdAt: now,
    updatedAt: now,
  };
  localStore.put("sessions", session);
  queue.enqueue("PUT", `/api/v1/sessions/${sessionId}`, {
    name: session.name,
    startedAt: session.startedAt,
    routineId: routine.id,
  });

  const ros = localStore
    .list<RoutineExercise>("routine_exercises")
    .filter((re) => re.routineId === routine.id)
    .sort((a, b) => a.position - b.position);

  for (const re of ros) {
    const seId = uuid();
    const se: SessionExercise = {
      id: seId,
      sessionId,
      exerciseId: re.exerciseId,
      position: re.position,
      notes: re.notes,
      createdAt: now,
      updatedAt: now,
    };
    localStore.put("session_exercises", se);
    queue.enqueue("PUT", `/api/v1/session_exercises/${seId}`, {
      sessionId,
      exerciseId: re.exerciseId,
      position: re.position,
      notes: re.notes,
    });

    const exercise = exerciseLookup(re.exerciseId);
    const isCardio = exercise?.kind === "cardio";

    for (let i = 0; i < re.plannedSets; i++) {
      const setId = uuid();
      const set: WorkoutSet = {
        id: setId,
        sessionExerciseId: seId,
        position: i,
        reps: isCardio ? null : re.plannedReps,
        weightLb: isCardio ? null : re.plannedWeightLb,
        durationSeconds: isCardio ? re.plannedDurationSeconds : null,
        distanceMeters: isCardio ? re.plannedDistanceMeters : null,
        rpe: null,
        isWarmup: false,
        completedAt: null,
        notes: null,
        createdAt: now,
        updatedAt: now,
      };
      localStore.put("sets", set);
      queue.enqueue("PUT", `/api/v1/sets/${setId}`, {
        sessionExerciseId: seId,
        position: i,
        reps: set.reps,
        weightLb: set.weightLb,
        durationSeconds: set.durationSeconds,
        distanceMeters: set.distanceMeters,
        isWarmup: false,
        completedAt: null,
      });
    }
  }

  syncWorker.poke();
  return session;
}

export async function hydrateRoutines(): Promise<void> {
  try {
    const body = (await apiClient.get("/api/v1/routines")) as ApiSuccess<Routine[]>;
    localStore.replace("routines", body.data);
  } catch {
    // offline — keep local copy
  }
}

export async function hydrateRoutine(id: string): Promise<void> {
  try {
    const body = (await apiClient.get(`/api/v1/routines/${id}`)) as ApiSuccess<
      Routine & { routineExercises: RoutineExercise[] }
    >;
    const { routineExercises, ...routine } = body.data;
    localStore.put("routines", routine as Routine);
    for (const re of routineExercises ?? []) {
      localStore.put("routine_exercises", re);
    }
  } catch {
    // offline
  }
}
