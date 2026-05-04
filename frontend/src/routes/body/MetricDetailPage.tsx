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
      <Link
        to="/body"
        className="flex w-fit items-center gap-1 text-xs font-semibold uppercase tracking-[0.18em] text-fg-subtle transition-colors hover:text-fg-muted"
      >
        <ArrowLeft className="h-3.5 w-3.5" />
        Back
      </Link>

      <div className="flex items-start justify-between gap-3">
        <div className="flex min-w-0 flex-col gap-1">
          <h1 className="truncate font-display text-3xl leading-none text-fg-soft">
            {formatMetricLabel(validMetric)}
          </h1>
          <span className="text-[11px] font-semibold uppercase tracking-[0.18em] text-body-accent">
            Body metric
          </span>
        </div>
        <button
          type="button"
          onClick={() => setLogOpen(true)}
          className="flex shrink-0 items-center gap-1.5 rounded-full bg-accent px-4 py-2 text-sm font-semibold text-accent-fg transition-colors hover:bg-accent-hover"
        >
          <Plus className="h-4 w-4" strokeWidth={2.5} />
          Log
        </button>
      </div>

      {points.length > 0 && (
        <div className="rounded-xl border border-line bg-surface-1 p-3">
          <LineChart
            data={points}
            yFormatter={(n) => `${n} ${unit}`}
            color="var(--color-body-accent)"
          />
        </div>
      )}

      <section className="mt-2 flex flex-col gap-3">
        <h2 className="text-[11px] font-semibold uppercase tracking-[0.18em] text-fg-subtle">
          History
        </h2>
        {measurements.length === 0 ? (
          <p className="text-sm text-fg-muted">No entries yet.</p>
        ) : (
          <ul className="flex flex-col gap-1.5">
            {measurements.map((m) => (
              <li key={m.id}>
                <Swipeable
                  left={{
                    icon: Trash2,
                    bg: "bg-danger",
                    onTrigger: () => deleteMeasurement(m.id),
                  }}
                >
                  <div className="flex items-center justify-between gap-3 rounded-lg border border-line bg-surface-1 p-3">
                    <span className="font-mono text-[11px] uppercase tracking-wide text-fg-muted">
                      {new Date(m.recordedAt).toLocaleString(undefined, {
                        month: "short",
                        day: "numeric",
                        hour: "numeric",
                        minute: "2-digit",
                      })}
                    </span>
                    <span className="flex items-baseline gap-1.5">
                      <span className="font-mono text-base font-medium text-fg-soft tabular-nums">
                        {m.value}
                      </span>
                      <span className="font-mono text-xs uppercase text-fg-muted">{m.unit}</span>
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
        maxWidth="md:max-w-3xl"
      />
    </div>
  );
}
