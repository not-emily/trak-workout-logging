import { useNavigate } from "react-router";
import { Link } from "react-router";
import { ChevronRight, AlertCircle, CheckCircle2, Download, LogOut, Smartphone } from "lucide-react";
import { useAuth } from "@/features/auth/useAuth";
import { useInstallPrompt } from "@/features/install/useInstallPrompt";
import { useSyncStatus } from "@/hooks/useSyncStatus";

export function SettingsPage() {
  const navigate = useNavigate();
  const { logout, user } = useAuth();
  const { failedCount } = useSyncStatus();
  const { canInstall, promptInstall } = useInstallPrompt();

  function handleSignOut() {
    logout();
    navigate("/login", { replace: true });
  }

  return (
    <div className="mx-auto flex max-w-2xl flex-col gap-4 px-4 pt-6 pb-8">
      <h1 className="text-2xl font-semibold">Settings</h1>

      {user && (
        <section className="rounded-xl bg-white p-4 ring-1 ring-gray-200">
          <div className="text-xs font-medium uppercase tracking-wide text-gray-500">
            Signed in as
          </div>
          <div className="mt-1 text-base text-gray-900">{user.email}</div>
        </section>
      )}

      <section className="flex flex-col gap-2">
        <h2 className="text-sm font-medium text-gray-700">Sync</h2>
        <Link
          to="/settings/sync-issues"
          className="flex items-center justify-between rounded-xl bg-white p-4 ring-1 ring-gray-200 hover:bg-gray-50"
        >
          <div className="flex items-center gap-3">
            {failedCount > 0 ? (
              <AlertCircle className="h-5 w-5 text-red-600" />
            ) : (
              <CheckCircle2 className="h-5 w-5 text-green-600" />
            )}
            <div className="flex flex-col">
              <span className="text-sm font-medium text-gray-900">Sync</span>
              <span className="text-xs text-gray-500">
                {failedCount === 0
                  ? "All caught up"
                  : `${failedCount} failed update${failedCount === 1 ? "" : "s"}`}
              </span>
            </div>
          </div>
          <ChevronRight className="h-4 w-4 text-gray-400" />
        </Link>
      </section>

      <section className="flex flex-col gap-2">
        <h2 className="text-sm font-medium text-gray-700">Install</h2>
        {canInstall && (
          <button
            type="button"
            onClick={() => {
              void promptInstall();
            }}
            className="flex items-center justify-between rounded-xl bg-black p-4 text-left text-white"
          >
            <div className="flex items-center gap-3">
              <Download className="h-5 w-5" />
              <span className="text-sm font-medium">Install trak</span>
            </div>
            <ChevronRight className="h-4 w-4 text-white/60" />
          </button>
        )}
        <div className="rounded-xl bg-white p-4 ring-1 ring-gray-200">
          <div className="flex items-start gap-3">
            <Smartphone className="mt-0.5 h-5 w-5 text-gray-400" />
            <div className="flex flex-col gap-1.5 text-sm text-gray-700">
              <p>
                <strong>iPhone:</strong> tap the share icon in Safari, then{" "}
                <em>Add to Home Screen</em>.
              </p>
              <p>
                <strong>Android:</strong> tap the menu (⋮) in Chrome, then{" "}
                <em>Install app</em>{" "}
                {canInstall ? "(or use the button above)" : ""}.
              </p>
            </div>
          </div>
        </div>
      </section>

      <section className="flex flex-col gap-2">
        <h2 className="text-sm font-medium text-gray-700">Account</h2>
        <button
          type="button"
          onClick={handleSignOut}
          className="flex items-center gap-3 rounded-xl bg-white p-4 text-left ring-1 ring-gray-200 hover:bg-gray-50"
        >
          <LogOut className="h-5 w-5 text-gray-400" />
          <span className="text-sm font-medium text-gray-900">Sign out</span>
        </button>
      </section>

      <p className="mt-2 text-center text-xs text-gray-400">version {__BUILD_LABEL__}</p>
    </div>
  );
}
