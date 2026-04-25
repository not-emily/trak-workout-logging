import { Link, useLocation } from "react-router";
import { motion, LayoutGroup } from "framer-motion";
import { Dumbbell, Clipboard, TrendingUp, HeartPulse, Plus } from "lucide-react";
import type { LucideIcon } from "lucide-react";

type NavItem = { to: string; icon: LucideIcon; label: string };

const navItems: readonly NavItem[] = [
  { to: "/sessions", icon: Dumbbell, label: "Sessions" },
  { to: "/routines", icon: Clipboard, label: "Routines" },
  { to: "/progress", icon: TrendingUp, label: "Progress" },
  { to: "/body", icon: HeartPulse, label: "Body" },
] as const;

function getActiveItem(pathname: string): NavItem | null {
  for (const item of navItems) {
    if (pathname === item.to || pathname.startsWith(item.to + "/")) return item;
  }
  return null;
}

const springTransition = {
  type: "spring" as const,
  stiffness: 400,
  damping: 30,
};

type Props = { onActionPress: () => void };

export function BottomNav({ onActionPress }: Props) {
  const { pathname } = useLocation();
  const activeItem = getActiveItem(pathname);

  return (
    <LayoutGroup>
      <nav
        aria-label="Main navigation"
        className="fixed bottom-0 left-0 right-0 z-50 pb-[env(safe-area-inset-bottom)]"
      >
        <div className="mx-auto flex max-w-5xl items-center justify-between gap-3 px-4 py-2">
          <motion.div
            layoutId="nav-pill"
            className="flex items-center gap-1 rounded-full bg-gray-100/90 p-1 shadow-sm backdrop-blur-sm"
            transition={springTransition}
          >
            {navItems.map((item) => {
              const isActive = item === activeItem;
              const Icon = item.icon;
              return (
                <Link
                  key={item.to}
                  to={item.to}
                  aria-label={item.label}
                  aria-current={isActive ? "page" : undefined}
                  className="relative flex h-10 w-10 items-center justify-center rounded-full"
                >
                  {isActive && (
                    <motion.div
                      layoutId="nav-active-bg"
                      className="absolute inset-0 rounded-full bg-white shadow-sm"
                      transition={springTransition}
                    />
                  )}
                  <Icon
                    className={`relative z-10 h-5 w-5 transition-colors ${
                      isActive ? "text-gray-900" : "text-gray-400"
                    }`}
                  />
                </Link>
              );
            })}
          </motion.div>

          <motion.button
            type="button"
            aria-label="New session"
            layoutId="nav-action"
            className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-gray-100/90 shadow-sm backdrop-blur-sm"
            transition={springTransition}
            onClick={onActionPress}
          >
            <Plus className="h-5 w-5 text-gray-500" />
          </motion.button>
        </div>
      </nav>
    </LayoutGroup>
  );
}
