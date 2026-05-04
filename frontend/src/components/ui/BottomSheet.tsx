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
  /**
   * Tailwind responsive max-width class applied on `md+`. Pass the page's
   * own max-w (e.g. `md:max-w-3xl`) so the sheet matches the content column.
   * Defaults to `md:max-w-md` for narrow forms.
   */
  maxWidth?: string;
};

const springTransition = {
  type: "spring" as const,
  stiffness: 350,
  damping: 30,
};

export function BottomSheet({
  open,
  onClose,
  title,
  children,
  bodyScroll = true,
  maxWidth = "md:max-w-md",
}: Props) {
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
            className={`fixed inset-x-0 bottom-0 z-[60] mx-auto flex max-h-[80vh] flex-col rounded-t-2xl border-t border-line-strong bg-surface-1 pb-[calc(env(safe-area-inset-bottom)+1rem)] shadow-[0_-12px_40px_rgba(0,0,0,0.5)] md:bottom-6 md:rounded-2xl md:border ${maxWidth}`}
          >
            <div aria-hidden className="mx-auto mt-2 h-1 w-9 rounded-full bg-fg-disabled" />
            <div className="flex items-center justify-between border-b border-line px-4 py-3">
              <h2 className="text-base font-semibold text-fg">{title}</h2>
              <button
                type="button"
                onClick={onClose}
                aria-label="Close"
                className="flex h-8 w-8 items-center justify-center rounded-full bg-surface-2 text-fg-muted transition-colors hover:bg-surface-3 hover:text-fg"
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
