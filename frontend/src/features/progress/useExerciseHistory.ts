import { useMemo, useSyncExternalStore } from "react";
import { localStore } from "@/sync/localStore";
import type { Session, SessionExercise, WorkoutSet } from "@/types/session";
import type { CompletedSet } from "@/lib/prs";

type DatedSet = {
  set: WorkoutSet;
  date: Date;
};

function toCompleted(d: DatedSet): CompletedSet {
  const { set, date } = d;
  return {
    weightLb: set.weightLb == null || set.weightLb === "" ? null : Number.parseFloat(set.weightLb),
    reps: set.reps,
    durationSeconds: set.durationSeconds,
    distanceMeters:
      set.distanceMeters == null || set.distanceMeters === ""
        ? null
        : Number.parseFloat(set.distanceMeters),
    isWarmup: set.isWarmup,
    date,
  };
}

function subscribeSets(cb: () => void): () => void {
  return localStore.subscribe("sets", cb);
}
function subscribeSessionExercises(cb: () => void): () => void {
  return localStore.subscribe("session_exercises", cb);
}
function subscribeSessions(cb: () => void): () => void {
  return localStore.subscribe("sessions", cb);
}

function getAllSets(): WorkoutSet[] {
  return localStore.list<WorkoutSet>("sets");
}
function getAllSessionExercises(): SessionExercise[] {
  return localStore.list<SessionExercise>("session_exercises");
}
function getAllSessions(): Session[] {
  return localStore.list<Session>("sessions");
}

// All completed sets for a given exercise, in chronological order. Each set is
// paired with the date its session started — `date` is what charts and PRs key
// off of, not the set's own `completedAt` (which is identical-ish but not always
// present for retroactive logs).
export function useExerciseHistory(exerciseId: string | undefined): DatedSet[] {
  const sets = useSyncExternalStore(subscribeSets, getAllSets, getAllSets);
  const sessionExercises = useSyncExternalStore(
    subscribeSessionExercises,
    getAllSessionExercises,
    getAllSessionExercises,
  );
  const sessions = useSyncExternalStore(subscribeSessions, getAllSessions, getAllSessions);

  return useMemo(() => {
    if (!exerciseId) return [];

    const seIdsForExercise = new Set(
      sessionExercises.filter((se) => se.exerciseId === exerciseId).map((se) => se.id),
    );
    if (seIdsForExercise.size === 0) return [];

    const seToSessionId = new Map(sessionExercises.map((se) => [se.id, se.sessionId]));
    const sessionDateById = new Map(sessions.map((s) => [s.id, new Date(s.startedAt)]));

    const result: DatedSet[] = [];
    for (const s of sets) {
      if (!seIdsForExercise.has(s.sessionExerciseId)) continue;
      if (s.completedAt === null) continue;
      const sessionId = seToSessionId.get(s.sessionExerciseId);
      const date = sessionId ? sessionDateById.get(sessionId) : undefined;
      if (!date) continue;
      result.push({ set: s, date });
    }
    return result.sort((a, b) => a.date.getTime() - b.date.getTime());
  }, [exerciseId, sets, sessionExercises, sessions]);
}

// Convenience: same data, but already projected into the shape the PR / chart
// math wants.
export function useExerciseCompletedSets(exerciseId: string | undefined): CompletedSet[] {
  const history = useExerciseHistory(exerciseId);
  return useMemo(() => history.map(toCompleted), [history]);
}

// IDs of exercises the user has logged at least one completed set for. Used by
// the Progress page to show only exercises with data.
export function useLoggedExerciseIds(): string[] {
  const sets = useSyncExternalStore(subscribeSets, getAllSets, getAllSets);
  const sessionExercises = useSyncExternalStore(
    subscribeSessionExercises,
    getAllSessionExercises,
    getAllSessionExercises,
  );

  return useMemo(() => {
    const seToExerciseId = new Map(sessionExercises.map((se) => [se.id, se.exerciseId]));
    const ids = new Set<string>();
    for (const s of sets) {
      if (s.completedAt === null) continue;
      const exId = seToExerciseId.get(s.sessionExerciseId);
      if (exId) ids.add(exId);
    }
    return Array.from(ids);
  }, [sets, sessionExercises]);
}
