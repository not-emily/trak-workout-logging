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
        className="flex items-center justify-between gap-2 rounded-md bg-surface-2/40 px-2.5 py-1.5 text-left transition-colors hover:bg-surface-2"
      >
        <PlannedReadout
          kind={exerciseKind}
          sets={sets}
          reps={reps}
          weight={weight}
          duration={duration}
          distance={distance}
        />
        <Pencil className="h-3.5 w-3.5 shrink-0 text-fg-faint" />
      </button>
    );
  }

  return (
    <div ref={wrapRef} className="rounded-md bg-surface-2 p-2.5 ring-2 ring-accent">
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
          className="rounded-full bg-accent px-3 py-1 text-xs font-semibold text-accent-fg"
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
  const dash = "—";
  const num = (v: string, missing = false) => (
    <span
      className={`font-mono font-medium tabular-nums ${missing ? "text-fg-faint" : "text-fg"}`}
    >
      {v}
    </span>
  );
  const label = (text: string) => <span className="text-fg-muted">{text}</span>;
  const sep = (text: string) => <span className="px-1.5 text-fg-faint">{text}</span>;

  if (props.kind === "strength") {
    return (
      <span className="text-sm">
        {num(props.sets || dash, !props.sets)} {label(props.sets === "1" ? "set" : "sets")}
        {sep("×")}
        {num(props.reps || dash, !props.reps)} {label("reps")}
        {sep("@")}
        {num(props.weight || dash, !props.weight)} {label("lb")}
      </span>
    );
  }
  if (props.kind === "bodyweight") {
    return (
      <span className="text-sm">
        {num(props.sets || dash, !props.sets)} {label(props.sets === "1" ? "set" : "sets")}
        {sep("×")}
        {num(props.reps || dash, !props.reps)} {label("reps")}
      </span>
    );
  }
  return (
    <span className="text-sm">
      {num(props.sets || dash, !props.sets)} {label(props.sets === "1" ? "set" : "sets")}
      {sep("·")}
      {num(props.duration || dash, !props.duration)} {label("s")}
      {sep("·")}
      {num(props.distance || dash, !props.distance)} {label("m")}
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
    <label className="flex flex-col gap-1">
      <span className="text-[10px] font-semibold uppercase tracking-[0.14em] text-fg-subtle">
        {props.label}
      </span>
      <input
        type="text"
        inputMode={props.inputMode}
        value={props.value}
        onChange={(e) => props.onChange(e.target.value)}
        onBlur={props.onBlur}
        onKeyDown={props.onKeyDown}
        autoFocus={props.autoFocus}
        className="rounded-md border border-line-strong bg-surface-1 px-2 py-1.5 text-center font-mono text-base text-fg tabular-nums focus:border-accent focus:outline-none"
      />
    </label>
  );
}
