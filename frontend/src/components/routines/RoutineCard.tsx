import { Link } from "react-router";
import { localStore } from "@/sync/localStore";
import type { Routine, RoutineExercise } from "@/types/routine";

type Props = { routine: Routine };

export function RoutineCard({ routine }: Props) {
  const exerciseCount = localStore
    .list<RoutineExercise>("routine_exercises")
    .filter((re) => re.routineId === routine.id).length;

  return (
    <Link
      to={`/routines/${routine.id}`}
      className="group flex flex-col gap-1 rounded-xl border border-line bg-surface-1 p-4 transition-colors hover:border-line-strong hover:bg-surface-2"
    >
      <h3 className="font-display text-base text-fg-soft">{routine.name}</h3>
      {routine.description && (
        <p className="text-sm text-fg-muted">{routine.description}</p>
      )}
      <p className="text-[11px] text-fg-faint">
        <span className="font-mono font-medium text-fg-muted tabular-nums">{exerciseCount}</span>{" "}
        {exerciseCount === 1 ? "exercise" : "exercises"}
      </p>
    </Link>
  );
}
