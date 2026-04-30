import { useEffect, useState } from "react";

// Chromium fires `beforeinstallprompt` early in page load — earlier than
// React mounts most of the time. Capture at module load so we don't miss
// it; the hook reads from this module-level slot.
//
// iOS Safari has no programmatic install prompt; this whole flow is a
// no-op there. SettingsPage shows static iOS instructions instead.

type BeforeInstallPromptEvent = Event & {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
};

let deferred: BeforeInstallPromptEvent | null = null;
const listeners = new Set<() => void>();

function notify(): void {
  for (const cb of listeners) cb();
}

if (typeof window !== "undefined") {
  window.addEventListener("beforeinstallprompt", (e) => {
    e.preventDefault();
    deferred = e as BeforeInstallPromptEvent;
    notify();
  });
  window.addEventListener("appinstalled", () => {
    deferred = null;
    notify();
  });
}

export function useInstallPrompt(): {
  canInstall: boolean;
  promptInstall: () => Promise<"accepted" | "dismissed" | "unavailable">;
} {
  const [, force] = useState(0);

  useEffect(() => {
    const cb = () => force((n) => n + 1);
    listeners.add(cb);
    return () => {
      listeners.delete(cb);
    };
  }, []);

  return {
    canInstall: deferred !== null,
    async promptInstall() {
      const event = deferred;
      if (!event) return "unavailable";
      await event.prompt();
      const choice = await event.userChoice;
      // The event is single-use — Chrome won't re-fire `beforeinstallprompt`
      // until the user uninstalls.
      deferred = null;
      notify();
      return choice.outcome;
    },
  };
}
