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
};

function localDatetimeNow(): string {
  const now = new Date();
  const local = new Date(now.getTime() - now.getTimezoneOffset() * 60000);
  return local.toISOString().slice(0, 16);
}

export function LogMeasurementSheet({ open, onClose, initialMetric }: Props) {
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
    <BottomSheet open={open} onClose={onClose} title="Log measurement">
      <form onSubmit={handleSubmit} className="flex flex-col gap-3 p-4">
        <label className="flex flex-col gap-1 text-sm">
          Metric
          <select
            value={metric}
            onChange={(e) => onMetricChange(e.target.value as BodyMetric)}
            className="rounded-lg border border-gray-300 bg-white px-3 py-2 text-base"
          >
            {BODY_METRICS.map((m) => (
              <option key={m} value={m}>
                {formatMetricLabel(m)}
              </option>
            ))}
          </select>
        </label>

        <div className="flex gap-2">
          <label className="flex flex-1 flex-col gap-1 text-sm">
            Value
            <input
              type="text"
              inputMode="decimal"
              value={value}
              onChange={(e) => setValue(e.target.value)}
              autoFocus
              required
              className="rounded-lg border border-gray-300 px-3 py-2 text-base"
            />
          </label>
          <label className="flex w-24 flex-col gap-1 text-sm">
            Unit
            <input
              type="text"
              value={unit}
              onChange={(e) => setUnit(e.target.value)}
              className="rounded-lg border border-gray-300 px-3 py-2 text-base"
            />
          </label>
        </div>

        <label className="flex flex-col gap-1 text-sm">
          When
          <input
            type="datetime-local"
            value={recordedAt}
            onChange={(e) => setRecordedAt(e.target.value)}
            required
            className="rounded-lg border border-gray-300 px-3 py-2 text-base"
          />
        </label>

        <div className="flex justify-end gap-2 pt-1">
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg bg-gray-100 px-3 py-2 text-sm font-medium text-gray-700"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={!value.trim()}
            className="rounded-lg bg-black px-4 py-2 text-sm font-medium text-white disabled:opacity-60"
          >
            Save
          </button>
        </div>
      </form>
    </BottomSheet>
  );
}
