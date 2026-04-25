import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { GripVertical, X } from "lucide-react";
import { removeRoutineExercise } from "@/features/routine/routineActions";
import { PlannedSetsEditor } from "./PlannedSetsEditor";
import type { Exercise } from "@/types/exercise";
import type { RoutineExercise } from "@/types/routine";

type Props = {
  routineExercise: RoutineExercise;
  exercise: Exercise;
};

export function RoutineExerciseBlock({ routineExercise, exercise }: Props) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: routineExercise.id,
  });

  const style: React.CSSProperties = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  function handleRemove() {
    if (!confirm(`Remove ${exercise.name} from this routine?`)) return;
    removeRoutineExercise(routineExercise.id);
  }

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
          className="flex h-7 w-7 shrink-0 cursor-grab items-center justify-center rounded-md text-gray-400 hover:text-gray-600 active:cursor-grabbing"
        >
          <GripVertical className="h-4 w-4" />
        </button>
        <h3 className="flex-1 font-medium text-gray-900">{exercise.name}</h3>
        <button
          type="button"
          onClick={handleRemove}
          aria-label={`Remove ${exercise.name}`}
          className="flex h-7 w-7 items-center justify-center rounded-full text-gray-400 hover:text-red-500"
        >
          <X className="h-4 w-4" />
        </button>
      </header>

      <PlannedSetsEditor routineExercise={routineExercise} exerciseKind={exercise.kind} />
    </section>
  );
}
