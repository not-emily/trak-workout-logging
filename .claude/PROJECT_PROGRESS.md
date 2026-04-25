# Project Progress - trak

## Plan Files
Roadmap: [plan.md](../docs/plan/plan.md)
Current Phase: [phase-4.md](../docs/plan/phases/phase-4.md)
Latest Weekly Report: None

Last Updated: 2026-04-24

## Current Focus
Phase 3 (Sync Layer + Session Logging) is complete locally — the MVP. Local-first sync layer (localStore + queue + syncWorker), full session models/controllers/policies/tests on backend, active session UI with rest timer, session history with summary cards, retroactive logging, sync indicator. Ready to deploy and start Phase 4 (Routines).

## Active Tasks
- [NEXT] Deploy Phase 3 to Mac via `./scripts/deploy-backend.sh`
- [NEXT] Phase 4: Routines — [phase-4.md](../docs/plan/phases/phase-4.md)
  - ⏭ Routine + RoutineExercise models + policies + controllers + tests
  - ⏭ Frontend: routine list, builder (drag-reorder via @dnd-kit), planned-sets editor
  - ⏭ "Start from routine" flow that materializes a session pre-filled with planned sets
  - ⏭ ActionMenu surfaces user routines above empty/log-past

## Open Questions/Blockers
None

## Completed This Week
- **Phase 1: Foundation** — deployed at https://trak.1bit2bit.dev
- **Phase 2: Exercise Library** — 79 seeded exercises, custom exercises, search/filter UI
- **Phase 3: Sync Layer + Session Logging** (MVP)
  - Backend: Session, SessionExercise, WorkoutSet (renamed to avoid Ruby's `Set` class clash) with UUID PKs, RPE check constraint, cascading destroy
  - Backend policies + Scope (own?), 3 controllers using upsert-by-UUID with parent ownership checks, nested SessionSerializer for show. 23 new controller tests; 53 total green
  - Frontend sync layer: `localStore` (stable array refs cached + invalidated on mutation), `queue` (append-only, FIFO drain, retryable/failed states), `syncWorker` (one-at-a-time drain, exponential backoff [1s/5s/30s/2m/10m], 401 → pause + re-auth), `schema` (cache invalidation on version bump), `useOnlineStatus` / `useSyncStatus` hooks, `SyncIndicator` banner (offline / syncing / sync-issues states)
  - useExercises refactored to flow through localStore — exercises usable offline, including in the AddExerciseSheet during a live session
  - Session feature: types, sessionActions (start, finish, delete, addExercise, removeExercise, addSet, completeSet, updateSet, removeSet, hydrate), useSession (assembled view of session + nested), useSessions, useActiveSession, useRestTimer
  - Active session UI: ActiveSessionPage with editable name and live elapsed-time header, SessionExerciseBlock, SetRow with weight/reps/duration/distance inputs (dispatched by exercise.kind) + checkmark + delete, RestTimerBar (auto-starts on set check, ±15s adjust), AddExerciseSheet bottom-sheet picker
  - Session history: SessionsListPage with reverse-chrono SessionCards summarizing date/duration/exercise count/set count/volume; in-progress badge for active sessions
  - Delete session from ActiveSessionPage (active or finished)
  - ActionMenuSheet wired to "+" satellite: "Start empty session" creates + navigates; "Log past workout" routes to RetroactiveSessionPage (date/time picker, optional name)

## Next Session
Deploy Phase 3 to Mac. Then start Phase 4.1: backend Routine + RoutineExercise models + policies + controllers + tests, mirroring the Phase 3 pattern but with planned values per exercise.
