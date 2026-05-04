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
      className={`group relative flex flex-col gap-2 overflow-hidden rounded-xl border p-4 transition-colors ${
        isActive
          ? "border-accent/30 bg-accent-soft/40 hover:bg-accent-soft/60"
          : "border-line bg-surface-1 hover:bg-surface-2"
      }`}
    >
      {isActive && (
        <span aria-hidden className="absolute inset-y-0 left-0 w-[3px] bg-accent" />
      )}

      <div className="flex items-baseline justify-between gap-2">
        <h3 className="truncate font-display text-base text-fg-soft">
          {session.name || "Untitled session"}
        </h3>
        {isActive && (
          <span className="flex shrink-0 items-center gap-1.5 text-[10px] font-semibold uppercase tracking-[0.18em] text-accent">
            <span className="relative flex h-1.5 w-1.5">
              <span className="absolute inset-0 animate-ping rounded-full bg-accent opacity-60" />
              <span className="relative h-1.5 w-1.5 rounded-full bg-accent" />
            </span>
            Live
          </span>
        )}
      </div>

      <div className="flex flex-wrap items-center gap-x-2 gap-y-1 text-[11px] text-fg-muted">
        <span className="font-mono uppercase tracking-wide">{formatDate(session.startedAt)}</span>
        {duration !== null && duration > 0 && (
          <>
            <span aria-hidden className="text-fg-faint">·</span>
            <span className="font-mono tabular-nums">{formatDuration(duration)}</span>
          </>
        )}
        <span aria-hidden className="text-fg-faint">·</span>
        <span>
          <span className="font-mono font-medium text-fg-soft tabular-nums">{exerciseCount}</span>{" "}
          {exerciseCount === 1 ? "exercise" : "exercises"}
        </span>
        <span aria-hidden className="text-fg-faint">·</span>
        <span>
          <span className="font-mono font-medium text-fg-soft tabular-nums">{setCount}</span>{" "}
          {setCount === 1 ? "set" : "sets"}
        </span>
        {totalVolume > 0 && (
          <>
            <span aria-hidden className="text-fg-faint">·</span>
            <span>
              <span className="font-mono font-medium text-fg-soft tabular-nums">
                {Math.round(totalVolume).toLocaleString()}
              </span>{" "}
              lb volume
            </span>
          </>
        )}
      </div>
    </Link>
  );
}
