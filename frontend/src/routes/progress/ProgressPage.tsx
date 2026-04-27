import { useMemo } from "react";
import { Link } from "react-router";
import { TrendingUp, ChevronRight } from "lucide-react";
import { useExercises } from "@/features/exercise/useExercises";
import { useLoggedExerciseIds } from "@/features/progress/useExerciseHistory";
import { useProgressSummary } from "@/features/progress/useProgressSummary";
import { ProgressStatCards } from "@/components/progress/ProgressStatCards";
import { EmptyState } from "@/components/ui/EmptyState";

export function ProgressPage() {
  const { exercises } = useExercises();
  const loggedIds = useLoggedExerciseIds();
  const summary = useProgressSummary();

  const logged = useMemo(() => {
    const byId = new Map(exercises.map((e) => [e.id, e]));
    return loggedIds
      .map((id) => byId.get(id))
      .filter((e): e is NonNullable<typeof e> => Boolean(e))
      .sort((a, b) => a.name.localeCompare(b.name));
  }, [exercises, loggedIds]);

  return (
    <div className="mx-auto flex max-w-5xl flex-col gap-4 px-4 pt-6 pb-8">
      <h1 className="text-2xl font-semibold">Progress</h1>

      {logged.length === 0 ? (
        <EmptyState icon={TrendingUp}>
          Log a few sets and progress charts will appear here.
        </EmptyState>
      ) : (
        <>
          <ProgressStatCards summary={summary} />

          <section className="flex flex-col gap-2">
            <h2 className="text-sm font-medium text-gray-700">Exercises</h2>
            <ul className="flex flex-col gap-2">
              {logged.map((e) => (
                <li key={e.id}>
                  <Link
                    to={`/progress/${e.id}`}
                    className="flex items-center justify-between gap-3 rounded-xl bg-white p-3 ring-1 ring-gray-200 hover:bg-gray-50"
                  >
                    <div className="flex flex-col">
                      <span className="font-medium text-gray-900">{e.name}</span>
                      <span className="text-xs uppercase tracking-wide text-gray-400">{e.kind}</span>
                    </div>
                    <ChevronRight className="h-4 w-4 text-gray-400" />
                  </Link>
                </li>
              ))}
            </ul>
          </section>
        </>
      )}
    </div>
  );
}
