import { Link } from "react-router";
import { Check, ChevronRight } from "lucide-react";
import type { Goal } from "@/types/goal";
import type { GoalProgress } from "@/features/goal/useGoalProgress";
import { useExercises } from "@/features/exercise/useExercises";
import { formatMetricLabel, type BodyMetric } from "@/types/bodyMeasurement";

type Props = {
  goal: Goal;
  progress: GoalProgress;
};

export function GoalCard({ goal, progress }: Props) {
  const { exercises } = useExercises();
  const exerciseName = goal.exerciseId
    ? exercises.find((e) => e.id === goal.exerciseId)?.name
    : null;
  const isAchieved = goal.achievedAt !== null;

  return (
    <Link
      to={`/goals/${goal.id}`}
      className="flex flex-col gap-2 rounded-xl bg-white p-3 ring-1 ring-gray-200 hover:bg-gray-50"
    >
      <div className="flex items-start justify-between gap-2">
        <div className="flex flex-1 flex-col">
          <span className="font-medium text-gray-900">{goal.name}</span>
          <span className="text-xs text-gray-500">{subtitle(goal, exerciseName)}</span>
        </div>
        {isAchieved ? (
          <span className="flex items-center gap-1 rounded-full bg-green-100 px-2 py-0.5 text-xs font-medium text-green-700">
            <Check className="h-3 w-3" />
            Achieved
          </span>
        ) : (
          <ChevronRight className="h-4 w-4 shrink-0 text-gray-400" />
        )}
      </div>

      <ProgressBar
        progress={progress}
        achieved={isAchieved}
        unit={goal.unit}
        currentLabel={goal.targetType === "lift" ? "Est. 1RM" : null}
      />
    </Link>
  );
}

function subtitle(goal: Goal, exerciseName: string | null | undefined): string {
  if (goal.targetType === "lift" && exerciseName) {
    return `${exerciseName} · ${goal.direction === "increase" ? "→" : "↓"} ${goal.targetValue} ${goal.unit}`;
  }
  if (goal.targetType === "body" && goal.metric) {
    return `${formatMetricLabel(goal.metric as BodyMetric)} · ${goal.direction === "increase" ? "→" : "↓"} ${goal.targetValue} ${goal.unit}`;
  }
  if (goal.targetType === "frequency") {
    return `${goal.targetValue} ${goal.unit} per week`;
  }
  return goal.targetType;
}

function ProgressBar({
  progress,
  achieved,
  unit,
  currentLabel,
}: {
  progress: GoalProgress;
  achieved: boolean;
  unit: string;
  currentLabel: string | null;
}) {
  const display = achieved ? 100 : progress.percent;
  return (
    <div className="flex flex-col gap-1">
      <div className="h-1.5 overflow-hidden rounded-full bg-gray-100">
        <div
          className={`h-full rounded-full transition-all ${
            achieved || progress.isAchieved ? "bg-green-500" : "bg-black"
          }`}
          style={{ width: `${display}%` }}
        />
      </div>
      <div className="flex items-baseline justify-between text-xs text-gray-500">
        <span>
          {currentLabel && <span className="text-gray-500">{currentLabel} </span>}
          <strong className="font-semibold text-gray-900">{formatNum(progress.current)}</strong> / {formatNum(progress.target)} {unit}
        </span>
        <span>{Math.round(display)}%</span>
      </div>
    </div>
  );
}

function formatNum(n: number): string {
  if (Number.isInteger(n)) return n.toString();
  return n.toFixed(1);
}
