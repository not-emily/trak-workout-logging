import { AlertTriangle } from "lucide-react";
import type { ReactNode } from "react";

type Props = {
  open: boolean;
  title: string;
  message: ReactNode;
  confirmLabel?: string;
  cancelLabel?: string;
  variant?: "danger" | "default";
  onConfirm: () => void;
  onCancel: () => void;
};

export function ConfirmDialog({
  open,
  title,
  message,
  confirmLabel = "Confirm",
  cancelLabel = "Cancel",
  variant = "default",
  onConfirm,
  onCancel,
}: Props) {
  if (!open) return null;
  const isDanger = variant === "danger";

  return (
    <div className="fixed inset-0 z-[70] flex items-center justify-center p-4">
      <button
        type="button"
        onClick={onCancel}
        aria-label="Close"
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
      />
      <div className="relative w-full max-w-sm rounded-2xl border border-line-strong bg-surface-1 p-5 shadow-[0_24px_64px_rgba(0,0,0,0.6)]">
        <div className="flex items-start gap-3">
          <div
            className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-full ${
              isDanger ? "bg-danger-soft" : "bg-surface-2"
            }`}
          >
            <AlertTriangle
              className={`h-4 w-4 ${isDanger ? "text-danger" : "text-fg-muted"}`}
              strokeWidth={2.5}
            />
          </div>
          <div className="min-w-0 flex-1">
            <h3 className="text-base font-semibold text-fg">{title}</h3>
            <div className="mt-1 text-sm text-fg-muted">{message}</div>
          </div>
        </div>

        <div className="mt-5 flex gap-2">
          <button
            type="button"
            onClick={onCancel}
            className="rounded-lg px-3 py-2 text-sm font-medium text-fg-muted transition-colors hover:bg-surface-2 hover:text-fg"
          >
            {cancelLabel}
          </button>
          <button
            type="button"
            onClick={onConfirm}
            className={`flex-1 rounded-lg px-4 py-2 text-sm font-semibold transition-colors ${
              isDanger
                ? "bg-danger text-fg hover:opacity-90"
                : "bg-accent text-accent-fg hover:bg-accent-hover"
            }`}
          >
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}
