import { useState } from "react";
import { Clipboard, Plus } from "lucide-react";
import { useNavigate } from "react-router";
import { useRoutines } from "@/features/routine/useRoutines";
import { createRoutine } from "@/features/routine/routineActions";
import { RoutineCard } from "@/components/routines/RoutineCard";
import { SyncIndicator } from "@/components/layout/SyncIndicator";
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
    <div className="mx-auto flex max-w-5xl flex-col gap-4 px-4 pt-6 pb-8">
      <div className="flex items-center justify-between">
        <h1 className="font-display text-3xl leading-none text-fg">Routines</h1>
        <div className="flex items-center gap-2">
          <SyncIndicator />
          <button
            type="button"
            onClick={startCreate}
            className="flex items-center gap-1.5 rounded-full bg-accent px-4 py-2 text-sm font-semibold text-accent-fg transition-colors hover:bg-accent-hover"
          >
            <Plus className="h-4 w-4" strokeWidth={2.5} />
            New
          </button>
        </div>
      </div>

      {creating && (
        <form
          onSubmit={handleCreate}
          className="flex flex-col gap-2 rounded-xl border border-line bg-surface-1 p-3 sm:flex-row"
        >
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            autoFocus
            placeholder="Routine name"
            className="min-w-0 flex-1 rounded-lg border border-line-strong bg-surface-2 px-3 py-2.5 text-base text-fg placeholder:text-fg-faint focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent-soft"
          />
          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => setCreating(false)}
              className="flex-1 rounded-lg bg-surface-2 px-3 py-2 text-sm font-medium text-fg-muted transition-colors hover:bg-surface-3 hover:text-fg sm:flex-none"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={!name.trim()}
              className="flex-1 rounded-lg bg-accent px-4 py-2 text-sm font-semibold text-accent-fg transition-colors hover:bg-accent-hover disabled:opacity-40 sm:flex-none"
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
