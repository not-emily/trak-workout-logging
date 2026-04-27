import type { ExercisePRs, RepBucket } from "@/lib/prs";
import { REP_BUCKETS } from "@/lib/prs";
import { formatDuration } from "@/lib/time";

type Props = { prs: ExercisePRs };

export function PRCardList({ prs }: Props) {
  if (prs.kind === "strength") return <StrengthPRCards prs={prs} />;
  if (prs.kind === "bodyweight") return <BodyweightPRCards prs={prs} />;
  return <CardioPRCards prs={prs} />;
}

function fmtDate(d: Date): string {
  return d.toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric" });
}

function Card({ label, value, sub }: { label: string; value: string; sub?: string }) {
  return (
    <div className="flex flex-col gap-0.5 rounded-xl bg-white p-3 ring-1 ring-gray-200">
      <span className="text-xs font-medium uppercase tracking-wide text-gray-500">{label}</span>
      <span className="text-lg font-semibold text-gray-900">{value}</span>
      {sub && <span className="text-xs text-gray-500">{sub}</span>}
    </div>
  );
}

function StrengthPRCards({ prs }: { prs: Extract<ExercisePRs, { kind: "strength" }> }) {
  const cards: { label: string; value: string; sub?: string }[] = [];
  if (prs.heaviestWeight) {
    cards.push({
      label: "Heaviest weight",
      value: `${prs.heaviestWeight.weightLb} lb × ${prs.heaviestWeight.reps}`,
      sub: fmtDate(prs.heaviestWeight.date),
    });
  }
  if (prs.bestEstimated1RM) {
    cards.push({
      label: "Est. 1RM",
      value: `${Math.round(prs.bestEstimated1RM.estimated)} lb`,
      sub: `${prs.bestEstimated1RM.weightLb} × ${prs.bestEstimated1RM.reps} on ${fmtDate(prs.bestEstimated1RM.date)}`,
    });
  }
  if (prs.highestVolumeSet) {
    cards.push({
      label: "Heaviest set volume",
      value: `${Math.round(prs.highestVolumeSet.volume).toLocaleString()} lb`,
      sub: `${prs.highestVolumeSet.weightLb} × ${prs.highestVolumeSet.reps} on ${fmtDate(prs.highestVolumeSet.date)}`,
    });
  }
  for (const bucket of REP_BUCKETS) {
    const entry = prs.bestByReps[bucket as RepBucket];
    if (!entry) continue;
    cards.push({
      label: `Best ${bucket}-rep`,
      value: `${entry.weightLb} lb`,
      sub: fmtDate(entry.date),
    });
  }
  return <Grid cards={cards} />;
}

function BodyweightPRCards({ prs }: { prs: Extract<ExercisePRs, { kind: "bodyweight" }> }) {
  const cards: { label: string; value: string; sub?: string }[] = [];
  if (prs.mostReps) {
    cards.push({ label: "Most reps", value: `${prs.mostReps.reps}`, sub: fmtDate(prs.mostReps.date) });
  }
  return <Grid cards={cards} />;
}

function CardioPRCards({ prs }: { prs: Extract<ExercisePRs, { kind: "cardio" }> }) {
  const cards: { label: string; value: string; sub?: string }[] = [];
  if (prs.longestDistance) {
    cards.push({
      label: "Longest distance",
      value: `${prs.longestDistance.distanceMeters.toLocaleString()} m`,
      sub: fmtDate(prs.longestDistance.date),
    });
  }
  if (prs.longestDuration) {
    cards.push({
      label: "Longest duration",
      value: formatDuration(prs.longestDuration.durationSeconds),
      sub: fmtDate(prs.longestDuration.date),
    });
  }
  if (prs.fastestPace) {
    const secPerKm = prs.fastestPace.secondsPerMeter * 1000;
    cards.push({
      label: "Fastest pace",
      value: `${formatDuration(Math.round(secPerKm))} / km`,
      sub: `${prs.fastestPace.distanceMeters.toLocaleString()} m in ${formatDuration(prs.fastestPace.durationSeconds)} on ${fmtDate(prs.fastestPace.date)}`,
    });
  }
  return <Grid cards={cards} />;
}

function Grid({ cards }: { cards: { label: string; value: string; sub?: string }[] }) {
  if (cards.length === 0) {
    return <p className="text-sm text-gray-500">No PRs yet — log a few sets to see records here.</p>;
  }
  return (
    <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
      {cards.map((c) => (
        <Card key={c.label} label={c.label} value={c.value} sub={c.sub} />
      ))}
    </div>
  );
}
