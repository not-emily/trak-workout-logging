import { useCallback, useEffect, useState } from "react";
import { apiClient } from "@/sync/apiClient";
import type { ApiSuccess } from "@/types/api";
import type { Exercise, ExerciseInput } from "@/types/exercise";

type ExerciseFilters = {
  kind?: string;
  muscleGroup?: string;
};

function buildQuery(filters: ExerciseFilters): string {
  const params = new URLSearchParams();
  if (filters.kind) params.set("kind", filters.kind);
  if (filters.muscleGroup) params.set("muscle_group", filters.muscleGroup);
  const q = params.toString();
  return q ? `?${q}` : "";
}

export function useExercises(filters: ExerciseFilters = {}) {
  const [exercises, setExercises] = useState<Exercise[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const queryKey = `${filters.kind || ""}|${filters.muscleGroup || ""}`;

  const refetch = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const body = (await apiClient.get(`/api/v1/exercises${buildQuery(filters)}`)) as ApiSuccess<Exercise[]>;
      setExercises(body.data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load exercises");
    } finally {
      setLoading(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [queryKey]);

  useEffect(() => {
    refetch();
  }, [refetch]);

  return { exercises, loading, error, refetch };
}

export async function upsertExercise(id: string, input: ExerciseInput): Promise<Exercise> {
  const body = (await apiClient.put(`/api/v1/exercises/${id}`, input)) as ApiSuccess<Exercise>;
  return body.data;
}

export async function deleteExercise(id: string): Promise<void> {
  await apiClient.delete(`/api/v1/exercises/${id}`);
}
