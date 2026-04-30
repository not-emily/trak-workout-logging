import { useMemo } from "react";
import { Link, Navigate, useNavigate, useParams } from "react-router";
import { ArrowLeft, Check, Pencil } from "lucide-react";
import { LineChart } from "@/components/charts/LineChart";
import { useExercises } from "@/features/exercise/useExercises";
import { useExerciseHistory } from "@/features/progress/useExerciseHistory";
import { useGoal } from "@/features/goal/useGoals";
import { useGoalProgress } from "@/features/goal/useGoalProgress";
import { useMeasurementsForMetric } from "@/features/body/useBodyMeasurements";
import { useSessions } from "@/features/session/useSessions";
import { estimated1RM } from "@/lib/prs";
import { formatMetricLabel, type BodyMetric } from "@/types/bodyMeasurement";

export function GoalDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const goal = useGoal(id);
  const progress = useGoalProgress(goal);

  if (!id || !goal) return <Navigate to="/goals" replace />;
  if (!progress) return null;

  const isAchieved = goal.achievedAt !== null;
  const currentLabel = goal.targetType === "lift" ? "Est. 1RM" : "Current";

  return (
    <div className="mx-auto flex max-w-3xl flex-col gap-4 px-4 pt-6 pb-8">
      <Link to="/goals" className="flex items-center gap-1 text-sm text-gray-600">
        <ArrowLeft className="h-4 w-4" />
        Back
      </Link>

      <div className="flex items-start justify-between gap-3">
        <div className="flex flex-1 flex-col">
          <h1 className="text-2xl font-semibold text-gray-900">{goal.name}</h1>
          <span className="text-sm text-gray-500">
            <Subtitle goal={goal} />
          </span>
        </div>
        <div className="flex items-center gap-2">
          {isAchieved && (
            <span className="flex items-center gap-1 rounded-full bg-green-100 px-2 py-1 text-xs font-medium text-green-700">
              <Check className="h-3 w-3" />
              Achieved
            </span>
          )}
          <button
            type="button"
            onClick={() => navigate(`/goals/${id}/edit`)}
            aria-label="Edit goal"
            className="flex h-9 w-9 items-center justify-center rounded-full bg-gray-100 text-gray-700"
          >
            <Pencil className="h-4 w-4" />
          </button>
        </div>
      </div>

      <section className="rounded-xl bg-white p-4 ring-1 ring-gray-200">
        <div className="flex items-baseline justify-between gap-3">
          <div>
            <div className="text-xs font-medium uppercase tracking-wide text-gray-500">
              {currentLabel}
            </div>
            <div className="text-3xl font-semibold text-gray-900">
              {formatNum(progress.current)}{" "}
              <span className="text-base font-normal text-gray-500">{goal.unit}</span>
            </div>
          </div>
          <div className="text-right">
            <div className="text-xs font-medium uppercase tracking-wide text-gray-500">Target</div>
            <div className="text-2xl font-semibold text-gray-900">
              {goal.direction === "decrease" ? "≤ " : "≥ "}
              {formatNum(progress.target)}{" "}
              <span className="text-base font-normal text-gray-500">{goal.unit}</span>
            </div>
          </div>
        </div>

        <div className="mt-3 h-2 overflow-hidden rounded-full bg-gray-100">
          <div
            className={`h-full rounded-full transition-all ${
              isAchieved || progress.isAchieved ? "bg-green-500" : "bg-black"
            }`}
            style={{ width: `${isAchieved ? 100 : progress.percent}%` }}
          />
        </div>
        <div className="mt-2 flex items-center justify-between text-xs text-gray-500">
          {progress.start != null ? (
            <span>
              Started at <strong className="font-medium text-gray-700">{formatNum(progress.start)} {goal.unit}</strong>
            </span>
          ) : (
            <span className="italic text-gray-400">No baseline yet</span>
          )}
          <span>{Math.round(isAchieved ? 100 : progress.percent)}%</span>
        </div>
      </section>

      <GoalChart goal={goal} />
    </div>
  );
}

function Subtitle({ goal }: { goal: ReturnType<typeof useGoal> }) {
  const { exercises } = useExercises();
  if (!goal) return null;
  if (goal.targetType === "lift" && goal.exerciseId) {
    const ex = exercises.find((e) => e.id === goal.exerciseId);
    return <>Lift goal · {ex?.name ?? "Unknown exercise"}</>;
  }
  if (goal.targetType === "body" && goal.metric) {
    return <>Body goal · {formatMetricLabel(goal.metric as BodyMetric)}</>;
  }
  if (goal.targetType === "frequency") {
    return <>Frequency goal · sessions per week</>;
  }
  return <>{goal.targetType}</>;
}

function GoalChart({ goal }: { goal: NonNullable<ReturnType<typeof useGoal>> }) {
  if (goal.targetType === "lift") return <LiftChart goal={goal} />;
  if (goal.targetType === "body") return <BodyChart goal={goal} />;
  if (goal.targetType === "frequency") return <FrequencyChart />;
  return null;
}

function LiftChart({ goal }: { goal: NonNullable<ReturnType<typeof useGoal>> }) {
  const history = useExerciseHistory(goal.exerciseId ?? undefined);

  // Best e1RM per session date.
  const points = useMemo(() => {
    const bestByDay = new Map<string, { x: Date; y: number }>();
    for (const { set, date } of history) {
      if (set.isWarmup || set.completedAt === null) continue;
      if (set.weightLb == null || set.weightLb === "" || set.reps == null || set.reps <= 0) continue;
      const w = Number.parseFloat(set.weightLb);
      if (w <= 0) continue;
      const e = estimated1RM(w, set.reps);
      const key = date.toISOString().slice(0, 10);
      const existing = bestByDay.get(key);
      if (!existing || e > existing.y) bestByDay.set(key, { x: date, y: e });
    }
    return Array.from(bestByDay.values()).sort((a, b) => a.x.getTime() - b.x.getTime());
  }, [history]);

  return (
    <ChartCard title="Estimated 1RM over time" empty={points.length === 0}>
      <LineChart data={points} yFormatter={(n) => `${Math.round(n)} ${goal.unit}`} />
    </ChartCard>
  );
}

function BodyChart({ goal }: { goal: NonNullable<ReturnType<typeof useGoal>> }) {
  const measurements = useMeasurementsForMetric((goal.metric ?? "") as BodyMetric);
  const points = useMemo(
    () =>
      [...measurements]
        .sort((a, b) => new Date(a.recordedAt).getTime() - new Date(b.recordedAt).getTime())
        .map((m) => ({ x: new Date(m.recordedAt), y: Number.parseFloat(m.value) })),
    [measurements],
  );
  return (
    <ChartCard title={`${formatMetricLabel((goal.metric ?? "weight") as BodyMetric)} over time`} empty={points.length === 0}>
      <LineChart data={points} yFormatter={(n) => `${formatNum(n)} ${goal.unit}`} />
    </ChartCard>
  );
}

const ONE_DAY_MS = 24 * 60 * 60 * 1000;
const WEEKS_TO_SHOW = 8;

function FrequencyChart() {
  const sessions = useSessions();
  const weeks = useMemo(() => {
    // Last 8 weeks ending today (rolling). Each window is 7 days wide.
    const now = Date.now();
    const buckets: { start: Date; end: Date; count: number }[] = [];
    for (let i = WEEKS_TO_SHOW - 1; i >= 0; i--) {
      const end = new Date(now - i * 7 * ONE_DAY_MS);
      const start = new Date(end.getTime() - 7 * ONE_DAY_MS);
      let count = 0;
      for (const s of sessions) {
        if (!s.endedAt) continue;
        const t = new Date(s.endedAt).getTime();
        if (t >= start.getTime() && t < end.getTime()) count++;
      }
      buckets.push({ start, end, count });
    }
    return buckets;
  }, [sessions]);

  const max = Math.max(1, ...weeks.map((w) => w.count));

  return (
    <ChartCard title="Sessions per week (last 8 weeks)" empty={false}>
      <ul className="flex flex-col gap-1.5">
        {weeks.map((w) => (
          <li key={w.end.toISOString()} className="flex items-center gap-3 text-sm">
            <span className="w-20 shrink-0 text-xs text-gray-500">
              {w.end.toLocaleDateString(undefined, { month: "short", day: "numeric" })}
            </span>
            <div className="relative h-5 flex-1 overflow-hidden rounded bg-gray-100">
              <div
                className="h-full bg-black transition-all"
                style={{ width: `${(w.count / max) * 100}%` }}
              />
            </div>
            <span className="w-6 shrink-0 text-right font-medium text-gray-900">{w.count}</span>
          </li>
        ))}
      </ul>
    </ChartCard>
  );
}

function ChartCard({
  title,
  empty,
  children,
}: {
  title: string;
  empty: boolean;
  children: React.ReactNode;
}) {
  return (
    <section className="flex flex-col gap-2">
      <h2 className="text-sm font-medium text-gray-700">{title}</h2>
      <div className="rounded-xl bg-white p-3 ring-1 ring-gray-200">
        {empty ? (
          <div className="flex h-44 items-center justify-center text-sm text-gray-500">
            No data yet.
          </div>
        ) : (
          children
        )}
      </div>
    </section>
  );
}

function formatNum(n: number): string {
  if (Number.isInteger(n)) return n.toString();
  return n.toFixed(1);
}
