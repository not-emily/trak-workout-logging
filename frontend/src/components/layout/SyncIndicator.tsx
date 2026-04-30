import { Link } from "react-router";
import { AlertCircle, CloudOff, RefreshCw } from "lucide-react";
import { useOnlineStatus } from "@/hooks/useOnlineStatus";
import { useSyncStatus } from "@/hooks/useSyncStatus";

// Inline sync pill — render in a page's header row to surface queue
// state next to the page's action buttons. Returns null when there's
// nothing to say. Three live states:
//
//   failed > 0:           red, links to /settings/sync-issues
//   pending + online:     blue with spinner ("Syncing…")
//   pending + offline:    gray with clock ("N pending")
export function SyncIndicator() {
  const online = useOnlineStatus();
  const { pendingCount, failedCount } = useSyncStatus();

  if (failedCount > 0) {
    return (
      <Link
        to="/settings/sync-issues"
        className="flex items-center gap-1 rounded-full bg-red-100 px-2.5 py-1 text-xs font-medium text-red-700 ring-1 ring-red-200"
      >
        <AlertCircle className="h-3 w-3" />
        {failedCount}
      </Link>
    );
  }

  if (pendingCount > 0) {
    if (online) {
      return (
        <span className="flex items-center gap-1 rounded-full bg-blue-100 px-2.5 py-1 text-xs font-medium text-blue-700 ring-1 ring-blue-200">
          <RefreshCw className="h-3 w-3 animate-spin" />
          Syncing… ({pendingCount})
        </span>
      );
    }
    return (
      <span className="flex items-center gap-1 rounded-full bg-gray-100 px-2.5 py-1 text-xs font-medium text-gray-700 ring-1 ring-gray-200">
        <CloudOff className="h-3 w-3" />
        {pendingCount} pending
      </span>
    );
  }

  return null;
}
