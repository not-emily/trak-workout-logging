import { Link } from "react-router";
import { formatMuscleGroup } from "@/lib/muscleGroups";
import type { Exercise } from "@/types/exercise";

type Props = { exercise: Exercise };

export function ExerciseCard({ exercise }: Props) {
  return (
    <Link
      to={`/exercises/${exercise.id}`}
      className="flex flex-col gap-1 rounded-lg border border-gray-200 bg-white p-3 transition-colors hover:bg-gray-50"
    >
      <div className="flex items-center justify-between gap-2">
        <h3 className="font-medium text-gray-900">{exercise.name}</h3>
        {!exercise.isSystem && (
          <span className="shrink-0 rounded-full bg-blue-100 px-2 py-0.5 text-xs font-medium text-blue-700">
            Custom
          </span>
        )}
      </div>
      <div className="flex flex-wrap items-center gap-1.5 text-xs text-gray-500">
        <span className="capitalize">{exercise.kind}</span>
        {exercise.equipment && (
          <>
            <span aria-hidden="true">•</span>
            <span>{exercise.equipment}</span>
          </>
        )}
        {exercise.muscleGroups.length > 0 && (
          <>
            <span aria-hidden="true">•</span>
            <span>{exercise.muscleGroups.slice(0, 3).map(formatMuscleGroup).join(", ")}</span>
          </>
        )}
      </div>
    </Link>
  );
}
