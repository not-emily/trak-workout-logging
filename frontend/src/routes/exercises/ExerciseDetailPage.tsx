import { useState } from "react";
import { Link, Navigate, useNavigate, useParams } from "react-router";
import { ArrowLeft, Pencil, Trash2 } from "lucide-react";
import { deleteExercise, useExercises } from "@/features/exercise/useExercises";
import { formatMuscleGroup } from "@/lib/muscleGroups";
import { ConfirmDialog } from "@/components/ui/ConfirmDialog";

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
      <Link to="/exercises" className="flex items-center gap-1 text-sm text-gray-600">
        <ArrowLeft className="h-4 w-4" />
        Back
      </Link>

      <div className="flex items-start justify-between gap-3">
        <div className="flex flex-col gap-1">
          <h1 className="text-2xl font-semibold">{exercise.name}</h1>
          <div className="flex flex-wrap gap-1.5 text-xs text-gray-500">
            <span className="capitalize">{exercise.kind}</span>
            {exercise.equipment && (
              <>
                <span aria-hidden="true">•</span>
                <span>{exercise.equipment}</span>
              </>
            )}
            {exercise.level && (
              <>
                <span aria-hidden="true">•</span>
                <span className="capitalize">{exercise.level}</span>
              </>
            )}
          </div>
        </div>
        {canEdit && (
          <div className="flex gap-2">
            <Link
              to={`/exercises/${exercise.id}/edit`}
              className="flex h-8 w-8 items-center justify-center rounded-full bg-gray-100 text-gray-700"
              aria-label="Edit"
            >
              <Pencil className="h-4 w-4" />
            </Link>
            <button
              type="button"
              onClick={() => setConfirmDelete(true)}
              className="flex h-8 w-8 items-center justify-center rounded-full bg-red-50 text-red-600"
              aria-label="Delete"
            >
              <Trash2 className="h-4 w-4" />
            </button>
          </div>
        )}
      </div>

      {exercise.muscleGroups.length > 0 && (
        <section className="flex flex-col gap-2">
          <h2 className="text-sm font-medium text-gray-700">Muscle groups</h2>
          <div className="flex flex-wrap gap-1.5">
            {exercise.muscleGroups.map((mg) => (
              <span
                key={mg}
                className="rounded-full bg-gray-100 px-3 py-1 text-xs font-medium text-gray-700"
              >
                {formatMuscleGroup(mg)}
              </span>
            ))}
          </div>
        </section>
      )}

      {exercise.instructions && (
        <section className="flex flex-col gap-2">
          <h2 className="text-sm font-medium text-gray-700">Instructions</h2>
          <p className="whitespace-pre-line text-sm leading-6 text-gray-700">
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
