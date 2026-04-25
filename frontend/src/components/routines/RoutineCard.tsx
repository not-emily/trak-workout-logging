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
      className="flex flex-col gap-1 rounded-xl border border-gray-200 bg-white p-4 transition-colors hover:bg-gray-50"
    >
      <h3 className="font-medium text-gray-900">{routine.name}</h3>
      {routine.description && (
        <p className="text-sm text-gray-600">{routine.description}</p>
      )}
      <p className="text-xs text-gray-500">
        {exerciseCount} {exerciseCount === 1 ? "exercise" : "exercises"}
      </p>
    </Link>
  );
}
