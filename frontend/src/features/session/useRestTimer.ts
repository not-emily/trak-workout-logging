import { useEffect, useRef, useState } from "react";

type RestTimerState = {
  running: boolean;
  remainingSeconds: number;
  totalSeconds: number;
};

export function useRestTimer(defaultSeconds = 90) {
  const [state, setState] = useState<RestTimerState>({
    running: false,
    remainingSeconds: 0,
    totalSeconds: defaultSeconds,
  });
  const intervalRef = useRef<number | null>(null);

  useEffect(() => {
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, []);

  function tick() {
    setState((prev) => {
      if (!prev.running) return prev;
      if (prev.remainingSeconds <= 1) {
        if (intervalRef.current) clearInterval(intervalRef.current);
        intervalRef.current = null;
        return { ...prev, running: false, remainingSeconds: 0 };
      }
      return { ...prev, remainingSeconds: prev.remainingSeconds - 1 };
    });
  }

  function start(seconds: number = defaultSeconds) {
    if (intervalRef.current) clearInterval(intervalRef.current);
    intervalRef.current = window.setInterval(tick, 1000);
    setState({ running: true, remainingSeconds: seconds, totalSeconds: seconds });
  }

  function stop() {
    if (intervalRef.current) clearInterval(intervalRef.current);
    intervalRef.current = null;
    setState((prev) => ({ ...prev, running: false, remainingSeconds: 0 }));
  }

  return { ...state, start, stop };
}
