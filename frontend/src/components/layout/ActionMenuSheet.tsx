import { motion, AnimatePresence } from "framer-motion";
import { useNavigate } from "react-router";
import { Activity, CalendarPlus, X } from "lucide-react";
import { startEmptySession } from "@/features/session/sessionActions";

type Props = {
  open: boolean;
  onClose: () => void;
};

export function ActionMenuSheet({ open, onClose }: Props) {
  const navigate = useNavigate();

  function handleStartEmpty() {
    const session = startEmptySession();
    onClose();
    navigate(`/sessions/${session.id}`);
  }

  function handleLogPast() {
    onClose();
    navigate("/sessions/log-past");
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
            className="fixed bottom-0 left-0 right-0 z-50 flex flex-col rounded-t-2xl bg-white pb-[env(safe-area-inset-bottom)] shadow-xl"
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
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
