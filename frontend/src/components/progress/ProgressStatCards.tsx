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
    <div className="relative overflow-hidden rounded-xl border border-gold/25 bg-surface-1 p-4">
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 opacity-50"
        style={{
          background:
            "radial-gradient(ellipse 70% 100% at 0% 0%, var(--color-gold-soft), transparent 60%)",
        }}
      />
      <div className="relative flex flex-col items-center gap-1.5 text-center sm:items-start sm:text-left">
        <div className="flex items-center gap-1.5 text-[10px] font-semibold uppercase tracking-[0.18em] text-gold">
          <Icon className="h-3 w-3" strokeWidth={2.5} />
          {label}
        </div>
        <div className="font-display text-2xl leading-none text-fg tabular">{value}</div>
        <div className="truncate text-[11px] text-fg-muted">{sub}</div>
      </div>
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
    <div className="flex flex-col items-center gap-0.5 rounded-xl border border-line bg-surface-1 p-3 text-center sm:items-start sm:text-left">
      <div className="flex items-center gap-1 text-[10px] font-semibold uppercase tracking-[0.14em] text-fg-subtle">
        <Icon className="h-3 w-3" strokeWidth={2.5} />
        {label}
      </div>
      <div className="font-display text-xl leading-none text-fg-soft tabular">{value}</div>
      <div className="text-[10px] text-fg-faint">{sub}</div>
    </div>
  );
}
