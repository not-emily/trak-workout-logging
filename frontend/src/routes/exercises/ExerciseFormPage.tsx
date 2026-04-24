import { useMemo } from "react";
import { Link, Navigate, useNavigate, useParams } from "react-router";
import { ArrowLeft } from "lucide-react";
import { ExerciseForm } from "@/components/exercises/ExerciseForm";
import { upsertExercise, useExercises } from "@/features/exercise/useExercises";
import { uuid } from "@/lib/uuid";
import type { ExerciseInput } from "@/types/exercise";

export function ExerciseFormPage() {
  const { id } = useParams<{ id?: string }>();
  const navigate = useNavigate();
  const isNew = id === "new";

  const { exercises, loading } = useExercises();
  const existing = useMemo(
    () => (isNew ? null : exercises.find((e) => e.id === id) ?? null),
    [exercises, id, isNew]
  );

  if (!isNew && !loading && !existing) {
    return <Navigate to="/exercises" replace />;
  }

  if (!isNew && existing?.isSystem) {
    return <Navigate to={`/exercises/${id}`} replace />;
  }

  async function handleSubmit(input: ExerciseInput) {
    const targetId = isNew ? uuid() : id!;
    await upsertExercise(targetId, input);
    navigate("/exercises", { replace: true });
  }

  return (
    <div className="flex flex-col gap-4 p-4">
      <Link to="/exercises" className="flex items-center gap-1 text-sm text-gray-600">
        <ArrowLeft className="h-4 w-4" />
        Back
      </Link>
      <h1 className="text-2xl font-semibold">
        {isNew ? "New custom exercise" : "Edit exercise"}
      </h1>
      {!isNew && loading && <p className="text-sm text-gray-500">Loading…</p>}
      {(isNew || existing) && (
        <ExerciseForm
          initial={
            existing
              ? {
                  name: existing.name,
                  kind: existing.kind,
                  muscleGroups: existing.muscleGroups,
                  equipment: existing.equipment,
                  instructions: existing.instructions,
                }
              : undefined
          }
          submitLabel={isNew ? "Create exercise" : "Save changes"}
          onSubmit={handleSubmit}
        />
      )}
    </div>
  );
}
