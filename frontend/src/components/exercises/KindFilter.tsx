import type { ExerciseKind } from "@/types/exercise";

type Props = {
  value: ExerciseKind | null;
  onChange: (kind: ExerciseKind | null) => void;
};

const OPTIONS: { label: string; value: ExerciseKind | null }[] = [
  { label: "All", value: null },
  { label: "Strength", value: "strength" },
  { label: "Cardio", value: "cardio" },
  { label: "Bodyweight", value: "bodyweight" },
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
            className={`whitespace-nowrap rounded-full px-3 py-1.5 text-sm font-medium transition-colors ${
              isActive ? "bg-black text-white" : "bg-gray-100 text-gray-700 hover:bg-gray-200"
            }`}
          >
            {opt.label}
          </button>
        );
      })}
    </div>
  );
}
