# Phase 5: Progress & PRs

> **Depends on:** [Phase 3](phase-3.md)
> **Enables:** [Phase 6 (reuses LineChart)](phase-6.md)
>
> See: [Full Plan](../plan.md)

## Goal

Let users see their progress over time via hand-rolled SVG charts, and surface personal records (PRs) per exercise. A "New PR!" toast fires during an active session when a set beats history.

## Key Deliverables

- `components/charts/LineChart.tsx` — Hand-rolled SVG line chart, ~150 LOC
- `lib/prs.ts` — Pure functions to compute PRs and estimated 1RM
- Progress route: pick an exercise → see chart of weight/volume/estimated-1RM over time
- PR list per exercise: heaviest weight, best Nx (1RM, 3RM, 5RM), highest volume session
- Live "New PR!" toast during an active session when a completed set beats history

## Files to Create

**Frontend:**
- `frontend/src/components/charts/LineChart.tsx` — Core chart component
- `frontend/src/components/charts/ChartAxis.tsx` — Tick labels and gridlines (internal)
- `frontend/src/components/charts/ChartTooltip.tsx` — Nearest-point tooltip
- `frontend/src/lib/prs.ts` — `calculateEstimated1RM(weight, reps)`, `findPRs(sets)`, etc.
- `frontend/src/features/progress/useExerciseHistory.ts` — Pulls all sets for an exercise from localStore
- `frontend/src/features/progress/usePRs.ts` — Derived PRs per exercise
- `frontend/src/routes/progress/ProgressPage.tsx` — Replace Phase 1 placeholder
- `frontend/src/routes/progress/ExerciseProgressPage.tsx` — Individual exercise detail
- `frontend/src/components/progress/ExercisePicker.tsx` — Select exercise to view
- `frontend/src/components/progress/PRCard.tsx`
- `frontend/src/components/progress/MetricTabs.tsx` — Toggle between weight / volume / est-1RM
- `frontend/src/features/session/usePRDetection.ts` — Hook used by ActiveSessionPage to fire "New PR!" toasts
- `frontend/src/components/ui/Toast.tsx` — If not already present

**Backend:** None new — PRs are computed client-side from already-synced data.

## Dependencies

**Internal:** Phase 3 (session/set history exists).

**External:** None — custom SVG chart, no library.

## Implementation Notes

### LineChart component

Contract:

```typescript
type DataPoint = { x: Date; y: number; label?: string };

type LineChartProps = {
  data: DataPoint[];
  width?: number;             // Defaults to 100% of container
  height?: number;            // Defaults to 200
  yLabel?: string;
  xFormatter?: (d: Date) => string;
  yFormatter?: (n: number) => string;
};
```

Implementation outline:
- Compute x domain from `min(data[].x)` to `max(data[].x)`
- Compute y domain with a small padding (±5%)
- Use `viewBox` on the outer `<svg>` for responsive sizing — no JS resize listeners needed
- Draw:
  - Horizontal gridlines + y-axis tick labels (4-5 ticks)
  - X-axis tick labels (every Nth point, spaced to fit)
  - Polyline connecting points (via SVG `<path>` with `M/L` commands)
  - Small `<circle>` at each data point
- Tooltip on hover (desktop) and tap (mobile):
  - Track pointer events on an overlay rect
  - Find nearest point by x-distance
  - Render a small absolute-positioned div near the nearest point
  - Vertical indicator line + highlight the point
- No zoom, no pan, no brush — out of scope.

Target: ≤200 LOC for the chart family (`LineChart` + `ChartAxis` + `ChartTooltip` combined).

### PR calculations

`lib/prs.ts` provides pure, unit-testable functions:

```typescript
// Epley formula
export function estimated1RM(weightLb: number, reps: number): number {
  if (reps < 1) return 0;
  if (reps === 1) return weightLb;
  return weightLb * (1 + reps / 30);
}

export type ExercisePRs = {
  heaviestWeight: { weightLb: number; reps: number; date: Date } | null;
  bestByReps: Record<number, { weightLb: number; date: Date }>;  // { 1: ..., 3: ..., 5: ..., 10: ... }
  bestEstimated1RM: { estimated: number; weightLb: number; reps: number; date: Date } | null;
  highestVolumeSet: { volume: number; weightLb: number; reps: number; date: Date } | null;
};

export function findPRs(sets: Set[]): ExercisePRs;
```

Exclude warmup sets from PR calculations.

For cardio exercises, PRs look different:
- Fastest pace (time/distance)
- Longest duration
- Longest distance

Handle via a branch in `findPRs` keyed on `exercise.kind`.

### Progress page UX

- `ProgressPage`: grid of exercises the user has logged against, each with a thumbnail chart and the user's best PR. Tap → `ExerciseProgressPage`.
- `ExerciseProgressPage`: picker at top (or drop-in replacement from the grid), tabs for metric (weight / volume / est-1RM / for cardio: pace / distance / duration), big `LineChart`, PRs list below.

### Live PR detection

`usePRDetection`:
- On each completed set, compare to cached PRs for that exercise
- If the new set beats a PR (max weight for any rep count, new best Nx, new 1RM estimate), show a toast: "New PR! 140 lb × 5 — beats 135 lb × 5"
- Updates cached PRs so repeated sets don't re-toast

Keep it lightweight — this is pure client-side math on data the user already has.

### Data volume

A user logging daily could accumulate ~1000-2000 sets per year. Rendering 500 points in an SVG line chart is fine. No virtualization needed.

## Validation

- [ ] Progress page lists exercises the user has logged
- [ ] Tap an exercise → chart renders; weight-over-time is visually correct
- [ ] Tooltip works on hover (desktop) and tap (mobile)
- [ ] Metric tabs switch between weight / volume / est-1RM without re-fetch
- [ ] PR cards show heaviest weight, best 1RM/3RM/5RM, highest volume set
- [ ] Logging a new PR in an active session fires the "New PR!" toast
- [ ] Warmup sets are excluded from PR calculations
- [ ] Cardio exercises show pace/distance/duration-appropriate PRs
- [ ] Chart renders with 500+ data points without noticeable lag
