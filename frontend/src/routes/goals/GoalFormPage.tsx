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

const labelClass =
  "flex flex-col gap-1.5 text-[11px] font-semibold uppercase tracking-[0.18em] text-fg-subtle";
const fieldClass =
  "rounded-lg border border-line-strong bg-surface-2 px-3 py-2.5 text-base text-fg placeholder:text-fg-faint focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent-soft";

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
    <div className="mx-auto flex max-w-2xl flex-col gap-5 px-4 pt-6 pb-8">
      <Link
        to="/goals"
        className="flex w-fit items-center gap-1 text-xs font-semibold uppercase tracking-[0.18em] text-fg-subtle transition-colors hover:text-fg-muted"
      >
        <ArrowLeft className="h-3.5 w-3.5" />
        Back
      </Link>

      <div className="flex items-center justify-between">
        <h1 className="font-display text-3xl leading-none text-fg">
          {isNew ? "New goal" : "Edit goal"}
        </h1>
        {!isNew && (
          <button
            type="button"
            onClick={() => setConfirmDelete(true)}
            aria-label="Delete goal"
            className="flex h-9 w-9 items-center justify-center rounded-full bg-danger-soft text-danger transition-colors hover:bg-danger hover:text-fg"
          >
            <Trash2 className="h-4 w-4" />
          </button>
        )}
      </div>

      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        <label className={labelClass}>
          Name
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
            placeholder="e.g. Bench 225"
            className={fieldClass + " font-sans normal-case tracking-normal"}
          />
        </label>

        <div className={labelClass}>
          Type
          <GoalTypePicker value={targetType} onChange={setTargetType} />
        </div>

        {targetType === "lift" && (
          <div className={labelClass}>
            Exercise
            <button
              type="button"
              onClick={() => setPickerOpen(true)}
              className={fieldClass + " flex items-center justify-between text-left normal-case tracking-normal"}
            >
              <span className={selectedExercise ? "text-fg" : "text-fg-faint"}>
                {selectedExercise ? selectedExercise.name : "Pick an exercise…"}
              </span>
              <ChevronDown className="h-4 w-4 text-fg-faint" />
            </button>
            <span className="text-[11px] font-normal normal-case tracking-normal text-fg-muted">
              Compared against your best estimated 1RM for this exercise.
            </span>
          </div>
        )}

        {targetType === "body" && (
          <label className={labelClass}>
            Body metric
            <select
              value={bodyMetric}
              onChange={(e) => setBodyMetric(e.target.value as BodyMetric)}
              className={fieldClass + " font-sans normal-case tracking-normal"}
            >
              {BODY_METRICS.map((m) => (
                <option key={m} value={m} className="bg-surface-2 text-fg">
                  {formatMetricLabel(m)}
                </option>
              ))}
            </select>
          </label>
        )}

        {targetType && targetType !== "frequency" && (
          <div className={labelClass}>
            Direction
            <div className="flex gap-2">
              {(["increase", "decrease"] as GoalDirection[]).map((d) => {
                const active = direction === d;
                return (
                  <button
                    key={d}
                    type="button"
                    onClick={() => setDirection(d)}
                    className={`flex-1 rounded-lg border px-3 py-2.5 text-sm font-semibold normal-case tracking-normal transition-colors ${
                      active
                        ? "border-accent bg-accent-soft text-accent"
                        : "border-line-strong bg-surface-2 text-fg-muted hover:bg-surface-3 hover:text-fg"
                    }`}
                  >
                    {d === "increase" ? "Increase to" : "Decrease to"}
                  </button>
                );
              })}
            </div>
          </div>
        )}

        <div className="flex gap-2">
          <label className={labelClass + " flex-1"}>
            Target
            <input
              type="text"
              inputMode="decimal"
              value={targetValue}
              onChange={(e) => setTargetValue(e.target.value)}
              required
              className={fieldClass + " font-mono normal-case tracking-normal"}
            />
          </label>
          <label className={labelClass + " w-28"}>
            Unit
            <input
              type="text"
              value={unit}
              onChange={(e) => setUnit(e.target.value)}
              className={fieldClass + " font-mono normal-case tracking-normal"}
            />
          </label>
        </div>

        {targetType !== "frequency" && (
          <label className={labelClass}>
            <span>
              Target date{" "}
              <span className="font-normal normal-case tracking-normal text-fg-faint">
                (optional)
              </span>
            </span>
            <input
              type="date"
              value={targetDate}
              onChange={(e) => setTargetDate(e.target.value)}
              className={fieldClass + " font-sans normal-case tracking-normal [color-scheme:dark]"}
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
          className="mt-2 rounded-lg bg-accent px-4 py-2.5 font-semibold text-accent-fg transition-colors hover:bg-accent-hover disabled:bg-surface-3 disabled:text-fg-faint"
        >
          {isNew ? "Create goal" : "Save changes"}
        </button>
      </form>

      <ExercisePicker
        open={pickerOpen}
        onClose={() => setPickerOpen(false)}
        onSelect={(ex) => setExerciseId(ex.id)}
        title="Pick exercise"
        maxWidth="md:max-w-2xl"
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
