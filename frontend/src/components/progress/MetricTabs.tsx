import type { ExerciseKind } from "@/types/exercise";

export type StrengthMetric = "weight" | "volume" | "est1RM";
export type BodyweightMetric = "reps";
export type CardioMetric = "pace" | "distance" | "duration";
export type Metric = StrengthMetric | BodyweightMetric | CardioMetric;

const LABELS: Record<Metric, string> = {
  weight: "Weight",
  volume: "Volume",
  est1RM: "Est. 1RM",
  reps: "Reps",
  pace: "Pace",
  distance: "Distance",
  duration: "Duration",
};

function metricsFor(kind: ExerciseKind): Metric[] {
  if (kind === "strength") return ["weight", "volume", "est1RM"];
  if (kind === "bodyweight") return ["reps"];
  return ["pace", "distance", "duration"];
}

export function defaultMetric(kind: ExerciseKind): Metric {
  if (kind === "strength") return "weight";
  if (kind === "bodyweight") return "reps";
  return "distance";
}

type Props = {
  kind: ExerciseKind;
  value: Metric;
  onChange: (m: Metric) => void;
};

export function MetricTabs({ kind, value, onChange }: Props) {
  const metrics = metricsFor(kind);
  if (metrics.length <= 1) return null;
  return (
    <div className="inline-flex gap-1 rounded-full bg-gray-100 p-1">
      {metrics.map((m) => {
        const active = m === value;
        return (
          <button
            key={m}
            type="button"
            onClick={() => onChange(m)}
            className={`rounded-full px-3 py-1 text-sm font-medium transition-colors ${
              active ? "bg-white text-gray-900 shadow-sm" : "text-gray-500"
            }`}
          >
            {LABELS[m]}
          </button>
        );
      })}
    </div>
  );
}
