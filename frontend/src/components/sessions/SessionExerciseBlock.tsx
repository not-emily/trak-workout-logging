import { useState } from "react";
import { Plus, X } from "lucide-react";
import { addSet, removeSessionExercise } from "@/features/session/sessionActions";
import { ConfirmDialog } from "@/components/ui/ConfirmDialog";
import { SetRow } from "./SetRow";
import type { Exercise } from "@/types/exercise";
import type { AssembledSessionExercise, WorkoutSet } from "@/types/session";

type Props = {
  sessionExercise: AssembledSessionExercise;
  exercise: Exercise;
  sessionFinished: boolean;
  readOnly?: boolean;
  onSetCompleted?: () => void;
};

export function SessionExerciseBlock({
  sessionExercise,
  exercise,
  sessionFinished,
  readOnly = false,
  onSetCompleted,
}: Props) {
  const [confirmRemove, setConfirmRemove] = useState(false);

  function handleAddSet() {
    // Always pre-fill from the previous set, regardless of completion state —
    // makes it easy to plan a workout without checking off each row first.
    const previous: WorkoutSet | undefined = sessionExercise.sets.at(-1);
    const defaults: Partial<WorkoutSet> = {
      reps: previous?.reps ?? null,
      weightLb: previous?.weightLb ?? null,
      durationSeconds: previous?.durationSeconds ?? null,
      distanceMeters: previous?.distanceMeters ?? null,
    };
    if (sessionFinished) {
      defaults.completedAt = new Date().toISOString();
    }
    addSet(sessionExercise.id, defaults);
  }

  return (
    <section className="flex flex-col gap-2 rounded-xl bg-white p-3 ring-1 ring-gray-200">
      <header className="flex items-center justify-between gap-2">
        <h3 className="font-medium text-gray-900">{exercise.name}</h3>
        {!readOnly && (
          <button
            type="button"
            onClick={() => setConfirmRemove(true)}
            aria-label={`Remove ${exercise.name}`}
            className="flex h-7 w-7 items-center justify-center rounded-full text-gray-400 hover:text-red-500"
          >
            <X className="h-4 w-4" />
          </button>
        )}
      </header>

      <ul className="flex flex-col gap-1.5">
        {sessionExercise.sets.map((set, i) => (
          <li key={set.id}>
            <SetRow
              set={set}
              index={i}
              exerciseKind={exercise.kind}
              suppressRestTimer={sessionFinished}
              readOnly={readOnly}
              onComplete={onSetCompleted}
            />
          </li>
        ))}
      </ul>

      {!readOnly && (
        <button
          type="button"
          onClick={handleAddSet}
          className="flex items-center justify-center gap-1 rounded-lg bg-gray-100 py-2 text-sm font-medium text-gray-700 hover:bg-gray-200"
        >
          <Plus className="h-4 w-4" />
          Add set
        </button>
      )}

      <ConfirmDialog
        open={confirmRemove}
        variant="danger"
        title={`Remove ${exercise.name}?`}
        message="All sets logged for this exercise will be deleted."
        confirmLabel="Remove"
        onCancel={() => setConfirmRemove(false)}
        onConfirm={() => {
          removeSessionExercise(sessionExercise.id);
          setConfirmRemove(false);
        }}
      />
    </section>
  );
}
