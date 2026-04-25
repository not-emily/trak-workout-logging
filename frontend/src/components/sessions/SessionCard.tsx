import { Link } from "react-router";
import { localStore } from "@/sync/localStore";
import { formatDuration } from "@/lib/time";
import type { Session, SessionExercise, WorkoutSet } from "@/types/session";

type Props = { session: Session };

function summarizeSession(session: Session) {
  const exercises = localStore
    .list<SessionExercise>("session_exercises")
    .filter((se) => se.sessionId === session.id);
  const seIds = new Set(exercises.map((se) => se.id));
  const sets = localStore
    .list<WorkoutSet>("sets")
    .filter((s) => seIds.has(s.sessionExerciseId));

  const completedSets = sets.filter((s) => s.completedAt !== null);
  const totalVolume = completedSets.reduce((acc, s) => {
    const reps = s.reps ?? 0;
    const weight = s.weightLb ? Number.parseFloat(s.weightLb) : 0;
    return acc + reps * weight;
  }, 0);

  return {
    exerciseCount: exercises.length,
    setCount: completedSets.length,
    totalVolume,
  };
}

function formatDate(iso: string): string {
  const d = new Date(iso);
  const now = new Date();
  const isToday = d.toDateString() === now.toDateString();
  const isYesterday =
    d.toDateString() === new Date(now.getTime() - 86400000).toDateString();

  const time = d.toLocaleTimeString(undefined, { hour: "numeric", minute: "2-digit" });
  if (isToday) return `Today, ${time}`;
  if (isYesterday) return `Yesterday, ${time}`;
  return d.toLocaleDateString(undefined, { weekday: "short", month: "short", day: "numeric" });
}

export function SessionCard({ session }: Props) {
  const { exerciseCount, setCount, totalVolume } = summarizeSession(session);
  const isActive = session.endedAt === null;
  const duration =
    session.durationSeconds ??
    (session.endedAt
      ? Math.floor((new Date(session.endedAt).getTime() - new Date(session.startedAt).getTime()) / 1000)
      : null);

  return (
    <Link
      to={`/sessions/${session.id}`}
      className="flex flex-col gap-2 rounded-xl border border-gray-200 bg-white p-4 transition-colors hover:bg-gray-50"
    >
      <div className="flex items-baseline justify-between gap-2">
        <h3 className="text-base font-medium text-gray-900">
          {session.name || "Untitled session"}
        </h3>
        {isActive && (
          <span className="shrink-0 rounded-full bg-blue-100 px-2 py-0.5 text-xs font-medium text-blue-700">
            In progress
          </span>
        )}
      </div>
      <div className="flex flex-wrap items-center gap-1.5 text-xs text-gray-500">
        <span>{formatDate(session.startedAt)}</span>
        {duration !== null && (
          <>
            <span aria-hidden="true">•</span>
            <span>{formatDuration(duration)}</span>
          </>
        )}
        <span aria-hidden="true">•</span>
        <span>
          {exerciseCount} {exerciseCount === 1 ? "exercise" : "exercises"}
        </span>
        <span aria-hidden="true">•</span>
        <span>
          {setCount} {setCount === 1 ? "set" : "sets"}
        </span>
        {totalVolume > 0 && (
          <>
            <span aria-hidden="true">•</span>
            <span>{Math.round(totalVolume).toLocaleString()} lb volume</span>
          </>
        )}
      </div>
    </Link>
  );
}
