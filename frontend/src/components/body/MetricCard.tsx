import { Link } from "react-router";
import { ChevronRight } from "lucide-react";
import { formatMetricLabel, type BodyMeasurement } from "@/types/bodyMeasurement";

type Props = { measurement: BodyMeasurement };

export function MetricCard({ measurement }: Props) {
  const label = formatMetricLabel(measurement.metric);
  const recorded = new Date(measurement.recordedAt);
  return (
    <Link
      to={`/body/${measurement.metric}`}
      className="group flex items-center justify-between gap-3 rounded-xl border border-line bg-surface-1 p-4 transition-colors hover:border-line-strong hover:bg-surface-2"
    >
      <div className="flex flex-col">
        <span className="text-[10px] font-semibold uppercase tracking-[0.18em] text-fg-subtle">
          {label}
        </span>
        <span className="mt-1 flex items-baseline gap-1.5">
          <span className="font-display text-2xl leading-none text-fg">
            {measurement.value}
          </span>
          <span className="font-mono text-xs uppercase tracking-wide text-fg-muted">
            {measurement.unit}
          </span>
        </span>
        <span className="mt-1.5 text-[11px] text-fg-faint">
          {recorded.toLocaleDateString(undefined, { month: "short", day: "numeric" })}
        </span>
      </div>
      <ChevronRight className="h-4 w-4 text-fg-faint transition-transform group-hover:translate-x-0.5 group-hover:text-fg-muted" />
    </Link>
  );
}
