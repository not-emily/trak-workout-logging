import { useMemo, useState } from "react";
import { Link, Navigate, useParams } from "react-router";
import { ArrowLeft, Plus, Trash2 } from "lucide-react";
import { LineChart } from "@/components/charts/LineChart";
import { LogMeasurementSheet } from "@/components/body/LogMeasurementSheet";
import { Swipeable } from "@/components/ui/Swipeable";
import {
  deleteMeasurement,
  useMeasurementsForMetric,
} from "@/features/body/useBodyMeasurements";
import { BODY_METRICS, formatMetricLabel, type BodyMetric } from "@/types/bodyMeasurement";

export function MetricDetailPage() {
  const { metric } = useParams<{ metric: string }>();
  const [logOpen, setLogOpen] = useState(false);

  const validMetric = (BODY_METRICS as readonly string[]).includes(metric ?? "")
    ? (metric as BodyMetric)
    : null;
  const measurements = useMeasurementsForMetric(validMetric ?? "weight");

  const points = useMemo(
    () =>
      validMetric
        ? [...measurements]
            .sort((a, b) => new Date(a.recordedAt).getTime() - new Date(b.recordedAt).getTime())
            .map((m) => ({ x: new Date(m.recordedAt), y: Number.parseFloat(m.value) }))
        : [],
    [measurements, validMetric],
  );

  if (!validMetric) return <Navigate to="/body" replace />;

  const unit = measurements[0]?.unit ?? "";

  return (
    <div className="mx-auto flex max-w-3xl flex-col gap-4 px-4 pt-6 pb-8">
      <Link to="/body" className="flex items-center gap-1 text-sm text-gray-600">
        <ArrowLeft className="h-4 w-4" />
        Back
      </Link>

      <div className="flex items-start justify-between gap-3">
        <h1 className="text-2xl font-semibold">{formatMetricLabel(validMetric)}</h1>
        <button
          type="button"
          onClick={() => setLogOpen(true)}
          className="flex items-center gap-1 rounded-full bg-black px-3 py-1.5 text-sm font-medium text-white"
        >
          <Plus className="h-4 w-4" />
          Log
        </button>
      </div>

      {points.length > 0 && (
        <div className="rounded-xl bg-white p-3 ring-1 ring-gray-200">
          <LineChart data={points} yFormatter={(n) => `${n} ${unit}`} />
        </div>
      )}

      <section className="flex flex-col gap-2">
        <h2 className="text-sm font-medium text-gray-700">History</h2>
        {measurements.length === 0 ? (
          <p className="text-sm text-gray-500">No entries yet.</p>
        ) : (
          <ul className="flex flex-col gap-1.5">
            {measurements.map((m) => (
              <li key={m.id}>
                <Swipeable
                  left={{ icon: Trash2, bg: "bg-red-600", onTrigger: () => deleteMeasurement(m.id) }}
                >
                  <div className="flex items-center justify-between gap-3 rounded-lg bg-white p-3 ring-1 ring-gray-200">
                    <span className="text-sm text-gray-500">
                      {new Date(m.recordedAt).toLocaleString(undefined, {
                        month: "short",
                        day: "numeric",
                        hour: "numeric",
                        minute: "2-digit",
                      })}
                    </span>
                    <span className="text-base font-semibold text-gray-900">
                      {m.value} <span className="text-sm font-normal text-gray-500">{m.unit}</span>
                    </span>
                  </div>
                </Swipeable>
              </li>
            ))}
          </ul>
        )}
      </section>

      <LogMeasurementSheet
        open={logOpen}
        onClose={() => setLogOpen(false)}
        initialMetric={validMetric}
      />
    </div>
  );
}
