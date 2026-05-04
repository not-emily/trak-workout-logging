import { useState } from "react";
import { useNavigate } from "react-router";
import { Link } from "react-router";
import { ChevronRight, AlertCircle, CheckCircle2, Download, LogOut, Smartphone } from "lucide-react";
import { useAuth } from "@/features/auth/useAuth";
import { useInstallPrompt } from "@/features/install/useInstallPrompt";
import { useSyncStatus } from "@/hooks/useSyncStatus";
import { ConfirmDialog } from "@/components/ui/ConfirmDialog";

export function SettingsPage() {
  const navigate = useNavigate();
  const { logout, user } = useAuth();
  const { pendingCount, failedCount } = useSyncStatus();
  const { canInstall, promptInstall } = useInstallPrompt();
  const [confirmSignOut, setConfirmSignOut] = useState(false);

  const unsyncedCount = pendingCount + failedCount;

  function handleSignOutClick() {
    if (unsyncedCount > 0) {
      setConfirmSignOut(true);
    } else {
      doSignOut();
    }
  }

  function doSignOut() {
    logout();
    navigate("/login", { replace: true });
  }

  function unsyncedMessage(): string {
    if (pendingCount > 0 && failedCount > 0) {
      return `${pendingCount} pending and ${failedCount} failed update${failedCount === 1 ? "" : "s"} haven't synced. They'll be discarded if you sign out now.`;
    }
    if (pendingCount > 0) {
      return `${pendingCount} update${pendingCount === 1 ? "" : "s"} haven't synced yet. They'll be discarded if you sign out now.`;
    }
    return `${failedCount} failed update${failedCount === 1 ? "" : "s"} will be discarded if you sign out now. You can review them on the Sync issues screen first.`;
  }

  const sectionHeader =
    "text-[11px] font-semibold uppercase tracking-[0.18em] text-fg-subtle";

  return (
    <div className="mx-auto flex max-w-2xl flex-col gap-5 px-4 pt-6 pb-8">
      <h1 className="font-display text-3xl leading-none text-fg">Settings</h1>

      {user && (
        <section className="rounded-xl border border-line bg-surface-1 p-4">
          <div className="text-[10px] font-semibold uppercase tracking-[0.18em] text-fg-subtle">
            Signed in as
          </div>
          <div className="mt-1.5 font-mono text-sm text-fg-soft">{user.email}</div>
        </section>
      )}

      <section className="flex flex-col gap-2">
        <h2 className={sectionHeader}>Sync</h2>
        <Link
          to="/settings/sync-issues"
          className="group flex items-center justify-between rounded-xl border border-line bg-surface-1 p-4 transition-colors hover:border-line-strong hover:bg-surface-2"
        >
          <div className="flex items-center gap-3">
            {failedCount > 0 ? (
              <div className="flex h-9 w-9 items-center justify-center rounded-full bg-danger-soft text-danger">
                <AlertCircle className="h-4 w-4" strokeWidth={2.5} />
              </div>
            ) : (
              <div className="flex h-9 w-9 items-center justify-center rounded-full bg-accent-soft text-accent">
                <CheckCircle2 className="h-4 w-4" strokeWidth={2.5} />
              </div>
            )}
            <div className="flex flex-col">
              <span className="font-display text-sm text-fg-soft">Sync issues</span>
              <span className="text-xs text-fg-muted">
                {failedCount === 0
                  ? "All caught up"
                  : `${failedCount} failed update${failedCount === 1 ? "" : "s"}`}
              </span>
            </div>
          </div>
          <ChevronRight className="h-4 w-4 text-fg-faint transition-transform group-hover:translate-x-0.5 group-hover:text-fg-muted" />
        </Link>
      </section>

      <section className="flex flex-col gap-2">
        <h2 className={sectionHeader}>Install</h2>
        {canInstall && (
          <button
            type="button"
            onClick={() => {
              void promptInstall();
            }}
            className="flex items-center justify-between rounded-xl bg-accent p-4 text-left text-accent-fg transition-colors hover:bg-accent-hover"
          >
            <div className="flex items-center gap-3">
              <Download className="h-5 w-5" strokeWidth={2.5} />
              <span className="font-display text-sm">Install trak</span>
            </div>
            <ChevronRight className="h-4 w-4 opacity-70" />
          </button>
        )}
        <div className="rounded-xl border border-line bg-surface-1 p-4">
          <div className="flex items-start gap-3">
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-surface-2 text-fg-muted">
              <Smartphone className="h-4 w-4" strokeWidth={2.5} />
            </div>
            <div className="flex flex-col gap-2 text-sm text-fg-muted">
              <p>
                <span className="font-semibold text-fg-soft">iPhone:</span> tap the share icon in
                Safari, then <em className="not-italic text-fg-soft">Add to Home Screen</em>.
              </p>
              <p>
                <span className="font-semibold text-fg-soft">Android:</span> tap the menu (⋮) in
                Chrome, then <em className="not-italic text-fg-soft">Install app</em>{" "}
                {canInstall ? "(or use the button above)" : ""}.
              </p>
            </div>
          </div>
        </div>
      </section>

      <section className="flex flex-col gap-2">
        <h2 className={sectionHeader}>Account</h2>
        <button
          type="button"
          onClick={handleSignOutClick}
          className="flex items-center gap-3 rounded-xl border border-line bg-surface-1 p-4 text-left transition-colors hover:border-danger/30 hover:bg-danger-soft/40"
        >
          <div className="flex h-9 w-9 items-center justify-center rounded-full bg-surface-2 text-fg-muted">
            <LogOut className="h-4 w-4" strokeWidth={2.5} />
          </div>
          <span className="font-display text-sm text-fg-soft">Sign out</span>
        </button>
      </section>

      <p className="mt-2 text-center font-mono text-[10px] uppercase tracking-[0.18em] text-fg-faint">
        version {__BUILD_LABEL__}
      </p>

      <ConfirmDialog
        open={confirmSignOut}
        variant="danger"
        title="Sign out anyway?"
        message={unsyncedMessage()}
        confirmLabel="Sign out"
        cancelLabel="Wait"
        onCancel={() => setConfirmSignOut(false)}
        onConfirm={() => {
          setConfirmSignOut(false);
          doSignOut();
        }}
      />
    </div>
  );
}
