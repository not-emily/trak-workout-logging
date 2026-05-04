import { CloudOff } from "lucide-react";
import { useOnlineStatus } from "@/hooks/useOnlineStatus";

// Slim status strip shown when navigator is offline. Reassures the user
// their writes are queued locally — they'll drain when reconnect happens.
export function OfflineBanner() {
  const online = useOnlineStatus();
  if (online) return null;
  return (
    <div className="flex items-center justify-center gap-1.5 border-b border-amber-400/20 bg-amber-500/[0.08] px-4 py-1.5 text-xs font-semibold uppercase tracking-[0.14em] text-amber-300">
      <CloudOff className="h-3.5 w-3.5" strokeWidth={2.5} />
      Offline — your logs are safe
    </div>
  );
}
