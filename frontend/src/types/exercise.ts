export type ExerciseKind = "strength" | "cardio" | "bodyweight";
export type ExerciseLevel = "beginner" | "intermediate" | "expert";

export type Exercise = {
  id: string;
  name: string;
  kind: ExerciseKind;
  muscleGroups: string[];
  instructions: string | null;
  equipment: string | null;
  level: ExerciseLevel | null;
  isSystem: boolean;
  ownerUserId: string | null;
  createdAt: string;
  updatedAt: string;
};

export type ExerciseInput = {
  name: string;
  kind: ExerciseKind;
  muscleGroups: string[];
  instructions?: string | null;
  equipment?: string | null;
  level?: ExerciseLevel | null;
};
