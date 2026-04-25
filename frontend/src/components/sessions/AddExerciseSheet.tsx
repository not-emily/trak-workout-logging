import { useMemo, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Search, X } from "lucide-react";
import { useExercises } from "@/features/exercise/useExercises";
import { formatMuscleGroup } from "@/lib/muscleGroups";
import type { Exercise } from "@/types/exercise";

type Props = {
  open: boolean;
  onClose: () => void;
  onSelect: (exercise: Exercise) => void;
};

export function AddExerciseSheet({ open, onClose, onSelect }: Props) {
  const { exercises } = useExercises();
  const [query, setQuery] = useState("");

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return exercises;
    return exercises.filter((e) => e.name.toLowerCase().includes(q));
  }, [exercises, query]);

  return (
    <AnimatePresence>
      {open && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 z-40 bg-black/40"
          />
          <motion.div
            initial={{ y: "100%" }}
            animate={{ y: 0 }}
            exit={{ y: "100%" }}
            transition={{ type: "spring", stiffness: 350, damping: 30 }}
            className="fixed bottom-0 left-0 right-0 z-50 flex max-h-[80vh] flex-col rounded-t-2xl bg-white shadow-xl"
          >
            <div className="flex items-center justify-between border-b border-gray-200 px-4 py-3">
              <h2 className="text-lg font-semibold">Add exercise</h2>
              <button
                type="button"
                onClick={onClose}
                aria-label="Close"
                className="flex h-8 w-8 items-center justify-center rounded-full bg-gray-100"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

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
                <li className="p-4 text-center text-sm text-gray-500">
                  No exercises match.
                </li>
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
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
