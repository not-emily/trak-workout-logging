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
      className="rounded-full bg-gray-100 px-3 py-1.5 text-sm font-medium text-gray-700 focus:outline-none focus:ring-2 focus:ring-black"
    >
      <option value="">All muscle groups</option>
      {MUSCLE_GROUPS.map((mg) => (
        <option key={mg} value={mg}>
          {formatMuscleGroup(mg)}
        </option>
      ))}
    </select>
  );
}
