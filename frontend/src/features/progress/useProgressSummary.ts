import { useMemo, useSyncExternalStore } from "react";
import { localStore } from "@/sync/localStore";
import { findPRs, type CompletedSet } from "@/lib/prs";
import type { Exercise } from "@/types/exercise";
import type { Session, SessionExercise, WorkoutSet } from "@/types/session";

export type ProgressSummary = {
  sessionsThisWeek: number;
  volumeThisWeek: number;
  prsThisMonth: number;
  heaviestSet: { weightLb: number; reps: number; exerciseName: string; date: Date } | null;
  longestDistance: { distanceMeters: number; exerciseName: string; date: Date } | null;
};

function startOfWeek(d: Date): Date {
  const out = new Date(d);
  out.setHours(0, 0, 0, 0);
  // ISO week: Monday as day 1. JS getDay() returns 0 (Sun)..6 (Sat).
  const day = out.getDay();
  const diff = day === 0 ? -6 : 1 - day;
  out.setDate(out.getDate() + diff);
  return out;
}

function startOfMonth(d: Date): Date {
  return new Date(d.getFullYear(), d.getMonth(), 1);
}

function subscribe(resource: Parameters<typeof localStore.subscribe>[0]) {
  return (cb: () => void) => localStore.subscribe(resource, cb);
}

const subscribeSets = subscribe("sets");
const subscribeSEs = subscribe("session_exercises");
const subscribeSessions = subscribe("sessions");
const subscribeExercises = subscribe("exercises");

const getSets = () => localStore.list<WorkoutSet>("sets");
const getSEs = () => localStore.list<SessionExercise>("session_exercises");
const getSessions = () => localStore.list<Session>("sessions");
const getExercises = () => localStore.list<Exercise>("exercises");

export function useProgressSummary(): ProgressSummary {
  const sets = useSyncExternalStore(subscribeSets, getSets, getSets);
  const sessionExercises = useSyncExternalStore(subscribeSEs, getSEs, getSEs);
  const sessions = useSyncExternalStore(subscribeSessions, getSessions, getSessions);
  const exercises = useSyncExternalStore(subscribeExercises, getExercises, getExercises);

  return useMemo(() => {
    const now = new Date();
    const weekStart = startOfWeek(now);
    const monthStart = startOfMonth(now);

    const exerciseById = new Map(exercises.map((e) => [e.id, e]));
    const seById = new Map(sessionExercises.map((se) => [se.id, se]));
    const sessionDateById = new Map(sessions.map((s) => [s.id, new Date(s.startedAt)]));

    // --- Sessions this week ---
    const sessionsThisWeek = sessions.filter(
      (s) => new Date(s.startedAt).getTime() >= weekStart.getTime(),
    ).length;

    // --- Volume this week (sum of weight × reps for completed sets in sessions this week) ---
    let volumeThisWeek = 0;
    for (const s of sets) {
      if (s.completedAt === null) continue;
      const se = seById.get(s.sessionExerciseId);
      if (!se) continue;
      const sessionDate = sessionDateById.get(se.sessionId);
      if (!sessionDate || sessionDate.getTime() < weekStart.getTime()) continue;
      const weight = s.weightLb == null || s.weightLb === "" ? 0 : Number.parseFloat(s.weightLb);
      const reps = s.reps ?? 0;
      if (weight > 0 && reps > 0) volumeThisWeek += weight * reps;
    }

    // --- Heaviest set ever + longest distance ever (across all exercises) ---
    let heaviestSet: ProgressSummary["heaviestSet"] = null;
    let longestDistance: ProgressSummary["longestDistance"] = null;

    for (const s of sets) {
      if (s.completedAt === null || s.isWarmup) continue;
      const se = seById.get(s.sessionExerciseId);
      if (!se) continue;
      const exercise = exerciseById.get(se.exerciseId);
      if (!exercise) continue;
      const date = sessionDateById.get(se.sessionId);
      if (!date) continue;

      const weight = s.weightLb == null || s.weightLb === "" ? 0 : Number.parseFloat(s.weightLb);
      const reps = s.reps ?? 0;
      if (weight > 0 && reps > 0) {
        if (!heaviestSet || weight > heaviestSet.weightLb) {
          heaviestSet = { weightLb: weight, reps, exerciseName: exercise.name, date };
        }
      }

      const distance =
        s.distanceMeters == null || s.distanceMeters === "" ? 0 : Number.parseFloat(s.distanceMeters);
      if (distance > 0) {
        if (!longestDistance || distance > longestDistance.distanceMeters) {
          longestDistance = { distanceMeters: distance, exerciseName: exercise.name, date };
        }
      }
    }

    // --- PRs this month: per-exercise, count independent (non-bestByReps) PRs whose date falls in this month ---
    // Group sets by exerciseId for findPRs. Skip exercises with no completed sets.
    const setsByExerciseId = new Map<string, CompletedSet[]>();
    for (const s of sets) {
      if (s.completedAt === null) continue;
      const se = seById.get(s.sessionExerciseId);
      if (!se) continue;
      const date = sessionDateById.get(se.sessionId);
      if (!date) continue;
      const list = setsByExerciseId.get(se.exerciseId);
      const projected: CompletedSet = {
        weightLb: s.weightLb == null || s.weightLb === "" ? null : Number.parseFloat(s.weightLb),
        reps: s.reps,
        durationSeconds: s.durationSeconds,
        distanceMeters:
          s.distanceMeters == null || s.distanceMeters === "" ? null : Number.parseFloat(s.distanceMeters),
        isWarmup: s.isWarmup,
        date,
      };
      if (list) list.push(projected);
      else setsByExerciseId.set(se.exerciseId, [projected]);
    }

    let prsThisMonth = 0;
    for (const [exId, sets] of setsByExerciseId) {
      const exercise = exerciseById.get(exId);
      if (!exercise) continue;
      const prs = findPRs(sets, exercise.kind);
      if (prs.kind === "strength") {
        if (prs.heaviestWeight && prs.heaviestWeight.date >= monthStart) prsThisMonth++;
        if (prs.bestEstimated1RM && prs.bestEstimated1RM.date >= monthStart) prsThisMonth++;
        if (prs.highestVolumeSet && prs.highestVolumeSet.date >= monthStart) prsThisMonth++;
      } else if (prs.kind === "bodyweight") {
        if (prs.mostReps && prs.mostReps.date >= monthStart) prsThisMonth++;
      } else {
        if (prs.longestDistance && prs.longestDistance.date >= monthStart) prsThisMonth++;
        if (prs.longestDuration && prs.longestDuration.date >= monthStart) prsThisMonth++;
        if (prs.fastestPace && prs.fastestPace.date >= monthStart) prsThisMonth++;
      }
    }

    return {
      sessionsThisWeek,
      volumeThisWeek,
      prsThisMonth,
      heaviestSet,
      longestDistance,
    };
  }, [sets, sessionExercises, sessions, exercises]);
}
