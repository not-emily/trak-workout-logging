import { useState } from "react";
import { Link, Navigate, useNavigate, useParams } from "react-router";
import { ArrowLeft, Pencil, Trash2 } from "lucide-react";
import { deleteExercise, useExercises } from "@/features/exercise/useExercises";
import { formatMuscleGroup } from "@/lib/muscleGroups";
import { ConfirmDialog } from "@/components/ui/ConfirmDialog";
import type { Exercise } from "@/types/exercise";

const KIND_DOT_BG: Record<Exercise["kind"], string> = {
  strength: "bg-strength",
  cardio: "bg-cardio",
  bodyweight: "bg-bodyweight",
};

export function ExerciseDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { exercises } = useExercises();
  const [confirmDelete, setConfirmDelete] = useState(false);

  const exercise = exercises.find((e) => e.id === id);
  if (!exercise) {
    return <Navigate to="/exercises" replace />;
  }

  const canEdit = !exercise.isSystem;

  return (
    <div className="mx-auto flex max-w-3xl flex-col gap-4 px-4 pt-6 pb-8">
      <Link
        to="/exercises"
        className="flex w-fit items-center gap-1 text-xs font-semibold uppercase tracking-[0.18em] text-fg-subtle transition-colors hover:text-fg-muted"
      >
        <ArrowLeft className="h-3.5 w-3.5" />
        Back
      </Link>

      <div className="flex items-start justify-between gap-3">
        <div className="flex min-w-0 flex-col gap-1.5">
          <div className="flex items-center gap-2.5">
            <span
              aria-hidden
              className={`h-2 w-2 shrink-0 rounded-full ${KIND_DOT_BG[exercise.kind]}`}
            />
            <h1 className="truncate font-display text-3xl leading-none text-fg-soft">
              {exercise.name}
            </h1>
          </div>
          <div className="flex flex-wrap items-center gap-1.5 pl-4 text-[11px] font-semibold uppercase tracking-[0.18em] text-fg-subtle">
            <span>{exercise.kind}</span>
            {exercise.equipment && (
              <>
                <span aria-hidden className="text-fg-faint">
                  ·
                </span>
                <span className="font-medium normal-case tracking-normal text-fg-muted">
                  {exercise.equipment}
                </span>
              </>
            )}
            {exercise.level && (
              <>
                <span aria-hidden className="text-fg-faint">
                  ·
                </span>
                <span className="font-medium normal-case tracking-normal text-fg-muted">
                  {exercise.level}
                </span>
              </>
            )}
          </div>
        </div>
        {canEdit && (
          <div className="flex shrink-0 gap-2">
            <Link
              to={`/exercises/${exercise.id}/edit`}
              className="flex h-9 w-9 items-center justify-center rounded-full bg-surface-2 text-fg-muted transition-colors hover:bg-surface-3 hover:text-fg"
              aria-label="Edit"
            >
              <Pencil className="h-4 w-4" />
            </Link>
            <button
              type="button"
              onClick={() => setConfirmDelete(true)}
              className="flex h-9 w-9 items-center justify-center rounded-full bg-danger-soft text-danger transition-colors hover:bg-danger hover:text-fg"
              aria-label="Delete"
            >
              <Trash2 className="h-4 w-4" />
            </button>
          </div>
        )}
      </div>

      {exercise.muscleGroups.length > 0 && (
        <section className="flex flex-col gap-2">
          <h2 className="text-[11px] font-semibold uppercase tracking-[0.18em] text-fg-subtle">
            Muscle groups
          </h2>
          <div className="flex flex-wrap gap-1.5">
            {exercise.muscleGroups.map((mg) => (
              <span
                key={mg}
                className="rounded-full border border-line-strong bg-surface-1 px-3 py-1 text-xs font-medium text-fg-soft"
              >
                {formatMuscleGroup(mg)}
              </span>
            ))}
          </div>
        </section>
      )}

      {exercise.instructions && (
        <section className="flex flex-col gap-2">
          <h2 className="text-[11px] font-semibold uppercase tracking-[0.18em] text-fg-subtle">
            Instructions
          </h2>
          <p className="whitespace-pre-line text-sm leading-6 text-fg-muted">
            {exercise.instructions}
          </p>
        </section>
      )}

      <ConfirmDialog
        open={confirmDelete}
        variant="danger"
        title={`Delete ${exercise.name}?`}
        message="This custom exercise will be removed. Sets you've already logged with it will be kept."
        confirmLabel="Delete"
        onCancel={() => setConfirmDelete(false)}
        onConfirm={() => {
          deleteExercise(exercise.id);
          setConfirmDelete(false);
          navigate("/exercises", { replace: true });
        }}
      />
    </div>
  );
}
