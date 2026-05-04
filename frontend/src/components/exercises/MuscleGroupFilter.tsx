import { MUSCLE_GROUPS, formatMuscleGroup, type MuscleGroup } from "@/lib/muscleGroups";

type Props = {
  value: MuscleGroup | null;
  onChange: (mg: MuscleGroup | null) => void;
};

export function MuscleGroupFilter({ value, onChange }: Props) {
  return (
    <select
      value={value ?? ""}
      onChange={(e) => onChange((e.target.value || null) as MuscleGroup | null)}
      className="rounded-full border border-line-strong bg-surface-1 px-3 py-1.5 text-xs font-semibold uppercase tracking-[0.14em] text-fg-muted transition-colors hover:bg-surface-2 hover:text-fg focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent-soft [color-scheme:dark]"
    >
      <option value="" className="bg-surface-2 text-fg">
        All muscle groups
      </option>
      {MUSCLE_GROUPS.map((mg) => (
        <option key={mg} value={mg} className="bg-surface-2 text-fg">
          {formatMuscleGroup(mg)}
        </option>
      ))}
    </select>
  );
}
