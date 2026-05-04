import { useMemo, useState } from "react";
import { Link, Navigate, useParams } from "react-router";
import { ArrowLeft } from "lucide-react";
import { useExercises } from "@/features/exercise/useExercises";
import { useExerciseCompletedSets } from "@/features/progress/useExerciseHistory";
import { usePRs } from "@/features/progress/usePRs";
import { seriesForMetric } from "@/features/progress/seriesForMetric";
import { LineChart } from "@/components/charts/LineChart";
import { MetricTabs, defaultMetric, type Metric } from "@/components/progress/MetricTabs";
import { PRCardList } from "@/components/progress/PRCard";
import { formatDuration } from "@/lib/time";
import type { ExerciseKind } from "@/types/exercise";

const KIND_DOT_BG: Record<ExerciseKind, string> = {
  strength: "bg-strength",
  cardio: "bg-cardio",
  bodyweight: "bg-bodyweight",
};

const KIND_COLOR: Record<ExerciseKind, string> = {
  strength: "var(--color-strength)",
  cardio: "var(--color-cardio)",
  bodyweight: "var(--color-bodyweight)",
};

export function ExerciseProgressPage() {
  const { id } = useParams<{ id: string }>();
  const { exercises } = useExercises();
  const exercise = exercises.find((e) => e.id === id);
  const sets = useExerciseCompletedSets(id);
  const prs = usePRs(id, exercise?.kind ?? "strength");

  const [metric, setMetric] = useState<Metric>(() => defaultMetric(exercise?.kind ?? "strength"));

  const points = useMemo(() => seriesForMetric(sets, metric), [sets, metric]);

  if (!id) return <Navigate to="/progress" replace />;
  if (!exercise) {
    return (
      <div className="mx-auto max-w-3xl px-4 pt-6 pb-8">
        <p className="text-sm text-fg-muted">Exercise not found.</p>
      </div>
    );
  }

  return (
    <div className="mx-auto flex max-w-3xl flex-col gap-4 px-4 pt-6 pb-8">
      <Link
        to="/progress"
        className="flex w-fit items-center gap-1 text-xs font-semibold uppercase tracking-[0.18em] text-fg-subtle transition-colors hover:text-fg-muted"
      >
        <ArrowLeft className="h-3.5 w-3.5" />
        Back
      </Link>

      <header className="flex items-center gap-2.5">
        <span
          aria-hidden
          className={`h-2 w-2 shrink-0 rounded-full ${KIND_DOT_BG[exercise.kind]}`}
        />
        <div className="flex min-w-0 flex-col">
          <h1 className="truncate font-display text-3xl leading-none text-fg-soft">
            {exercise.name}
          </h1>
          <span className="text-[11px] font-semibold uppercase tracking-[0.18em] text-fg-subtle">
            {exercise.kind}
          </span>
        </div>
      </header>

      <MetricTabs kind={exercise.kind} value={metric} onChange={setMetric} />

      <div className="rounded-xl border border-line bg-surface-1 p-3">
        <LineChart
          data={points}
          yFormatter={yFormatterFor(metric)}
          color={KIND_COLOR[exercise.kind]}
        />
      </div>

      <section className="mt-2 flex flex-col gap-3">
        <h2 className="text-[11px] font-semibold uppercase tracking-[0.18em] text-fg-subtle">
          Personal records
        </h2>
        <PRCardList prs={prs} />
      </section>
    </div>
  );
}

function yFormatterFor(metric: Metric): (n: number) => string {
  switch (metric) {
    case "weight":
      return (n) => `${n} lb`;
    case "est1RM":
      return (n) => `${Math.round(n)} lb`;
    case "volume":
      return (n) => `${Math.round(n).toLocaleString()} lb`;
    case "reps":
      return (n) => `${n}`;
    case "distance":
      return (n) => `${Math.round(n).toLocaleString()} m`;
    case "duration":
      return (n) => formatDuration(Math.round(n));
    case "pace":
      return (n) => `${formatDuration(Math.round(n * 1000))}/km`;
  }
}
