import { useMemo } from "react";
import { Link } from "react-router";
import { TrendingUp, ChevronRight } from "lucide-react";
import { useExercises } from "@/features/exercise/useExercises";
import { useLoggedExerciseIds } from "@/features/progress/useExerciseHistory";
import { useProgressSummary } from "@/features/progress/useProgressSummary";
import { ProgressStatCards } from "@/components/progress/ProgressStatCards";
import { SyncIndicator } from "@/components/layout/SyncIndicator";
import { EmptyState } from "@/components/ui/EmptyState";
import type { Exercise } from "@/types/exercise";

const KIND_DOT_BG: Record<Exercise["kind"], string> = {
  strength: "bg-strength",
  cardio: "bg-cardio",
  bodyweight: "bg-bodyweight",
};

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
      <div className="flex items-center justify-between">
        <h1 className="font-display text-3xl leading-none text-fg">Progress</h1>
        <SyncIndicator />
      </div>

      {logged.length === 0 ? (
        <EmptyState icon={TrendingUp}>
          Log a few sets and progress charts will appear here.
        </EmptyState>
      ) : (
        <>
          <ProgressStatCards summary={summary} />

          <section className="mt-2 flex flex-col gap-3">
            <h2 className="text-[11px] font-semibold uppercase tracking-[0.18em] text-fg-subtle">
              Exercises
            </h2>
            <ul className="flex flex-col gap-2">
              {logged.map((e) => (
                <li key={e.id}>
                  <Link
                    to={`/progress/${e.id}`}
                    className="group flex items-center justify-between gap-3 rounded-xl border border-line bg-surface-1 p-3.5 transition-colors hover:border-line-strong hover:bg-surface-2"
                  >
                    <div className="flex min-w-0 items-center gap-2.5">
                      <span
                        aria-hidden
                        className={`h-1.5 w-1.5 shrink-0 rounded-full ${KIND_DOT_BG[e.kind]}`}
                      />
                      <div className="flex min-w-0 flex-col">
                        <span className="truncate font-display text-sm text-fg-soft">{e.name}</span>
                        <span className="text-[10px] font-semibold uppercase tracking-[0.18em] text-fg-subtle">
                          {e.kind}
                        </span>
                      </div>
                    </div>
                    <ChevronRight className="h-4 w-4 shrink-0 text-fg-faint transition-transform group-hover:translate-x-0.5 group-hover:text-fg-muted" />
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
