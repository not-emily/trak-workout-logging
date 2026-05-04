import { Link } from "react-router";
import { AlertCircle, CloudOff, RefreshCw } from "lucide-react";
import { useOnlineStatus } from "@/hooks/useOnlineStatus";
import { useSyncStatus } from "@/hooks/useSyncStatus";

// Inline sync pill — render in a page's header row to surface queue
// state next to the page's action buttons. Returns null when there's
// nothing to say. Three live states:
//
//   failed > 0:           red, links to /settings/sync-issues
//   pending + online:     cyan with spinner ("Syncing…")
//   pending + offline:    muted with cloud-off ("N pending")
export function SyncIndicator() {
  const online = useOnlineStatus();
  const { pendingCount, failedCount } = useSyncStatus();

  if (failedCount > 0) {
    return (
      <Link
        to="/settings/sync-issues"
        className="flex items-center gap-1 rounded-full border border-danger/30 bg-danger-soft px-2.5 py-1 text-xs font-semibold text-danger transition-colors hover:bg-danger/20"
      >
        <AlertCircle className="h-3 w-3" strokeWidth={2.5} />
        {failedCount}
      </Link>
    );
  }

  if (pendingCount > 0) {
    if (online) {
      return (
        <span className="flex items-center gap-1 rounded-full border border-cardio/30 bg-cardio-soft px-2.5 py-1 text-xs font-semibold text-cardio">
          <RefreshCw className="h-3 w-3 animate-spin" strokeWidth={2.5} />
          Syncing… ({pendingCount})
        </span>
      );
    }
    return (
      <span className="flex items-center gap-1 rounded-full border border-line-strong bg-surface-2 px-2.5 py-1 text-xs font-semibold text-fg-muted">
        <CloudOff className="h-3 w-3" strokeWidth={2.5} />
        {pendingCount} pending
      </span>
    );
  }

  return null;
}
