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

const KIND_DOT_BG: Record<Exercise["kind"], string> = {
  strength: "bg-strength",
  cardio: "bg-cardio",
  bodyweight: "bg-bodyweight",
};

const KIND_LABEL: Record<Exercise["kind"], string> = {
  strength: "Strength",
  cardio: "Cardio",
  bodyweight: "Bodyweight",
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
    <section className="flex flex-col gap-2 rounded-xl border border-line bg-surface-1 p-3">
      <header className="flex items-center justify-between gap-2">
        <div className="flex min-w-0 items-center gap-2">
          <span
            className={`h-1.5 w-1.5 shrink-0 rounded-full ${KIND_DOT_BG[exercise.kind]}`}
            aria-hidden
          />
          <h3 className="truncate font-display text-base text-fg-soft">{exercise.name}</h3>
          <span className="ml-1 hidden shrink-0 text-[10px] font-semibold uppercase tracking-[0.18em] text-fg-subtle sm:inline">
            {KIND_LABEL[exercise.kind]}
          </span>
        </div>
        {!readOnly && (
          <button
            type="button"
            onClick={() => setConfirmRemove(true)}
            aria-label={`Remove ${exercise.name}`}
            className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-fg-faint transition-colors hover:bg-danger-soft hover:text-danger"
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
          className="flex items-center justify-center gap-1.5 rounded-lg border border-dashed border-line-strong bg-surface-2/50 py-2 text-xs font-semibold uppercase tracking-[0.14em] text-fg-muted transition-colors hover:border-accent hover:bg-surface-2 hover:text-accent"
        >
          <Plus className="h-3.5 w-3.5" />
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
