# Phase 4: Routines

> **Depends on:** [Phase 3](phase-3.md)
> **Enables:** The "+" action menu now lists saved routines for quick-start
>
> See: [Full Plan](../plan.md)

## Goal

Users can create reusable routine templates (e.g., "Arm Day"), then start a session pre-filled from that routine. Each planned set in the routine expands into N set rows in the new session, pre-filled with planned weight/reps/duration/distance.

## Key Deliverables

- `Routine` and `RoutineExercise` models with policies and controllers
- Routine builder UI: add exercises (drag-to-reorder via `@dnd-kit`), configure planned sets per exercise
- Edit / delete routines
- "Start from routine" flow that materializes a session from a template
- The "+" satellite action menu lists user's routines

## Files to Create

**Backend:**
- `backend/db/migrate/*_create_routines.rb`
- `backend/db/migrate/*_create_routine_exercises.rb`
- `backend/app/models/routine.rb`
- `backend/app/models/routine_exercise.rb`
- `backend/app/policies/routine_policy.rb` — With `Scope`
- `backend/app/policies/routine_exercise_policy.rb`
- `backend/app/controllers/api/v1/routines_controller.rb`
- `backend/app/controllers/api/v1/routine_exercises_controller.rb`
- `backend/app/serializers/routine_serializer.rb` — Nested includes routine_exercises
- `backend/app/serializers/routine_exercise_serializer.rb`

**Frontend:**
- `frontend/src/types/routine.ts`
- `frontend/src/sync/apiClient.ts` — Add routine methods
- `frontend/src/features/routine/useRoutines.ts`, `useRoutine.ts`
- `frontend/src/features/routine/routineActions.ts` — `createRoutine`, `addRoutineExercise`, `startSessionFromRoutine`
- `frontend/src/routes/routines/RoutinesListPage.tsx` — Replace Phase 1 placeholder
- `frontend/src/routes/routines/RoutineDetailPage.tsx`
- `frontend/src/routes/routines/RoutineBuilderPage.tsx`
- `frontend/src/components/routines/RoutineCard.tsx`
- `frontend/src/components/routines/RoutineExerciseBlock.tsx` — Drag handle, planned config editor
- `frontend/src/components/routines/PlannedSetsEditor.tsx` — Inline editor for sets/reps/weight or duration/distance based on exercise kind
- `frontend/src/components/layout/ActionMenu.tsx` — Update to list routines

**Registry updates:**
- Add `Routine` and `RoutineExercise` to `POLICY_CLASSES`; add `Routine` to `POLICY_SCOPE_CLASSES`.

## Dependencies

**Internal:** Phase 3 (sessions, session_exercises, sets — "Start from routine" creates these).

**External:**
- `@dnd-kit/core`, `@dnd-kit/sortable`, `@dnd-kit/utilities` — Touch-friendly drag-and-drop for reordering routine exercises. Already used in garnish.

## Implementation Notes

### Routines schema

```ruby
create_table :routines, id: :uuid do |t|
  t.references :user, type: :uuid, null: false, foreign_key: true
  t.string :name, null: false
  t.text :description
  t.integer :position, null: false, default: 0
  t.timestamps
end
add_index :routines, [:user_id, :position]
```

### RoutineExercises schema

```ruby
create_table :routine_exercises, id: :uuid do |t|
  t.references :routine, type: :uuid, null: false, foreign_key: true
  t.references :exercise, type: :uuid, null: false, foreign_key: true
  t.integer :position, null: false
  t.integer :planned_sets, default: 3, null: false
  t.integer :planned_reps
  t.decimal :planned_weight_lb, precision: 7, scale: 2
  t.integer :planned_duration_seconds
  t.decimal :planned_distance_meters, precision: 9, scale: 2
  t.text :notes
  t.timestamps
end
add_index :routine_exercises, [:routine_id, :position]
```

### Routine serialization

```ruby
# app/serializers/routine_serializer.rb — detail shape
{
  id: routine.id,
  name: routine.name,
  description: routine.description,
  position: routine.position,
  routine_exercises: routine.routine_exercises.order(:position).map { |re|
    RoutineExerciseSerializer.call(re)
  },
  created_at: ...,
  updated_at: ...,
}
```

### "Start from routine" materialization

When the user taps a routine from the action menu:

1. Client generates UUIDs for: new `session`, N new `session_exercises` (one per routine_exercise), N×planned_sets new `sets`.
2. Client writes all of them to localStore with the planned values pre-filled on the sets. `completed_at: null` on every set.
3. Client enqueues PUT for each record (session → session_exercises → sets in order).
4. Client navigates to `/sessions/:id` (ActiveSessionPage), which reads from localStore and renders as usual.

The routine template is **snapshotted by value** onto the session (via the `session.routine_id` pointer and actual records copied over). If the routine is edited later, past sessions are unaffected.

### Drag-to-reorder

Routine exercise reordering in the builder uses `@dnd-kit/sortable` with touch and pointer sensors. On drop, batch-update `position` values and PUT each changed routine_exercise.

### Planned sets editor

Per exercise, a small inline UI shows:
- Sets count (number input)
- Based on `exercise.kind`:
  - **Strength/Bodyweight:** Reps (number), Weight lb (number, optional)
  - **Cardio:** Duration (mm:ss), Distance (optional, user picks mi or m)

For v1, every planned set within one routine exercise is identical (no per-set variation). Per-set variation is deferred to v1.5.

### "+" action menu content

Phase 3 added "Start empty session" and "Log past workout." Phase 4 prepends the user's routines above those, styled as primary actions:

```
[ Arm Day        →]
[ Cardio         →]
─────────────────────
  Start empty session
  Log past workout
```

## Validation

- [ ] Create a routine with name and description
- [ ] Add 3 exercises to the routine, each with planned sets configured
- [ ] Drag to reorder exercises; order persists after refresh
- [ ] Edit planned sets/reps/weight on an existing routine exercise
- [ ] Delete a routine (confirm dialog) — cascade deletes routine_exercises
- [ ] Tap "+" → action menu shows saved routines
- [ ] Tap a routine → session is created with planned sets pre-filled
- [ ] Editing a set's actuals in the session does not affect the routine template
- [ ] Routines list shows only current_user's routines
- [ ] Creating a routine works offline; syncs on reconnect
