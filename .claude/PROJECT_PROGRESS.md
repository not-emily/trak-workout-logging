# Project Progress - trak

## Plan Files
Roadmap: [plan.md](../docs/plan/plan.md)
Current Phase: [phase-5.md](../docs/plan/phases/phase-5.md)
Latest Weekly Report: None

Last Updated: 2026-04-24

## Current Focus
Phase 4 (Routines) is complete locally. Routine builder with drag-reorder via @dnd-kit, planned-sets editor per exercise (kind-aware), Start-from-routine flow that materializes a session pre-filled with planned sets, ActionMenu shows user's saved routines. Ready to deploy and start Phase 5 (Progress & PRs).

## Active Tasks
- [NEXT] Deploy Phases 3+4 together via `./scripts/deploy-backend.sh`
- [NEXT] Phase 5: Progress & PRs — [phase-5.md](../docs/plan/phases/phase-5.md)
  - ⏭ Hand-rolled SVG `LineChart` (~150 LOC) with tooltip
  - ⏭ `lib/prs.ts`: estimated 1RM (Epley), best-by-reps, highest-volume helpers
  - ⏭ `useExerciseHistory`, `usePRs` derived hooks
  - ⏭ ProgressPage (exercise picker) → ExerciseProgressPage (chart + PRs)
  - ⏭ "New PR!" toast during active session

## Open Questions/Blockers
None

## Completed This Week
- **Phase 1: Foundation** — deployed at https://trak.1bit2bit.dev
- **Phase 2: Exercise Library** — 79 seeded exercises + custom exercises
- **Phase 3: Sync Layer + Session Logging** (MVP)
- **Phase 4: Routines**
  - Backend: Routine + RoutineExercise models with cascade destroy. RoutinePolicy + Scope (own?), RoutineExercisePolicy delegating ownership through routine. Controllers using upsert-by-UUID with parent ownership checks. RoutineSerializer with nested routine_exercises on show. 17 new tests; 70 total backend tests passing
  - Registered Routine + RoutineExercise in POLICY_CLASSES / POLICY_SCOPE_CLASSES
  - Frontend types, routineActions (create/update/delete routine, addRoutineExercise, updateRoutineExercise, removeRoutineExercise, reorderRoutineExercises, startSessionFromRoutine, hydrateRoutines/Routine), useRoutines / useRoutine hooks
  - RoutinesListPage with inline create form. RoutineDetailPage with editable name + description, drag-sortable RoutineExerciseBlocks (via @dnd-kit pointer + touch sensors), PlannedSetsEditor (kind-aware fields), AddExerciseSheet reused from sessions
  - Start session from routine: materializes session + session_exercises + N pre-filled (uncompleted) sets per planned_sets count, navigates to ActiveSessionPage. Routine template stays untouched
  - ActionMenuSheet now lists user routines above empty/log-past
  - @dnd-kit/core + @dnd-kit/sortable + @dnd-kit/utilities added; the only library that justified its weight (touch DnD + reorder is genuinely complex)

## Next Session
Deploy Phases 3+4 to Mac. Then start Phase 5.1: build the hand-rolled SVG LineChart and prs.ts helpers, then wire into ProgressPage.
