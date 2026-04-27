import type { LucideIcon } from "lucide-react";
import type { ReactNode } from "react";

type Props = {
  icon: LucideIcon;
  children: ReactNode;
};

export function EmptyState({ icon: Icon, children }: Props) {
  return (
    <div className="rounded-xl border-2 border-dashed border-gray-200 px-6 py-12 text-center">
      <Icon className="mx-auto h-12 w-12 text-gray-300" />
      <p className="mt-3 text-sm text-gray-500">{children}</p>
    </div>
  );
}
