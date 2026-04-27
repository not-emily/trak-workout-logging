import { useState } from "react";
import { Clipboard, Plus } from "lucide-react";
import { useNavigate } from "react-router";
import { useRoutines } from "@/features/routine/useRoutines";
import { createRoutine } from "@/features/routine/routineActions";
import { RoutineCard } from "@/components/routines/RoutineCard";
import { EmptyState } from "@/components/ui/EmptyState";

export function RoutinesListPage() {
  const navigate = useNavigate();
  const routines = useRoutines();
  const [creating, setCreating] = useState(false);
  const [name, setName] = useState("");

  function startCreate() {
    setName("");
    setCreating(true);
  }

  function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim()) return;
    const r = createRoutine(name.trim());
    setCreating(false);
    navigate(`/routines/${r.id}`);
  }

  return (
    <div className="mx-auto flex max-w-5xl flex-col gap-3 px-4 pt-6 pb-8">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold">Routines</h1>
        <button
          type="button"
          onClick={startCreate}
          className="flex items-center gap-1 rounded-full bg-black px-3 py-1.5 text-sm font-medium text-white"
        >
          <Plus className="h-4 w-4" />
          New
        </button>
      </div>

      {creating && (
        <form
          onSubmit={handleCreate}
          className="flex flex-col gap-2 rounded-xl bg-white p-3 ring-1 ring-gray-200 sm:flex-row"
        >
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            autoFocus
            placeholder="Routine name"
            className="min-w-0 flex-1 rounded-lg border border-gray-300 px-3 py-2 text-base"
          />
          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => setCreating(false)}
              className="flex-1 rounded-lg bg-gray-100 px-3 py-2 text-sm font-medium text-gray-700 sm:flex-none"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={!name.trim()}
              className="flex-1 rounded-lg bg-black px-4 py-2 text-sm font-medium text-white disabled:opacity-60 sm:flex-none"
            >
              Create
            </button>
          </div>
        </form>
      )}

      {routines.length === 0 && !creating && (
        <EmptyState icon={Clipboard}>
          No routines yet. Create one to save reusable workout templates.
        </EmptyState>
      )}

      <ul className="flex flex-col gap-2">
        {routines.map((r) => (
          <li key={r.id}>
            <RoutineCard routine={r} />
          </li>
        ))}
      </ul>
    </div>
  );
}
