import { useSyncExternalStore } from "react";
import { motion, AnimatePresence } from "framer-motion";
import type { ReactNode } from "react";

export type ToastVariant = "default" | "success";

type ToastEntry = {
  id: string;
  variant: ToastVariant;
  title: string;
  body?: string;
};

const DISMISS_MS = 4000;
const STACK_VISIBLE = 3;
const SWIPE_DISMISS_PX = 60;

let entries: ToastEntry[] = [];
let activeTimer: number | null = null;
const listeners = new Set<() => void>();

function emit(): void {
  for (const cb of listeners) cb();
}

// The dismiss timer only runs for the currently-visible (front-of-queue) toast.
// When it fires, the next queued toast slides forward and its own timer starts.
function startActiveTimer(): void {
  if (activeTimer != null) return;
  if (entries.length === 0) return;
  const activeId = entries[0].id;
  activeTimer = window.setTimeout(() => {
    activeTimer = null;
    toast.dismiss(activeId);
  }, DISMISS_MS);
}

export const toast = {
  show(t: { title: string; body?: string; variant?: ToastVariant; id?: string }): string {
    const id = t.id ?? `${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;
    entries = [...entries, { id, title: t.title, body: t.body, variant: t.variant ?? "default" }];
    emit();
    startActiveTimer();
    return id;
  },
  dismiss(id: string): void {
    const wasActive = entries[0]?.id === id;
    entries = entries.filter((e) => e.id !== id);
    if (wasActive && activeTimer != null) {
      clearTimeout(activeTimer);
      activeTimer = null;
    }
    emit();
    startActiveTimer();
  },
  dismissAll(): void {
    if (activeTimer != null) {
      clearTimeout(activeTimer);
      activeTimer = null;
    }
    entries = [];
    emit();
  },
};

function subscribe(cb: () => void): () => void {
  listeners.add(cb);
  return () => listeners.delete(cb);
}
function getEntries(): ToastEntry[] {
  return entries;
}

export function ToastHost(): ReactNode {
  const items = useSyncExternalStore(subscribe, getEntries, getEntries);
  const visible = items.slice(0, STACK_VISIBLE);

  return (
    <div
      className="pointer-events-none fixed left-0 right-0 top-[calc(env(safe-area-inset-top)+0.75rem)] z-[80] flex justify-center px-4"
      role="status"
      aria-live="polite"
    >
      <div className="grid w-full max-w-sm">
        <AnimatePresence>
          {visible.map((t, i) => {
            const isFront = i === 0;
            return (
              <motion.div
                key={t.id}
                initial={{ opacity: 0, y: -24, scale: 0.95 }}
                animate={{
                  // Front: full size. Behind: smaller, faded, nudged down so a sliver
                  // peeks below the front card — reads as a real stack of cards.
                  opacity: 1 - i * 0.22,
                  y: i * 8,
                  scale: 1 - i * 0.05,
                }}
                exit={{ opacity: 0, y: -24, transition: { duration: 0.18 } }}
                transition={{ type: "spring", stiffness: 400, damping: 32 }}
                drag={isFront ? "y" : false}
                dragConstraints={{ top: -120, bottom: 0 }}
                dragElastic={0.2}
                dragMomentum={false}
                onDragEnd={(_e, info) => {
                  if (isFront && info.offset.y < -SWIPE_DISMISS_PX) {
                    toast.dismissAll();
                  }
                }}
                onClick={() => isFront && toast.dismiss(t.id)}
                style={{
                  gridArea: "1 / 1",
                  zIndex: STACK_VISIBLE - i,
                  transformOrigin: "top center",
                  touchAction: isFront ? "none" : undefined,
                }}
                className={`pointer-events-auto rounded-2xl px-4 py-2.5 text-sm shadow-lg ${
                  t.variant === "success"
                    ? "bg-green-600 text-white"
                    : "bg-gray-900 text-white"
                } ${isFront ? "cursor-pointer" : ""}`}
              >
                <div className="font-semibold">{t.title}</div>
                {t.body && <div className="mt-0.5 text-xs opacity-90">{t.body}</div>}
              </motion.div>
            );
          })}
        </AnimatePresence>
      </div>
    </div>
  );
}
