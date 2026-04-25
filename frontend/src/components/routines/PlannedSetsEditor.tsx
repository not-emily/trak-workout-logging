import { useEffect, useState } from "react";
import { updateRoutineExercise } from "@/features/routine/routineActions";
import type { Exercise } from "@/types/exercise";
import type { RoutineExercise } from "@/types/routine";

type Props = {
  routineExercise: RoutineExercise;
  exerciseKind: Exercise["kind"];
};

export function PlannedSetsEditor({ routineExercise, exerciseKind }: Props) {
  const [sets, setSets] = useState(routineExercise.plannedSets.toString());
  const [reps, setReps] = useState(routineExercise.plannedReps?.toString() ?? "");
  const [weight, setWeight] = useState(routineExercise.plannedWeightLb ?? "");
  const [duration, setDuration] = useState(routineExercise.plannedDurationSeconds?.toString() ?? "");
  const [distance, setDistance] = useState(routineExercise.plannedDistanceMeters ?? "");

  // If the underlying record changes (e.g. drag reorder), reseed local state.
  useEffect(() => {
    setSets(routineExercise.plannedSets.toString());
    setReps(routineExercise.plannedReps?.toString() ?? "");
    setWeight(routineExercise.plannedWeightLb ?? "");
    setDuration(routineExercise.plannedDurationSeconds?.toString() ?? "");
    setDistance(routineExercise.plannedDistanceMeters ?? "");
  }, [
    routineExercise.id,
    routineExercise.plannedSets,
    routineExercise.plannedReps,
    routineExercise.plannedWeightLb,
    routineExercise.plannedDurationSeconds,
    routineExercise.plannedDistanceMeters,
  ]);

  function commit() {
    const parsedSets = Math.max(1, Number.parseInt(sets || "1", 10) || 1);
    const patch: Partial<RoutineExercise> = { plannedSets: parsedSets };
    if (exerciseKind === "strength" || exerciseKind === "bodyweight") {
      patch.plannedReps = reps === "" ? null : Number.parseInt(reps, 10);
    }
    if (exerciseKind === "strength") {
      patch.plannedWeightLb = weight === "" ? null : weight;
    }
    if (exerciseKind === "cardio") {
      patch.plannedDurationSeconds = duration === "" ? null : Number.parseInt(duration, 10);
      patch.plannedDistanceMeters = distance === "" ? null : distance;
    }
    updateRoutineExercise(routineExercise.id, patch);
  }

  return (
    <div className="grid grid-cols-2 gap-2 text-xs sm:grid-cols-4">
      <Field label="Sets" value={sets} onChange={setSets} onBlur={commit} inputMode="numeric" />

      {(exerciseKind === "strength" || exerciseKind === "bodyweight") && (
        <Field label="Reps" value={reps} onChange={setReps} onBlur={commit} inputMode="numeric" />
      )}

      {exerciseKind === "strength" && (
        <Field label="Weight (lb)" value={weight} onChange={setWeight} onBlur={commit} inputMode="decimal" />
      )}

      {exerciseKind === "cardio" && (
        <>
          <Field label="Duration (s)" value={duration} onChange={setDuration} onBlur={commit} inputMode="numeric" />
          <Field label="Distance (m)" value={distance} onChange={setDistance} onBlur={commit} inputMode="decimal" />
        </>
      )}
    </div>
  );
}

function Field(props: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  onBlur: () => void;
  inputMode: "numeric" | "decimal";
}) {
  return (
    <label className="flex flex-col gap-0.5">
      <span className="text-gray-500">{props.label}</span>
      <input
        type="text"
        inputMode={props.inputMode}
        value={props.value}
        onChange={(e) => props.onChange(e.target.value)}
        onBlur={props.onBlur}
        className="rounded-md bg-white px-2 py-1.5 text-center text-base ring-1 ring-gray-300 focus:outline-none focus:ring-2 focus:ring-black"
      />
    </label>
  );
}
