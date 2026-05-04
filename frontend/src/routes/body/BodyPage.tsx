import { useMemo, useState } from "react";
import { Plus, HeartPulse } from "lucide-react";
import { useLatestPerMetric } from "@/features/body/useBodyMeasurements";
import { LogMeasurementSheet } from "@/components/body/LogMeasurementSheet";
import { MetricCard } from "@/components/body/MetricCard";
import { SyncIndicator } from "@/components/layout/SyncIndicator";
import { EmptyState } from "@/components/ui/EmptyState";

export function BodyPage() {
  const latest = useLatestPerMetric();
  const [logOpen, setLogOpen] = useState(false);

  const cards = useMemo(() => Array.from(latest.values()), [latest]);
  const weight = latest.get("weight");
  const otherCards = useMemo(() => cards.filter((c) => c.metric !== "weight"), [cards]);

  return (
    <div className="mx-auto flex max-w-5xl flex-col gap-7 px-4 pt-6 pb-8">
      <div className="flex items-center justify-between">
        <h1 className="font-display text-3xl leading-none text-fg">Body</h1>
        <div className="flex items-center gap-2">
          <SyncIndicator />
          <button
            type="button"
            onClick={() => setLogOpen(true)}
            className="flex items-center gap-1.5 rounded-full bg-accent px-4 py-2 text-sm font-semibold text-accent-fg transition-colors hover:bg-accent-hover"
          >
            <Plus className="h-4 w-4" strokeWidth={2.5} />
            Log
          </button>
        </div>
      </div>

      {weight && (
        <div className="relative overflow-hidden rounded-2xl border border-line bg-surface-1 p-6">
          <div
            aria-hidden
            className="pointer-events-none absolute inset-x-0 top-0 h-40"
            style={{
              background:
                "radial-gradient(ellipse 80% 100% at 50% 0%, var(--color-body-soft), transparent 70%)",
            }}
          />
          <div className="relative">
            <div className="flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-[0.18em] text-body-accent">
              <HeartPulse className="h-3.5 w-3.5" />
              Current weight
            </div>
            <div className="mt-3 flex items-baseline gap-3">
              <span className="font-display text-7xl leading-none text-fg">
                {weight.value}
              </span>
              <span className="font-mono text-sm uppercase tracking-wide text-fg-muted">
                {weight.unit}
              </span>
            </div>
            <div className="mt-3 text-xs text-fg-faint">
              {new Date(weight.recordedAt).toLocaleDateString(undefined, {
                month: "long",
                day: "numeric",
                year: "numeric",
              })}
            </div>
          </div>
        </div>
      )}

      {cards.length === 0 ? (
        <EmptyState icon={HeartPulse}>
          Tap <span className="font-medium text-fg">Log</span> to record weight, body fat, or measurements.
        </EmptyState>
      ) : otherCards.length > 0 ? (
        <section className="flex flex-col gap-3">
          <h2 className="text-[11px] font-semibold uppercase tracking-[0.18em] text-fg-subtle">
            All metrics
          </h2>
          <ul className="grid grid-cols-1 gap-2 sm:grid-cols-2">
            {otherCards.map((m) => (
              <li key={m.metric}>
                <MetricCard measurement={m} />
              </li>
            ))}
          </ul>
        </section>
      ) : null}

      <LogMeasurementSheet
        open={logOpen}
        onClose={() => setLogOpen(false)}
        maxWidth="md:max-w-5xl"
      />
    </div>
  );
}
