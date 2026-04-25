import { Plus, X } from "lucide-react";
import { addSet, removeSessionExercise } from "@/features/session/sessionActions";
import { SetRow } from "./SetRow";
import type { Exercise } from "@/types/exercise";
import type { AssembledSessionExercise } from "@/types/session";

type Props = {
  sessionExercise: AssembledSessionExercise;
  exercise: Exercise;
  onSetCompleted?: () => void;
};

export function SessionExerciseBlock({ sessionExercise, exercise, onSetCompleted }: Props) {
  function handleAddSet() {
    // Pre-fill from the most recent completed set in this block, if any.
    const lastCompleted = [...sessionExercise.sets]
      .reverse()
      .find((s) => s.completedAt !== null);

    addSet(sessionExercise.id, {
      reps: lastCompleted?.reps ?? null,
      weightLb: lastCompleted?.weightLb ?? null,
      durationSeconds: lastCompleted?.durationSeconds ?? null,
      distanceMeters: lastCompleted?.distanceMeters ?? null,
    });
  }

  function handleRemoveExercise() {
    if (!confirm(`Remove ${exercise.name} from this session?`)) return;
    removeSessionExercise(sessionExercise.id);
  }

  return (
    <section className="flex flex-col gap-2 rounded-xl bg-white p-3 ring-1 ring-gray-200">
      <header className="flex items-center justify-between gap-2">
        <h3 className="font-medium text-gray-900">{exercise.name}</h3>
        <button
          type="button"
          onClick={handleRemoveExercise}
          aria-label={`Remove ${exercise.name}`}
          className="flex h-7 w-7 items-center justify-center rounded-full text-gray-400 hover:text-red-500"
        >
          <X className="h-4 w-4" />
        </button>
      </header>

      <ul className="flex flex-col gap-1.5">
        {sessionExercise.sets.map((set, i) => (
          <li key={set.id}>
            <SetRow
              set={set}
              index={i}
              exerciseKind={exercise.kind}
              onComplete={onSetCompleted}
            />
          </li>
        ))}
      </ul>

      <button
        type="button"
        onClick={handleAddSet}
        className="flex items-center justify-center gap-1 rounded-lg bg-gray-100 py-2 text-sm font-medium text-gray-700 hover:bg-gray-200"
      >
        <Plus className="h-4 w-4" />
        Add set
      </button>
    </section>
  );
}
