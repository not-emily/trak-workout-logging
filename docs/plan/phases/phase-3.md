# Phase 3: Sync Layer + Session Logging

> **Depends on:** [Phase 1](phase-1.md), [Phase 2](phase-2.md)
> **Enables:** [Phase 4 (Routines)](phase-4.md), [Phase 5 (Progress)](phase-5.md)
>
> See: [Full Plan](../plan.md)

## Goal

Build the local-first sync layer (localStore, queue, sync worker) and the core logging feature: start a session, add exercises, log sets, rest-timer, finish, edit past sessions, log retroactively. This phase delivers the MVP — a usable workout tracker that works offline.

This is the largest phase and is broken into four sub-phases.

## Key Deliverables

- **Sync layer** (`src/sync/`): `localStore.ts`, `queue.ts`, `syncWorker.ts`, `apiClient.ts`, `schema.ts`
- Optimistic writes, FIFO drain with backoff, online/offline detection, 401 handling
- **Backend models**: `Session`, `SessionExercise`, `Set` with policies and controllers using upsert-by-UUID
- **Active session UI**: start empty session, add exercise, log sets with inline weight/reps entry, checkmark per set, auto-start rest timer, live duration, finish
- **Session history**: list of past sessions, detail view, edit, delete
- **Retroactive logging**: "Log past workout" flow with date picker

## Files to Create

### 3.1: Sync layer infrastructure (frontend only)

- `frontend/src/sync/localStore.ts` — `get`, `list`, `put`, `remove`, `subscribe` over localStorage
- `frontend/src/sync/queue.ts` — Append-only queue with `enqueue`, `pending`, `markSucceeded`, `markFailed`
- `frontend/src/sync/syncWorker.ts` — Drain loop with exponential backoff, `start()`, `stop()`, pause on 401
- `frontend/src/sync/apiClient.ts` — Expanded from Phase 1; handles JWT, `X-Refreshed-Token`, 401 → event emit
- `frontend/src/sync/schema.ts` — `SCHEMA_VERSION` constant; on mismatch clears cache
- `frontend/src/hooks/useOnlineStatus.ts` — Wraps `online`/`offline` events
- `frontend/src/hooks/useSyncStatus.ts` — Queue length, last-sync timestamp, any permanent failures
- `frontend/src/components/layout/SyncIndicator.tsx` — Small banner/icon showing sync state

### 3.2: Backend models + controllers

- `backend/db/migrate/*_create_sessions.rb`
- `backend/db/migrate/*_create_session_exercises.rb`
- `backend/db/migrate/*_create_sets.rb`
- `backend/app/models/session.rb`
- `backend/app/models/session_exercise.rb`
- `backend/app/models/set.rb`
- `backend/app/policies/session_policy.rb` — With `Scope`
- `backend/app/policies/session_exercise_policy.rb`
- `backend/app/policies/set_policy.rb`
- `backend/app/controllers/api/v1/sessions_controller.rb`
- `backend/app/controllers/api/v1/session_exercises_controller.rb`
- `backend/app/controllers/api/v1/sets_controller.rb`
- `backend/app/serializers/session_serializer.rb` — Nested includes session_exercises → sets
- `backend/app/serializers/session_exercise_serializer.rb`
- `backend/app/serializers/set_serializer.rb`

### 3.3: Active session UI

- `frontend/src/features/session/useActiveSession.ts` — The current in-progress session
- `frontend/src/features/session/useSession.ts` — Single session by id
- `frontend/src/features/session/useRestTimer.ts` — Timer with default durations
- `frontend/src/features/session/sessionActions.ts` — `startEmptySession`, `addExerciseToSession`, `logSet`, `finishSession`
- `frontend/src/routes/sessions/ActiveSessionPage.tsx`
- `frontend/src/components/sessions/SessionExerciseBlock.tsx` — Renders one exercise + its sets
- `frontend/src/components/sessions/SetRow.tsx` — Weight/reps inputs + checkmark
- `frontend/src/components/sessions/RestTimerBar.tsx`
- `frontend/src/components/sessions/AddExerciseSheet.tsx` — Picker backed by exercise library

### 3.4: History + retroactive

- `frontend/src/routes/sessions/SessionsListPage.tsx` — Replaces Phase 1 placeholder
- `frontend/src/routes/sessions/SessionDetailPage.tsx`
- `frontend/src/routes/sessions/RetroactiveSessionPage.tsx`
- `frontend/src/components/sessions/SessionCard.tsx`
- `frontend/src/components/layout/ActionMenu.tsx` — The "+" satellite's morph-into-menu content ("Start empty", "Log past workout", later: routines)

**Registry updates:**
- `backend/app/controllers/application_controller.rb` — Add `Session`, `SessionExercise`, `Set` to `POLICY_CLASSES` (and `Session` to `POLICY_SCOPE_CLASSES`).

## Dependencies

**Internal:** Phase 1 (auth, policies, `Syncable`), Phase 2 (exercises exist to log against).

**External:** None.

## Implementation Notes

### Sub-phase 3.1: Sync layer

**`localStore` contract:**

```typescript
type Resource = 'exercises' | 'routines' | 'sessions' | 'session_exercises' | 'sets' | 'body_measurements' | 'goals';

interface LocalStore {
  get<T>(resource: Resource, id: string): T | null;
  list<T>(resource: Resource, filter?: (r: T) => boolean): T[];
  put<T>(resource: Resource, record: T): void;
  remove(resource: Resource, id: string): void;
  subscribe(resource: Resource, cb: () => void): () => void;
}
```

**Storage layout in localStorage:**

```
trak.data.exercises          — object: { [id]: Exercise }
trak.data.routines           — object: { [id]: Routine }
trak.data.sessions           — object: { [id]: Session }
... etc per resource
trak.sync.queue              — array: QueueEntry[]
trak.sync.schemaVersion      — number
trak.auth.token              — string
```

Every `put` / `remove` triggers subscribers for that resource. Subscribers run in a microtask to batch React renders.

**Schema version:**
- `SCHEMA_VERSION` is a constant in `sync/schema.ts`.
- On app boot, if `trak.sync.schemaVersion` doesn't match, clear `trak.data.*` keys (the queue is preserved so unsynced writes aren't lost) and re-fetch from the API.

**Sync worker:**
- On app boot: start if online.
- Listens for `online` events; starts draining.
- Listens for `offline` events; pauses.
- Processes queue entries strictly sequentially.
- Per-entry: `apiClient.put(...)`. On 2xx → remove from queue. On 401 → pause, emit event to trigger re-login. On 5xx or network error → increment `attempts`, schedule retry with backoff: `[1000, 5000, 30000, 120000, 600000]` ms capped. On permanent 4xx (422, 403, 404) other than 401 → mark failed, surface in `SyncIndicator`.

**apiClient:**
- Reads token from localStorage on each request.
- On success, if response has `X-Refreshed-Token` header, write new token to localStorage.
- Returns the parsed JSON body or throws `ApiError` with status + body.
- snake_case ↔ camelCase mapping happens here (single boundary).

### Sub-phase 3.2: Backend

**Sessions schema:**

```ruby
create_table :sessions, id: :uuid do |t|
  t.references :user, type: :uuid, null: false, foreign_key: true
  t.references :routine, type: :uuid, null: true, foreign_key: true
  t.string :name                           # Copied from routine or user-set
  t.datetime :started_at, null: false
  t.datetime :ended_at                     # Null while in progress
  t.text :notes
  t.timestamps
end
add_index :sessions, [:user_id, :started_at]
```

**Session exercises:**

```ruby
create_table :session_exercises, id: :uuid do |t|
  t.references :session, type: :uuid, null: false, foreign_key: true
  t.references :exercise, type: :uuid, null: false, foreign_key: true
  t.integer :position, null: false
  t.text :notes
  t.timestamps
end
add_index :session_exercises, [:session_id, :position]
```

**Sets:**

```ruby
create_table :sets, id: :uuid do |t|
  t.references :session_exercise, type: :uuid, null: false, foreign_key: true
  t.integer :position, null: false
  t.integer :reps
  t.decimal :weight_lb, precision: 7, scale: 2
  t.integer :duration_seconds
  t.decimal :distance_meters, precision: 9, scale: 2
  t.integer :rpe                           # 1-10, nullable
  t.boolean :is_warmup, default: false, null: false
  t.datetime :completed_at                 # Null if planned-not-done
  t.text :notes
  t.timestamps
end
add_index :sets, [:session_exercise_id, :position]
```

**Policies** are all "own?" checks. Ownership of `SessionExercise` is checked via `session.user_id`; ownership of `Set` is checked via `session_exercise.session.user_id`. Each policy has a `Scope` where appropriate (Session at minimum; SessionExercise and Set are typically fetched through their parent so can skip their own Scope classes in this phase).

**Controllers** use `upsert_by_uuid` from `Syncable`. For nested resources, the `parent_check` proc verifies the parent belongs to `current_user`. Example for sets:

```ruby
def update
  authorize_new_or_existing_set!
  set = upsert_by_uuid(Set, permitted_set_params, parent_check: ->(s) {
    s.session_exercise.session.user_id == current_user.id
  })
  render json: { data: SetSerializer.call(set) }
end
```

### Sub-phase 3.3: Active session UI

**Start empty session flow:**
1. User taps "+" satellite → action menu morphs open
2. Taps "Start empty session"
3. Frontend generates UUID, writes Session to localStore (`started_at: now`, `ended_at: null`), enqueues PUT
4. Navigates to `/sessions/:id` (ActiveSessionPage)
5. Active session view reads from localStore, renders live

**Logging a set:**
1. User types weight and reps in the inputs
2. Taps checkmark
3. Frontend updates the Set in localStore with `completed_at: now` and the entered values
4. Subscribers re-render
5. Queue entry for PUT /api/v1/sets/:id
6. Rest timer auto-starts (default 90s configurable; later we'll make this per-user)

**Rest timer:**
- Lives on `ActiveSessionPage` state (not in the store — it's ephemeral).
- Counts down, makes a subtle sound or vibrates at zero (best-effort — browsers limit this).
- Can be cancelled / skipped.

**Finish flow:**
1. User taps "Finish"
2. Session's `ended_at = now` in localStore
3. Queue entry enqueued
4. Navigate back to sessions list with a summary toast

**Add exercise:**
- Bottom sheet with exercise library (searchable)
- Tap exercise → creates a `SessionExercise` with next `position`; no sets yet
- User taps "+ Add set" within the exercise block

### Sub-phase 3.4: History + retroactive

**History list:**
- Reverse-chronological sessions from localStore
- Each card shows: date, name (or routine name), duration, # exercises, # sets, total volume
- Tap → detail view

**Detail view:**
- Same layout as active session but read-mode by default; "Edit" toggles edit mode
- Can delete with confirm dialog

**Retroactive:**
- "+" menu → "Log past workout"
- Form: date picker (defaults to today), optional name
- Creates a session with `started_at` set to the chosen date, navigates to the active-session-style screen
- User adds exercises and sets as normal; `started_at` and `ended_at` are editable on the session

### Warm-up set toggle

On each set row, a small "warmup" toggle sets `is_warmup: true`. Warm-up sets don't count toward PRs in later phases. Keep the toggle small and out of the way.

## Validation

### 3.1 Sync layer
- [ ] Offline writes: toggle airplane mode, create a session + log sets, all functional; toggle back online and queue drains
- [ ] Retrying a failed request preserves order (POST set A must succeed before set B)
- [ ] 401 pauses queue, triggers re-login, resumes draining post-login
- [ ] Schema version mismatch clears data cache but preserves queue
- [ ] `SyncIndicator` shows pending count when offline

### 3.2 Backend
- [ ] `PUT /api/v1/sessions/:uuid` creates a session for current_user
- [ ] Re-PUT with same UUID updates (idempotent)
- [ ] `GET /api/v1/sessions` returns only current_user's sessions
- [ ] `GET /api/v1/sessions/:id` from another user returns 404
- [ ] Nested set upsert with a `session_exercise_id` belonging to another user's session returns 404

### 3.3 Active session
- [ ] Start empty session navigates to session view
- [ ] Add an exercise — picker works, exercise block renders with "+ Add set"
- [ ] Log a set — values save, checkmark appears, rest timer starts
- [ ] Edit a set's weight/reps after logging
- [ ] Finish session — `ended_at` set, returns to list with summary
- [ ] Session duration shown live in the nav bar during the session

### 3.4 History + retroactive
- [ ] Sessions list shows reverse-chron history with correct summary fields
- [ ] Tap a past session → detail; can edit and save; can delete with confirm
- [ ] "Log past workout" flow creates a backdated session successfully
- [ ] Full end-to-end: log a workout offline at the gym, go home, see it on the list
