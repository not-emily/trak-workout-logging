# trak: Personal Gym/Workout Tracker for Family Use

> **Status:** Planning complete | Last updated: 2026-04-22
>
> Phase files: [phases/](phases/)

## Overview

**trak** is a personal gym/workout tracker for logging strength and cardio workouts, saving reusable routines, and seeing progress over time. It replaces the practice of keeping workout notes in a phone's Notes app and gives you charts, personal records, and trends at a glance.

It is a PWA designed to be used at the gym — fast to log, works offline, installable on mobile. It supports multiple users (open signup, but unadvertised) with strict per-user data isolation, so you and family members can each track independently on the same instance.

The project deliberately scopes away social features, nutrition tracking, wearable integrations, and visual features like muscle-group diagrams or progress photos. The focus is: fast logging, reliable history, clear progress.

## Core Vision

- **Fast at the gym.** Logging a set must take two taps. One-handed, sweaty-hands UX.
- **Works offline.** Gym signal is unreliable. A set you logged must never be lost.
- **Personal, not social.** No feeds, no likes, no sharing. Your data is yours.
- **Flexible.** Strength, cardio, bodyweight — not locked into one training style.

## Requirements

### Must Have (v1)

- Open signup with email + password; per-user data isolation
- Pre-seeded exercise library (~80-100 common exercises)
- User-added custom exercises
- Workout logging — strength (sets/reps/weight) and cardio (duration/distance)
- Retroactive logging — log workouts from a past date
- Edit past sessions
- Routines — save reusable templates, start a session from a routine with planned sets pre-filled
- Active session UI with checkmark-per-set logging
- Rest timer (auto-starts on set check)
- Body weight + measurements tracking
- Goals (lift, body metric, frequency)
- Progress charts per exercise
- Personal records derived from set history
- Offline logging with queue-and-sync
- Installable PWA, mobile-first

### Nice to Have (v1.5+)

- Smart suggestions / progressive overload hints
- Supersets / circuits
- Plate calculator
- RPE tracking (schema ready; UI pending)
- Workout notes (schema ready; UI pending)
- Export (CSV/JSON)

### Out of Scope

- Social features, sharing, feeds — not the point
- Nutrition / calorie tracking — different problem
- Wearable integrations (Apple Watch, Garmin) — deferred to v2+
- Native mobile apps — PWA only
- Real-time multi-device sync — single-user-per-device model
- Progress photos — storage overhead not worth it for v1
- Muscle group visualization — v2 candidate

## Constraints

- **Timeline:** "Build it right, but usable" — roughly one implementation phase per weekend, 7 phases total
- **Tech stack:** Match garnish's stack where possible (Rails 8 API + Vite/React/TS PWA)
- **Team:** Solo build
- **Hosting:** Backend on Mac via Cloudflare Tunnel; frontend on Cloudflare Pages (free tier)
- **Budget:** $0 — no paid services
- **Dependency preference:** Lean toward no new dependency when something is build-able in reasonable LOC

## Success Metrics

- You replace your Notes.app workflow entirely and don't return to it
- Logging a set takes two taps or fewer
- You can see a chart of weight-over-time for any exercise you've logged
- An offline gym session logs reliably and syncs on reconnect
- At least one family member adopts it and uses it regularly

## Architecture Decisions

### 1. Stack: Rails 8 API + React PWA
**Choice:** Rails 8 API (port 3002) on Mac via Cloudflare Tunnel + Vite/React 19/TypeScript/Tailwind 4 on Cloudflare Pages.
**Rationale:** Mirrors garnish. Proven pattern, familiar tooling, free hosting.
**Trade-offs:** Two languages and two repos, but the cognitive overhead is familiar.

### 2. Local-first writes with queue-and-sync
**Choice:** Writes land in localStorage instantly; a sync worker POSTs them to the API in the background. UI never blocks on network.
**Rationale:** Gym signal is unreliable. The only way a set is never lost is to write locally first.
**Trade-offs:** More complex than traditional request-response. Worth it for the UX.

### 3. Client-generated UUIDs
**Choice:** Frontend generates UUID v4 for every record; the server accepts them as primary keys.
**Rationale:** Required for offline — the queue needs stable IDs to reference records before the server has seen them.
**Trade-offs:** Collision risk is negligible for UUID v4.

### 4. Upsert-by-UUID on every write
**Choice:** `PUT /api/v1/:resource/:id` is the only write verb. Server upserts based on the client-provided UUID.
**Rationale:** Idempotent — retrying a queued write produces the same state. No create/update distinction in the queue.
**Trade-offs:** Unconventional REST; mitigated by being a closed-system API.

### 5. Polymorphic set table
**Choice:** One `sets` table with nullable columns for strength (weight_lb, reps) and cardio (duration_seconds, distance_meters). `exercise.kind` determines which to read.
**Rationale:** Simpler queries, simpler sync, trivial to extend.
**Trade-offs:** Wide table with many nullable columns; acceptable for clarity.

### 6. JWT auth, 30-day expiry, localStorage
**Choice:** HS256 JWT valid 30 days, stored in localStorage, refreshed silently via `X-Refreshed-Token` response header when within 7 days of expiry.
**Rationale:** Low-sensitivity data; JWT must be JS-readable so the offline queue can include it.
**Trade-offs:** Stolen token valid up to 30 days. Acceptable given threat model.

### 7. 404 for cross-user reads
**Choice:** When a user accesses a record they don't own, return 404 (not 403).
**Rationale:** Don't leak resource existence.
**Trade-offs:** None material.

### 8. Custom Rails policy pattern (advanced + scope hybrid)
**Choice:** Plain-Ruby policies in `app/policies/` using the structured-result pattern (`{ allowed:, reason: }`) with nested `Scope` classes for index filtering. Explicit `POLICY_CLASSES` registry in `ApplicationController` (no `.constantize`).
**Rationale:** No gem. Custom error messages. Same pattern as other 1bit2bit projects. Follows the pattern documented in `~/Work/personal/code-ref/rails/policies/`.
**Trade-offs:** One-line registry bookkeeping per resource. Trivial.

### 9. Custom SVG charts (no charting library)
**Choice:** Hand-rolled `LineChart` component, ~150 LOC of SVG.
**Rationale:** Simple chart needs; a library like Recharts is ~100kb for features we don't need.
**Trade-offs:** Reimplement tooltips and responsive sizing. Acceptable for scope.

### 10. localStorage as the local store
**Choice:** Custom `sync/localStore.ts` wrapper around localStorage for the write queue + cache of recent data.
**Rationale:** Data is small text; localStorage (5-10 MB) is enough. Synchronous API. No dependency.
**Trade-offs:** If data grows huge, swap to IndexedDB behind the same interface.

### 11. Shared Postgres, separate database
**Choice:** Same Postgres instance as garnish, database `trak_development` / `trak_production`.
**Rationale:** Zero new infra. Postgres multi-database is standard.
**Trade-offs:** Shares resources with garnish. Easy to split later.

### 12. No background jobs in v1
**Choice:** Skip `good_job`. No async work needed.
**Rationale:** No emails, no scheduled reports, no webhooks.
**Trade-offs:** Add back when the first async need appears.

### 13. Custom hand-written service worker
**Choice:** Write our own service worker for the PWA. No Workbox or `vite-plugin-pwa`.
**Rationale:** Our caching needs are simple (app shell + static assets + API cache fallback). A ~100-LOC SW keeps us in control and dependency-free.
**Trade-offs:** More code to maintain; acceptable given the simple requirements.

### 14. Drop TanStack Query
**Choice:** No data-fetching library. Frontend hooks read from `localStore` and subscribe to changes; the sync layer handles caching and invalidation.
**Rationale:** Local-first makes TanStack Query redundant — it's built for "fetch-cache-invalidate," not "read-from-local-store."
**Trade-offs:** Less community pattern to lean on; acceptable given our sync layer owns the same concerns.

### 15. Vendored, idempotent exercise seed data
**Choice:** Curate ~80-100 exercises from `yuhonas/free-exercise-db`, commit as `lib/exercises_seed_data.json`, seed idempotently via `seed_slug` upsert.
**Rationale:** No runtime dependency on GitHub; deterministic deploys; versioned in repo.
**Trade-offs:** Manual curation updates when we want new exercises. Infrequent enough.

## Project Structure

```
trak/
├── backend/              # Rails 8 API
│   ├── app/
│   │   ├── controllers/
│   │   │   ├── application_controller.rb   # Auth, authorize!, policy_scope, registry
│   │   │   ├── concerns/
│   │   │   │   ├── authenticatable.rb      # JWT verify, @current_user
│   │   │   │   └── syncable.rb             # upsert_by_uuid helper
│   │   │   └── api/v1/                     # All versioned endpoints
│   │   ├── models/
│   │   ├── policies/
│   │   │   ├── concerns/policy_result.rb   # allow / deny helpers
│   │   │   └── *_policy.rb                 # One per resource
│   │   └── serializers/                    # Plain-Ruby response shapers
│   ├── config/
│   │   ├── database.yml                    # trak_development, trak_production
│   │   ├── routes.rb                       # /api/v1/* namespace
│   │   └── initializers/cors.rb, jwt.rb
│   ├── db/
│   │   ├── migrate/
│   │   └── seeds.rb                        # Idempotent; seeds exercises
│   ├── lib/
│   │   └── exercises_seed_data.json        # Vendored from free-exercise-db
│   └── test/                               # Minitest
├── frontend/             # Vite + React PWA
│   ├── public/
│   │   ├── manifest.webmanifest
│   │   ├── sw.js                           # Hand-written service worker
│   │   └── icon-*.png
│   ├── src/
│   │   ├── main.tsx                        # App entry, SW registration
│   │   ├── App.tsx                         # Router shell
│   │   ├── routes/                         # Route components
│   │   ├── features/                       # Domain hooks & logic
│   │   ├── sync/                           # localStore, queue, syncWorker, apiClient
│   │   ├── components/                     # UI primitives + charts/LineChart.tsx
│   │   ├── hooks/                          # Cross-cutting hooks
│   │   ├── lib/                            # Pure utilities (uuid, units, time, prs)
│   │   ├── types/                          # Shared TS types
│   │   └── styles/index.css                # Tailwind entry
│   ├── vite.config.ts
│   └── package.json
├── docs/
│   └── plan/                               # This plan
├── scripts/
├── docker-compose.yml
├── Procfile.dev                            # foreman: backend + frontend
└── README.md
```

### Key Architectural Boundaries

**Backend:**
- Controllers only talk to models and policies. Never raw SQL in controllers.
- Policies are the only place authorization lives.
- Serializers are the only shape contract with the frontend.

**Frontend:**
- `routes/` render UI and glue features together; no data logic.
- `features/` own domain hooks; depend on `sync/` for persistence.
- `sync/` is the only module that touches localStorage or the API directly.
- `components/` are pure presentational; no feature logic, no API calls.
- `lib/` contains pure functions only.

### Key Files

- `backend/app/controllers/application_controller.rb` — auth + `authorize!` + `policy_scope` + `POLICY_CLASSES` registry + `authorization_message`
- `backend/app/policies/concerns/policy_result.rb` — shared `allow`/`deny` helpers
- `backend/app/controllers/concerns/syncable.rb` — `upsert_by_uuid` helper for idempotent writes
- `backend/db/seeds.rb` + `backend/lib/exercises_seed_data.json` — exercise library
- `backend/config/routes.rb` — all API routes under `/api/v1/`
- `frontend/src/sync/localStore.ts` — the canonical source of data for the UI
- `frontend/src/sync/queue.ts` — append-only queue of pending mutations
- `frontend/src/sync/syncWorker.ts` — drains queue to API on reconnect
- `frontend/src/sync/apiClient.ts` — only module that talks HTTP
- `frontend/src/components/charts/LineChart.tsx` — hand-rolled SVG chart
- `frontend/src/components/layout/BottomNav.tsx` — pill nav with "+" satellite morph
- `frontend/public/sw.js` — hand-written service worker

## Core Interfaces

### REST API surface

All endpoints under `/api/v1/`. JSON, authenticated via `Authorization: Bearer <JWT>` except auth endpoints.

| Resource | Endpoints | Notes |
|---|---|---|
| **auth** | `POST /auth/signup`, `POST /auth/login`, `GET /auth/me` | Returns `{ token, user }` on signup/login |
| **exercises** | `GET /exercises`, `PUT /exercises/:id`, `DELETE /exercises/:id` | Index returns system + user-owned; PUT upserts; DELETE only for user-owned |
| **routines** | `GET /routines`, `GET /routines/:id`, `PUT /routines/:id`, `DELETE /routines/:id` | Detail includes nested `routine_exercises` |
| **sessions** | `GET /sessions`, `GET /sessions/:id`, `PUT /sessions/:id`, `DELETE /sessions/:id` | Detail includes `session_exercises → sets` |
| **session_exercises** | `PUT /session_exercises/:id`, `DELETE /session_exercises/:id` | Create via PUT (upsert) |
| **sets** | `PUT /sets/:id`, `DELETE /sets/:id` | Create via PUT (upsert) |
| **body_measurements** | `GET /body_measurements`, `PUT /body_measurements/:id`, `DELETE /body_measurements/:id` | |
| **goals** | `GET /goals`, `PUT /goals/:id`, `DELETE /goals/:id` | |

### Upsert-by-UUID Contract

Every mutation is `PUT /:resource/:id` where `id` is a client-generated UUID. If the record exists (scoped to current user), update; else insert. Implemented server-side via `Syncable#upsert_by_uuid`.

### Auth Flow

- Signup / login return `{ token, user }`. Token stored in `localStorage` under `trak.auth.token`.
- Authenticated requests include `Authorization: Bearer <token>`.
- Server may return `X-Refreshed-Token` header when token is within 7 days of expiry; client swaps it in.
- On 401, preserve the sync queue, clear token, redirect to `/login`. After re-login, drain queue.
- Logout is client-side only: clear token + local caches.

### Sync Queue Format

```typescript
type QueueEntry = {
  id: string;              // UUID, dedupe key
  method: 'PUT' | 'DELETE';
  path: string;            // e.g. "/api/v1/sets/7f3a-..."
  body?: unknown;          // JSON payload for PUT
  createdAt: string;       // ISO 8601
  attempts: number;
  lastError?: string;
};
```

**Queue rules:** append-only, FIFO drain, one in-flight request at a time (order-preserving), backoff 1s→5s→30s→2m→10m (capped). On 401 pause and re-auth; on permanent 4xx mark failed and surface in a "sync issues" UI.

### Response & Error Shape

Success:
```json
{ "data": { /* record or [records] */ } }
```

Error:
```json
{ "error": "Human-readable message" }
```

Validation error (422):
```json
{ "error": "Validation failed", "errors": { "weight_lb": ["must be positive"] } }
```

Not found / unauthorized:
```
404 { "error": "Resource not found" }
```

### Core Client Abstractions

```typescript
// sync/localStore.ts
interface LocalStore {
  get<T>(resource: string, id: string): T | null;
  list<T>(resource: string, filter?: Predicate<T>): T[];
  put<T>(resource: string, record: T): void;
  remove(resource: string, id: string): void;
  subscribe(resource: string, cb: () => void): Unsubscribe;
}

// sync/queue.ts
interface SyncQueue {
  enqueue(entry: Omit<QueueEntry, 'id' | 'createdAt' | 'attempts'>): void;
  pending(): QueueEntry[];
}

// sync/apiClient.ts
interface ApiClient {
  put(path: string, body: unknown): Promise<Response>;
  delete(path: string): Promise<Response>;
  get(path: string): Promise<Response>;
}
```

**Mutation flow:** `localStore.put(record)` → subscribers re-render → `queue.enqueue(...)` → syncWorker drains → `apiClient.put(...)`. Success clears the entry. 401 re-auths and resumes. 5xx retries with backoff.

**Read flow:** hook reads from `localStore`, renders. If stale (by timestamp), background-fetches from API, hydrates `localStore`, subscribers re-render.

## Implementation Phases

| Phase | Name | Scope | Depends On | Key Outputs |
|-------|------|-------|------------|-------------|
| 1 | Foundation | Repo, auth, app shell, nav skeleton | — | Signup/login, installed shell, pill nav |
| 2 | Exercise Library | Seeded + custom exercises | 1 | Browse library, add custom |
| 3 | Sync Layer + Session Logging | Offline-capable sync; log sessions | 1, 2 | MVP: log a workout, works offline |
| 4 | Routines | Template workouts, start session from template | 3 | Save a routine, start it, log it |
| 5 | Progress & PRs | Custom SVG charts, PRs | 3 | See trends over time |
| 6 | Body & Goals | Body metrics + goals | 5 | Weight/measurement history, targets |
| 7 | PWA Polish | Install manifest, service worker, offline UX | 1-6 | Installable PWA, offline end-to-end |

### Critical Path

Sequential: 1 → 2 → 3. This is the minimum for a usable logging tool.

After Phase 3, the remaining phases are independently valuable but each builds on the last:
- Phase 4 (Routines) depends on Phase 3's session logging.
- Phase 5 (Progress) depends on having session data.
- Phase 6 (Body & Goals) reuses the `LineChart` from Phase 5.
- Phase 7 (PWA Polish) is cross-cutting and sits at the end.

Could in theory parallelize Phases 4 & 5 if there were multiple developers; for solo work, sequential is simpler.

### Phase Details

- [Phase 1: Foundation](phases/phase-1.md)
- [Phase 2: Exercise Library](phases/phase-2.md)
- [Phase 3: Sync Layer + Session Logging](phases/phase-3.md)
- [Phase 4: Routines](phases/phase-4.md)
- [Phase 5: Progress & PRs](phases/phase-5.md)
- [Phase 6: Body & Goals](phases/phase-6.md)
- [Phase 7: PWA Polish](phases/phase-7.md)

## Tech Stack

| Category | Choice | Notes |
|----------|--------|-------|
| Backend language | Ruby 3.3+ | |
| Backend framework | Rails 8.1 API | Mirrors garnish |
| Database | Postgres (shared with garnish) | Database: `trak_development` / `trak_production` |
| Auth | JWT (HS256) | 30-day expiry, silent refresh via header |
| Auth gem | `jwt`, `bcrypt` | Already in garnish |
| CORS | `rack-cors` | Allow `trak.1bit2bit.dev` + `localhost:5174` |
| Backend hosting | Mac + Cloudflare Tunnel | Exposed as `trak-api.1bit2bit.dev`, internal port 3002 |
| Background jobs | None (v1) | Add `good_job` when first async need appears |
| Frontend language | TypeScript | |
| Frontend framework | React 19 | |
| Build | Vite 8 | |
| Styling | Tailwind CSS 4 | No CSS modules or styled-components |
| Routing | `react-router` v7 | |
| Animation | `framer-motion` | For nav pill morph (`layoutId`) |
| Icons | `lucide-react` | Tree-shakeable SVG icons |
| Drag and drop | `@dnd-kit/*` (Phase 4) | For routine exercise reordering |
| Charts | None (custom SVG) | `components/charts/LineChart.tsx` |
| Data fetching | None (custom sync layer) | Dropped TanStack Query |
| Local storage | `localStorage` + custom wrapper | Not IndexedDB; not Dexie |
| Service worker | Hand-written | Not Workbox, not `vite-plugin-pwa` |
| Frontend hosting | Cloudflare Pages | Free tier |

## Future Considerations

Items deferred from v1 scope but architecturally supported:

- **RPE tracking** — `rpe` column already on `sets`; expose in v1.5 UI
- **Warm-up set tagging** — `is_warmup` column; UI toggle added in Phase 3
- **Workout notes** — `notes` columns at session/exercise/set level; UI in v1.5
- **Supersets / circuits** — data model extension; can be retrofitted
- **Smart suggestions** — "try 5 lb more than last week"; pure derived feature
- **Plate calculator** — small utility component; v1.5
- **Muscle group visualization** — v2 candidate; data supports it (`muscle_groups` on exercise)
- **Export (CSV/JSON)** — pull from existing data
- **Progress photos** — would require object storage (e.g., R2); deferred
- **Wearable integrations** — v2+; would need new ingestion paths
- **Password reset via email** — requires email service; deferred
- **Sentry / error monitoring** — paid service; deferred
- **Weekly summary emails** — requires `good_job` + email; deferred
- **Soft delete** — currently hard delete; can add `deleted_at` later
- **Batch sync endpoint** — add when single-mutation drain becomes a bottleneck
- **Real-time multi-device sync** — single-device model is sufficient for now
