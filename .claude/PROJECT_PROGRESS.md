# Project Progress - trak

## Plan Files
Roadmap: [plan.md](../docs/plan/plan.md)
Current Phase: [phase-5.md](../docs/plan/phases/phase-5.md)
Latest Weekly Report: [weekly-2026-W17.md](../docs/reports/weekly-2026-W17.md)

Last Updated: 2026-04-27
Latest Daily Report: [daily-2026-04-24.md](../docs/reports/daily-2026-04-24.md)

## Current Focus
**Phase 3+4 polish pass complete.** Spent the day walking through the app, surfacing UX rough edges, and tightening them. App now feels production-quality across desktop and mobile: max-width layout matching garnish, contextual "+ New" header buttons (no more global FAB), reusable `BottomSheet` / `ConfirmDialog` / `Swipeable` / `MeatballMenu` components, set rows with read/edit modes + swipe-to-check / swipe-to-delete, retroactive sessions properly handled, finished sessions are read-only with explicit Edit toggle. Ready to start Phase 5 next.

## Active Tasks
- [NEXT] Phase 5: Progress & PRs — [phase-5.md](../docs/plan/phases/phase-5.md)
  - ⏭ Hand-rolled SVG `LineChart` (~150 LOC) with tooltip
  - ⏭ `lib/prs.ts`: estimated 1RM (Epley), best-by-reps, highest-volume helpers
  - ⏭ `useExerciseHistory`, `usePRs` derived hooks
  - ⏭ ProgressPage (exercise picker) → ExerciseProgressPage (chart + PRs)
  - ⏭ "New PR!" toast during active session
- [LATER] Heavy retheme — colors / font / vibe. Marginally better to do now (before Phase 5–7 visual surfaces lock in) but not urgent
- [LATER] Re-deploy backend (`./scripts/deploy-backend.sh`) once Phase 5 lands

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

## Next Session
Start **Phase 5 — Progress & PRs** ([phase-5.md](../docs/plan/phases/phase-5.md)). Hand-rolled SVG `LineChart` first, then `lib/prs.ts` (Epley 1RM, best-by-reps, volume), then ProgressPage / ExerciseProgressPage, then "New PR!" toast. Probably a smaller phase since the data is already there. Retheme can wait until after, or weave in if a clear vision lands.
