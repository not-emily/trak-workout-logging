import { useEffect, useRef, useState } from "react";
import { MoreHorizontal } from "lucide-react";
import type { LucideIcon } from "lucide-react";

export type MenuItem = {
  label: string;
  icon?: LucideIcon;
  onClick: () => void;
  variant?: "danger" | "default";
};

type Props = {
  items: MenuItem[];
  ariaLabel?: string;
};

export function MeatballMenu({ items, ariaLabel = "Open menu" }: Props) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    function handler(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [open]);

  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        aria-label={ariaLabel}
        aria-haspopup="menu"
        aria-expanded={open}
        onClick={() => setOpen((s) => !s)}
        className="flex h-9 w-9 items-center justify-center rounded-full text-fg-muted transition-colors hover:bg-surface-2 hover:text-fg"
      >
        <MoreHorizontal className="h-4 w-4" />
      </button>
      {open && (
        <ul
          role="menu"
          className="absolute right-0 top-full z-30 mt-1 min-w-[10rem] overflow-hidden rounded-lg border border-line-strong bg-surface-1 py-1 shadow-[0_8px_24px_rgba(0,0,0,0.5)]"
        >
          {items.map((item) => {
            const Icon = item.icon;
            const danger = item.variant === "danger";
            return (
              <li key={item.label}>
                <button
                  type="button"
                  role="menuitem"
                  onClick={() => {
                    item.onClick();
                    setOpen(false);
                  }}
                  className={`flex w-full items-center gap-2 px-3 py-2 text-left text-sm transition-colors hover:bg-surface-2 ${
                    danger ? "text-danger" : "text-fg-muted hover:text-fg"
                  }`}
                >
                  {Icon && <Icon className="h-4 w-4" />}
                  {item.label}
                </button>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
