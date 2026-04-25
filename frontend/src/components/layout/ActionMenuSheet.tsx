import { motion, AnimatePresence } from "framer-motion";
import { useNavigate } from "react-router";
import { Activity, CalendarPlus, ChevronRight, Clipboard, X } from "lucide-react";
import { startEmptySession } from "@/features/session/sessionActions";
import { startSessionFromRoutine } from "@/features/routine/routineActions";
import { useRoutines } from "@/features/routine/useRoutines";
import { useExercises } from "@/features/exercise/useExercises";
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
    <AnimatePresence>
      {open && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 z-40 bg-black/40"
          />
          <motion.div
            initial={{ y: "100%" }}
            animate={{ y: 0 }}
            exit={{ y: "100%" }}
            transition={{ type: "spring", stiffness: 350, damping: 30 }}
            className="fixed bottom-0 left-0 right-0 z-50 flex max-h-[80vh] flex-col rounded-t-2xl bg-white pb-[env(safe-area-inset-bottom)] shadow-xl"
          >
            <div className="flex items-center justify-between border-b border-gray-100 px-4 py-3">
              <h2 className="text-lg font-semibold">New</h2>
              <button
                type="button"
                onClick={onClose}
                aria-label="Close"
                className="flex h-8 w-8 items-center justify-center rounded-full bg-gray-100"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="overflow-y-auto">
              {routines.length > 0 && (
                <>
                  <div className="px-4 pt-3 pb-1 text-xs font-medium uppercase tracking-wide text-gray-500">
                    Start from routine
                  </div>
                  <ul className="flex flex-col">
                    {routines.map((routine) => (
                      <li key={routine.id}>
                        <button
                          type="button"
                          onClick={() => handleStartFromRoutine(routine)}
                          className="flex w-full items-center gap-3 px-4 py-3 text-left hover:bg-gray-50"
                        >
                          <span className="flex h-9 w-9 items-center justify-center rounded-full bg-green-100 text-green-700">
                            <Clipboard className="h-4 w-4" />
                          </span>
                          <span className="flex flex-1 flex-col">
                            <span className="font-medium">{routine.name}</span>
                            {routine.description && (
                              <span className="text-xs text-gray-500">{routine.description}</span>
                            )}
                          </span>
                          <ChevronRight className="h-4 w-4 text-gray-400" />
                        </button>
                      </li>
                    ))}
                  </ul>
                  <div className="my-2 border-t border-gray-100" />
                </>
              )}

              <ul className="flex flex-col">
                <li>
                  <button
                    type="button"
                    onClick={handleStartEmpty}
                    className="flex w-full items-center gap-3 px-4 py-4 text-left hover:bg-gray-50"
                  >
                    <span className="flex h-9 w-9 items-center justify-center rounded-full bg-blue-100 text-blue-700">
                      <Activity className="h-4 w-4" />
                    </span>
                    <span className="flex flex-col">
                      <span className="font-medium">Start empty session</span>
                      <span className="text-xs text-gray-500">Add exercises as you go</span>
                    </span>
                  </button>
                </li>
                <li>
                  <button
                    type="button"
                    onClick={handleLogPast}
                    className="flex w-full items-center gap-3 px-4 py-4 text-left hover:bg-gray-50"
                  >
                    <span className="flex h-9 w-9 items-center justify-center rounded-full bg-purple-100 text-purple-700">
                      <CalendarPlus className="h-4 w-4" />
                    </span>
                    <span className="flex flex-col">
                      <span className="font-medium">Log past workout</span>
                      <span className="text-xs text-gray-500">Pick a date and log retroactively</span>
                    </span>
                  </button>
                </li>
              </ul>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
