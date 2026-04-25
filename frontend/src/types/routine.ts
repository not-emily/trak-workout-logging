export type Routine = {
  id: string;
  userId: string;
  name: string;
  description: string | null;
  position: number;
  createdAt: string;
  updatedAt: string;
};

export type RoutineExercise = {
  id: string;
  routineId: string;
  exerciseId: string;
  position: number;
  plannedSets: number;
  plannedReps: number | null;
  plannedWeightLb: string | null;
  plannedDurationSeconds: number | null;
  plannedDistanceMeters: string | null;
  notes: string | null;
  createdAt: string;
  updatedAt: string;
};

export type AssembledRoutine = Routine & {
  exercises: RoutineExercise[];
};
