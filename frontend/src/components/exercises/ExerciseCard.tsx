import { Link } from "react-router";
import { formatMuscleGroup } from "@/lib/muscleGroups";
import type { Exercise } from "@/types/exercise";

type Props = { exercise: Exercise };

const KIND_DOT_BG: Record<Exercise["kind"], string> = {
  strength: "bg-strength",
  cardio: "bg-cardio",
  bodyweight: "bg-bodyweight",
};

export function ExerciseCard({ exercise }: Props) {
  return (
    <Link
      to={`/exercises/${exercise.id}`}
      className="group flex flex-col gap-1 rounded-xl border border-line bg-surface-1 p-3.5 transition-colors hover:border-line-strong hover:bg-surface-2"
    >
      <div className="flex items-center justify-between gap-2">
        <div className="flex min-w-0 items-center gap-2.5">
          <span
            aria-hidden
            className={`h-1.5 w-1.5 shrink-0 rounded-full ${KIND_DOT_BG[exercise.kind]}`}
          />
          <h3 className="truncate font-display text-base text-fg-soft">{exercise.name}</h3>
        </div>
        {!exercise.isSystem && (
          <span className="shrink-0 rounded-full border border-accent/30 bg-accent-soft px-2 py-0.5 text-[10px] font-semibold uppercase tracking-[0.18em] text-accent">
            Custom
          </span>
        )}
      </div>
      <div className="flex flex-wrap items-center gap-1.5 pl-4 text-[11px] text-fg-muted">
        <span className="font-semibold uppercase tracking-[0.14em] text-fg-subtle">
          {exercise.kind}
        </span>
        {exercise.equipment && (
          <>
            <span aria-hidden className="text-fg-faint">
              ·
            </span>
            <span>{exercise.equipment}</span>
          </>
        )}
        {exercise.muscleGroups.length > 0 && (
          <>
            <span aria-hidden className="text-fg-faint">
              ·
            </span>
            <span>{exercise.muscleGroups.slice(0, 3).map(formatMuscleGroup).join(", ")}</span>
          </>
        )}
      </div>
    </Link>
  );
}
