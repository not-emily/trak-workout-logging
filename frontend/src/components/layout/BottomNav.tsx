import { Link, useLocation } from "react-router";
import { motion, LayoutGroup } from "framer-motion";
import { Dumbbell, Clipboard, TrendingUp, HeartPulse, Target } from "lucide-react";
import type { LucideIcon } from "lucide-react";

type NavItem = { to: string; icon: LucideIcon; label: string };

const navItems: readonly NavItem[] = [
  { to: "/", icon: Dumbbell, label: "Sessions" },
  { to: "/routines", icon: Clipboard, label: "Routines" },
  { to: "/progress", icon: TrendingUp, label: "Progress" },
  { to: "/body", icon: HeartPulse, label: "Body" },
  { to: "/goals", icon: Target, label: "Goals" },
] as const;

function getActiveItem(pathname: string): NavItem | null {
  if (pathname === "/" || pathname === "/sessions" || pathname.startsWith("/sessions/")) {
    return navItems[0];
  }
  for (const item of navItems.slice(1)) {
    if (pathname === item.to || pathname.startsWith(item.to + "/")) return item;
  }
  return null;
}

const springTransition = {
  type: "spring" as const,
  stiffness: 400,
  damping: 30,
};

export function BottomNav() {
  const { pathname } = useLocation();
  const activeItem = getActiveItem(pathname);

  return (
    <LayoutGroup>
      <nav
        aria-label="Main navigation"
        className="pointer-events-none fixed bottom-0 left-0 right-0 z-50 pb-[calc(env(safe-area-inset-bottom)+0.5rem)]"
      >
        <div className="pointer-events-none mx-auto flex max-w-5xl items-center justify-start gap-3 px-4 py-3">
          <motion.div
            layoutId="nav-pill"
            className="pointer-events-auto flex items-center gap-1 rounded-full border border-line-strong bg-surface-1/85 p-1 shadow-[0_8px_24px_rgba(0,0,0,0.4)] backdrop-blur-md"
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
                  className="relative flex h-11 w-11 items-center justify-center rounded-full"
                >
                  {isActive && (
                    <motion.div
                      layoutId="nav-active-bg"
                      className="absolute inset-0 rounded-full bg-accent shadow-[0_0_20px_rgba(163,230,53,0.35)]"
                      transition={springTransition}
                    />
                  )}
                  <Icon
                    className={`relative z-10 h-5 w-5 transition-colors ${
                      isActive ? "text-accent-fg" : "text-fg-faint"
                    }`}
                    strokeWidth={isActive ? 2.5 : 2}
                  />
                </Link>
              );
            })}
          </motion.div>
        </div>
      </nav>
    </LayoutGroup>
  );
}
