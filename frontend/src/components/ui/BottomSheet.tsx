import { motion, AnimatePresence } from "framer-motion";
import { X } from "lucide-react";
import type { ReactNode } from "react";

type Props = {
  open: boolean;
  onClose: () => void;
  title: string;
  children: ReactNode;
  /** Set to false when the sheet body manages its own scrolling. */
  bodyScroll?: boolean;
};

const springTransition = {
  type: "spring" as const,
  stiffness: 350,
  damping: 30,
};

export function BottomSheet({ open, onClose, title, children, bodyScroll = true }: Props) {
  return (
    <AnimatePresence>
      {open && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 z-[60] bg-black/40"
          />
          <motion.div
            initial={{ y: "100%" }}
            animate={{ y: 0 }}
            exit={{ y: "100%" }}
            transition={springTransition}
            className="fixed bottom-0 left-0 right-0 z-[60] flex max-h-[80vh] flex-col rounded-t-2xl bg-white pb-[calc(env(safe-area-inset-bottom)+1rem)] shadow-xl"
          >
            <div className="flex items-center justify-between border-b border-gray-100 px-4 py-3">
              <h2 className="text-lg font-semibold">{title}</h2>
              <button
                type="button"
                onClick={onClose}
                aria-label="Close"
                className="flex h-8 w-8 items-center justify-center rounded-full bg-gray-100"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
            <div className={bodyScroll ? "overflow-y-auto" : "flex flex-1 flex-col overflow-hidden"}>
              {children}
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
