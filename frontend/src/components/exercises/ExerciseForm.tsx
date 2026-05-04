import { useState } from "react";
import { MUSCLE_GROUPS, formatMuscleGroup, type MuscleGroup } from "@/lib/muscleGroups";
import type { ExerciseInput, ExerciseKind } from "@/types/exercise";

type Props = {
  initial?: Partial<ExerciseInput>;
  submitLabel: string;
  onSubmit: (input: ExerciseInput) => Promise<void>;
};

const KIND_OPTIONS: { label: string; value: ExerciseKind; dot: string }[] = [
  { label: "Strength", value: "strength", dot: "bg-strength" },
  { label: "Cardio", value: "cardio", dot: "bg-cardio" },
  { label: "Bodyweight", value: "bodyweight", dot: "bg-bodyweight" },
];

const labelClass =
  "flex flex-col gap-1.5 text-[11px] font-semibold uppercase tracking-[0.18em] text-fg-subtle";
const fieldClass =
  "rounded-lg border border-line-strong bg-surface-2 px-3 py-2.5 font-sans text-base normal-case tracking-normal text-fg placeholder:text-fg-faint focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent-soft";

export function ExerciseForm({ initial, submitLabel, onSubmit }: Props) {
  const [name, setName] = useState(initial?.name ?? "");
  const [kind, setKind] = useState<ExerciseKind>(initial?.kind ?? "strength");
  const [selected, setSelected] = useState<Set<MuscleGroup>>(
    new Set((initial?.muscleGroups ?? []) as MuscleGroup[])
  );
  const [equipment, setEquipment] = useState(initial?.equipment ?? "");
  const [instructions, setInstructions] = useState(initial?.instructions ?? "");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function toggle(mg: MuscleGroup) {
    setSelected((prev) => {
      const next = new Set(prev);
      next.has(mg) ? next.delete(mg) : next.add(mg);
      return next;
    });
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    setError(null);
    try {
      await onSubmit({
        name: name.trim(),
        kind,
        muscleGroups: Array.from(selected),
        equipment: equipment.trim() || null,
        instructions: instructions.trim() || null,
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Save failed");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-4">
      <label className={labelClass}>
        Name
        <input
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          required
          className={fieldClass}
        />
      </label>

      <fieldset className={labelClass}>
        <legend className="mb-1.5">Kind</legend>
        <div className="flex gap-1.5">
          {KIND_OPTIONS.map((opt) => {
            const active = kind === opt.value;
            return (
              <button
                key={opt.value}
                type="button"
                onClick={() => setKind(opt.value)}
                className={`flex flex-1 items-center justify-center gap-1.5 rounded-full border px-3 py-1.5 text-xs font-semibold uppercase tracking-[0.14em] transition-colors ${
                  active
                    ? "border-accent bg-accent-soft text-accent"
                    : "border-line-strong bg-surface-1 text-fg-muted hover:bg-surface-2 hover:text-fg"
                }`}
              >
                <span aria-hidden className={`h-1.5 w-1.5 rounded-full ${opt.dot}`} />
                {opt.label}
              </button>
            );
          })}
        </div>
      </fieldset>

      <fieldset className={labelClass}>
        <legend className="mb-1.5">Muscle groups</legend>
        <div className="flex flex-wrap gap-1.5">
          {MUSCLE_GROUPS.map((mg) => {
            const active = selected.has(mg);
            return (
              <button
                key={mg}
                type="button"
                onClick={() => toggle(mg)}
                className={`rounded-full border px-3 py-1 text-xs font-medium normal-case tracking-normal transition-colors ${
                  active
                    ? "border-accent bg-accent-soft text-accent"
                    : "border-line-strong bg-surface-1 text-fg-muted hover:bg-surface-2 hover:text-fg"
                }`}
              >
                {formatMuscleGroup(mg)}
              </button>
            );
          })}
        </div>
      </fieldset>

      <label className={labelClass}>
        <span>
          Equipment{" "}
          <span className="font-normal normal-case tracking-normal text-fg-faint">
            (optional)
          </span>
        </span>
        <input
          type="text"
          value={equipment ?? ""}
          onChange={(e) => setEquipment(e.target.value)}
          placeholder="e.g. barbell, dumbbell, bodyweight"
          className={fieldClass}
        />
      </label>

      <label className={labelClass}>
        <span>
          Instructions{" "}
          <span className="font-normal normal-case tracking-normal text-fg-faint">
            (optional)
          </span>
        </span>
        <textarea
          value={instructions ?? ""}
          onChange={(e) => setInstructions(e.target.value)}
          rows={4}
          className={fieldClass + " resize-none"}
        />
      </label>

      {error && <p className="text-sm text-danger">{error}</p>}

      <button
        type="submit"
        disabled={submitting || !name.trim()}
        className="mt-2 rounded-lg bg-accent px-4 py-2.5 font-semibold text-accent-fg transition-colors hover:bg-accent-hover disabled:bg-surface-3 disabled:text-fg-faint"
      >
        {submitting ? "Saving…" : submitLabel}
      </button>
    </form>
  );
}
