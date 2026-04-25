import { useState } from "react";
import { Check, Trash2 } from "lucide-react";
import { completeSet, removeSet, uncompleteSet, updateSet } from "@/features/session/sessionActions";
import type { Exercise } from "@/types/exercise";
import type { WorkoutSet } from "@/types/session";

type Props = {
  set: WorkoutSet;
  index: number;
  exerciseKind: Exercise["kind"];
  onComplete?: () => void;
};

export function SetRow({ set, index, exerciseKind, onComplete }: Props) {
  // Local mirror — committed on blur/check so we don't enqueue per keystroke.
  const [weight, setWeight] = useState(set.weightLb ?? "");
  const [reps, setReps] = useState(set.reps?.toString() ?? "");
  const [duration, setDuration] = useState(set.durationSeconds?.toString() ?? "");
  const [distance, setDistance] = useState(set.distanceMeters ?? "");

  const isCompleted = set.completedAt !== null;
  const isStrength = exerciseKind === "strength";
  const isBodyweight = exerciseKind === "bodyweight";
  const isCardio = exerciseKind === "cardio";

  function commitFields(): Partial<WorkoutSet> {
    const patch: Partial<WorkoutSet> = {};
    if (isStrength || isBodyweight) {
      patch.reps = reps === "" ? null : Number.parseInt(reps, 10);
    }
    if (isStrength) {
      patch.weightLb = weight === "" ? null : weight;
    }
    if (isCardio) {
      patch.durationSeconds = duration === "" ? null : Number.parseInt(duration, 10);
      patch.distanceMeters = distance === "" ? null : distance;
    }
    return patch;
  }

  function handleBlur() {
    updateSet(set.id, commitFields());
  }

  function handleCheck() {
    if (isCompleted) {
      uncompleteSet(set.id);
    } else {
      completeSet(set.id, commitFields());
      onComplete?.();
    }
  }

  function handleDelete() {
    removeSet(set.id);
  }

  return (
    <div
      className={`flex items-center gap-2 rounded-lg p-2 ${
        isCompleted ? "bg-green-50" : "bg-gray-50"
      }`}
    >
      <span className="w-6 shrink-0 text-center text-sm font-medium text-gray-500">
        {index + 1}
      </span>

      {isStrength && (
        <>
          <NumberField
            value={weight}
            onChange={setWeight}
            onBlur={handleBlur}
            placeholder="lb"
            className="w-20"
            inputMode="decimal"
          />
          <NumberField
            value={reps}
            onChange={setReps}
            onBlur={handleBlur}
            placeholder="reps"
            className="w-16"
            inputMode="numeric"
          />
        </>
      )}

      {isBodyweight && (
        <NumberField
          value={reps}
          onChange={setReps}
          onBlur={handleBlur}
          placeholder="reps"
          className="flex-1"
          inputMode="numeric"
        />
      )}

      {isCardio && (
        <>
          <NumberField
            value={duration}
            onChange={setDuration}
            onBlur={handleBlur}
            placeholder="sec"
            className="w-20"
            inputMode="numeric"
          />
          <NumberField
            value={distance}
            onChange={setDistance}
            onBlur={handleBlur}
            placeholder="meters"
            className="w-24"
            inputMode="decimal"
          />
        </>
      )}

      <button
        type="button"
        onClick={handleCheck}
        aria-label={isCompleted ? "Uncomplete set" : "Complete set"}
        className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-full transition-colors ${
          isCompleted ? "bg-green-600 text-white" : "bg-white text-gray-400 ring-1 ring-gray-300"
        }`}
      >
        <Check className="h-4 w-4" />
      </button>

      <button
        type="button"
        onClick={handleDelete}
        aria-label="Delete set"
        className="flex h-9 w-9 shrink-0 items-center justify-center text-gray-400 hover:text-red-500"
      >
        <Trash2 className="h-4 w-4" />
      </button>
    </div>
  );
}

function NumberField(props: {
  value: string;
  onChange: (v: string) => void;
  onBlur: () => void;
  placeholder: string;
  className?: string;
  inputMode?: "numeric" | "decimal";
}) {
  return (
    <input
      type="text"
      inputMode={props.inputMode}
      value={props.value}
      onChange={(e) => props.onChange(e.target.value)}
      onBlur={props.onBlur}
      placeholder={props.placeholder}
      className={`rounded-md bg-white px-2 py-1.5 text-center text-base ring-1 ring-gray-300 focus:outline-none focus:ring-2 focus:ring-black ${props.className ?? ""}`}
    />
  );
}
