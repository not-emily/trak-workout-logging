import type { CompletedSet } from "@/lib/prs";
import { estimated1RM } from "@/lib/prs";
import type { Metric } from "@/components/progress/MetricTabs";
import type { DataPoint } from "@/components/charts/LineChart";

// Aggregate a flat history of completed sets into one point per session,
// keyed on the metric the user is currently viewing. Some metrics aggregate
// across the session's sets (volume, total distance), others pick the best
// (heaviest weight, fastest pace).
export function seriesForMetric(history: CompletedSet[], metric: Metric): DataPoint[] {
  const bySession = new Map<number, CompletedSet[]>();
  for (const s of history) {
    if (s.isWarmup) continue;
    const key = s.date.getTime();
    const list = bySession.get(key);
    if (list) list.push(s);
    else bySession.set(key, [s]);
  }

  const points: DataPoint[] = [];
  for (const [time, sets] of bySession) {
    const value = aggregate(sets, metric);
    if (value == null) continue;
    points.push({ x: new Date(time), y: value });
  }
  return points.sort((a, b) => a.x.getTime() - b.x.getTime());
}

function aggregate(sets: CompletedSet[], metric: Metric): number | null {
  switch (metric) {
    case "weight":
      return maxOf(sets, (s) => (s.weightLb ?? 0) > 0 ? s.weightLb : null);
    case "est1RM":
      return maxOf(sets, (s) =>
        s.weightLb != null && s.reps != null && s.weightLb > 0 && s.reps > 0
          ? estimated1RM(s.weightLb, s.reps)
          : null,
      );
    case "volume":
      return sumOf(sets, (s) =>
        s.weightLb != null && s.reps != null && s.weightLb > 0 && s.reps > 0
          ? s.weightLb * s.reps
          : null,
      );
    case "reps":
      return maxOf(sets, (s) => (s.reps ?? 0) > 0 ? s.reps : null);
    case "distance":
      return sumOf(sets, (s) => (s.distanceMeters ?? 0) > 0 ? s.distanceMeters : null);
    case "duration":
      return sumOf(sets, (s) => (s.durationSeconds ?? 0) > 0 ? s.durationSeconds : null);
    case "pace": {
      // Lowest sec/m across the session's cardio sets.
      let best: number | null = null;
      for (const s of sets) {
        if (
          s.durationSeconds != null &&
          s.distanceMeters != null &&
          s.durationSeconds > 0 &&
          s.distanceMeters > 0
        ) {
          const p = s.durationSeconds / s.distanceMeters;
          if (best == null || p < best) best = p;
        }
      }
      return best;
    }
  }
}

function maxOf(sets: CompletedSet[], project: (s: CompletedSet) => number | null): number | null {
  let best: number | null = null;
  for (const s of sets) {
    const v = project(s);
    if (v == null) continue;
    if (best == null || v > best) best = v;
  }
  return best;
}

function sumOf(sets: CompletedSet[], project: (s: CompletedSet) => number | null): number | null {
  let total = 0;
  let any = false;
  for (const s of sets) {
    const v = project(s);
    if (v == null) continue;
    total += v;
    any = true;
  }
  return any ? total : null;
}
