import { useSyncExternalStore } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { CheckCircle2, Trophy } from "lucide-react";
import type { ReactNode } from "react";

export type ToastVariant = "default" | "success" | "achievement";

type ToastEntry = {
  id: string;
  variant: ToastVariant;
  title: string;
  /** Optional headline value, only rendered by the "achievement" variant. */
  value?: string;
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
  show(t: {
    title: string;
    body?: string;
    value?: string;
    variant?: ToastVariant;
    id?: string;
  }): string {
    const id = t.id ?? `${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;
    entries = [
      ...entries,
      { id, title: t.title, body: t.body, value: t.value, variant: t.variant ?? "default" },
    ];
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

function ToastBody({ entry }: { entry: ToastEntry }): ReactNode {
  if (entry.variant === "achievement") {
    return (
      <>
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0 opacity-60"
          style={{
            background:
              "radial-gradient(ellipse 70% 80% at 0% 0%, var(--color-gold-soft), transparent 65%)",
          }}
        />
        <div aria-hidden className="absolute inset-y-0 left-0 w-[3px] bg-gold" />
        <div className="relative pl-3">
          <div className="flex items-center gap-1.5 text-[10px] font-semibold uppercase tracking-[0.18em] text-gold">
            <Trophy className="h-3 w-3" strokeWidth={2.5} />
            {entry.title}
          </div>
          {entry.value && (
            <div className="mt-2 font-display-shade text-3xl leading-none text-fg">
              {entry.value}
            </div>
          )}
          {entry.body && (
            <div className="mt-2 text-[11px] text-fg-muted">{entry.body}</div>
          )}
        </div>
      </>
    );
  }

  if (entry.variant === "success") {
    return (
      <>
        <div aria-hidden className="absolute inset-y-0 left-0 w-[3px] bg-accent" />
        <div className="relative flex items-start gap-2 pl-3">
          <CheckCircle2 className="mt-0.5 h-4 w-4 flex-shrink-0 text-accent" strokeWidth={2.5} />
          <div className="min-w-0">
            <div className="text-sm font-semibold text-fg">{entry.title}</div>
            {entry.body && <div className="mt-0.5 text-xs text-fg-muted">{entry.body}</div>}
          </div>
        </div>
      </>
    );
  }

  return (
    <div className="text-sm">
      <div className="font-semibold text-fg">{entry.title}</div>
      {entry.body && <div className="mt-0.5 text-xs text-fg-muted">{entry.body}</div>}
    </div>
  );
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
            const isAchievement = t.variant === "achievement";
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
                  boxShadow: isAchievement
                    ? "0 0 32px rgba(251, 191, 36, 0.28), 0 8px 24px rgba(0, 0, 0, 0.5)"
                    : "0 8px 24px rgba(0, 0, 0, 0.5)",
                }}
                className={`pointer-events-auto relative overflow-hidden rounded-2xl border bg-surface-1 ${
                  isAchievement ? "border-gold/30 px-4 py-3.5" : "border-line-strong px-4 py-3"
                } ${isFront ? "cursor-pointer" : ""}`}
              >
                <ToastBody entry={t} />
              </motion.div>
            );
          })}
        </AnimatePresence>
      </div>
    </div>
  );
}
