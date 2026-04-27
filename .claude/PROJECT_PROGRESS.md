# Project Progress - trak

## Plan Files
Roadmap: [plan.md](../docs/plan/plan.md)
Current Phase: [phase-5.md](../docs/plan/phases/phase-5.md)
Latest Weekly Report: [weekly-2026-W17.md](../docs/reports/weekly-2026-W17.md)

Last Updated: 2026-04-27
Latest Daily Report: [daily-2026-04-24.md](../docs/reports/daily-2026-04-24.md)

## Current Focus
Phases 3 and 4 are complete locally and pushed to `main`. **Next session: manual end-to-end testing of Phases 3 and 4 before starting Phase 5.** Walk through the full flow on the deployed app: signup, exercise library, log a session, log retroactive, build a routine, start session from routine, offline behavior, sync indicator. Find and fix any rough edges before adding more surface area.

## Active Tasks
- [NEXT] Deploy Phases 3+4 together via `./scripts/deploy-backend.sh`
- [NEXT] **Manual testing of Phase 3 (sessions/sync) and Phase 4 (routines)** — walk through:
  - Sign up + log in
  - Browse exercise library, add a custom exercise
  - "+" → Start empty session → add exercises → log sets (strength + cardio) → checkmark to complete → rest timer → finish
  - Edit a past session, delete a session
  - "+" → Log past workout (retroactive)
  - Create a routine, drag-reorder exercises, edit planned values
  - "+" → Start from routine → confirm session is pre-filled, edits don't affect template
  - Toggle airplane mode mid-session — verify localStorage works, sync banner shows offline, reconnect drains queue
- [LATER] Phase 5: Progress & PRs — [phase-5.md](../docs/plan/phases/phase-5.md)
  - ⏭ Hand-rolled SVG `LineChart` (~150 LOC) with tooltip
  - ⏭ `lib/prs.ts`: estimated 1RM (Epley), best-by-reps, highest-volume helpers
  - ⏭ `useExerciseHistory`, `usePRs` derived hooks
  - ⏭ ProgressPage (exercise picker) → ExerciseProgressPage (chart + PRs)
  - ⏭ "New PR!" toast during active session

## Open Questions/Blockers
None

## Completed This Week
None yet

## Next Session
Deploy Phases 3+4 to Mac, then **manually test the full flow** end-to-end (see Active Tasks). Don't start Phase 5 until Emily has walked through the app and signed off on the existing surface area. Capture any bugs / UX rough edges as new tasks before moving forward.
