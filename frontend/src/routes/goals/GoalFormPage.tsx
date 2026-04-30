import { useEffect, useState } from "react";
import { Link, Navigate, useNavigate, useParams } from "react-router";
import { ArrowLeft, ChevronDown, Trash2 } from "lucide-react";
import { uuid } from "@/lib/uuid";
import { useExercises } from "@/features/exercise/useExercises";
import { deleteGoal, upsertGoal, useGoal } from "@/features/goal/useGoals";
import { ExercisePicker } from "@/components/exercises/ExercisePicker";
import { GoalTypePicker } from "@/components/goals/GoalTypePicker";
import { ConfirmDialog } from "@/components/ui/ConfirmDialog";
import {
  BODY_METRICS,
  defaultUnit,
  formatMetricLabel,
  type BodyMetric,
} from "@/types/bodyMeasurement";
import type { GoalDirection, GoalInput, GoalTargetType } from "@/types/goal";

export function GoalFormPage() {
  const { id } = useParams<{ id?: string }>();
  const navigate = useNavigate();
  const isNew = !id || id === "new";
  const existing = useGoal(isNew ? undefined : id);
  const { exercises } = useExercises();

  const [name, setName] = useState("");
  const [targetType, setTargetType] = useState<GoalTargetType | null>(null);
  const [exerciseId, setExerciseId] = useState<string>("");
  const [bodyMetric, setBodyMetric] = useState<BodyMetric>("weight");
  const [targetValue, setTargetValue] = useState("");
  const [unit, setUnit] = useState("lb");
  const [direction, setDirection] = useState<GoalDirection>("increase");
  const [targetDate, setTargetDate] = useState("");
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [pickerOpen, setPickerOpen] = useState(false);

  // Seed from existing goal once it loads.
  useEffect(() => {
    if (!existing) return;
    setName(existing.name);
    setTargetType(existing.targetType);
    setExerciseId(existing.exerciseId ?? "");
    if (existing.targetType === "body" && existing.metric) {
      setBodyMetric(existing.metric as BodyMetric);
    }
    setTargetValue(existing.targetValue);
    setUnit(existing.unit);
    setDirection(existing.direction);
    setTargetDate(existing.targetDate ?? "");
  }, [existing]);

  // Auto-default unit when target type or body metric changes (only on new).
  useEffect(() => {
    if (!isNew || !targetType) return;
    if (targetType === "lift") setUnit("lb");
    else if (targetType === "body") setUnit(defaultUnit(bodyMetric));
    else if (targetType === "frequency") setUnit("sessions");
  }, [isNew, targetType, bodyMetric]);

  const selectedExercise = exerciseId ? exercises.find((e) => e.id === exerciseId) : null;

  if (!isNew && !existing) {
    return <Navigate to="/goals" replace />;
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!targetType || !name.trim() || !targetValue.trim()) return;

    const targetId = isNew ? uuid() : id!;
    const input: GoalInput = {
      name: name.trim(),
      targetType,
      exerciseId: targetType === "lift" ? exerciseId || null : null,
      metric:
        targetType === "body"
          ? bodyMetric
          : targetType === "frequency"
            ? "sessions_per_week"
            : null,
      targetValue: targetValue.trim(),
      unit: unit.trim() || "lb",
      direction: targetType === "frequency" ? "increase" : direction,
      targetDate: targetDate || null,
    };
    upsertGoal(targetId, input);
    navigate("/goals", { replace: true });
  }

  function handleDelete() {
    if (!existing) return;
    deleteGoal(existing.id);
    navigate("/goals", { replace: true });
  }

  return (
    <div className="mx-auto flex max-w-2xl flex-col gap-4 px-4 pt-6 pb-8">
      <Link to="/goals" className="flex items-center gap-1 text-sm text-gray-600">
        <ArrowLeft className="h-4 w-4" />
        Back
      </Link>

      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold">{isNew ? "New goal" : "Edit goal"}</h1>
        {!isNew && (
          <button
            type="button"
            onClick={() => setConfirmDelete(true)}
            aria-label="Delete goal"
            className="flex h-9 w-9 items-center justify-center rounded-full bg-red-50 text-red-600"
          >
            <Trash2 className="h-4 w-4" />
          </button>
        )}
      </div>

      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        <label className="flex flex-col gap-1 text-sm">
          Name
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
            placeholder="e.g. Bench 225"
            className="rounded-lg border border-gray-300 px-3 py-2 text-base"
          />
        </label>

        <div className="flex flex-col gap-1 text-sm">
          Type
          <GoalTypePicker value={targetType} onChange={setTargetType} />
        </div>

        {targetType === "lift" && (
          <div className="flex flex-col gap-1 text-sm">
            Exercise
            <button
              type="button"
              onClick={() => setPickerOpen(true)}
              className="flex items-center justify-between rounded-lg border border-gray-300 bg-white px-3 py-2 text-left text-base"
            >
              <span className={selectedExercise ? "text-gray-900" : "text-gray-400"}>
                {selectedExercise ? selectedExercise.name : "Pick an exercise…"}
              </span>
              <ChevronDown className="h-4 w-4 text-gray-400" />
            </button>
            <span className="text-xs text-gray-500">
              Compared against your best estimated 1RM for this exercise.
            </span>
          </div>
        )}

        {targetType === "body" && (
          <label className="flex flex-col gap-1 text-sm">
            Body metric
            <select
              value={bodyMetric}
              onChange={(e) => setBodyMetric(e.target.value as BodyMetric)}
              className="rounded-lg border border-gray-300 bg-white px-3 py-2 text-base"
            >
              {BODY_METRICS.map((m) => (
                <option key={m} value={m}>
                  {formatMetricLabel(m)}
                </option>
              ))}
            </select>
          </label>
        )}

        {targetType && targetType !== "frequency" && (
          <label className="flex flex-col gap-1 text-sm">
            Direction
            <div className="flex gap-2">
              {(["increase", "decrease"] as GoalDirection[]).map((d) => {
                const active = direction === d;
                return (
                  <button
                    key={d}
                    type="button"
                    onClick={() => setDirection(d)}
                    className={`flex-1 rounded-lg px-3 py-2 text-sm font-medium ring-1 ${
                      active
                        ? "bg-gray-900 text-white ring-gray-900"
                        : "bg-white text-gray-700 ring-gray-200"
                    }`}
                  >
                    {d === "increase" ? "Increase to" : "Decrease to"}
                  </button>
                );
              })}
            </div>
          </label>
        )}

        <div className="flex gap-2">
          <label className="flex flex-1 flex-col gap-1 text-sm">
            Target
            <input
              type="text"
              inputMode="decimal"
              value={targetValue}
              onChange={(e) => setTargetValue(e.target.value)}
              required
              className="rounded-lg border border-gray-300 px-3 py-2 text-base"
            />
          </label>
          <label className="flex w-28 flex-col gap-1 text-sm">
            Unit
            <input
              type="text"
              value={unit}
              onChange={(e) => setUnit(e.target.value)}
              className="rounded-lg border border-gray-300 px-3 py-2 text-base"
            />
          </label>
        </div>

        {targetType !== "frequency" && (
          <label className="flex flex-col gap-1 text-sm">
            Target date <span className="text-gray-400">(optional)</span>
            <input
              type="date"
              value={targetDate}
              onChange={(e) => setTargetDate(e.target.value)}
              className="rounded-lg border border-gray-300 px-3 py-2 text-base"
            />
          </label>
        )}

        <button
          type="submit"
          disabled={
            !targetType ||
            !name.trim() ||
            !targetValue.trim() ||
            (targetType === "lift" && !exerciseId)
          }
          className="mt-2 rounded-lg bg-black px-4 py-2 font-medium text-white disabled:opacity-60"
        >
          {isNew ? "Create goal" : "Save changes"}
        </button>
      </form>

      <ExercisePicker
        open={pickerOpen}
        onClose={() => setPickerOpen(false)}
        onSelect={(ex) => setExerciseId(ex.id)}
        title="Pick exercise"
      />

      <ConfirmDialog
        open={confirmDelete}
        variant="danger"
        title="Delete this goal?"
        message="The goal will be permanently removed."
        confirmLabel="Delete"
        onCancel={() => setConfirmDelete(false)}
        onConfirm={handleDelete}
      />
    </div>
  );
}
