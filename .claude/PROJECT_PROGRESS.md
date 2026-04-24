# Project Progress - trak

## Plan Files
Roadmap: [plan.md](../docs/plan/plan.md)
Current Phase: [phase-3.md](../docs/plan/phases/phase-3.md)
Latest Weekly Report: None

Last Updated: 2026-04-24

## Current Focus
Phase 2 (Exercise Library) is complete locally. 79 curated system exercises seeded, per-user custom exercises supported end-to-end, browser UI with search/kind/muscle-group filters working. Ready to deploy and start Phase 3 (Sync Layer + Session Logging), the MVP-delivering phase.

## Active Tasks
- [NEXT] Deploy Phase 2 to Mac: `git pull` + `RAILS_ENV=production bin/rails db:migrate db:seed` + frontend auto-deploys via Cloudflare Pages
- [NEXT] Phase 3: Sync Layer + Session Logging — [phase-3.md](../docs/plan/phases/phase-3.md)
  - ⏭ 3.1 Sync layer infrastructure (localStore, queue, syncWorker, online/offline, 401 handling)
  - ⏭ 3.2 Backend models/controllers: sessions, session_exercises, sets (with Syncable upserts)
  - ⏭ 3.3 Active session UI (start empty, add exercise, log sets, rest timer, finish)
  - ⏭ 3.4 History + retroactive (session list, detail, edit, backdated logging)

## Open Questions/Blockers
None

## Completed This Week
- **Phase 1: Foundation** — deployed end-to-end at https://trak.1bit2bit.dev
- **Phase 2: Exercise Library**
  - Exercise model: UUID PK, kind enum (strength/cardio/bodyweight), muscle_groups text[], instructions, equipment, level, seed_slug (unique where not null), is_system, owner_user_id, DB check constraints enforcing the ownership invariant (system XOR custom)
  - Seed data: curated 79 exercises from yuhonas/free-exercise-db via `scripts/curate_exercises.rb` (reproducible). Vendored as `backend/lib/exercises_seed_data.json`. Kinds: 55 strength, 15 bodyweight, 9 cardio
  - Idempotent `db/seeds.rb` upserts by seed_slug — safe to run every deploy
  - ExercisePolicy + Scope: system exercises visible to all, custom only to owner, system exercises read-only (`:system_exercise_readonly` reason), unowned records return 404 via `:not_visible`
  - Api::V1::ExercisesController: index (policy_scope + optional kind/muscle_group filters), update (PUT upsert forcing is_system=false + owner=current_user, even if client sends otherwise), destroy (policy-guarded). 15/15 controller tests passing; 30 total tests green
  - Frontend types, useExercises/upsertExercise/deleteExercise hooks, ExerciseListPage (search + kind filter + muscle-group filter + New button), ExerciseDetailPage (with Edit/Delete for owned), ExerciseFormPage, ExerciseCard, KindFilter, MuscleGroupFilter, shared ExerciseForm component. Wired into router. Temporary links on Sessions/Routines placeholder pages for discoverability until Phase 3/4

## Next Session
Deploy Phase 2 to farley_station (pull + migrate + seed). Then start Phase 3.1: build the sync layer (`sync/localStore.ts`, `sync/queue.ts`, `sync/syncWorker.ts`). This is the biggest phase of the project and delivers the MVP (usable workout tracker, works offline).
