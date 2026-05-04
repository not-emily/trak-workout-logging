import { Link } from "react-router";
import { Trophy, ChevronRight } from "lucide-react";
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
      className={`group relative flex flex-col gap-2.5 overflow-hidden rounded-xl border p-4 transition-colors ${
        isAchieved
          ? "border-gold/30 bg-surface-1 hover:bg-surface-2"
          : "border-line bg-surface-1 hover:border-line-strong hover:bg-surface-2"
      }`}
    >
      {isAchieved && (
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0 opacity-50"
          style={{
            background:
              "radial-gradient(ellipse 70% 80% at 0% 0%, var(--color-gold-soft), transparent 60%)",
          }}
        />
      )}
      <div className="relative flex items-start justify-between gap-2">
        <div className="flex min-w-0 flex-1 flex-col">
          <span className="truncate font-display text-base text-fg-soft">{goal.name}</span>
          <span className="truncate text-[11px] text-fg-muted">{subtitle(goal, exerciseName)}</span>
        </div>
        {isAchieved ? (
          <span className="flex shrink-0 items-center gap-1 rounded-full border border-gold/30 bg-gold-soft px-2 py-0.5 text-[10px] font-semibold uppercase tracking-[0.18em] text-gold">
            <Trophy className="h-3 w-3" strokeWidth={2.5} />
            Achieved
          </span>
        ) : (
          <ChevronRight className="h-4 w-4 shrink-0 text-fg-faint transition-transform group-hover:translate-x-0.5 group-hover:text-fg-muted" />
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
  const filled = achieved || progress.isAchieved;
  return (
    <div className="relative flex flex-col gap-1.5">
      <div className="h-1.5 overflow-hidden rounded-full bg-surface-3">
        <div
          className={`h-full rounded-full transition-all ${filled ? "bg-gold" : "bg-accent"}`}
          style={{ width: `${display}%` }}
        />
      </div>
      <div className="flex items-baseline justify-between text-[11px] text-fg-muted">
        <span>
          {currentLabel && <span className="text-fg-subtle">{currentLabel} </span>}
          <span className="font-mono font-medium text-fg-soft tabular-nums">
            {formatNum(progress.current)}
          </span>{" "}
          / {formatNum(progress.target)} {unit}
        </span>
        <span className="font-mono tabular-nums">{Math.round(display)}%</span>
      </div>
    </div>
  );
}

function formatNum(n: number): string {
  if (Number.isInteger(n)) return n.toString();
  return n.toFixed(1);
}
