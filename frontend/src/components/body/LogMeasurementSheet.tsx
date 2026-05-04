import { useEffect, useState } from "react";
import { BottomSheet } from "@/components/ui/BottomSheet";
import { logMeasurement } from "@/features/body/useBodyMeasurements";
import {
  BODY_METRICS,
  defaultUnit,
  formatMetricLabel,
  type BodyMetric,
} from "@/types/bodyMeasurement";

type Props = {
  open: boolean;
  onClose: () => void;
  initialMetric?: BodyMetric;
  /** Tailwind `md:max-w-*` to match the parent page's content width. */
  maxWidth?: string;
};

function localDatetimeNow(): string {
  const now = new Date();
  const local = new Date(now.getTime() - now.getTimezoneOffset() * 60000);
  return local.toISOString().slice(0, 16);
}

const fieldClass =
  "rounded-lg border border-line-strong bg-surface-2 px-3 py-2.5 text-base text-fg placeholder:text-fg-faint focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent-soft";

const labelClass = "flex flex-col gap-1.5 text-xs font-semibold uppercase tracking-[0.14em] text-fg-subtle";

export function LogMeasurementSheet({ open, onClose, initialMetric, maxWidth }: Props) {
  const [metric, setMetric] = useState<BodyMetric>(initialMetric ?? "weight");
  const [value, setValue] = useState("");
  const [unit, setUnit] = useState(defaultUnit(initialMetric ?? "weight"));
  const [recordedAt, setRecordedAt] = useState(localDatetimeNow());

  useEffect(() => {
    if (open) {
      setMetric(initialMetric ?? "weight");
      setValue("");
      setUnit(defaultUnit(initialMetric ?? "weight"));
      setRecordedAt(localDatetimeNow());
    }
  }, [open, initialMetric]);

  function onMetricChange(next: BodyMetric) {
    setMetric(next);
    setUnit(defaultUnit(next));
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!value.trim()) return;
    logMeasurement({
      metric,
      value: value.trim(),
      unit,
      recordedAt: new Date(recordedAt).toISOString(),
    });
    onClose();
  }

  return (
    <BottomSheet open={open} onClose={onClose} title="Log measurement" maxWidth={maxWidth}>
      <form onSubmit={handleSubmit} className="flex flex-col gap-4 p-4">
        <label className={labelClass}>
          Metric
          <select
            value={metric}
            onChange={(e) => onMetricChange(e.target.value as BodyMetric)}
            className={fieldClass + " font-sans normal-case tracking-normal"}
          >
            {BODY_METRICS.map((m) => (
              <option key={m} value={m} className="bg-surface-2 text-fg">
                {formatMetricLabel(m)}
              </option>
            ))}
          </select>
        </label>

        <div className="flex gap-2">
          <label className={labelClass + " flex-1"}>
            Value
            <input
              type="text"
              inputMode="decimal"
              value={value}
              onChange={(e) => setValue(e.target.value)}
              autoFocus
              required
              className={fieldClass + " font-mono normal-case tracking-normal"}
            />
          </label>
          <label className={labelClass + " w-24"}>
            Unit
            <input
              type="text"
              value={unit}
              onChange={(e) => setUnit(e.target.value)}
              className={fieldClass + " font-mono normal-case tracking-normal"}
            />
          </label>
        </div>

        <label className={labelClass}>
          When
          <input
            type="datetime-local"
            value={recordedAt}
            onChange={(e) => setRecordedAt(e.target.value)}
            required
            className={fieldClass + " font-sans normal-case tracking-normal [color-scheme:dark]"}
          />
        </label>

        <div className="flex justify-end gap-2 pt-2">
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg bg-surface-2 px-4 py-2 text-sm font-medium text-fg-muted transition-colors hover:bg-surface-3 hover:text-fg"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={!value.trim()}
            className="rounded-lg bg-accent px-5 py-2 text-sm font-semibold text-accent-fg transition-colors hover:bg-accent-hover disabled:opacity-40"
          >
            Save
          </button>
        </div>
      </form>
    </BottomSheet>
  );
}
