import { useState } from "react";
import { Link } from "react-router";
import { Dumbbell, Plus, Settings } from "lucide-react";
import { useSessions } from "@/features/session/useSessions";
import { useSyncStatus } from "@/hooks/useSyncStatus";
import { SessionCard } from "@/components/sessions/SessionCard";
import { ActionMenuSheet } from "@/components/layout/ActionMenuSheet";
import { SyncIndicator } from "@/components/layout/SyncIndicator";
import { EmptyState } from "@/components/ui/EmptyState";

export function SessionsListPage() {
  const sessions = useSessions();
  const { failedCount } = useSyncStatus();
  const [menuOpen, setMenuOpen] = useState(false);

  return (
    <div className="mx-auto flex max-w-5xl flex-col gap-4 px-4 pt-6 pb-8">
      <div className="flex items-center justify-between">
        <h1 className="font-display text-3xl leading-none text-fg">Sessions</h1>
        <div className="flex items-center gap-2">
          <SyncIndicator />
          <Link
            to="/settings"
            aria-label="Settings"
            className="relative flex h-9 w-9 items-center justify-center rounded-full text-fg-muted transition-colors hover:bg-surface-2 hover:text-fg"
          >
            <Settings className="h-5 w-5" />
            {failedCount > 0 && (
              <span className="absolute right-1.5 top-1.5 h-1.5 w-1.5 rounded-full bg-danger" />
            )}
          </Link>
          <button
            type="button"
            onClick={() => setMenuOpen(true)}
            className="flex items-center gap-1.5 rounded-full bg-accent px-4 py-2 text-sm font-semibold text-accent-fg transition-colors hover:bg-accent-hover"
          >
            <Plus className="h-4 w-4" strokeWidth={2.5} />
            New
          </button>
        </div>
      </div>

      {sessions.length === 0 ? (
        <EmptyState icon={Dumbbell}>
          No sessions yet. Tap <span className="font-medium text-fg">New</span> to start your first one.
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
