import { motion } from "framer-motion";
import { X, Plus, Minus } from "lucide-react";
import { formatDuration } from "@/lib/time";

import { useState, useEffect } from 'react';


type Props = {
  remainingSeconds: number;
  totalSeconds: number;
  onAdjust: (deltaSeconds: number) => void;
  onCancel: () => void;
  isExpanded: boolean;
};

export function RestTimerBar({ remainingSeconds, totalSeconds, onAdjust, onCancel, isExpanded }: Props) {
  const progress = totalSeconds === 0 ? 0 : (totalSeconds - remainingSeconds) / totalSeconds;
  const [expanded, setExpanded] = useState(isExpanded)

  useEffect(() => {
    if (expanded) {
      setTimeout(() => {
        setExpanded(false);
      }, 5000);
    }
  }, [expanded])


  return (
  <>
    { expanded ?
    <motion.div
      initial={{ x: 50, opacity: 0 }}
      animate={{ y: -65, x: 0, opacity: 1 }}
      exit={{ y: 100, opacity: 0 }}
      transition={{ type: "spring", stiffness: 400, damping: 30 }}
      className="fixed bottom-5 left-3 right-3 z-40 mx-auto max-w-md overflow-hidden rounded-2xl border border-line-strong bg-surface-1 text-fg shadow-[0_8px_32px_rgba(0,0,0,0.6)]"
    >
      <div className="relative flex items-center justify-between gap-2 px-4 py-3">
        <button
          type="button"
          onClick={() => onAdjust(-15)}
          aria-label="Subtract 15 seconds"
          className="flex h-8 w-8 items-center justify-center rounded-full bg-surface-2 text-fg-muted transition-colors hover:bg-surface-3 hover:text-fg"
        >
          <Minus className="h-4 w-4" />
        </button>

        <div className="flex flex-col items-center leading-none" onClick={() => setExpanded(false) }>
          <span className="text-[10px] font-semibold uppercase tracking-[0.18em] text-fg-subtle">
            Rest
          </span>
          <span className="mt-1 font-display text-3xl text-fg tabular">
            {formatDuration(remainingSeconds)}
          </span>
        </div>

        <button
          type="button"
          onClick={() => onAdjust(15)}
          aria-label="Add 15 seconds"
          className="flex h-8 w-8 items-center justify-center rounded-full bg-surface-2 text-fg-muted transition-colors hover:bg-surface-3 hover:text-fg"
        >
          <Plus className="h-4 w-4" />
        </button>
      </div>

      <div className="h-1 w-full bg-surface-3">
        <div
          className="h-full bg-accent transition-all duration-1000 ease-linear"
          style={{ width: `${progress * 100}%` }}
        />
      </div>
    </motion.div>
    :
    <>
    <motion.div
      initial={{ x:-150, opacity: 0 }}
      animate={{ x: 0, opacity: 1 }}
      exit={{ y: 100, opacity: 0 }}
      transition={{ type: "spring", stiffness: 400, damping: 30 }}
      className="fixed bottom-5 right-3 z-40 mx-auto max-w-md overflow-hidden rounded-2xl border border-line-strong bg-surface-1 text-fg shadow-[0_8px_32px_rgba(0,0,0,0.6)]"
    >
      <div className="relative flex items-end justify-end gap-2 px-4 py-3" onClick={() => setExpanded(true) }>
        <div className="flex flex-col items-center leading-none">
          <span className="text-[10px] font-semibold uppercase tracking-[0.18em] text-fg-subtle">
            Rest
          </span>
          <span className="mt-1 font-display text-3xl text-fg tabular">
            {formatDuration(remainingSeconds)}
          </span>
        </div>
      </div>

      <div className="h-1 w-full bg-surface-3">
        <div
          className="h-full bg-accent transition-all duration-1000 ease-linear"
          style={{ width: `${progress * 100}%` }}
        />
      </div>
    </motion.div>
    </>
    }
  </>
  );
}
