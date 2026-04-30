import { useEffect, useRef } from "react";
import {
  bestEstimated1RMForExercise,
  latestBodyMeasurementValue,
  setGoalStartValue,
  useGoals,
} from "./useGoals";
import type { Goal } from "@/types/goal";

// Lazy-fill startValue when a goal was created before the user had any data.
// Once the user logs the first measurement / set, snapshot it so the progress
// bar has a real anchor going forward.
export function useGoalStartValueBackfill(): void {
  const goals = useGoals();
  const filledRef = useRef<Set<string>>(new Set());

  useEffect(() => {
    for (const g of goals) {
      if (g.startValue != null) continue; // already has a baseline
      if (filledRef.current.has(g.id)) continue;
      const value = computeStartFor(g);
      if (value == null) continue;
      filledRef.current.add(g.id);
      setGoalStartValue(g.id, value.toFixed(3));
    }
  }, [goals]);
}

function computeStartFor(goal: Goal): number | null {
  if (goal.targetType === "lift" && goal.exerciseId) {
    return bestEstimated1RMForExercise(goal.exerciseId);
  }
  if (goal.targetType === "body" && goal.metric) {
    return latestBodyMeasurementValue(goal.metric);
  }
  return null;
}
