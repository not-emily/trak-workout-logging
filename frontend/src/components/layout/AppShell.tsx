import { Outlet } from "react-router";
import { BottomNav } from "./BottomNav";
import { SyncIndicator } from "./SyncIndicator";
import { ToastHost } from "@/components/ui/Toast";

export function AppShell() {
  return (
    <div className="flex min-h-full flex-col pb-20">
      <SyncIndicator />
      <ToastHost />
      <main className="flex-1">
        <Outlet />
      </main>
      <BottomNav />
    </div>
  );
}
