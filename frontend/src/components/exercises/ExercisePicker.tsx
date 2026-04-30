import { useMemo, useState } from "react";
import { Search } from "lucide-react";
import { useExercises } from "@/features/exercise/useExercises";
import { formatMuscleGroup } from "@/lib/muscleGroups";
import { BottomSheet } from "@/components/ui/BottomSheet";
import type { Exercise } from "@/types/exercise";

type Props = {
  open: boolean;
  onClose: () => void;
  onSelect: (exercise: Exercise) => void;
  title?: string;
  emptyMessage?: string;
};

export function ExercisePicker({
  open,
  onClose,
  onSelect,
  title = "Add exercise",
  emptyMessage = "No exercises match.",
}: Props) {
  const { exercises } = useExercises();
  const [query, setQuery] = useState("");

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return exercises;
    return exercises.filter((e) => e.name.toLowerCase().includes(q));
  }, [exercises, query]);

  return (
    <BottomSheet open={open} onClose={onClose} title={title} bodyScroll={false}>
      <div className="border-b border-gray-200 p-3">
        <div className="relative">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search…"
            autoFocus
            className="w-full rounded-full bg-gray-100 py-2 pl-10 pr-4 text-sm placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-black"
          />
        </div>
      </div>

      <ul className="flex-1 overflow-y-auto">
        {filtered.length === 0 && (
          <li className="p-4 text-center text-sm text-gray-500">{emptyMessage}</li>
        )}
        {filtered.map((exercise) => (
          <li key={exercise.id}>
            <button
              type="button"
              onClick={() => {
                onSelect(exercise);
                onClose();
              }}
              className="flex w-full flex-col items-start gap-0.5 border-b border-gray-100 px-4 py-3 text-left hover:bg-gray-50"
            >
              <span className="font-medium text-gray-900">{exercise.name}</span>
              <span className="text-xs text-gray-500">
                <span className="capitalize">{exercise.kind}</span>
                {exercise.equipment && ` • ${exercise.equipment}`}
                {exercise.muscleGroups.length > 0 &&
                  ` • ${exercise.muscleGroups.slice(0, 2).map(formatMuscleGroup).join(", ")}`}
              </span>
            </button>
          </li>
        ))}
      </ul>
    </BottomSheet>
  );
}
