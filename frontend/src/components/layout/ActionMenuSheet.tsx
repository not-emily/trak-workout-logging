import { useNavigate } from "react-router";
import { Activity, CalendarPlus, ChevronRight, Clipboard } from "lucide-react";
import { startEmptySession } from "@/features/session/sessionActions";
import { startSessionFromRoutine } from "@/features/routine/routineActions";
import { useRoutines } from "@/features/routine/useRoutines";
import { useExercises } from "@/features/exercise/useExercises";
import { BottomSheet } from "@/components/ui/BottomSheet";
import type { Routine } from "@/types/routine";

type Props = {
  open: boolean;
  onClose: () => void;
};

export function ActionMenuSheet({ open, onClose }: Props) {
  const navigate = useNavigate();
  const routines = useRoutines();
  const { exercises } = useExercises();

  function handleStartEmpty() {
    const session = startEmptySession();
    onClose();
    navigate(`/sessions/${session.id}`);
  }

  function handleLogPast() {
    onClose();
    navigate("/sessions/log-past");
  }

  function handleStartFromRoutine(routine: Routine) {
    const session = startSessionFromRoutine(routine, (id) =>
      exercises.find((e) => e.id === id),
    );
    onClose();
    navigate(`/sessions/${session.id}`);
  }

  return (
    <BottomSheet open={open} onClose={onClose} title="New" maxWidth="md:max-w-5xl">
      {routines.length > 0 && (
        <>
          <div className="px-4 pt-3 pb-1.5 text-[10px] font-semibold uppercase tracking-[0.18em] text-fg-subtle">
            Start from routine
          </div>
          <ul className="flex flex-col">
            {routines.map((routine) => (
              <li key={routine.id}>
                <button
                  type="button"
                  onClick={() => handleStartFromRoutine(routine)}
                  className="flex w-full items-center gap-3 px-4 py-3 text-left transition-colors hover:bg-surface-2"
                >
                  <span className="flex h-9 w-9 items-center justify-center rounded-full bg-accent-soft text-accent">
                    <Clipboard className="h-4 w-4" strokeWidth={2.25} />
                  </span>
                  <span className="flex min-w-0 flex-1 flex-col">
                    <span className="truncate font-display text-sm text-fg">{routine.name}</span>
                    {routine.description && (
                      <span className="truncate text-xs text-fg-muted">{routine.description}</span>
                    )}
                  </span>
                  <ChevronRight className="h-4 w-4 text-fg-faint" />
                </button>
              </li>
            ))}
          </ul>
          <div className="my-2 border-t border-line" />
        </>
      )}

      <ul className="flex flex-col">
        <li>
          <button
            type="button"
            onClick={handleStartEmpty}
            className="flex w-full items-center gap-3 px-4 py-4 text-left transition-colors hover:bg-surface-2"
          >
            <span className="flex h-9 w-9 items-center justify-center rounded-full bg-cardio-soft text-cardio">
              <Activity className="h-4 w-4" strokeWidth={2.25} />
            </span>
            <span className="flex flex-col">
              <span className="font-display text-sm text-fg">Start empty session</span>
              <span className="text-xs text-fg-muted">Add exercises as you go</span>
            </span>
          </button>
        </li>
        <li>
          <button
            type="button"
            onClick={handleLogPast}
            className="flex w-full items-center gap-3 px-4 py-4 text-left transition-colors hover:bg-surface-2"
          >
            <span className="flex h-9 w-9 items-center justify-center rounded-full bg-bodyweight-soft text-bodyweight">
              <CalendarPlus className="h-4 w-4" strokeWidth={2.25} />
            </span>
            <span className="flex flex-col">
              <span className="font-display text-sm text-fg">Log past workout</span>
              <span className="text-xs text-fg-muted">Pick a date and log retroactively</span>
            </span>
          </button>
        </li>
      </ul>
    </BottomSheet>
  );
}
