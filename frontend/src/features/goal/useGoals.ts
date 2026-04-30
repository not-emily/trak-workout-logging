import { useEffect, useMemo, useSyncExternalStore } from "react";
import { estimated1RM } from "@/lib/prs";
import { apiClient } from "@/sync/apiClient";
import { localStore } from "@/sync/localStore";
import { queue } from "@/sync/queue";
import { syncWorker } from "@/sync/syncWorker";
import type { ApiSuccess } from "@/types/api";
import type { BodyMeasurement } from "@/types/bodyMeasurement";
import type { Goal, GoalInput } from "@/types/goal";
import type { SessionExercise, WorkoutSet } from "@/types/session";

function nowIso(): string {
  return new Date().toISOString();
}

function subscribe(cb: () => void): () => void {
  return localStore.subscribe("goals", cb);
}

function getAll(): Goal[] {
  return localStore.list<Goal>("goals");
}

let lastHydrate = 0;

async function hydrateFromServer(): Promise<void> {
  const now = Date.now();
  if (now - lastHydrate < 30_000) return;
  lastHydrate = now;
  try {
    const body = (await apiClient.get("/api/v1/goals")) as ApiSuccess<Goal[]>;
    localStore.replace("goals", body.data);
  } catch {
    // Offline — keep showing local data.
  }
}

// Sorted: active goals first (achievedAt null), then most-recently achieved.
export function useGoals(): Goal[] {
  const records = useSyncExternalStore(subscribe, getAll, getAll);

  useEffect(() => {
    hydrateFromServer();
  }, []);

  return useMemo(() => {
    return [...records].sort((a, b) => {
      if (a.achievedAt === null && b.achievedAt !== null) return -1;
      if (b.achievedAt === null && a.achievedAt !== null) return 1;
      if (a.achievedAt && b.achievedAt) {
        return new Date(b.achievedAt).getTime() - new Date(a.achievedAt).getTime();
      }
      return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
    });
  }, [records]);
}

export function useGoal(id: string | undefined): Goal | null {
  const goals = useGoals();
  return useMemo(() => (id ? goals.find((g) => g.id === id) ?? null : null), [goals, id]);
}

// Best estimated-1RM the user has hit for the given exercise, computed from
// completed (non-warmup) sets in localStore. Returns null if no qualifying data.
export function bestEstimated1RMForExercise(exerciseId: string): number | null {
  const sets = localStore.list<WorkoutSet>("sets");
  const ses = localStore.list<SessionExercise>("session_exercises");
  const seIdsForExercise = new Set(
    ses.filter((se) => se.exerciseId === exerciseId).map((se) => se.id),
  );
  if (seIdsForExercise.size === 0) return null;
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
  return best > 0 ? best : null;
}

// Latest body measurement value for a metric. Returns null if no data.
export function latestBodyMeasurementValue(metric: string): number | null {
  const measurements = localStore.list<BodyMeasurement>("body_measurements");
  let latest: BodyMeasurement | null = null;
  for (const m of measurements) {
    if (m.metric !== metric) continue;
    if (!latest || new Date(m.recordedAt) > new Date(latest.recordedAt)) latest = m;
  }
  if (!latest) return null;
  const v = Number.parseFloat(latest.value);
  return Number.isFinite(v) ? v : null;
}

// Snapshot the user's current value for a goal at creation time. Body and lift
// goals get a baseline; frequency goals don't need one (start = 0 is implied).
function snapshotStartValue(input: GoalInput): string | null {
  if (input.targetType === "lift" && input.exerciseId) {
    const v = bestEstimated1RMForExercise(input.exerciseId);
    return v != null ? v.toFixed(3) : null;
  }
  if (input.targetType === "body" && input.metric) {
    const v = latestBodyMeasurementValue(input.metric);
    return v != null ? v.toFixed(3) : null;
  }
  return null;
}

function goalToPayload(g: Goal): Record<string, unknown> {
  return {
    name: g.name,
    targetType: g.targetType,
    exerciseId: g.exerciseId,
    metric: g.metric,
    targetValue: g.targetValue,
    startValue: g.startValue,
    unit: g.unit,
    direction: g.direction,
    targetDate: g.targetDate,
    achievedAt: g.achievedAt,
  };
}

// Editing the target / direction / exercise / metric / type re-arms achievement
// detection — if the new definition still satisfies the condition, the watcher
// will mark it achieved again on the next render. Renames or target-date edits
// preserve the existing achievedAt.
function shouldClearAchievement(existing: Goal, input: GoalInput): boolean {
  if (existing.achievedAt === null) return false;
  if (existing.targetType !== input.targetType) return true;
  if (existing.targetValue !== input.targetValue) return true;
  if (existing.direction !== input.direction) return true;
  if (existing.exerciseId !== (input.exerciseId ?? null)) return true;
  if (existing.metric !== (input.metric ?? null)) return true;
  return false;
}

export function upsertGoal(id: string, input: GoalInput): Goal {
  const existing = localStore.get<Goal>("goals", id);
  const now = nowIso();
  const startValue =
    input.startValue !== undefined
      ? input.startValue
      : existing
        ? existing.startValue
        : snapshotStartValue(input);
  const achievedAt =
    input.achievedAt !== undefined
      ? input.achievedAt
      : existing && shouldClearAchievement(existing, input)
        ? null
        : (existing?.achievedAt ?? null);
  const next: Goal = {
    id,
    userId: existing?.userId ?? "",
    name: input.name,
    targetType: input.targetType,
    exerciseId: input.exerciseId ?? null,
    metric: input.metric ?? null,
    targetValue: input.targetValue,
    startValue,
    unit: input.unit,
    direction: input.direction,
    targetDate: input.targetDate ?? null,
    achievedAt,
    createdAt: existing?.createdAt ?? now,
    updatedAt: now,
  };
  localStore.put("goals", next);
  queue.enqueue("PUT", `/api/v1/goals/${id}`, goalToPayload(next));
  syncWorker.poke();
  return next;
}

// Lazy-fill a goal's start value when no baseline existed at creation time but
// data has now appeared. Called by `useGoalStartValueBackfill`.
export function setGoalStartValue(id: string, value: string): void {
  const existing = localStore.get<Goal>("goals", id);
  if (!existing || existing.startValue != null) return;
  const updated: Goal = { ...existing, startValue: value, updatedAt: nowIso() };
  localStore.put("goals", updated);
  queue.enqueue("PUT", `/api/v1/goals/${id}`, goalToPayload(updated));
  syncWorker.poke();
}

export function markGoalAchieved(id: string): void {
  const existing = localStore.get<Goal>("goals", id);
  if (!existing || existing.achievedAt !== null) return;
  const updated: Goal = { ...existing, achievedAt: nowIso(), updatedAt: nowIso() };
  localStore.put("goals", updated);
  queue.enqueue("PUT", `/api/v1/goals/${id}`, goalToPayload(updated));
  syncWorker.poke();
}

export function unmarkGoalAchieved(id: string): void {
  const existing = localStore.get<Goal>("goals", id);
  if (!existing) return;
  const updated: Goal = { ...existing, achievedAt: null, updatedAt: nowIso() };
  localStore.put("goals", updated);
  queue.enqueue("PUT", `/api/v1/goals/${id}`, goalToPayload(updated));
  syncWorker.poke();
}

export function deleteGoal(id: string): void {
  localStore.remove("goals", id);
  queue.enqueue("DELETE", `/api/v1/goals/${id}`);
  syncWorker.poke();
}
