# Project Progress - trak

## Plan Files
Roadmap: [plan.md](../docs/plan/plan.md)
Current Phase: [phase-2.md](../docs/plan/phases/phase-2.md)
Latest Weekly Report: None

Last Updated: 2026-04-24

## Current Focus
Phase 1 (Foundation) is complete and deployed. trak is live at https://trak.1bit2bit.dev (frontend) and https://trak-api.1bit2bit.dev (backend). Starting Phase 2 (Exercise Library): seeded system exercises + per-user custom exercises.

## Active Tasks
- [NEXT] Phase 2: Exercise Library — [phase-2.md](../docs/plan/phases/phase-2.md)
  - ⏭ Exercise model + migration (kind enum, muscle_groups array, is_system, owner_user_id, seed_slug)
  - ⏭ Curate ~80-100 exercises from yuhonas/free-exercise-db into lib/exercises_seed_data.json
  - ⏭ Idempotent db/seeds.rb (upsert by seed_slug)
  - ⏭ ExercisePolicy with Scope (system + owned visible)
  - ⏭ Api::V1::ExercisesController + ExerciseSerializer
  - ⏭ Frontend: browser (search + muscle-group + kind filters), custom-exercise add/edit

## Open Questions/Blockers
None

## Completed This Week
- **Phase 1: Foundation** — all 5 sub-phases, end-to-end deployed
  - 1.1 Backend scaffold: Rails 8.1 API, Postgres (docker for dev, system for prod), UUID PKs via core `gen_random_uuid()`, User model with `has_secure_password`, port 3002
  - 1.2 Backend auth + policies: JWT (30-day, silent refresh via X-Refreshed-Token), Authenticatable/Syncable concerns, PolicyResult module, ApplicationController with POLICY_CLASSES registry + authorize! + policy_scope + 404-for-:not_visible mapping, Api::V1::AuthController (signup/login/me). 15/15 auth tests passing.
  - 1.3 Frontend scaffold + auth: Vite 8 + React 19 + TS + Tailwind 4, react-router v7, framer-motion, lucide-react. sync/apiClient with JWT + X-Refreshed-Token + snake↔camel, useAuth hook via useSyncExternalStore, login/signup screens, ProtectedRoute, Vite proxy.
  - 1.4 Nav shell: BottomNav pill with 4 tabs (Sessions/Routines/Progress/Body) + "+" satellite, framer-motion `layoutId` morph matching garnish, AppShell wrapper with placeholder pages.
  - 1.5 Deploy: Cloudflare Pages (frontend), Cloudflare Tunnel on Mac routing trak-api.1bit2bit.dev → 127.0.0.1:3002, launchd plist keeping puma alive, production config via plist env vars. `scripts/deploy-backend.sh` mirrors garnish's pattern.

## Next Session
Start Phase 2.1: create the `exercises` migration + model with the full schema (kind, muscle_groups[], instructions, equipment, level, seed_slug, is_system, owner_user_id). Register Exercise in POLICY_CLASSES when the policy is written.
