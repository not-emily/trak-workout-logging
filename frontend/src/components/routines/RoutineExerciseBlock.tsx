import { useState } from "react";
import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { GripVertical, X } from "lucide-react";
import { removeRoutineExercise } from "@/features/routine/routineActions";
import { ConfirmDialog } from "@/components/ui/ConfirmDialog";
import { PlannedSetsEditor } from "./PlannedSetsEditor";
import type { Exercise } from "@/types/exercise";
import type { RoutineExercise } from "@/types/routine";

type Props = {
  routineExercise: RoutineExercise;
  exercise: Exercise;
};

export function RoutineExerciseBlock({ routineExercise, exercise }: Props) {
  const [confirmRemove, setConfirmRemove] = useState(false);
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: routineExercise.id,
  });

  const style: React.CSSProperties = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  return (
    <section
      ref={setNodeRef}
      style={style}
      className="flex flex-col gap-2 rounded-xl bg-white p-3 ring-1 ring-gray-200"
    >
      <header className="flex items-center justify-between gap-2">
        <button
          type="button"
          {...attributes}
          {...listeners}
          aria-label="Reorder"
          // touch-action: none lets dnd-kit's TouchSensor own the gesture so
          // the browser doesn't pan the page on drag in mobile/emulated mode.
          style={{ touchAction: "none" }}
          className="flex h-7 w-7 shrink-0 cursor-grab items-center justify-center rounded-md text-gray-400 hover:text-gray-600 active:cursor-grabbing"
        >
          <GripVertical className="h-4 w-4" />
        </button>
        <h3 className="flex-1 font-medium text-gray-900">{exercise.name}</h3>
        <button
          type="button"
          onClick={() => setConfirmRemove(true)}
          aria-label={`Remove ${exercise.name}`}
          className="flex h-7 w-7 items-center justify-center rounded-full text-gray-400 hover:text-red-500"
        >
          <X className="h-4 w-4" />
        </button>
      </header>

      <PlannedSetsEditor routineExercise={routineExercise} exerciseKind={exercise.kind} />

      <ConfirmDialog
        open={confirmRemove}
        variant="danger"
        title={`Remove ${exercise.name}?`}
        message="This exercise will be removed from the routine. Existing logged sessions are unaffected."
        confirmLabel="Remove"
        onCancel={() => setConfirmRemove(false)}
        onConfirm={() => {
          removeRoutineExercise(routineExercise.id);
          setConfirmRemove(false);
        }}
      />
    </section>
  );
}
