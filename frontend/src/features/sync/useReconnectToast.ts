import { useEffect, useRef } from "react";
import { useOnlineStatus } from "@/hooks/useOnlineStatus";
import { useSyncStatus } from "@/hooks/useSyncStatus";
import { toast } from "@/components/ui/Toast";

// Side-effect-only hook: fires a "X updates synced" toast when the queue
// drains to zero AFTER the user was offline. Single online writes that
// drain immediately don't toast — only post-disconnect catch-ups do.
export function useReconnectToast(): void {
  const online = useOnlineStatus();
  const { pendingCount } = useSyncStatus();

  const prevPendingRef = useRef(pendingCount);
  const drainCountRef = useRef(0);
  const wasOfflineRef = useRef(!online);

  useEffect(() => {
    if (!online) {
      wasOfflineRef.current = true;
    }
  }, [online]);

  useEffect(() => {
    const prev = prevPendingRef.current;
    if (pendingCount < prev) {
      drainCountRef.current += prev - pendingCount;
    }
    prevPendingRef.current = pendingCount;

    if (
      online &&
      pendingCount === 0 &&
      wasOfflineRef.current &&
      drainCountRef.current > 0
    ) {
      const count = drainCountRef.current;
      drainCountRef.current = 0;
      wasOfflineRef.current = false;
      toast.show({
        variant: "success",
        title: `${count} update${count === 1 ? "" : "s"} synced`,
      });
    }
  }, [pendingCount, online]);
}
