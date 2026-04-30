export type GoalTargetType = "lift" | "body" | "frequency";
export type GoalDirection = "increase" | "decrease";

export type Goal = {
  id: string;
  userId: string;
  name: string;
  targetType: GoalTargetType;
  exerciseId: string | null;
  metric: string | null; // e.g. body metric, or "sessions_per_week"
  targetValue: string; // numeric serialized as string
  startValue: string | null; // numeric serialized as string; snapshot of where the user was when the goal was created
  unit: string;
  direction: GoalDirection;
  targetDate: string | null; // YYYY-MM-DD
  achievedAt: string | null; // ISO8601
  createdAt: string;
  updatedAt: string;
};

// Input shape for create/update. exerciseId is required for "lift", metric for "body" / "frequency".
export type GoalInput = {
  name: string;
  targetType: GoalTargetType;
  exerciseId?: string | null;
  metric?: string | null;
  targetValue: string;
  startValue?: string | null;
  unit: string;
  direction: GoalDirection;
  targetDate?: string | null;
  achievedAt?: string | null;
};
