import { useMemo, useState } from "react";
import { Link } from "react-router";
import { Plus, Search } from "lucide-react";
import { useExercises } from "@/features/exercise/useExercises";
import { ExerciseCard } from "@/components/exercises/ExerciseCard";
import { KindFilter } from "@/components/exercises/KindFilter";
import { MuscleGroupFilter } from "@/components/exercises/MuscleGroupFilter";
import type { ExerciseKind } from "@/types/exercise";
import type { MuscleGroup } from "@/lib/muscleGroups";

export function ExerciseListPage() {
  const [kind, setKind] = useState<ExerciseKind | null>(null);
  const [muscleGroup, setMuscleGroup] = useState<MuscleGroup | null>(null);
  const [query, setQuery] = useState("");

  const { exercises } = useExercises({
    kind: kind ?? undefined,
    muscleGroup: muscleGroup ?? undefined,
  });

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return exercises;
    return exercises.filter((e) => e.name.toLowerCase().includes(q));
  }, [exercises, query]);

  return (
    <div className="flex flex-col gap-4 p-4">
      <div className="flex items-center justify-between gap-3">
        <h1 className="text-2xl font-semibold">Exercises</h1>
        <Link
          to="/exercises/new"
          className="flex items-center gap-1 rounded-full bg-black px-3 py-1.5 text-sm font-medium text-white"
        >
          <Plus className="h-4 w-4" />
          New
        </Link>
      </div>

      <div className="relative">
        <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search exercises..."
          className="w-full rounded-full bg-gray-100 py-2 pl-10 pr-4 text-sm placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-black"
        />
      </div>

      <KindFilter value={kind} onChange={setKind} />
      <MuscleGroupFilter value={muscleGroup} onChange={setMuscleGroup} />

      {filtered.length === 0 && (
        <p className="text-sm text-gray-500">
          {query ? "No exercises match your search." : "No exercises yet — they'll appear shortly."}
        </p>
      )}

      <ul className="flex flex-col gap-2">
        {filtered.map((e) => (
          <li key={e.id}>
            <ExerciseCard exercise={e} />
          </li>
        ))}
      </ul>
    </div>
  );
}
