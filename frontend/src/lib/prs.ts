// Pure PR (personal-record) math. No store / DOM access — testable in isolation.
//
// Callers project `WorkoutSet` + the session's date into `CompletedSet` and pass
// arrays here. Warmup sets are excluded by the caller of `findPRs`; incomplete
// sets shouldn't be in the input either.

import type { ExerciseKind } from "@/types/exercise";

export type CompletedSet = {
  weightLb: number | null;
  reps: number | null;
  durationSeconds: number | null;
  distanceMeters: number | null;
  isWarmup: boolean;
  date: Date;
};

// Rep counts we surface as "best by reps" PRs. 1, 3, 5 are the standard
// strength-training intent buckets; 8 and 10 cover hypertrophy.
export const REP_BUCKETS = [1, 3, 5, 8, 10] as const;
export type RepBucket = (typeof REP_BUCKETS)[number];

// Epley formula. Reps=1 returns the weight directly (already a 1RM); otherwise
// adds (reps/30) of the weight as the predicted strength gain to a single rep.
export function estimated1RM(weightLb: number, reps: number): number {
  if (weightLb <= 0 || reps < 1) return 0;
  if (reps === 1) return weightLb;
  return weightLb * (1 + reps / 30);
}

export type StrengthPRs = {
  kind: "strength";
  heaviestWeight: { weightLb: number; reps: number; date: Date } | null;
  bestByReps: Partial<Record<RepBucket, { weightLb: number; date: Date }>>;
  bestEstimated1RM: { estimated: number; weightLb: number; reps: number; date: Date } | null;
  highestVolumeSet: { volume: number; weightLb: number; reps: number; date: Date } | null;
};

export type BodyweightPRs = {
  kind: "bodyweight";
  mostReps: { reps: number; date: Date } | null;
};

export type CardioPRs = {
  kind: "cardio";
  fastestPace: {
    secondsPerMeter: number;
    durationSeconds: number;
    distanceMeters: number;
    date: Date;
  } | null;
  longestDuration: { durationSeconds: number; date: Date } | null;
  longestDistance: { distanceMeters: number; date: Date } | null;
};

export type ExercisePRs = StrengthPRs | BodyweightPRs | CardioPRs;

export function findPRs(sets: CompletedSet[], kind: ExerciseKind): ExercisePRs {
  const working = sets.filter((s) => !s.isWarmup);
  if (kind === "strength") return strengthPRs(working);
  if (kind === "bodyweight") return bodyweightPRs(working);
  return cardioPRs(working);
}

function strengthPRs(sets: CompletedSet[]): StrengthPRs {
  let heaviestWeight: StrengthPRs["heaviestWeight"] = null;
  const bestByReps: StrengthPRs["bestByReps"] = {};
  let bestEstimated1RM: StrengthPRs["bestEstimated1RM"] = null;
  let highestVolumeSet: StrengthPRs["highestVolumeSet"] = null;

  for (const s of sets) {
    if (s.weightLb == null || s.reps == null || s.weightLb <= 0 || s.reps <= 0) continue;
    const { weightLb, reps, date } = s;

    if (!heaviestWeight || weightLb > heaviestWeight.weightLb) {
      heaviestWeight = { weightLb, reps, date };
    }

    for (const bucket of REP_BUCKETS) {
      if (reps >= bucket) {
        const existing = bestByReps[bucket];
        if (!existing || weightLb > existing.weightLb) {
          bestByReps[bucket] = { weightLb, date };
        }
      }
    }

    const estimated = estimated1RM(weightLb, reps);
    if (!bestEstimated1RM || estimated > bestEstimated1RM.estimated) {
      bestEstimated1RM = { estimated, weightLb, reps, date };
    }

    const volume = weightLb * reps;
    if (!highestVolumeSet || volume > highestVolumeSet.volume) {
      highestVolumeSet = { volume, weightLb, reps, date };
    }
  }

  return { kind: "strength", heaviestWeight, bestByReps, bestEstimated1RM, highestVolumeSet };
}

function bodyweightPRs(sets: CompletedSet[]): BodyweightPRs {
  let mostReps: BodyweightPRs["mostReps"] = null;
  for (const s of sets) {
    if (s.reps == null || s.reps <= 0) continue;
    if (!mostReps || s.reps > mostReps.reps) {
      mostReps = { reps: s.reps, date: s.date };
    }
  }
  return { kind: "bodyweight", mostReps };
}

function cardioPRs(sets: CompletedSet[]): CardioPRs {
  let fastestPace: CardioPRs["fastestPace"] = null;
  let longestDuration: CardioPRs["longestDuration"] = null;
  let longestDistance: CardioPRs["longestDistance"] = null;

  for (const s of sets) {
    if (s.durationSeconds != null && s.durationSeconds > 0) {
      if (!longestDuration || s.durationSeconds > longestDuration.durationSeconds) {
        longestDuration = { durationSeconds: s.durationSeconds, date: s.date };
      }
    }
    if (s.distanceMeters != null && s.distanceMeters > 0) {
      if (!longestDistance || s.distanceMeters > longestDistance.distanceMeters) {
        longestDistance = { distanceMeters: s.distanceMeters, date: s.date };
      }
    }
    if (
      s.durationSeconds != null &&
      s.distanceMeters != null &&
      s.durationSeconds > 0 &&
      s.distanceMeters > 0
    ) {
      const secondsPerMeter = s.durationSeconds / s.distanceMeters;
      if (!fastestPace || secondsPerMeter < fastestPace.secondsPerMeter) {
        fastestPace = {
          secondsPerMeter,
          durationSeconds: s.durationSeconds,
          distanceMeters: s.distanceMeters,
          date: s.date,
        };
      }
    }
  }

  return { kind: "cardio", fastestPace, longestDuration, longestDistance };
}

// "Did this set break any PR?" — used by live detection during an active
// session. Returns the list of broken PR types so the caller can format a
// human-readable toast. Compares a single candidate set against the prior PR
// set (passed in) — the candidate is assumed to be NOT yet included in `prior`.
export type BrokenPR =
  | { type: "heaviestWeight"; weightLb: number; reps: number; previous: number | null }
  | { type: "bestByReps"; bucket: RepBucket; weightLb: number; previous: number | null }
  | { type: "bestEstimated1RM"; estimated: number; weightLb: number; reps: number; previous: number | null }
  | { type: "highestVolumeSet"; volume: number; weightLb: number; reps: number; previous: number | null }
  | { type: "mostReps"; reps: number; previous: number | null }
  | { type: "fastestPace"; secondsPerMeter: number; previous: number | null }
  | { type: "longestDuration"; durationSeconds: number; previous: number | null }
  | { type: "longestDistance"; distanceMeters: number; previous: number | null };

export function detectBrokenPRs(
  candidate: CompletedSet,
  prior: ExercisePRs,
): BrokenPR[] {
  const broken: BrokenPR[] = [];
  if (candidate.isWarmup) return broken;

  if (prior.kind === "strength") {
    const { weightLb, reps } = candidate;
    if (weightLb == null || reps == null || weightLb <= 0 || reps <= 0) return broken;

    if (!prior.heaviestWeight || weightLb > prior.heaviestWeight.weightLb) {
      broken.push({
        type: "heaviestWeight",
        weightLb,
        reps,
        previous: prior.heaviestWeight?.weightLb ?? null,
      });
    }
    for (const bucket of REP_BUCKETS) {
      if (reps >= bucket) {
        const existing = prior.bestByReps[bucket];
        if (!existing || weightLb > existing.weightLb) {
          broken.push({
            type: "bestByReps",
            bucket,
            weightLb,
            previous: existing?.weightLb ?? null,
          });
        }
      }
    }
    const estimated = estimated1RM(weightLb, reps);
    if (!prior.bestEstimated1RM || estimated > prior.bestEstimated1RM.estimated) {
      broken.push({
        type: "bestEstimated1RM",
        estimated,
        weightLb,
        reps,
        previous: prior.bestEstimated1RM?.estimated ?? null,
      });
    }
    const volume = weightLb * reps;
    if (!prior.highestVolumeSet || volume > prior.highestVolumeSet.volume) {
      broken.push({
        type: "highestVolumeSet",
        volume,
        weightLb,
        reps,
        previous: prior.highestVolumeSet?.volume ?? null,
      });
    }
    return broken;
  }

  if (prior.kind === "bodyweight") {
    const { reps } = candidate;
    if (reps == null || reps <= 0) return broken;
    if (!prior.mostReps || reps > prior.mostReps.reps) {
      broken.push({ type: "mostReps", reps, previous: prior.mostReps?.reps ?? null });
    }
    return broken;
  }

  // cardio
  const { durationSeconds, distanceMeters } = candidate;
  if (durationSeconds != null && durationSeconds > 0) {
    if (!prior.longestDuration || durationSeconds > prior.longestDuration.durationSeconds) {
      broken.push({
        type: "longestDuration",
        durationSeconds,
        previous: prior.longestDuration?.durationSeconds ?? null,
      });
    }
  }
  if (distanceMeters != null && distanceMeters > 0) {
    if (!prior.longestDistance || distanceMeters > prior.longestDistance.distanceMeters) {
      broken.push({
        type: "longestDistance",
        distanceMeters,
        previous: prior.longestDistance?.distanceMeters ?? null,
      });
    }
  }
  if (
    durationSeconds != null &&
    distanceMeters != null &&
    durationSeconds > 0 &&
    distanceMeters > 0
  ) {
    const secondsPerMeter = durationSeconds / distanceMeters;
    if (!prior.fastestPace || secondsPerMeter < prior.fastestPace.secondsPerMeter) {
      broken.push({
        type: "fastestPace",
        secondsPerMeter,
        previous: prior.fastestPace?.secondsPerMeter ?? null,
      });
    }
  }
  return broken;
}
