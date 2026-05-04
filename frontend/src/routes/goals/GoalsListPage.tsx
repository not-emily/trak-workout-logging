import { Link } from "react-router";
import { Plus, Target } from "lucide-react";
import { useGoals } from "@/features/goal/useGoals";
import { useGoalProgresses } from "@/features/goal/useGoalProgress";
import { GoalCard } from "@/components/goals/GoalCard";
import { SyncIndicator } from "@/components/layout/SyncIndicator";
import { EmptyState } from "@/components/ui/EmptyState";

export function GoalsListPage() {
  const goals = useGoals();
  const progresses = useGoalProgresses(goals);

  return (
    <div className="mx-auto flex max-w-3xl flex-col gap-4 px-4 pt-6 pb-8">
      <div className="flex items-center justify-between">
        <h1 className="font-display text-3xl leading-none text-fg">Goals</h1>
        <div className="flex items-center gap-2">
          <SyncIndicator />
          <Link
            to="/goals/new"
            className="flex items-center gap-1.5 rounded-full bg-accent px-4 py-2 text-sm font-semibold text-accent-fg transition-colors hover:bg-accent-hover"
          >
            <Plus className="h-4 w-4" strokeWidth={2.5} />
            New
          </Link>
        </div>
      </div>

      {goals.length === 0 ? (
        <EmptyState icon={Target}>
          Set a goal to track strength, body, or training-frequency targets over time.
        </EmptyState>
      ) : (
        <ul className="flex flex-col gap-2">
          {goals.map((g) => {
            const p = progresses.get(g.id);
            if (!p) return null;
            return (
              <li key={g.id}>
                <GoalCard goal={g} progress={p} />
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
