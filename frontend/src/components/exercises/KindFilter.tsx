import type { ExerciseKind } from "@/types/exercise";

type Props = {
  value: ExerciseKind | null;
  onChange: (kind: ExerciseKind | null) => void;
};

const OPTIONS: { label: string; value: ExerciseKind | null; dot?: string }[] = [
  { label: "All", value: null },
  { label: "Strength", value: "strength", dot: "bg-strength" },
  { label: "Cardio", value: "cardio", dot: "bg-cardio" },
  { label: "Bodyweight", value: "bodyweight", dot: "bg-bodyweight" },
];

export function KindFilter({ value, onChange }: Props) {
  return (
    <div className="flex gap-1 overflow-x-auto">
      {OPTIONS.map((opt) => {
        const isActive = value === opt.value;
        return (
          <button
            key={opt.label}
            type="button"
            onClick={() => onChange(opt.value)}
            className={`flex items-center gap-1.5 whitespace-nowrap rounded-full border px-3 py-1.5 text-xs font-semibold uppercase tracking-[0.14em] transition-colors ${
              isActive
                ? "border-accent bg-accent-soft text-accent"
                : "border-line-strong bg-surface-1 text-fg-muted hover:bg-surface-2 hover:text-fg"
            }`}
          >
            {opt.dot && (
              <span aria-hidden className={`h-1.5 w-1.5 rounded-full ${opt.dot}`} />
            )}
            {opt.label}
          </button>
        );
      })}
    </div>
  );
}
