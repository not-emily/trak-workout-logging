// Allowed metric strings — mirrors BodyMeasurement::ALLOWED_METRICS on the
// backend. Keep in sync.
export const BODY_METRICS = [
  "weight",
  "body_fat_pct",
  "chest",
  "waist",
  "hips",
  "arm_left",
  "arm_right",
  "thigh_left",
  "thigh_right",
  "calf_left",
  "calf_right",
  "neck",
  "shoulders",
] as const;

export type BodyMetric = (typeof BODY_METRICS)[number];

export type BodyMeasurement = {
  id: string;
  userId: string;
  metric: BodyMetric;
  value: string; // numeric serialized as string to preserve precision
  unit: string;
  recordedAt: string;
  notes: string | null;
  createdAt: string;
  updatedAt: string;
};

// Default unit per metric. Inches for circumferences, pct for body fat, lb for weight.
export function defaultUnit(metric: BodyMetric): string {
  if (metric === "weight") return "lb";
  if (metric === "body_fat_pct") return "%";
  return "in";
}

export function formatMetricLabel(metric: BodyMetric): string {
  switch (metric) {
    case "body_fat_pct":
      return "Body fat";
    case "arm_left":
      return "Left arm";
    case "arm_right":
      return "Right arm";
    case "thigh_left":
      return "Left thigh";
    case "thigh_right":
      return "Right thigh";
    case "calf_left":
      return "Left calf";
    case "calf_right":
      return "Right calf";
    default:
      return metric.charAt(0).toUpperCase() + metric.slice(1);
  }
}
