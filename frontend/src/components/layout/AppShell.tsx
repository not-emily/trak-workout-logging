import { Outlet } from "react-router";
import { BottomNav } from "./BottomNav";
import { OfflineBanner } from "./OfflineBanner";
import { UpdateBanner } from "./UpdateBanner";
import { ToastHost } from "@/components/ui/Toast";
import { useGoalAchievementDetection } from "@/features/goal/useGoalAchievementDetection";
import { useGoalStartValueBackfill } from "@/features/goal/useGoalStartValueBackfill";
import { useReconnectToast } from "@/features/sync/useReconnectToast";

export function AppShell() {
  // App-wide goal-achievement watcher — fires the celebration toast and
  // marks the goal achieved when its progress crosses the target.
  useGoalAchievementDetection();
  // Lazy-fill startValue on the first measurement after a goal was created
  // without any baseline data.
  useGoalStartValueBackfill();
  // Fires "X updates synced" toast after the queue drains following an
  // offline period.
  useReconnectToast();

  return (
    <div className="flex min-h-full flex-col pb-20">
      <UpdateBanner />
      <OfflineBanner />
      <ToastHost />
      <main className="flex-1">
        <Outlet />
      </main>
      <BottomNav />
    </div>
  );
}
