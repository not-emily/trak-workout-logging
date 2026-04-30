import { useMemo, useState } from "react";
import { Plus, HeartPulse } from "lucide-react";
import { useLatestPerMetric } from "@/features/body/useBodyMeasurements";
import { LogMeasurementSheet } from "@/components/body/LogMeasurementSheet";
import { MetricCard } from "@/components/body/MetricCard";
import { EmptyState } from "@/components/ui/EmptyState";

export function BodyPage() {
  const latest = useLatestPerMetric();
  const [logOpen, setLogOpen] = useState(false);

  const cards = useMemo(() => Array.from(latest.values()), [latest]);
  const weight = latest.get("weight");

  return (
    <div className="mx-auto flex max-w-5xl flex-col gap-4 px-4 pt-6 pb-8">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold">Body</h1>
        <button
          type="button"
          onClick={() => setLogOpen(true)}
          className="flex items-center gap-1 rounded-full bg-black px-3 py-1.5 text-sm font-medium text-white"
        >
          <Plus className="h-4 w-4" />
          Log
        </button>
      </div>

      {weight && (
        <div className="rounded-xl bg-white p-4 ring-1 ring-gray-200">
          <div className="flex items-center gap-1.5 text-xs font-medium uppercase tracking-wide text-gray-500">
            <HeartPulse className="h-3.5 w-3.5" />
            Current weight
          </div>
          <div className="mt-1 text-3xl font-semibold text-gray-900">
            {weight.value} <span className="text-base font-normal text-gray-500">{weight.unit}</span>
          </div>
          <div className="mt-0.5 text-xs text-gray-500">
            {new Date(weight.recordedAt).toLocaleDateString(undefined, {
              month: "short",
              day: "numeric",
              year: "numeric",
            })}
          </div>
        </div>
      )}

      {cards.length === 0 ? (
        <EmptyState icon={HeartPulse}>
          Tap <span className="font-medium">Log</span> to record weight, body fat, or measurements.
        </EmptyState>
      ) : (
        <section className="flex flex-col gap-2">
          <h2 className="text-sm font-medium text-gray-700">All metrics</h2>
          <ul className="grid grid-cols-1 gap-2 sm:grid-cols-2">
            {cards.map((m) => (
              <li key={m.metric}>
                <MetricCard measurement={m} />
              </li>
            ))}
          </ul>
        </section>
      )}

      <LogMeasurementSheet open={logOpen} onClose={() => setLogOpen(false)} />
    </div>
  );
}
