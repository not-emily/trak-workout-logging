import type { LucideIcon } from "lucide-react";
import type { ReactNode } from "react";

type Props = {
  icon: LucideIcon;
  children: ReactNode;
};

export function EmptyState({ icon: Icon, children }: Props) {
  return (
    <div className="rounded-2xl border border-dashed border-line-strong bg-surface-1/30 px-6 py-12 text-center">
      <Icon className="mx-auto h-12 w-12 text-fg-faint" strokeWidth={1.5} />
      <p className="mt-3 text-sm text-fg-muted">{children}</p>
    </div>
  );
}
