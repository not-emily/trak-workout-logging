import { CloudOff, RefreshCw, AlertCircle } from "lucide-react";
import { useOnlineStatus } from "@/hooks/useOnlineStatus";
import { useSyncStatus } from "@/hooks/useSyncStatus";

export function SyncIndicator() {
  const online = useOnlineStatus();
  const { pendingCount, failedCount } = useSyncStatus();

  if (!online) {
    return (
      <div className="fixed top-3 left-1/2 z-50 flex -translate-x-1/2 items-center gap-1.5 rounded-full bg-gray-900 px-3 py-1.5 text-xs font-medium text-white shadow-md">
        <CloudOff className="h-3.5 w-3.5" />
        Offline
      </div>
    );
  }

  if (failedCount > 0) {
    return (
      <div className="fixed top-3 left-1/2 z-50 flex -translate-x-1/2 items-center gap-1.5 rounded-full bg-red-600 px-3 py-1.5 text-xs font-medium text-white shadow-md">
        <AlertCircle className="h-3.5 w-3.5" />
        {failedCount} sync issue{failedCount === 1 ? "" : "s"}
      </div>
    );
  }

  if (pendingCount > 0) {
    return (
      <div className="fixed top-3 left-1/2 z-50 flex -translate-x-1/2 items-center gap-1.5 rounded-full bg-blue-600 px-3 py-1.5 text-xs font-medium text-white shadow-md">
        <RefreshCw className="h-3.5 w-3.5 animate-spin" />
        Syncing… ({pendingCount})
      </div>
    );
  }

  return null;
}
