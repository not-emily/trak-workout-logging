# Weekly Report - trak - Week of 2026-04-20

## Week Overview
The week the entire MVP got built. trak went from an empty directory on Wednesday to a fully functional offline-capable workout tracker deployed at `trak.1bit2bit.dev` by Friday — Phases 1 through 4 all shipped in a single build day (2026-04-24), with infrastructure, exercise library, session logging + sync, and routines all live. ~10,000 lines added across 9 commits, 70 backend tests passing.

## Key Accomplishments

### Foundation & Infrastructure (Phase 1)
- Rails 8 API scaffolded with UUID primary keys via core `gen_random_uuid()` (no `pgcrypto` dependency)
- JWT auth with 30-day expiry and silent refresh via `X-Refreshed-Token` header
- Custom policy pattern: `PolicyResult` + `Authenticatable`/`Syncable` concerns + explicit `POLICY_CLASSES` registry on `ApplicationController` (no `.constantize`)
- Vite + React 19 + TypeScript + Tailwind 4 frontend with `useAuth`, `apiClient` (snake↔camel + token refresh), pill `BottomNav` with framer-motion `layoutId` morph
- Deployed to production: Cloudflare Pages for the frontend, Cloudflare Tunnel through `farley_station` for the backend (`trak-api.1bit2bit.dev` → `localhost:3002`) via launchd plist

### Exercise Library (Phase 2)
- Curated 79 exercises from `yuhonas/free-exercise-db` via the reproducible `scripts/curate_exercises.rb`
- Idempotent seeds — running on deploy doesn't double-insert
- `ExercisePolicy` with system/owned visibility; system exercises read-only with explicit `:system_exercise_readonly` reason
- Frontend browser with name search, kind filter, muscle-group filter, and custom exercise add/edit

### Sync Layer + Session Logging (Phase 3 — the MVP)
- Local-first sync architecture: `localStore` (with reference-stable cached arrays, invalidated on mutation), append-only FIFO `queue`, single-flight `syncWorker` with `[1s/5s/30s/2m/10m]` backoff, `schema` cache invalidation
- `Session` / `SessionExercise` / `WorkoutSet` models — renamed from `Set` to dodge Ruby stdlib clash (table name stays `sets`); policies, controllers, serializers, 23 tests
- Active-session UI: editable name, live elapsed timer, kind-aware `SetRow`, `RestTimerBar` that auto-starts on set check, `AddExerciseSheet` picker
- Session history with summary cards; retroactive logging via dedicated page; `ActionMenuSheet` wired to the `+` FAB

### Routines (Phase 4)
- `Routine` + `RoutineExercise` models with cascade destroy; `RoutinePolicy` + scope; `RoutineExercisePolicy` delegating ownership through routine; 17 tests (70 total)
- Frontend types and actions — including `startSessionFromRoutine` which materializes a session + nested exercises + pre-filled sets without ever touching the template
- `RoutineDetailPage` with editable name/description and drag-sortable exercises via `@dnd-kit` (pointer + touch sensors)
- `ActionMenuSheet` now lists the user's routines above the empty/log-past entries

### Critical Bug Fix
- `useAuth`'s `getSnapshot` was returning a fresh object on every call, triggering React 19's infinite-loop detection in production (silent — error swallowed). Cached the snapshot at module level and invalidated on `emitChange()`; same pattern applied to `localStore.list()` to keep array references stable. This is the canonical `useSyncExternalStore` shape

## Decisions This Week
1. **Architecture baseline captured in `docs/plan/plan.md`** (2026-04-22) — All initial decisions consolidated under "Architecture Decisions" in `plan.md` rather than duplicated to `DECISIONS.md`. → Plan stays the source of truth during phases 1–7; this log tracks course-corrections from here forward
2. **Ruby model renamed `Set` → `WorkoutSet`** — Ruby's stdlib `Set` collides with an ActiveRecord model named `Set`. → Table name kept as `sets`; clean Ruby class name; no API changes
3. **`useSyncExternalStore` snapshots must be reference-stable** — Returning a fresh object/array on each `getSnapshot` call triggers React 19's infinite-loop guard. → Cache snapshot at module level, invalidate on emit; applied to `useAuth` and `localStore.list()`
4. **`@dnd-kit` accepted as a dependency** — Touch-DnD with reorder is the one place hand-rolling crosses the not-worth-it threshold. → Three small `@dnd-kit/*` packages added; everything else (charts, IDB wrapper, service worker) remains custom
5. **`cloudflared` daemon reads `/etc/cloudflared/config.yml`, not `~/.cloudflared/config.yml`** — Long-running daemon on `farley_station` is configured at the system level, not per-user. → Service URLs use `127.0.0.1`; saved as a `reference` memory so future tunnel work doesn't repeat the misconfiguration

## Challenges Encountered
- **Two cloudflared configs**: the `cloudflared` daemon was reading `/etc/cloudflared/config.yml` while edits were happening in `~/.cloudflared/config.yml`. Found via process inspection on `farley_station`, fixed in place, captured in memory
- **Silent React 19 infinite-loop in production**: `useAuth` worked locally but was breaking auth in prod with no console error. Required a dive into React 19's render-loop detection to find that fresh `getSnapshot` returns trigger the bail-out silently
- **Ruby `Set` naming collision**: discovered partway through Phase 3 model design when ActiveRecord refused to load. Rename was mechanical but touched ~30 files

## Metrics
- **Commits:** 9 (week 17), starting from `4f25c45` "Remove pgcrypto dependency" through `cd27af2` "Daily report 2026-04-24"
- **Files changed:** ~230 (net) across 9 commits
- **Lines added:** ~14,000 (initial commit ~7,500, Phases 2/3/4 ~6,200 of net feature code)
- **Backend tests:** 70 passing (Phase 1: 30, +Phase 2: 13, +Phase 3: 23, +Phase 4: 17)

## Next Week Priorities
1. **Manual end-to-end testing of Phases 3+4** (in progress) — walk the deployed/local app, capture rough edges
2. **Polish pass on UX rough edges** found during testing — already underway: shared `BottomSheet` / `ConfirmDialog` / `Swipeable` / `MeatballMenu`, set-row read/edit modes, retroactive session fixes, read-only finished sessions
3. **Phase 5 — Progress & PRs** once polish lands: hand-rolled SVG `LineChart`, `lib/prs.ts` (Epley 1RM, best-by-reps, highest-volume), `useExerciseHistory` / `usePRs`, ProgressPage → ExerciseProgressPage, "New PR!" toast during active session
