export function formatDuration(seconds: number): string {
  if (seconds < 0) seconds = 0;
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = seconds % 60;
  if (h > 0) {
    return `${h}:${pad(m)}:${pad(s)}`;
  }
  return `${m}:${pad(s)}`;
}

function pad(n: number): string {
  return n.toString().padStart(2, "0");
}

// Live-updating elapsed-time hook. Recomputes every second from the
// given startedAt timestamp.
import { useEffect, useState } from "react";

export function useElapsedSeconds(startedAt: string | null, endedAt: string | null = null): number {
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    if (endedAt || !startedAt) return;
    const interval = window.setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(interval);
  }, [startedAt, endedAt]);
  if (!startedAt) return 0;
  const start = new Date(startedAt).getTime();
  const end = endedAt ? new Date(endedAt).getTime() : now;
  return Math.max(0, Math.floor((end - start) / 1000));
}
