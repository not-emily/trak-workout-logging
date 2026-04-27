# Project Progress - trak

## Plan Files
Roadmap: [plan.md](../docs/plan/plan.md)
Current Phase: [phase-6.md](../docs/plan/phases/phase-6.md)
Latest Weekly Report: [weekly-2026-W17.md](../docs/reports/weekly-2026-W17.md)

Last Updated: 2026-04-27
Latest Daily Report: [daily-2026-04-24.md](../docs/reports/daily-2026-04-24.md)

## Current Focus
**Phase 5 (Progress & PRs) shipped.** Pure-client PR math, hand-rolled SVG `LineChart` (~210 LOC for the chart family), per-exercise progress page with metric tabs, live "New PR!" toasts during active sessions (sequential stack with swipe-up-to-dismiss-all), and motivational stat cards on the Progress page. Ready for Phase 6 — Body measurements + Goals.

## Active Tasks
- [NEXT] Phase 6: Body & Goals — [phase-6.md](../docs/plan/phases/phase-6.md)
  - ⏭ Backend: `BodyMeasurement` + `Goal` models, policies, controllers, migrations, serializers
  - ⏭ Frontend: types + actions + hooks for both resources
  - ⏭ Body route: daily measurement entry + per-metric history chart (reuses `LineChart`)
  - ⏭ Goals route: create / view progress / auto-mark achieved when data crosses target
  - ⏭ Goal kinds: lift (target weight × reps for an exercise), body (target metric value), frequency (sessions per week)
- [LATER] Heavy retheme — colors / font / vibe. Marginally better to do now (before Phase 6–7 visual surfaces lock in) but not urgent
- [LATER] Re-deploy backend (`./scripts/deploy-backend.sh`) — Phases 5+6 together when 6 lands

## Open Questions/Blockers
None

## Completed This Week
- [2026-04-27] **Phase 3+4 polish pass — UX-focused day**
  - **Layout / nav** matched to garnish:
    - Per-page max-width wrappers (`max-w-5xl` lists, `max-w-3xl` detail, `max-w-2xl` forms, `max-w-sm` auth)
    - Bottom nav: `h-11/w-11` tap targets, `py-3`, `pb-[calc(env(safe-area-inset-bottom)+0.5rem)]`, `pointer-events-none/auto` for click-through outside the pill
    - Removed the global FAB; added a contextual "+ New" header button on `SessionsListPage` that opens the same `ActionMenuSheet`
    - Pinch-to-zoom disabled via viewport meta
  - **New shared components in `components/ui/`:**
    - `BottomSheet` — `z-[60]`, safe-area + 1rem bottom padding. Used by `ActionMenuSheet` + `AddExerciseSheet` (fixed both being hidden behind nav)
    - `ConfirmDialog` — garnish-style at `z-[70]`, `variant: "danger"`. Replaced all 5 `confirm()` calls (finish/delete session, remove session exercise, delete routine, remove routine exercise, delete custom exercise)
    - `Swipeable` — generic horizontal swipe wrapper (right + left actions, ports the y-pin trick from garnish's `SwipeableGroceryItem`)
    - `MeatballMenu` — `…` button with click-outside dismissal, danger variant
    - `EmptyState` — dashed-border card with icon (Sessions, Routines, Exercises empty states)
  - **Set row rebuild** (`SetRow`):
    - "SET 1" stacked label
    - Read mode displays formatted text ("**135** lb × **8** reps", "**12** reps", "**30**s · **200** m") with `—` placeholders for empty values
    - Tap row → edit mode (black ring), explicit "Done" button + blur/Enter/tap-outside commits + collapses
    - Swipe-right to check (only on populated, uncompleted sets), swipe-left to delete; disabled in edit mode
    - Always pre-fill from previous set (removed the "must check first" rule)
  - **Routine planned sets** (`PlannedSetsEditor`): same read/edit pattern — "**3 sets** × **8** reps @ **135** lb" with pencil affordance, expands to existing 4-column form on tap
  - **Retroactive sessions** fixed:
    - `RetroactiveSessionPage` creates with `endedAt = startedAt` so the 144-hour timer bug is gone; navigates with `state: { startInEdit: true }`
    - `addSet` bug: `completedAt: null` was hardcoded; now respects `defaults.completedAt` so sets added to finished sessions auto-complete
    - Header on a finished session shows date + duration (if > 0) + "finished" instead of running elapsed
    - Tap-to-edit datetime fields (`Started` / `Ended`) in the header so duration is editable; `datetime-local` inputs with `isoToLocalInput` / `localInputToIso` helpers
  - **Read-only finished sessions** (UI-only `isEditing` flag, no schema change):
    - Live sessions: always editing
    - Finished sessions: read-only by default; **Edit** (pencil, gray) toggles to editing, **Done** toggles back. Doesn't touch `endedAt`
    - Fresh retroactive sessions land in editing mode via `state: { startInEdit: true }`
    - `readOnly` prop propagated to `SessionExerciseBlock` + `SetRow` — disables tap-to-edit, swipe, check button, Add Set, Add Exercise, Remove Exercise X
  - **Routine detail page** rebuild: header has `Start` (Play icon, primary CTA, disabled when no exercises) + meatball menu with Delete; bottom Start CTA removed; drag-reorder fixed in mobile emulation via `touch-action: none` on the grip handle
  - **Inline name/description edit** layout fix: input now `w-full` inside `min-w-0 flex-1` column; action buttons hidden while editing so the input gets the row to itself
  - **Routine create form** stacks on mobile (input full-width row 1, Cancel + Create row 2) with `min-w-0` to prevent overflow
  - **Back-to-sessions link** on `ActiveSessionPage` matching `RoutineDetailPage`'s pattern
  - All changes type-check clean (`tsc -b`); no dependencies added
- [2026-04-27] **Phase 5: Progress & PRs**
  - **`lib/prs.ts`** — pure PR math, all client-side. Epley 1RM, `findPRs(sets, kind)` returning a discriminated union (strength / bodyweight / cardio). `detectBrokenPRs(candidate, prior)` for live comparison
    - Strength PRs: heaviest weight, best-by-reps (1/3/5/8/10), best estimated-1RM, heaviest single-set volume
    - Cardio: longest distance, longest duration, fastest pace (sec/m)
    - Bodyweight: most reps in a single set
  - **Data hooks** (`features/progress/`)
    - `useExerciseHistory` — joins sets + session_exercises + sessions to produce `(set, date)` pairs sorted by session date
    - `useExerciseCompletedSets` — same data, projected into `CompletedSet` for the math layer
    - `useLoggedExerciseIds` — distinct exercises that have any completed set (powers the picker)
    - `usePRs(exerciseId, kind)` — derived PRs via `findPRs`
    - `seriesForMetric(history, metric)` — aggregates session-level data points (max for weight/reps/pace, sum for volume/distance/duration)
  - **Chart family** in `components/charts/` — total ~210 LOC
    - `LineChart` — viewBox-based responsive SVG, padded y-domain, polyline + dots, fixed 5-tick y-axis, evenly-spaced x-axis ticks ending on the last point
    - `ChartAxis` — gridlines + tick labels
    - `ChartTooltip` — pointer-tracking overlay rect, nearest-by-x lookup, dashed indicator line, tooltip in `<foreignObject>` with edge clamping
  - **Progress UI**
    - `ProgressPage` (replaces Phase 1 placeholder) — stat cards on top + scrollable list of logged exercises
      - **Stat cards** (`ProgressStatCards`): hero row (heaviest set + longest distance, all-time, with exercise name and date) + activity row (Sessions / Volume this week, PRs this month). Center-aligned on mobile, left-aligned on `sm:` and up. Each card self-hides when there's no data
      - `useProgressSummary` — aggregates the above from localStore. Week = ISO week (Mon start). Month = calendar 1st-of-month
    - `ExerciseProgressPage` — back link, kind badge, `MetricTabs` (kind-aware: weight/volume/est-1RM for strength, reps for bodyweight, pace/distance/duration for cardio), `LineChart` of selected metric with kind-aware y-formatter, `PRCardList` below
    - `MetricTabs`, `PRCard` / `PRCardList` — per-kind PR cards
  - **Toast system** (`components/ui/Toast.tsx`)
    - Module-level store, `toast.show/dismiss/dismissAll`, mounted as `ToastHost` in `AppShell` at `z-[80]`
    - **Sequential queue with visible stack** — front card at full size/opacity, behind cards scaled to 95%/90% with reduced opacity and y-offset (peek out below front). 4s active timer drives the cascade — when front exits, next animates forward
    - **Swipe-up-to-dismiss-all** on the front card (drag past 60px → `dismissAll`); tap front to dismiss just that one
  - **Live PR detection** (`features/session/usePRDetection`) — wired into `ActiveSessionPage`
    - Only runs while session is live (`endedAt === null`)
    - Per-exercise history snapshot taken at first init (excludes the current session's sets); already-completed session sets marked seen so no toasts on remount
    - On each newly-completed set, runs `detectBrokenPRs` against the cached history and fires success toasts ("New PR · Bench press · 200 lb × 5 — beats 180 lb"); appends candidate to local history so subsequent sets in the same session must beat it too
    - `bestByReps` PRs **suppressed from toasts** (mathematically implied by higher-rep PRs) — still surface on the PR cards for granular data
    - Max 3 toasts per strength set (heaviest weight, est-1RM, heaviest volume), 1 for bodyweight, up to 3 for cardio
  - Route added: `/progress/:id` → `ExerciseProgressPage`. tsc clean. No backend changes (PRs are client-side). No new dependencies

## Next Session
Start **Phase 6 — Body & Goals** ([phase-6.md](../docs/plan/phases/phase-6.md)). Backend models + migrations first (`BodyMeasurement` flexible-metric + `Goal` polymorphic — lift / body / frequency), then frontend hooks, then Body and Goals pages. Body route reuses `LineChart` for per-metric history. Goals auto-detect achievement from logged data.
