import { Trophy, Footprints, Flame, Dumbbell, Award } from "lucide-react";
import type { LucideIcon } from "lucide-react";
import type { ProgressSummary } from "@/features/progress/useProgressSummary";

type Props = { summary: ProgressSummary };

function fmtDate(d: Date): string {
  return d.toLocaleDateString(undefined, { month: "short", day: "numeric" });
}

export function ProgressStatCards({ summary }: Props) {
  const { heaviestSet, longestDistance, sessionsThisWeek, volumeThisWeek, prsThisMonth } = summary;
  const hasHero = heaviestSet || longestDistance;

  return (
    <div className="flex flex-col gap-3">
      {hasHero && (
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          {heaviestSet && (
            <HeroCard
              icon={Trophy}
              label="Heaviest set"
              value={`${heaviestSet.weightLb} lb × ${heaviestSet.reps}`}
              sub={`${heaviestSet.exerciseName} · ${fmtDate(heaviestSet.date)}`}
            />
          )}
          {longestDistance && (
            <HeroCard
              icon={Footprints}
              label="Longest distance"
              value={`${longestDistance.distanceMeters.toLocaleString()} m`}
              sub={`${longestDistance.exerciseName} · ${fmtDate(longestDistance.date)}`}
            />
          )}
        </div>
      )}

      <div className="grid grid-cols-3 gap-2">
        <SmallCard
          icon={Flame}
          label="Sessions"
          value={sessionsThisWeek.toString()}
          sub="this week"
        />
        <SmallCard
          icon={Dumbbell}
          label="Volume"
          value={volumeThisWeek > 0 ? `${Math.round(volumeThisWeek).toLocaleString()}` : "—"}
          sub={volumeThisWeek > 0 ? "lb · this week" : "this week"}
        />
        <SmallCard
          icon={Award}
          label="PRs"
          value={prsThisMonth.toString()}
          sub="this month"
        />
      </div>
    </div>
  );
}

function HeroCard({
  icon: Icon,
  label,
  value,
  sub,
}: {
  icon: LucideIcon;
  label: string;
  value: string;
  sub: string;
}) {
  return (
    <div className="flex flex-col items-center gap-1 rounded-xl bg-white p-4 text-center ring-1 ring-gray-200 sm:items-start sm:text-left">
      <div className="flex items-center gap-1.5 text-xs font-medium uppercase tracking-wide text-gray-500">
        <Icon className="h-3.5 w-3.5" />
        {label}
      </div>
      <div className="text-2xl font-semibold text-gray-900">{value}</div>
      <div className="truncate text-xs text-gray-500">{sub}</div>
    </div>
  );
}

function SmallCard({
  icon: Icon,
  label,
  value,
  sub,
}: {
  icon: LucideIcon;
  label: string;
  value: string;
  sub: string;
}) {
  return (
    <div className="flex flex-col items-center gap-0.5 rounded-xl bg-white p-3 text-center ring-1 ring-gray-200 sm:items-start sm:text-left">
      <div className="flex items-center gap-1 text-[10px] font-medium uppercase tracking-wide text-gray-500">
        <Icon className="h-3 w-3" />
        {label}
      </div>
      <div className="text-xl font-semibold text-gray-900">{value}</div>
      <div className="text-[10px] text-gray-500">{sub}</div>
    </div>
  );
}
