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

  const { exercises } = useExercises();
  const existing = useMemo(
    () => (isNew ? null : exercises.find((e) => e.id === id) ?? null),
    [exercises, id, isNew]
  );

  if (!isNew && existing?.isSystem) {
    return <Navigate to={`/exercises/${id}`} replace />;
  }

  function handleSubmit(input: ExerciseInput) {
    const targetId = isNew ? uuid() : id!;
    upsertExercise(targetId, input);
    navigate("/exercises", { replace: true });
    return Promise.resolve();
  }

  return (
    <div className="mx-auto flex max-w-2xl flex-col gap-4 px-4 pt-6 pb-8">
      <Link
        to="/exercises"
        className="flex w-fit items-center gap-1 text-xs font-semibold uppercase tracking-[0.18em] text-fg-subtle transition-colors hover:text-fg-muted"
      >
        <ArrowLeft className="h-3.5 w-3.5" />
        Back
      </Link>
      <h1 className="font-display text-3xl leading-none text-fg">
        {isNew ? "New custom exercise" : "Edit exercise"}
      </h1>
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
