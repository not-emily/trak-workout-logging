import { useEffect, useMemo, useSyncExternalStore } from "react";
import { uuid } from "@/lib/uuid";
import { apiClient } from "@/sync/apiClient";
import { localStore } from "@/sync/localStore";
import { queue } from "@/sync/queue";
import { syncWorker } from "@/sync/syncWorker";
import type { ApiSuccess } from "@/types/api";
import type { BodyMeasurement, BodyMetric } from "@/types/bodyMeasurement";

function nowIso(): string {
  return new Date().toISOString();
}

function subscribe(cb: () => void): () => void {
  return localStore.subscribe("body_measurements", cb);
}

function getAll(): BodyMeasurement[] {
  return localStore.list<BodyMeasurement>("body_measurements");
}

let lastHydrate = 0;

async function hydrateFromServer(): Promise<void> {
  const now = Date.now();
  if (now - lastHydrate < 30_000) return;
  lastHydrate = now;
  try {
    const body = (await apiClient.get("/api/v1/body_measurements")) as ApiSuccess<BodyMeasurement[]>;
    localStore.replace("body_measurements", body.data);
  } catch {
    // Offline — keep showing local data.
  }
}

// Returns all measurements sorted by recordedAt desc.
export function useBodyMeasurements(): BodyMeasurement[] {
  const records = useSyncExternalStore(subscribe, getAll, getAll);

  useEffect(() => {
    hydrateFromServer();
  }, []);

  return useMemo(
    () =>
      [...records].sort(
        (a, b) => new Date(b.recordedAt).getTime() - new Date(a.recordedAt).getTime(),
      ),
    [records],
  );
}

// Most-recent measurement per metric. Useful for the BodyPage card grid.
export function useLatestPerMetric(): Map<BodyMetric, BodyMeasurement> {
  const records = useBodyMeasurements();
  return useMemo(() => {
    const out = new Map<BodyMetric, BodyMeasurement>();
    // records is already sorted desc — first hit per metric wins.
    for (const r of records) {
      if (!out.has(r.metric)) out.set(r.metric, r);
    }
    return out;
  }, [records]);
}

export function useMeasurementsForMetric(metric: BodyMetric): BodyMeasurement[] {
  const all = useBodyMeasurements();
  return useMemo(() => all.filter((m) => m.metric === metric), [all, metric]);
}

export type LogMeasurementInput = {
  metric: BodyMetric;
  value: string;
  unit: string;
  recordedAt?: string; // ISO; defaults to now
  notes?: string | null;
};

export function logMeasurement(input: LogMeasurementInput): BodyMeasurement {
  const id = uuid();
  const now = nowIso();
  const record: BodyMeasurement = {
    id,
    userId: "",
    metric: input.metric,
    value: input.value,
    unit: input.unit,
    recordedAt: input.recordedAt ?? now,
    notes: input.notes ?? null,
    createdAt: now,
    updatedAt: now,
  };
  localStore.put("body_measurements", record);
  queue.enqueue("PUT", `/api/v1/body_measurements/${id}`, {
    metric: record.metric,
    value: record.value,
    unit: record.unit,
    recordedAt: record.recordedAt,
    notes: record.notes,
  });
  syncWorker.poke();
  return record;
}

export function updateMeasurement(id: string, patch: Partial<LogMeasurementInput>): void {
  const existing = localStore.get<BodyMeasurement>("body_measurements", id);
  if (!existing) return;
  const updated: BodyMeasurement = {
    ...existing,
    metric: (patch.metric as BodyMetric) ?? existing.metric,
    value: patch.value ?? existing.value,
    unit: patch.unit ?? existing.unit,
    recordedAt: patch.recordedAt ?? existing.recordedAt,
    notes: patch.notes ?? existing.notes,
    updatedAt: nowIso(),
  };
  localStore.put("body_measurements", updated);
  queue.enqueue("PUT", `/api/v1/body_measurements/${id}`, {
    metric: updated.metric,
    value: updated.value,
    unit: updated.unit,
    recordedAt: updated.recordedAt,
    notes: updated.notes,
  });
  syncWorker.poke();
}

export function deleteMeasurement(id: string): void {
  localStore.remove("body_measurements", id);
  queue.enqueue("DELETE", `/api/v1/body_measurements/${id}`);
  syncWorker.poke();
}
