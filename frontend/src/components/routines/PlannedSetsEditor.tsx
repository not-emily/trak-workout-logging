import { useEffect, useRef, useState } from "react";
import { Pencil } from "lucide-react";
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
  const [editing, setEditing] = useState(false);
  const wrapRef = useRef<HTMLDivElement>(null);

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

  function commitAndCollapse() {
    commit();
    setEditing(false);
  }

  // Tap outside the editor commits + collapses.
  useEffect(() => {
    if (!editing) return;
    function handler(e: MouseEvent) {
      if (wrapRef.current && !wrapRef.current.contains(e.target as Node)) {
        commitAndCollapse();
      }
    }
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [editing, sets, reps, weight, duration, distance]);

  function handleKeyDown(e: React.KeyboardEvent) {
    if (e.key === "Enter") {
      e.preventDefault();
      commitAndCollapse();
    }
  }

  if (!editing) {
    return (
      <button
        type="button"
        onClick={() => setEditing(true)}
        className="flex items-center justify-between gap-2 rounded-md bg-gray-50 px-2 py-1.5 text-left text-sm text-gray-700 hover:bg-gray-100"
      >
        <span>
          <PlannedReadout
            kind={exerciseKind}
            sets={sets}
            reps={reps}
            weight={weight}
            duration={duration}
            distance={distance}
          />
        </span>
        <Pencil className="h-3.5 w-3.5 shrink-0 text-gray-400" />
      </button>
    );
  }

  return (
    <div ref={wrapRef} className="rounded-md bg-white p-2 ring-2 ring-black">
      <div className="grid grid-cols-2 gap-2 text-xs sm:grid-cols-4">
        <Field
          label="Sets"
          value={sets}
          onChange={setSets}
          onBlur={commit}
          onKeyDown={handleKeyDown}
          inputMode="numeric"
          autoFocus
        />

        {(exerciseKind === "strength" || exerciseKind === "bodyweight") && (
          <Field
            label="Reps"
            value={reps}
            onChange={setReps}
            onBlur={commit}
            onKeyDown={handleKeyDown}
            inputMode="numeric"
          />
        )}

        {exerciseKind === "strength" && (
          <Field
            label="Weight (lb)"
            value={weight}
            onChange={setWeight}
            onBlur={commit}
            onKeyDown={handleKeyDown}
            inputMode="decimal"
          />
        )}

        {exerciseKind === "cardio" && (
          <>
            <Field
              label="Duration (s)"
              value={duration}
              onChange={setDuration}
              onBlur={commit}
              onKeyDown={handleKeyDown}
              inputMode="numeric"
            />
            <Field
              label="Distance (m)"
              value={distance}
              onChange={setDistance}
              onBlur={commit}
              onKeyDown={handleKeyDown}
              inputMode="decimal"
            />
          </>
        )}
      </div>
      <div className="mt-2 flex justify-end">
        <button
          type="button"
          onClick={commitAndCollapse}
          className="rounded-full bg-black px-3 py-1.5 text-sm font-medium text-white"
        >
          Done
        </button>
      </div>
    </div>
  );
}

function PlannedReadout(props: {
  kind: Exercise["kind"];
  sets: string;
  reps: string;
  weight: string;
  duration: string;
  distance: string;
}) {
  const setsLabel = `${props.sets || "—"} ${props.sets === "1" ? "set" : "sets"}`;
  const dash = "—";
  if (props.kind === "strength") {
    return (
      <span>
        <strong className="font-semibold text-gray-900">{setsLabel}</strong>
        <span className="px-2 text-gray-400">×</span>
        <strong className="font-semibold text-gray-900">{props.reps || dash}</strong> reps @{" "}
        <strong className="font-semibold text-gray-900">{props.weight || dash}</strong> lb
      </span>
    );
  }
  if (props.kind === "bodyweight") {
    return (
      <span>
        <strong className="font-semibold text-gray-900">{setsLabel}</strong>
        <span className="px-2 text-gray-400">×</span>
        <strong className="font-semibold text-gray-900">{props.reps || dash}</strong> reps
      </span>
    );
  }
  return (
    <span>
      <strong className="font-semibold text-gray-900">{setsLabel}</strong>
      <span className="px-2 text-gray-400">·</span>
      <strong className="font-semibold text-gray-900">{props.duration || dash}</strong>s ·{" "}
      <strong className="font-semibold text-gray-900">{props.distance || dash}</strong> m
    </span>
  );
}

function Field(props: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  onBlur: () => void;
  onKeyDown: (e: React.KeyboardEvent) => void;
  inputMode: "numeric" | "decimal";
  autoFocus?: boolean;
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
        onKeyDown={props.onKeyDown}
        autoFocus={props.autoFocus}
        className="rounded-md bg-white px-2 py-1.5 text-center text-base ring-1 ring-gray-300 focus:outline-none focus:ring-2 focus:ring-black"
      />
    </label>
  );
}
