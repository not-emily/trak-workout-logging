import { useMemo, useSyncExternalStore } from "react";
import { localStore } from "@/sync/localStore";
import { estimated1RM } from "@/lib/prs";
import type { BodyMeasurement } from "@/types/bodyMeasurement";
import type { Goal } from "@/types/goal";
import type { Session, SessionExercise, WorkoutSet } from "@/types/session";

export type GoalProgress = {
  current: number;
  target: number;
  start: number | null;
  percent: number; // 0..100
  isAchieved: boolean;
};

const subscribeSets = (cb: () => void) => localStore.subscribe("sets", cb);
const subscribeSEs = (cb: () => void) => localStore.subscribe("session_exercises", cb);
const subscribeSessions = (cb: () => void) => localStore.subscribe("sessions", cb);
const subscribeBM = (cb: () => void) => localStore.subscribe("body_measurements", cb);

const getSets = () => localStore.list<WorkoutSet>("sets");
const getSEs = () => localStore.list<SessionExercise>("session_exercises");
const getSessions = () => localStore.list<Session>("sessions");
const getBM = () => localStore.list<BodyMeasurement>("body_measurements");

const ONE_WEEK_MS = 7 * 24 * 60 * 60 * 1000;

function liftProgress(goal: Goal, sets: WorkoutSet[], sessionExercises: SessionExercise[]): number {
  const seIdsForExercise = new Set(
    sessionExercises.filter((se) => se.exerciseId === goal.exerciseId).map((se) => se.id),
  );
  if (seIdsForExercise.size === 0) return 0;
  let best = 0;
  for (const s of sets) {
    if (!seIdsForExercise.has(s.sessionExerciseId)) continue;
    if (s.completedAt === null || s.isWarmup) continue;
    if (s.weightLb == null || s.weightLb === "" || s.reps == null || s.reps <= 0) continue;
    const w = Number.parseFloat(s.weightLb);
    if (w <= 0) continue;
    const e = estimated1RM(w, s.reps);
    if (e > best) best = e;
  }
  return best;
}

function bodyProgress(goal: Goal, measurements: BodyMeasurement[]): number {
  // Latest measurement for the metric.
  let latest: BodyMeasurement | null = null;
  for (const m of measurements) {
    if (m.metric !== goal.metric) continue;
    if (!latest || new Date(m.recordedAt) > new Date(latest.recordedAt)) latest = m;
  }
  return latest ? Number.parseFloat(latest.value) : 0;
}

function frequencyProgress(sessions: Session[]): number {
  const cutoff = Date.now() - ONE_WEEK_MS;
  return sessions.filter((s) => {
    if (!s.endedAt) return false;
    return new Date(s.endedAt).getTime() >= cutoff;
  }).length;
}

function clamp01(n: number): number {
  if (!Number.isFinite(n)) return 0;
  if (n < 0) return 0;
  if (n > 100) return 100;
  return n;
}

function computeProgress(
  goal: Goal,
  sets: WorkoutSet[],
  sessionExercises: SessionExercise[],
  sessions: Session[],
  measurements: BodyMeasurement[],
): GoalProgress {
  const target = Number.parseFloat(goal.targetValue);
  const startRaw = goal.startValue != null ? Number.parseFloat(goal.startValue) : NaN;
  const start = Number.isFinite(startRaw) ? startRaw : null;

  let current = 0;
  if (goal.targetType === "lift") current = liftProgress(goal, sets, sessionExercises);
  else if (goal.targetType === "body") current = bodyProgress(goal, measurements);
  else if (goal.targetType === "frequency") current = frequencyProgress(sessions);

  let percent = 0;
  let isAchieved = false;
  if (goal.targetType === "frequency") {
    // Frequency: anchor at 0; one-direction (increase). Doesn't auto-mark
    // achieved permanently — that's handled separately if at all.
    if (target > 0) percent = clamp01((current / target) * 100);
    isAchieved = current >= target;
  } else if (goal.direction === "increase") {
    isAchieved = current >= target;
    if (start != null && start < target) {
      // Real progress reading: distance traveled / distance to go.
      percent = clamp01(((current - start) / (target - start)) * 100);
    } else if (target > 0) {
      // No usable baseline — fall back to current/target.
      percent = clamp01((current / target) * 100);
    }
  } else {
    // Decrease.
    isAchieved = current > 0 && current <= target;
    if (start != null && start > target) {
      percent = clamp01(((start - current) / (start - target)) * 100);
    } else if (current > 0) {
      // No usable baseline — keep something monotonic. Caps at 100 once achieved.
      if (current <= target) percent = 100;
      else if (target > 0) percent = clamp01((target / current) * 100);
    }
  }

  return { current, target, start, percent, isAchieved };
}

// Returns a Map<goalId, GoalProgress> recomputed when the underlying data changes.
export function useGoalProgresses(goals: Goal[]): Map<string, GoalProgress> {
  const sets = useSyncExternalStore(subscribeSets, getSets, getSets);
  const sessionExercises = useSyncExternalStore(subscribeSEs, getSEs, getSEs);
  const sessions = useSyncExternalStore(subscribeSessions, getSessions, getSessions);
  const measurements = useSyncExternalStore(subscribeBM, getBM, getBM);

  return useMemo(() => {
    const map = new Map<string, GoalProgress>();
    for (const g of goals) {
      map.set(g.id, computeProgress(g, sets, sessionExercises, sessions, measurements));
    }
    return map;
  }, [goals, sets, sessionExercises, sessions, measurements]);
}

// Convenience: progress for a single goal (used by GoalCard / detail).
export function useGoalProgress(goal: Goal | null | undefined): GoalProgress | null {
  const sets = useSyncExternalStore(subscribeSets, getSets, getSets);
  const sessionExercises = useSyncExternalStore(subscribeSEs, getSEs, getSEs);
  const sessions = useSyncExternalStore(subscribeSessions, getSessions, getSessions);
  const measurements = useSyncExternalStore(subscribeBM, getBM, getBM);

  return useMemo(() => {
    if (!goal) return null;
    return computeProgress(goal, sets, sessionExercises, sessions, measurements);
  }, [goal, sets, sessionExercises, sessions, measurements]);
}
