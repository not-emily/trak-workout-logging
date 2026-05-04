import { useEffect, useRef } from "react";
import { toast } from "@/components/ui/Toast";
import { useGoals, markGoalAchieved } from "./useGoals";
import { useGoalProgresses } from "./useGoalProgress";

// App-wide watcher: any unachieved goal whose progress crosses 100% gets marked
// achieved (server-synced) and fires a celebration toast. Runs against local
// data so it works offline.
export function useGoalAchievementDetection(): void {
  const goals = useGoals();
  const progresses = useGoalProgresses(goals);
  const initializedRef = useRef(false);
  const seenAchievedRef = useRef<Set<string>>(new Set());

  useEffect(() => {
    // First mount: prime the seen-set with goals that are already achieved so
    // we don't re-toast on app load.
    if (!initializedRef.current) {
      for (const g of goals) {
        if (g.achievedAt !== null) seenAchievedRef.current.add(g.id);
      }
      initializedRef.current = true;
      return;
    }

    for (const g of goals) {
      if (g.achievedAt !== null) {
        seenAchievedRef.current.add(g.id);
        continue;
      }
      // achievedAt was cleared (e.g., user edited target) — re-arm so the
      // detector can fire again if the new definition is satisfied.
      seenAchievedRef.current.delete(g.id);
      const p = progresses.get(g.id);
      if (!p || !p.isAchieved) continue;
      seenAchievedRef.current.add(g.id);
      markGoalAchieved(g.id);
      const { value, body } = formatGoalAchievement(g.targetType, p.current, p.target, g.unit);
      toast.show({
        variant: "achievement",
        title: `Goal achieved · ${g.name}`,
        value,
        body,
      });
    }
  }, [goals, progresses]);
}

function formatGoalAchievement(
  targetType: "lift" | "body" | "frequency",
  current: number,
  target: number,
  unit: string,
): { value: string; body: string } {
  if (targetType === "lift") {
    return { value: `${Math.round(current)} ${unit}`, body: `target ${target} ${unit}` };
  }
  if (targetType === "frequency") {
    return { value: `${current} ${unit}`, body: `target ${target} this week` };
  }
  return { value: `${current} ${unit}`, body: `target ${target} ${unit}` };
}
