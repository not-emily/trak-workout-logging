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
  /** Tailwind `md:max-w-*` to match the parent page's content width. */
  maxWidth?: string;
};

const KIND_DOT_BG: Record<Exercise["kind"], string> = {
  strength: "bg-strength",
  cardio: "bg-cardio",
  bodyweight: "bg-bodyweight",
};

export function ExercisePicker({
  open,
  onClose,
  onSelect,
  title = "Add exercise",
  emptyMessage = "No exercises match.",
  maxWidth,
}: Props) {
  const { exercises } = useExercises();
  const [query, setQuery] = useState("");

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return exercises;
    return exercises.filter((e) => e.name.toLowerCase().includes(q));
  }, [exercises, query]);

  return (
    <BottomSheet open={open} onClose={onClose} title={title} bodyScroll={false} maxWidth={maxWidth}>
      <div className="border-b border-line p-3">
        <div className="relative">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-fg-faint" />
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search…"
            autoFocus
            className="w-full rounded-full border border-line-strong bg-surface-2 py-2 pl-10 pr-4 text-sm text-fg placeholder:text-fg-faint focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent-soft"
          />
        </div>
      </div>

      <ul className="flex-1 overflow-y-auto">
        {filtered.length === 0 && (
          <li className="p-6 text-center text-sm text-fg-muted">{emptyMessage}</li>
        )}
        {filtered.map((exercise) => (
          <li key={exercise.id}>
            <button
              type="button"
              onClick={() => {
                onSelect(exercise);
                onClose();
              }}
              className="group flex w-full items-center gap-3 border-b border-line/60 px-4 py-3 text-left transition-colors hover:bg-surface-2"
            >
              <span
                aria-hidden
                className={`h-1.5 w-1.5 shrink-0 rounded-full ${KIND_DOT_BG[exercise.kind]}`}
              />
              <span className="flex min-w-0 flex-1 flex-col gap-0.5">
                <span className="truncate font-display text-sm text-fg-soft">{exercise.name}</span>
                <span className="flex items-center gap-1.5 truncate text-[10px] font-medium uppercase tracking-[0.14em] text-fg-subtle">
                  <span>{exercise.kind}</span>
                  {exercise.equipment && (
                    <>
                      <span className="text-fg-faint">·</span>
                      <span className="normal-case tracking-normal">{exercise.equipment}</span>
                    </>
                  )}
                  {exercise.muscleGroups.length > 0 && (
                    <>
                      <span className="text-fg-faint">·</span>
                      <span className="normal-case tracking-normal">
                        {exercise.muscleGroups.slice(0, 2).map(formatMuscleGroup).join(", ")}
                      </span>
                    </>
                  )}
                </span>
              </span>
            </button>
          </li>
        ))}
      </ul>
    </BottomSheet>
  );
}
