import { useSyncExternalStore } from "react";
import { Link } from "react-router";
import { ArrowLeft, CheckCircle2, RotateCcw, Trash2 } from "lucide-react";
import { queue, type QueueEntry } from "@/sync/queue";
import { syncWorker } from "@/sync/syncWorker";
import { EmptyState } from "@/components/ui/EmptyState";

// Cache the snapshot — useSyncExternalStore requires getSnapshot to
// return the same reference when the underlying data hasn't changed.
// queue.failed() returns a fresh array each call, so we memoize and
// invalidate on queue notifications.
let cachedFailed: QueueEntry[] | null = null;
const listeners = new Set<() => void>();

queue.subscribe(() => {
  cachedFailed = null;
  for (const cb of listeners) cb();
});

function subscribe(cb: () => void): () => void {
  listeners.add(cb);
  return () => {
    listeners.delete(cb);
  };
}

function getFailed(): QueueEntry[] {
  if (cachedFailed === null) cachedFailed = queue.failed();
  return cachedFailed;
}

export function SyncIssuesPage() {
  const failed = useSyncExternalStore(subscribe, getFailed, getFailed);

  function handleRetry(id: string) {
    queue.retry(id);
    syncWorker.poke();
  }

  function handleDiscard(id: string) {
    queue.discard(id);
  }

  return (
    <div className="mx-auto flex max-w-2xl flex-col gap-4 px-4 pt-6 pb-8">
      <Link
        to="/settings"
        className="flex w-fit items-center gap-1 text-xs font-semibold uppercase tracking-[0.18em] text-fg-subtle transition-colors hover:text-fg-muted"
      >
        <ArrowLeft className="h-3.5 w-3.5" />
        Back
      </Link>

      <h1 className="font-display text-3xl leading-none text-fg">Sync issues</h1>

      {failed.length === 0 ? (
        <EmptyState icon={CheckCircle2}>
          No failed updates. Everything's in sync.
        </EmptyState>
      ) : (
        <ul className="flex flex-col gap-2">
          {failed.map((entry) => (
            <li
              key={entry.id}
              className="flex flex-col gap-2.5 rounded-xl border border-danger/20 bg-surface-1 p-3.5"
            >
              <div className="flex flex-col gap-1">
                <span className="font-mono text-xs uppercase tracking-wide text-fg-muted">
                  <span className="rounded bg-surface-2 px-1.5 py-0.5 text-fg-soft">
                    {entry.method}
                  </span>{" "}
                  {entry.path}
                </span>
                {entry.lastError && (
                  <span className="text-sm text-danger">{entry.lastError}</span>
                )}
                <span className="text-[11px] text-fg-faint">
                  Queued{" "}
                  <span className="font-mono">{new Date(entry.createdAt).toLocaleString()}</span>
                </span>
              </div>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => handleRetry(entry.id)}
                  className="flex flex-1 items-center justify-center gap-1.5 rounded-lg bg-surface-2 px-3 py-2 text-sm font-medium text-fg-muted transition-colors hover:bg-surface-3 hover:text-fg"
                >
                  <RotateCcw className="h-4 w-4" />
                  Retry
                </button>
                <button
                  type="button"
                  onClick={() => handleDiscard(entry.id)}
                  className="flex flex-1 items-center justify-center gap-1.5 rounded-lg bg-danger-soft px-3 py-2 text-sm font-semibold text-danger transition-colors hover:bg-danger/30"
                >
                  <Trash2 className="h-4 w-4" />
                  Discard
                </button>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
