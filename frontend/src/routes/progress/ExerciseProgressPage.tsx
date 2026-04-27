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
        <p className="text-sm text-gray-500">Exercise not found.</p>
      </div>
    );
  }

  return (
    <div className="mx-auto flex max-w-3xl flex-col gap-4 px-4 pt-6 pb-8">
      <Link to="/progress" className="flex items-center gap-1 text-sm text-gray-600">
        <ArrowLeft className="h-4 w-4" />
        Back
      </Link>

      <header className="flex flex-col gap-1">
        <h1 className="text-2xl font-semibold text-gray-900">{exercise.name}</h1>
        <span className="text-xs uppercase tracking-wide text-gray-500">{exercise.kind}</span>
      </header>

      <MetricTabs kind={exercise.kind} value={metric} onChange={setMetric} />

      <div className="rounded-xl bg-white p-3 ring-1 ring-gray-200">
        <LineChart
          data={points}
          yFormatter={yFormatterFor(metric)}
        />
      </div>

      <section className="flex flex-col gap-2">
        <h2 className="text-sm font-medium text-gray-700">Personal records</h2>
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
      // sec/m → display as min/km
      return (n) => `${formatDuration(Math.round(n * 1000))}/km`;
  }
}
