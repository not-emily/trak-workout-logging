# Project Progress - trak

## Plan Files
Roadmap: [plan.md](../docs/plan/plan.md)
Current Phase: [phase-7.md](../docs/plan/phases/phase-7.md)
Latest Weekly Report: [weekly-2026-W17.md](../docs/reports/weekly-2026-W17.md)

Last Updated: 2026-04-29
Latest Daily Report: [daily-2026-04-27.md](../docs/reports/daily-2026-04-27.md)

## Current Focus
**Phase 6 (Body & Goals) shipped — bugs fixed, polish applied, GoalDetailPage added.** Ready to commit + deploy backend (one new migration: `start_value`). Phase 7 (PWA Polish) is the final v1 phase.

## Active Tasks
- [NEXT] Phase 7: PWA Polish — [phase-7.md](../docs/plan/phases/phase-7.md)
  - ⏭ Hand-written service worker (`public/sw.js` — no Workbox / no plugin)
  - ⏭ Properly sized `manifest.webmanifest` icons
  - ⏭ Install guidance (iOS Add-to-Home-Screen + Android)
  - ⏭ Offline banner + sync-issues inbox + reconnect toast
  - ⏭ End-to-end testing on real iPhone + Android
- [LATER] Heavy retheme — colors / font / vibe. Could weave in during Phase 7 polish or wait until v1 ships
- [LATER] Set `NPM_VERSION=11` env var on CF Pages project (one-time, prevents lockfile-format drift on future deploys)

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
- [2026-04-27] **Deploy-pipeline fixes** — Cloudflare Pages was failing to build trak with "Missing: @emnapi/core from lock file" because CF Pages bundles `npm@10.9.2` (regardless of Node version) and trak's local lockfile was written by `npm@11`, which omits the `node_modules/@emnapi/{core,runtime}` entries that npm 10's strict `npm ci` requires. Triggered specifically because Vite 8 / Rolldown pulls in `@napi-rs/wasm-runtime` (with platform-conditional optionalDeps) — garnish doesn't hit this since it's still on Vite ≤6 / Rollup
  - Added `frontend/.nvmrc` pinning Node 24 (commit `bb1737e`) — got CF Pages onto Node 24 but didn't change npm (CF bundles npm separately)
  - Regenerated `package-lock.json` against `npm@10.9.2` via `npx -y npm@10.9.2 install` (commit `cc30265`) — now lockfile has the entries CF expects; `tsc -b` and `vite build` both pass locally
  - Long-term: set `NPM_VERSION=11` env var on the CF Pages project so trak permanently uses npm 11 like local — prevents drift on next install
  - Phases 3+4 polish, Phase 5, and the lockfile fix are all live at https://trak.1bit2bit.dev (frontend auto-deployed via CF Pages). Backend deploy still pending — no Phase 5 schema changes, so it's optional until Phase 6 ships
- [2026-04-29] **Phase 6: Body & Goals — initial build**
  - **Backend:** `BodyMeasurement` + `Goal` migrations, models, policies (with Scope), controllers, serializers; 17 new tests; `POLICY_CLASSES` registry updated; routes added
  - **Frontend types:** `bodyMeasurement.ts` (allowed metrics + default unit + label formatter), `goal.ts`
  - **Hooks:** `useBodyMeasurements` / `useLatestPerMetric` / `useMeasurementsForMetric`, `useGoals` / `useGoal`, `useGoalProgress` / `useGoalProgresses`
  - **Components:** `body/MetricCard`, `body/LogMeasurementSheet`, `goals/GoalCard` (with progress bar), `goals/GoalTypePicker`
  - **Pages:** `BodyPage` (replaces Phase 1 placeholder, hero "Current weight" card + metric grid + log button), `MetricDetailPage` (chart + swipe-to-delete history), `GoalsListPage`, `GoalFormPage`
  - **Goal achievement detection:** `useGoalAchievementDetection` mounted in `AppShell` — watches all goals app-wide, fires celebration toast and persists `achievedAt` when progress crosses target
  - **Routes added:** `/body/:metric`, `/goals`, `/goals/new`, `/goals/:id/edit`. Nav adds 5th tab (Target icon)
  - tsc clean; 87/87 backend tests passing; backend smoke-test confirms `/api/v1/body_measurements` and `/api/v1/goals` route correctly
- [2026-04-29] **Phase 6: bug fixes + UX polish from manual testing**
  - **Decrease-goal progress math fixed.** Old code did `target / current` which is mathematically meaningless (target=140 / current=150 = 93%, regardless of where you started). Added `start_value` decimal column to `goals` (migration `20260429000001_add_start_value_to_goals.rb`). `upsertGoal` snapshots at creation: latest body_measurement for body goals, best est-1RM for lift goals, null for frequency. New `useGoalStartValueBackfill` hook (mounted in AppShell) lazy-fills startValue when a goal was created before any data existed. Math now: increase = `(current − start) / (target − start)`, decrease = `(start − current) / (start − target)`, both clamped 0–100. Falls back to old behavior when no baseline exists.
  - **Frequency goals now count finished sessions, not started.** `frequencyProgress` filters on `endedAt !== null` and uses `endedAt` for the rolling 7-day cutoff. "Sessions per week" is honest now — a session you bailed out of doesn't tick the goal.
  - **Achievement state re-arms on edit.** `upsertGoal` clears `achievedAt` if any of `targetType` / `targetValue` / `direction` / `exerciseId` / `metric` change (renames preserve achievement). Detector re-runs the next render — if the new definition still satisfies the condition, it instantly re-marks. Otherwise the badge disappears until the user re-hits the new target. Required adding `seenAchievedRef.delete(g.id)` in the detector for goals where `achievedAt` becomes null.
  - **`AddExerciseSheet` → `ExercisePicker` (reusable).** Moved to `components/exercises/`, added optional `title` and `emptyMessage` props. Replaced the `<select>` in `GoalFormPage` with the searchable bottom sheet — consistent with sessions and routines, scales to long exercise lists. Updated 3 callers.
  - **"Est. 1RM" label on lift goal cards.** `GoalCard`'s ProgressBar now takes a `currentLabel` prop; lift goals show `Est. 1RM 64 / 130 lb` so the displayed number isn't ambiguous.
  - **`GoalDetailPage` at `/goals/:id`.** Goal cards now route to detail (not edit form). Detail page: back link, name + Achieved badge + pencil-to-edit button, hero with current/target/start/% progress bar, kind-aware chart — lift = best e1RM per session over time (reuses `LineChart`), body = metric over time (reuses `LineChart`), frequency = bar list of last 8 weeks of finished-session counts. Edit pencil → `/goals/:id/edit` (existing form). Updated `App.tsx` routes accordingly.
  - **Tests:** Added 2 new backend controller tests (`start_value` persistence + null default). 89/89 backend pass; frontend `tsc -b` clean.
  - **Pending:** commit + push, run `./scripts/deploy-backend.sh` to apply migration in prod.

## Next Session
Start **Phase 7 — PWA Polish**: hand-written service worker (no Workbox/plugin), `manifest.webmanifest` with full icon set, install guidance for iOS+Android, offline banner, sync-issues inbox, reconnect toast, real-device testing. After Phase 7, v1 is done.
