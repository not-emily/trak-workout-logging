import { useState } from "react";
import { Dumbbell, Plus } from "lucide-react";
import { useSessions } from "@/features/session/useSessions";
import { SessionCard } from "@/components/sessions/SessionCard";
import { ActionMenuSheet } from "@/components/layout/ActionMenuSheet";
import { EmptyState } from "@/components/ui/EmptyState";

export function SessionsListPage() {
  const sessions = useSessions();
  const [menuOpen, setMenuOpen] = useState(false);

  return (
    <div className="mx-auto flex max-w-5xl flex-col gap-3 px-4 pt-6 pb-8">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold">Sessions</h1>
        <button
          type="button"
          onClick={() => setMenuOpen(true)}
          className="flex items-center gap-1 rounded-full bg-black px-3 py-1.5 text-sm font-medium text-white"
        >
          <Plus className="h-4 w-4" />
          New
        </button>
      </div>

      {sessions.length === 0 ? (
        <EmptyState icon={Dumbbell}>
          No sessions yet. Tap <span className="font-medium">New</span> to start your first one.
        </EmptyState>
      ) : (
        <ul className="flex flex-col gap-2">
          {sessions.map((s) => (
            <li key={s.id}>
              <SessionCard session={s} />
            </li>
          ))}
        </ul>
      )}

      <ActionMenuSheet open={menuOpen} onClose={() => setMenuOpen(false)} />
    </div>
  );
}
