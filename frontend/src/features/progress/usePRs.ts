import { useMemo } from "react";
import { findPRs, type ExercisePRs } from "@/lib/prs";
import { useExerciseCompletedSets } from "./useExerciseHistory";
import type { ExerciseKind } from "@/types/exercise";

export function usePRs(exerciseId: string | undefined, kind: ExerciseKind): ExercisePRs {
  const sets = useExerciseCompletedSets(exerciseId);
  return useMemo(() => findPRs(sets, kind), [sets, kind]);
}
