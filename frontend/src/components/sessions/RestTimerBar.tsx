import { motion } from "framer-motion";
import { X, Plus, Minus } from "lucide-react";
import { formatDuration } from "@/lib/time";

type Props = {
  remainingSeconds: number;
  totalSeconds: number;
  onAdjust: (deltaSeconds: number) => void;
  onCancel: () => void;
};

export function RestTimerBar({ remainingSeconds, totalSeconds, onAdjust, onCancel }: Props) {
  const progress = totalSeconds === 0 ? 0 : (totalSeconds - remainingSeconds) / totalSeconds;

  return (
    <motion.div
      initial={{ y: 100, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      exit={{ y: 100, opacity: 0 }}
      transition={{ type: "spring", stiffness: 400, damping: 30 }}
      className="fixed bottom-20 left-3 right-3 z-40 mx-auto max-w-md overflow-hidden rounded-2xl bg-gray-900 text-white shadow-lg"
    >
      <div className="relative flex items-center justify-between gap-2 px-4 py-3">
        <button
          type="button"
          onClick={() => onAdjust(-15)}
          aria-label="Subtract 15 seconds"
          className="flex h-8 w-8 items-center justify-center rounded-full bg-white/10"
        >
          <Minus className="h-4 w-4" />
        </button>

        <div className="flex flex-col items-center">
          <span className="text-xs uppercase tracking-wide text-gray-400">Rest</span>
          <span className="font-mono text-2xl font-semibold tabular-nums">
            {formatDuration(remainingSeconds)}
          </span>
        </div>

        <button
          type="button"
          onClick={() => onAdjust(15)}
          aria-label="Add 15 seconds"
          className="flex h-8 w-8 items-center justify-center rounded-full bg-white/10"
        >
          <Plus className="h-4 w-4" />
        </button>

        <button
          type="button"
          onClick={onCancel}
          aria-label="Cancel timer"
          className="absolute right-2 top-2 flex h-7 w-7 items-center justify-center rounded-full bg-white/10"
        >
          <X className="h-3.5 w-3.5" />
        </button>
      </div>

      <div className="h-1 w-full bg-white/10">
        <div
          className="h-full bg-blue-500 transition-all duration-1000 ease-linear"
          style={{ width: `${progress * 100}%` }}
        />
      </div>
    </motion.div>
  );
}
