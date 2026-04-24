export const MUSCLE_GROUPS = [
  "abdominals",
  "abductors",
  "adductors",
  "biceps",
  "calves",
  "chest",
  "forearms",
  "glutes",
  "hamstrings",
  "lats",
  "lower_back",
  "middle_back",
  "quadriceps",
  "shoulders",
  "traps",
  "triceps",
] as const;

export type MuscleGroup = (typeof MUSCLE_GROUPS)[number];

export function formatMuscleGroup(mg: string): string {
  return mg
    .split("_")
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");
}
