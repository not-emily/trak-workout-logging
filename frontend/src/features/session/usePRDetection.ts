import { useEffect, useRef } from "react";
import { localStore } from "@/sync/localStore";
import { useExercises } from "@/features/exercise/useExercises";
import { detectBrokenPRs, findPRs, type BrokenPR, type CompletedSet } from "@/lib/prs";
import { toast } from "@/components/ui/Toast";
import { formatDuration } from "@/lib/time";
import type { AssembledSession, Session, SessionExercise, WorkoutSet } from "@/types/session";

function workoutSetToCompleted(s: WorkoutSet, date: Date): CompletedSet {
  return {
    weightLb: s.weightLb == null || s.weightLb === "" ? null : Number.parseFloat(s.weightLb),
    reps: s.reps,
    durationSeconds: s.durationSeconds,
    distanceMeters:
      s.distanceMeters == null || s.distanceMeters === ""
        ? null
        : Number.parseFloat(s.distanceMeters),
    isWarmup: s.isWarmup,
    date,
  };
}

// All completed sets for `exerciseId` from history, excluding any sets that
// belong to `excludeSessionId` (the active session being detected against).
function priorHistoryFor(
  exerciseId: string,
  excludeSessionId: string,
): CompletedSet[] {
  const sets = localStore.list<WorkoutSet>("sets");
  const sessionExercises = localStore.list<SessionExercise>("session_exercises");
  const sessions = localStore.list<Session>("sessions");

  const seToSessionId = new Map(sessionExercises.map((se) => [se.id, se.sessionId]));
  const seExerciseId = new Map(sessionExercises.map((se) => [se.id, se.exerciseId]));
  const sessionDateById = new Map(sessions.map((s) => [s.id, new Date(s.startedAt)]));

  const result: CompletedSet[] = [];
  for (const s of sets) {
    if (s.completedAt === null) continue;
    if (seExerciseId.get(s.sessionExerciseId) !== exerciseId) continue;
    const sessionId = seToSessionId.get(s.sessionExerciseId);
    if (!sessionId || sessionId === excludeSessionId) continue;
    const date = sessionDateById.get(sessionId);
    if (!date) continue;
    result.push(workoutSetToCompleted(s, date));
  }
  return result;
}

function formatPRToast(
  exerciseName: string,
  pr: BrokenPR,
): { title: string; value: string; body?: string } {
  switch (pr.type) {
    case "heaviestWeight":
      return {
        title: `New PR · ${exerciseName}`,
        value: `${pr.weightLb} lb × ${pr.reps}`,
        body: pr.previous != null ? `beats ${pr.previous} lb` : undefined,
      };
    case "bestByReps":
      return {
        title: `${pr.bucket}-rep PR · ${exerciseName}`,
        value: `${pr.weightLb} lb`,
        body: pr.previous != null ? `beats ${pr.previous} lb` : undefined,
      };
    case "bestEstimated1RM":
      return {
        title: `Est. 1RM · ${exerciseName}`,
        value: `${Math.round(pr.estimated)} lb`,
        body: `from ${pr.weightLb} × ${pr.reps}`,
      };
    case "highestVolumeSet":
      return {
        title: `Heaviest set · ${exerciseName}`,
        value: `${Math.round(pr.volume).toLocaleString()} lb`,
        body: `${pr.weightLb} × ${pr.reps}`,
      };
    case "mostReps":
      return {
        title: `New PR · ${exerciseName}`,
        value: `${pr.reps} reps`,
        body: pr.previous != null ? `beats ${pr.previous}` : undefined,
      };
    case "longestDistance":
      return {
        title: `Longest distance · ${exerciseName}`,
        value: `${pr.distanceMeters.toLocaleString()} m`,
      };
    case "longestDuration":
      return {
        title: `Longest duration · ${exerciseName}`,
        value: formatDuration(pr.durationSeconds),
      };
    case "fastestPace":
      return {
        title: `Fastest pace · ${exerciseName}`,
        value: `${formatDuration(Math.round(pr.secondsPerMeter * 1000))} / km`,
      };
  }
}

// Watches the active session and fires "New PR!" toasts when newly-completed
// sets break a record. Only runs while the session is live (endedAt null) — we
// don't toast for retroactive logs or finished-session edits.
//
// State held in refs:
//   - seenSetIds: completed-set IDs already evaluated, so we don't double-toast
//   - historyByExercise: per-exercise CompletedSet[] reflecting all sets known
//     to have happened *before* the in-progress candidate. When a new set fires,
//     it's appended so the next candidate has to beat it too.
export function usePRDetection(session: AssembledSession | null | undefined): void {
  const { exercises: exerciseLibrary } = useExercises();
  const seenSetIdsRef = useRef<Set<string>>(new Set());
  const historyByExerciseRef = useRef<Map<string, CompletedSet[]>>(new Map());
  const initializedRef = useRef(false);

  useEffect(() => {
    if (!session || session.endedAt !== null) return;

    if (!initializedRef.current) {
      // First run for this session: seed each exercise's history excluding the
      // session's own sets, and mark already-completed session sets as seen so
      // we don't toast on remount.
      for (const se of session.exercises) {
        if (!historyByExerciseRef.current.has(se.exerciseId)) {
          historyByExerciseRef.current.set(
            se.exerciseId,
            priorHistoryFor(se.exerciseId, session.id),
          );
        }
        for (const s of se.sets) {
          if (s.completedAt !== null) seenSetIdsRef.current.add(s.id);
        }
      }
      initializedRef.current = true;
      return;
    }

    for (const se of session.exercises) {
      const exercise = exerciseLibrary.find((e) => e.id === se.exerciseId);
      if (!exercise) continue;

      // Lazy-init for exercises added after first mount.
      if (!historyByExerciseRef.current.has(exercise.id)) {
        historyByExerciseRef.current.set(
          exercise.id,
          priorHistoryFor(exercise.id, session.id),
        );
      }

      for (const s of se.sets) {
        if (s.completedAt === null) continue;
        if (seenSetIdsRef.current.has(s.id)) continue;
        seenSetIdsRef.current.add(s.id);

        const candidate = workoutSetToCompleted(s, new Date(s.completedAt));
        const history = historyByExerciseRef.current.get(exercise.id)!;
        const prior = findPRs(history, exercise.kind);
        const broken = detectBrokenPRs(candidate, prior);

        // bestByReps cascades — beating the 10-rep PR mechanically beats 8/5/3/1.
        // Keep it on the PR cards (useful data) but skip the toast (noise).
        for (const pr of broken) {
          if (pr.type === "bestByReps") continue;
          const { title, value, body } = formatPRToast(exercise.name, pr);
          toast.show({ title, value, body, variant: "achievement" });
        }

        // Append to history so subsequent sets in this session have to beat it.
        history.push(candidate);
      }
    }
  }, [session, exerciseLibrary]);
}
