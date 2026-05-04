import { useMemo } from "react";
import { Link, Navigate, useNavigate, useParams } from "react-router";
import { ArrowLeft, Trophy, Pencil } from "lucide-react";
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
      <Link
        to="/goals"
        className="flex w-fit items-center gap-1 text-xs font-semibold uppercase tracking-[0.18em] text-fg-subtle transition-colors hover:text-fg-muted"
      >
        <ArrowLeft className="h-3.5 w-3.5" />
        Back
      </Link>

      <div className="flex items-start justify-between gap-3">
        <div className="flex min-w-0 flex-1 flex-col gap-1">
          <h1 className="truncate font-display text-3xl leading-none text-fg-soft">
            {goal.name}
          </h1>
          <span className="text-xs font-semibold uppercase tracking-[0.18em] text-fg-subtle">
            <Subtitle goal={goal} />
          </span>
        </div>
        <div className="flex shrink-0 items-center gap-2">
          {isAchieved && (
            <span className="flex items-center gap-1 rounded-full border border-gold/30 bg-gold-soft px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.18em] text-gold">
              <Trophy className="h-3 w-3" strokeWidth={2.5} />
              Achieved
            </span>
          )}
          <button
            type="button"
            onClick={() => navigate(`/goals/${id}/edit`)}
            aria-label="Edit goal"
            className="flex h-9 w-9 items-center justify-center rounded-full bg-surface-2 text-fg-muted transition-colors hover:bg-surface-3 hover:text-fg"
          >
            <Pencil className="h-4 w-4" />
          </button>
        </div>
      </div>

      <section
        className={`relative overflow-hidden rounded-2xl border p-5 ${
          isAchieved ? "border-gold/30 bg-surface-1" : "border-line bg-surface-1"
        }`}
      >
        {isAchieved && (
          <div
            aria-hidden
            className="pointer-events-none absolute inset-0 opacity-50"
            style={{
              background:
                "radial-gradient(ellipse 80% 100% at 0% 0%, var(--color-gold-soft), transparent 60%)",
            }}
          />
        )}
        <div className="relative flex items-baseline justify-between gap-3">
          <div>
            <div
              className={`text-[10px] font-semibold uppercase tracking-[0.18em] ${
                isAchieved ? "text-gold" : "text-fg-subtle"
              }`}
            >
              {currentLabel}
            </div>
            <div
              className={`mt-1.5 font-display leading-none tabular ${
                isAchieved ? "text-4xl text-fg" : "text-4xl text-fg-soft"
              }`}
            >
              {formatNum(progress.current)}{" "}
              <span className="font-mono text-sm uppercase text-fg-muted">{goal.unit}</span>
            </div>
          </div>
          <div className="text-right">
            <div className="text-[10px] font-semibold uppercase tracking-[0.18em] text-fg-subtle">
              Target
            </div>
            <div className="mt-1.5 font-display text-2xl leading-none text-fg-soft tabular">
              {goal.direction === "decrease" ? "≤ " : "≥ "}
              {formatNum(progress.target)}{" "}
              <span className="font-mono text-xs uppercase text-fg-muted">{goal.unit}</span>
            </div>
          </div>
        </div>

        <div className="relative mt-4 h-2 overflow-hidden rounded-full bg-surface-3">
          <div
            className={`h-full rounded-full transition-all ${
              isAchieved || progress.isAchieved ? "bg-gold" : "bg-accent"
            }`}
            style={{ width: `${isAchieved ? 100 : progress.percent}%` }}
          />
        </div>
        <div className="relative mt-2 flex items-center justify-between text-[11px] text-fg-muted">
          {progress.start != null ? (
            <span>
              Started at{" "}
              <span className="font-mono font-medium text-fg-soft tabular-nums">
                {formatNum(progress.start)} {goal.unit}
              </span>
            </span>
          ) : (
            <span className="text-fg-faint">No baseline yet</span>
          )}
          <span className="font-mono tabular-nums">
            {Math.round(isAchieved ? 100 : progress.percent)}%
          </span>
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
      <LineChart
        data={points}
        yFormatter={(n) => `${Math.round(n)} ${goal.unit}`}
        color="var(--color-strength)"
      />
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
    <ChartCard
      title={`${formatMetricLabel((goal.metric ?? "weight") as BodyMetric)} over time`}
      empty={points.length === 0}
    >
      <LineChart
        data={points}
        yFormatter={(n) => `${formatNum(n)} ${goal.unit}`}
        color="var(--color-body-accent)"
      />
    </ChartCard>
  );
}

const ONE_DAY_MS = 24 * 60 * 60 * 1000;
const WEEKS_TO_SHOW = 8;

function FrequencyChart() {
  const sessions = useSessions();
  const weeks = useMemo(() => {
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
        {weeks.map((w, i) => {
          const isCurrentWeek = i === weeks.length - 1;
          return (
            <li key={w.end.toISOString()} className="flex items-center gap-3">
              <span className="w-20 shrink-0 font-mono text-[11px] uppercase tracking-wide text-fg-muted">
                {w.end.toLocaleDateString(undefined, { month: "short", day: "numeric" })}
              </span>
              <div className="relative h-5 flex-1 overflow-hidden rounded bg-surface-2">
                <div
                  className={`h-full transition-all ${isCurrentWeek ? "bg-accent" : "bg-fg-faint"}`}
                  style={{ width: `${(w.count / max) * 100}%` }}
                />
              </div>
              <span className="w-6 shrink-0 text-right font-mono text-sm font-medium text-fg-soft tabular-nums">
                {w.count}
              </span>
            </li>
          );
        })}
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
    <section className="flex flex-col gap-3">
      <h2 className="text-[11px] font-semibold uppercase tracking-[0.18em] text-fg-subtle">
        {title}
      </h2>
      <div className="rounded-xl border border-line bg-surface-1 p-3">
        {empty ? (
          <div className="flex h-44 items-center justify-center text-sm text-fg-muted">
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
