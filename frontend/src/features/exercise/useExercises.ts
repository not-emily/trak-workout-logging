import { useEffect, useSyncExternalStore } from "react";
import { apiClient } from "@/sync/apiClient";
import { localStore } from "@/sync/localStore";
import { queue } from "@/sync/queue";
import { syncWorker } from "@/sync/syncWorker";
import type { ApiSuccess } from "@/types/api";
import type { Exercise, ExerciseInput } from "@/types/exercise";

type ExerciseFilters = {
  kind?: string;
  muscleGroup?: string;
  equipment?: string;
};

function applyFilters(exercises: Exercise[], filters: ExerciseFilters): Exercise[] {
  let result = exercises;
  if (filters.kind) result = result.filter((e) => e.kind === filters.kind);
  if (filters.muscleGroup) result = result.filter((e) => e.muscleGroups.includes(filters.muscleGroup!));
  if (filters.equipment) result = result.filter((e) => e.equipment === filters.equipment);
  return result.sort((a, b) => a.name.localeCompare(b.name));
}

// Derived from the data, not a fixed list — custom exercises take free-text
// equipment, so anything hardcoded would silently drop them from the filter.
function distinctEquipment(exercises: Exercise[]): string[] {
  const seen = new Set<string>();
  for (const e of exercises) {
    if (e.equipment) seen.add(e.equipment);
  }
  return [...seen].sort((a, b) => a.localeCompare(b));
}

function subscribeToExercises(cb: () => void): () => void {
  return localStore.subscribe("exercises", cb);
}

function getAllExercises(): Exercise[] {
  return localStore.list<Exercise>("exercises");
}

let lastHydrate = 0;

async function hydrateFromServer(): Promise<void> {
  // Throttle hydration to once every 30s to avoid hammering on remount.
  const now = Date.now();
  if (now - lastHydrate < 30_000) return;
  try {
    const body = (await apiClient.get("/api/v1/exercises")) as ApiSuccess<Exercise[]>;
    localStore.replace("exercises", body.data);
    // Stamped only on success. Stamping before the request would let a
    // transient failure consume the throttle window and pin stale data.
    lastHydrate = Date.now();
  } catch (err) {
    // Keep showing whatever's in localStore — but don't fail silently.
    console.warn("[trak] exercises hydration failed; showing cached data", err);
  }
}

export function useExercises(filters: ExerciseFilters = {}) {
  const exercises = useSyncExternalStore(subscribeToExercises, getAllExercises, getAllExercises);

  useEffect(() => {
    hydrateFromServer();
  }, []);

  return {
    exercises: applyFilters(exercises, filters),
    // Options come off the unfiltered set so the dropdown doesn't shrink out
    // from under the current selection as other filters change.
    equipmentOptions: distinctEquipment(exercises),
    refetch: () => {
      lastHydrate = 0;
      return hydrateFromServer();
    },
  };
}

export function getExerciseById(id: string): Exercise | null {
  return localStore.get<Exercise>("exercises", id);
}

// Upsert: write to local first (instant), enqueue server sync.
export function upsertExercise(id: string, input: ExerciseInput): Exercise {
  const existing = localStore.get<Exercise>("exercises", id);
  const now = new Date().toISOString();
  const optimistic: Exercise = {
    id,
    name: input.name,
    kind: input.kind,
    muscleGroups: input.muscleGroups,
    equipment: input.equipment ?? null,
    instructions: input.instructions ?? null,
    level: existing?.level ?? null,
    isSystem: false,
    ownerUserId: existing?.ownerUserId ?? null,
    createdAt: existing?.createdAt ?? now,
    updatedAt: now,
  };
  localStore.put("exercises", optimistic);
  queue.enqueue("PUT", `/api/v1/exercises/${id}`, input);
  syncWorker.poke();
  return optimistic;
}

export function deleteExercise(id: string): void {
  localStore.remove("exercises", id);
  queue.enqueue("DELETE", `/api/v1/exercises/${id}`);
  syncWorker.poke();
}
