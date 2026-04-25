export type Session = {
  id: string;
  userId: string;
  routineId: string | null;
  name: string | null;
  startedAt: string;
  endedAt: string | null;
  notes: string | null;
  durationSeconds: number | null;
  createdAt: string;
  updatedAt: string;
};

export type SessionExercise = {
  id: string;
  sessionId: string;
  exerciseId: string;
  position: number;
  notes: string | null;
  createdAt: string;
  updatedAt: string;
};

export type WorkoutSet = {
  id: string;
  sessionExerciseId: string;
  position: number;
  reps: number | null;
  weightLb: string | null;        // numerics returned as strings to preserve precision
  durationSeconds: number | null;
  distanceMeters: string | null;
  rpe: number | null;
  isWarmup: boolean;
  completedAt: string | null;
  notes: string | null;
  createdAt: string;
  updatedAt: string;
};

// Assembled view: a session with its exercises and sets joined.
export type AssembledSession = Session & {
  exercises: AssembledSessionExercise[];
};

export type AssembledSessionExercise = SessionExercise & {
  sets: WorkoutSet[];
};
