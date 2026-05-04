import { useEffect, useRef, useState } from "react";
import { Check, Trash2 } from "lucide-react";
import { completeSet, removeSet, uncompleteSet, updateSet } from "@/features/session/sessionActions";
import { Swipeable } from "@/components/ui/Swipeable";
import type { Exercise } from "@/types/exercise";
import type { WorkoutSet } from "@/types/session";

type Props = {
  set: WorkoutSet;
  index: number;
  exerciseKind: Exercise["kind"];
  /** Skip the post-completion rest-timer fire. Used for retroactive sessions. */
  suppressRestTimer?: boolean;
  /** Disable all interactions — used when the parent session is in read-only view. */
  readOnly?: boolean;
  onComplete?: () => void;
};

const KIND_SOFT_BG: Record<Exercise["kind"], string> = {
  strength: "bg-strength-soft",
  cardio: "bg-cardio-soft",
  bodyweight: "bg-bodyweight-soft",
};

const KIND_STRIPE_BG: Record<Exercise["kind"], string> = {
  strength: "bg-strength",
  cardio: "bg-cardio",
  bodyweight: "bg-bodyweight",
};

function isSetEmpty(set: WorkoutSet): boolean {
  return (
    set.reps == null &&
    (set.weightLb == null || set.weightLb === "") &&
    set.durationSeconds == null &&
    (set.distanceMeters == null || set.distanceMeters === "")
  );
}

export function SetRow({ set, index, exerciseKind, suppressRestTimer, readOnly = false, onComplete }: Props) {
  const [weight, setWeight] = useState(set.weightLb ?? "");
  const [reps, setReps] = useState(set.reps?.toString() ?? "");
  const [duration, setDuration] = useState(set.durationSeconds?.toString() ?? "");
  const [distance, setDistance] = useState(set.distanceMeters ?? "");

  const [editing, setEditing] = useState(() => !readOnly && isSetEmpty(set));
  const rowRef = useRef<HTMLDivElement>(null);

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

  function commit() {
    updateSet(set.id, commitFields());
  }

  function commitAndCollapse() {
    commit();
    setEditing(false);
  }

  function toggleComplete() {
    if (isCompleted) {
      uncompleteSet(set.id);
    } else {
      completeSet(set.id, commitFields());
      if (!suppressRestTimer) onComplete?.();
    }
    setEditing(false);
  }

  useEffect(() => {
    if (!editing) return;
    function handler(e: MouseEvent) {
      if (rowRef.current && !rowRef.current.contains(e.target as Node)) {
        commitAndCollapse();
      }
    }
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [editing, weight, reps, duration, distance]);

  function handleKeyDown(e: React.KeyboardEvent) {
    if (e.key === "Enter") {
      e.preventDefault();
      commitAndCollapse();
    }
  }

  const completedBg = KIND_SOFT_BG[exerciseKind];
  const stripeBg = KIND_STRIPE_BG[exerciseKind];

  return (
    <Swipeable
      enabled={!editing && !readOnly}
      right={
        !readOnly && !isCompleted && !isSetEmpty(set)
          ? { icon: Check, bg: stripeBg, onTrigger: toggleComplete }
          : undefined
      }
      left={!readOnly ? { icon: Trash2, bg: "bg-danger", onTrigger: () => removeSet(set.id) } : undefined}
    >
      <div
        ref={rowRef}
        onClick={() => !editing && !readOnly && setEditing(true)}
        className={`relative flex items-center gap-2 overflow-hidden rounded-lg p-2 transition-colors ${
          editing
            ? "bg-surface-2 ring-2 ring-accent"
            : isCompleted
              ? completedBg
              : "bg-surface-2/40"
        } ${!editing && !readOnly ? "cursor-pointer" : ""}`}
      >
        {isCompleted && (
          <span aria-hidden className={`absolute inset-y-0 left-0 w-[3px] ${stripeBg}`} />
        )}

        <span className="flex w-9 shrink-0 flex-col items-center leading-none">
          <span className="text-[9px] font-semibold uppercase tracking-[0.18em] text-fg-subtle">
            Set
          </span>
          <span className="mt-0.5 font-mono text-sm font-medium text-fg-muted">{index + 1}</span>
        </span>

        {editing ? (
          <EditFields
            kind={exerciseKind}
            weight={weight}
            reps={reps}
            duration={duration}
            distance={distance}
            onWeight={setWeight}
            onReps={setReps}
            onDuration={setDuration}
            onDistance={setDistance}
            onBlur={commit}
            onKeyDown={handleKeyDown}
          />
        ) : (
          <ReadValues
            kind={exerciseKind}
            weight={weight}
            reps={reps}
            duration={duration}
            distance={distance}
          />
        )}

        {editing ? (
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              commitAndCollapse();
            }}
            className="ml-auto rounded-full bg-accent px-3 py-1.5 text-xs font-semibold text-accent-fg"
          >
            Done
          </button>
        ) : (
          <button
            type="button"
            disabled={readOnly}
            onClick={(e) => {
              e.stopPropagation();
              if (!readOnly) toggleComplete();
            }}
            aria-label={isCompleted ? "Uncomplete set" : "Complete set"}
            className={`ml-auto flex h-9 w-9 shrink-0 items-center justify-center rounded-full transition-colors disabled:cursor-default ${
              isCompleted
                ? `${stripeBg} text-bg`
                : "border border-line-strong bg-surface-1 text-fg-faint hover:border-accent hover:text-accent"
            }`}
          >
            <Check className="h-4 w-4" strokeWidth={isCompleted ? 3 : 2} />
          </button>
        )}
      </div>
    </Swipeable>
  );
}

function EditFields(props: {
  kind: Exercise["kind"];
  weight: string;
  reps: string;
  duration: string;
  distance: string;
  onWeight: (v: string) => void;
  onReps: (v: string) => void;
  onDuration: (v: string) => void;
  onDistance: (v: string) => void;
  onBlur: () => void;
  onKeyDown: (e: React.KeyboardEvent) => void;
}) {
  const common = { onBlur: props.onBlur, onKeyDown: props.onKeyDown };
  if (props.kind === "strength") {
    return (
      <>
        <NumberField {...common} value={props.weight} onChange={props.onWeight} placeholder="lb" className="w-20" inputMode="decimal" autoFocus />
        <NumberField {...common} value={props.reps} onChange={props.onReps} placeholder="reps" className="w-16" inputMode="numeric" />
      </>
    );
  }
  if (props.kind === "bodyweight") {
    return (
      <NumberField {...common} value={props.reps} onChange={props.onReps} placeholder="reps" className="flex-1" inputMode="numeric" autoFocus />
    );
  }
  return (
    <>
      <NumberField {...common} value={props.duration} onChange={props.onDuration} placeholder="sec" className="w-20" inputMode="numeric" autoFocus />
      <NumberField {...common} value={props.distance} onChange={props.onDistance} placeholder="meters" className="w-24" inputMode="decimal" />
    </>
  );
}

function ReadValues(props: {
  kind: Exercise["kind"];
  weight: string;
  reps: string;
  duration: string;
  distance: string;
}) {
  const dash = <span className="text-fg-faint">—</span>;
  const num = (v: string) => (
    <span className="font-mono text-base font-medium text-fg tabular-nums">{v}</span>
  );
  const unit = (label: string) => (
    <span className="text-xs text-fg-muted">{label}</span>
  );
  const sep = <span className="px-1.5 text-fg-faint">·</span>;

  if (props.kind === "strength") {
    return (
      <span className="flex flex-1 items-baseline gap-1">
        {props.weight ? num(props.weight) : dash} {unit("lb")}
        {sep}
        {props.reps ? num(props.reps) : dash} {unit("reps")}
      </span>
    );
  }
  if (props.kind === "bodyweight") {
    return (
      <span className="flex flex-1 items-baseline gap-1">
        {props.reps ? num(props.reps) : dash} {unit("reps")}
      </span>
    );
  }
  return (
    <span className="flex flex-1 items-baseline gap-1">
      {props.duration ? num(props.duration) : dash}
      {unit("s")}
      {sep}
      {props.distance ? num(props.distance) : dash} {unit("m")}
    </span>
  );
}

function NumberField(props: {
  value: string;
  onChange: (v: string) => void;
  onBlur: () => void;
  onKeyDown: (e: React.KeyboardEvent) => void;
  placeholder: string;
  className?: string;
  inputMode?: "numeric" | "decimal";
  autoFocus?: boolean;
}) {
  return (
    <input
      type="text"
      inputMode={props.inputMode}
      value={props.value}
      onChange={(e) => props.onChange(e.target.value)}
      onBlur={props.onBlur}
      onKeyDown={props.onKeyDown}
      onClick={(e) => e.stopPropagation()}
      placeholder={props.placeholder}
      autoFocus={props.autoFocus}
      className={`rounded-md border border-line-strong bg-surface-1 px-2 py-1.5 text-center font-mono text-base text-fg tabular-nums placeholder:text-fg-faint focus:border-accent focus:outline-none ${props.className ?? ""}`}
    />
  );
}
