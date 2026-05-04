import { useMemo, useState } from "react";
import { Link } from "react-router";
import { Dumbbell, Plus, Search } from "lucide-react";
import { useExercises } from "@/features/exercise/useExercises";
import { ExerciseCard } from "@/components/exercises/ExerciseCard";
import { KindFilter } from "@/components/exercises/KindFilter";
import { MuscleGroupFilter } from "@/components/exercises/MuscleGroupFilter";
import { SyncIndicator } from "@/components/layout/SyncIndicator";
import { EmptyState } from "@/components/ui/EmptyState";
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
    <div className="mx-auto flex max-w-5xl flex-col gap-4 px-4 pt-6 pb-8">
      <div className="flex items-center justify-between gap-3">
        <h1 className="font-display text-3xl leading-none text-fg">Exercises</h1>
        <div className="flex items-center gap-2">
          <SyncIndicator />
          <Link
            to="/exercises/new"
            className="flex items-center gap-1.5 rounded-full bg-accent px-4 py-2 text-sm font-semibold text-accent-fg transition-colors hover:bg-accent-hover"
          >
            <Plus className="h-4 w-4" strokeWidth={2.5} />
            New
          </Link>
        </div>
      </div>

      <div className="relative">
        <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-fg-faint" />
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search exercises..."
          className="w-full rounded-full border border-line-strong bg-surface-1 py-2 pl-10 pr-4 text-sm text-fg placeholder:text-fg-faint focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent-soft"
        />
      </div>

      <KindFilter value={kind} onChange={setKind} />
      <MuscleGroupFilter value={muscleGroup} onChange={setMuscleGroup} />

      {filtered.length === 0 && (
        <EmptyState icon={query ? Search : Dumbbell}>
          {query ? "No exercises match your search." : "No exercises yet — they'll appear shortly."}
        </EmptyState>
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
