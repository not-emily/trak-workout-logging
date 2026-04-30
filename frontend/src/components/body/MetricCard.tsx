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
      className="flex items-center justify-between gap-3 rounded-xl bg-white p-3 ring-1 ring-gray-200 hover:bg-gray-50"
    >
      <div className="flex flex-col">
        <span className="text-xs font-medium uppercase tracking-wide text-gray-500">{label}</span>
        <span className="text-lg font-semibold text-gray-900">
          {measurement.value} <span className="text-sm font-normal text-gray-500">{measurement.unit}</span>
        </span>
        <span className="text-xs text-gray-400">
          {recorded.toLocaleDateString(undefined, { month: "short", day: "numeric" })}
        </span>
      </div>
      <ChevronRight className="h-4 w-4 text-gray-400" />
    </Link>
  );
}
