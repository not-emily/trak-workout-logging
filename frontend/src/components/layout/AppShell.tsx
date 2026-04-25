import { useState } from "react";
import { Outlet } from "react-router";
import { BottomNav } from "./BottomNav";
import { SyncIndicator } from "./SyncIndicator";
import { ActionMenuSheet } from "./ActionMenuSheet";

export function AppShell() {
  const [menuOpen, setMenuOpen] = useState(false);

  return (
    <div className="flex min-h-full flex-col pb-20">
      <SyncIndicator />
      <main className="flex-1">
        <Outlet />
      </main>
      <BottomNav onActionPress={() => setMenuOpen(true)} />
      <ActionMenuSheet open={menuOpen} onClose={() => setMenuOpen(false)} />
    </div>
  );
}
