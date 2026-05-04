import { useSyncExternalStore } from "react";
import { Sparkles } from "lucide-react";
import { swUpdateStore } from "@/sync/swRegister";

function subscribe(cb: () => void): () => void {
  return swUpdateStore.subscribe(cb);
}

function getSnapshot(): boolean {
  return swUpdateStore.hasUpdate();
}

// Shown when a newer service worker has installed and is waiting. Tapping
// tells the SW to take over, which triggers a controllerchange + reload.
// Don't auto-update mid-set; let the user finish what they're doing.
export function UpdateBanner() {
  const hasUpdate = useSyncExternalStore(subscribe, getSnapshot, getSnapshot);
  if (!hasUpdate) return null;
  return (
    <button
      type="button"
      onClick={() => swUpdateStore.applyUpdate()}
      className="flex w-full items-center justify-center gap-1.5 bg-accent px-4 py-2 text-xs font-semibold uppercase tracking-[0.14em] text-accent-fg transition-colors hover:bg-accent-hover"
    >
      <Sparkles className="h-3.5 w-3.5" strokeWidth={2.5} />
      Update available — tap to refresh
    </button>
  );
}
