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
        className="absolute inset-0 bg-black/40"
      />
      <div className="relative w-full max-w-sm rounded-2xl bg-white p-5 shadow-xl">
        <div className="flex items-start gap-3">
          <div
            className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-full ${
              isDanger ? "bg-red-50" : "bg-gray-100"
            }`}
          >
            <AlertTriangle className={`h-4 w-4 ${isDanger ? "text-red-600" : "text-gray-700"}`} />
          </div>
          <div className="min-w-0 flex-1">
            <h3 className="text-base font-semibold text-gray-900">{title}</h3>
            <div className="mt-1 text-sm text-gray-600">{message}</div>
          </div>
        </div>

        <div className="mt-5 flex gap-2">
          <button
            type="button"
            onClick={onCancel}
            className="rounded-lg px-3 py-2 text-sm font-medium text-gray-600 hover:bg-gray-100"
          >
            {cancelLabel}
          </button>
          <button
            type="button"
            onClick={onConfirm}
            className={`flex-1 rounded-lg px-4 py-2 text-sm font-medium text-white shadow-sm ${
              isDanger ? "bg-red-600 hover:bg-red-700" : "bg-black hover:bg-gray-800"
            }`}
          >
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}
