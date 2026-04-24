import { useState } from "react";
import { MUSCLE_GROUPS, formatMuscleGroup, type MuscleGroup } from "@/lib/muscleGroups";
import type { ExerciseInput, ExerciseKind } from "@/types/exercise";

type Props = {
  initial?: Partial<ExerciseInput>;
  submitLabel: string;
  onSubmit: (input: ExerciseInput) => Promise<void>;
};

const KIND_OPTIONS: { label: string; value: ExerciseKind }[] = [
  { label: "Strength", value: "strength" },
  { label: "Cardio", value: "cardio" },
  { label: "Bodyweight", value: "bodyweight" },
];

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
      <label className="flex flex-col gap-1 text-sm">
        Name
        <input
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          required
          className="rounded-lg border border-gray-300 px-3 py-2 text-base"
        />
      </label>

      <fieldset className="flex flex-col gap-2 text-sm">
        <legend>Kind</legend>
        <div className="flex gap-1">
          {KIND_OPTIONS.map((opt) => (
            <button
              key={opt.value}
              type="button"
              onClick={() => setKind(opt.value)}
              className={`flex-1 rounded-full px-3 py-1.5 text-sm font-medium ${
                kind === opt.value ? "bg-black text-white" : "bg-gray-100 text-gray-700"
              }`}
            >
              {opt.label}
            </button>
          ))}
        </div>
      </fieldset>

      <fieldset className="flex flex-col gap-2 text-sm">
        <legend>Muscle groups</legend>
        <div className="flex flex-wrap gap-1.5">
          {MUSCLE_GROUPS.map((mg) => (
            <button
              key={mg}
              type="button"
              onClick={() => toggle(mg)}
              className={`rounded-full px-3 py-1 text-xs font-medium ${
                selected.has(mg) ? "bg-black text-white" : "bg-gray-100 text-gray-700"
              }`}
            >
              {formatMuscleGroup(mg)}
            </button>
          ))}
        </div>
      </fieldset>

      <label className="flex flex-col gap-1 text-sm">
        Equipment <span className="text-gray-400">(optional)</span>
        <input
          type="text"
          value={equipment ?? ""}
          onChange={(e) => setEquipment(e.target.value)}
          placeholder="e.g. barbell, dumbbell, bodyweight"
          className="rounded-lg border border-gray-300 px-3 py-2 text-base"
        />
      </label>

      <label className="flex flex-col gap-1 text-sm">
        Instructions <span className="text-gray-400">(optional)</span>
        <textarea
          value={instructions ?? ""}
          onChange={(e) => setInstructions(e.target.value)}
          rows={4}
          className="rounded-lg border border-gray-300 px-3 py-2 text-base"
        />
      </label>

      {error && <p className="text-sm text-red-600">{error}</p>}

      <button
        type="submit"
        disabled={submitting || !name.trim()}
        className="mt-2 rounded-lg bg-black px-4 py-2 font-medium text-white disabled:opacity-60"
      >
        {submitting ? "Saving…" : submitLabel}
      </button>
    </form>
  );
}
