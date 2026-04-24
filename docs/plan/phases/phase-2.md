# Phase 2: Exercise Library

> **Depends on:** [Phase 1](phase-1.md)
> **Enables:** [Phase 3 (session logging references exercises)](phase-3.md)
>
> See: [Full Plan](../plan.md)

## Goal

Seed a curated exercise library (~80-100 common exercises from `yuhonas/free-exercise-db`), let users add custom exercises, and provide a browsable/searchable library in the frontend.

## Key Deliverables

- `Exercise` model with `kind` (strength | cardio | bodyweight), `muscle_groups`, `instructions`, `is_system`, `owner_user_id`, `seed_slug`
- Idempotent seed loading from vendored `exercises_seed_data.json`
- `ExercisePolicy` with `Scope` (visible = system OR owned)
- `Api::V1::ExercisesController` — index, upsert (PUT), destroy
- `ExerciseSerializer`
- Frontend exercise browser: searchable list, filter by muscle group, filter by kind
- "Add custom exercise" form
- Custom exercise edit / delete (system exercises read-only)

## Files to Create

**Backend:**
- `backend/db/migrate/*_create_exercises.rb`
- `backend/app/models/exercise.rb` — enum for `kind`, validations, association to user for custom exercises
- `backend/lib/exercises_seed_data.json` — Curated ~80-100 exercises (vendored from free-exercise-db)
- `backend/lib/tasks/seed_exercises.rake` — Optional rake task for re-seeding just the exercise library
- `backend/db/seeds.rb` — Reads `exercises_seed_data.json`, upserts by `seed_slug`
- `backend/app/policies/exercise_policy.rb` — With `Scope`
- `backend/app/controllers/api/v1/exercises_controller.rb`
- `backend/app/serializers/exercise_serializer.rb`
- `backend/test/policies/exercise_policy_test.rb`
- `backend/test/controllers/api/v1/exercises_controller_test.rb`

**Frontend:**
- `frontend/src/types/exercise.ts` — `Exercise` type matching serializer output
- `frontend/src/sync/apiClient.ts` — Add `getExercises`, `upsertExercise`, `deleteExercise`
- `frontend/src/features/exercise/useExercises.ts` — Hook that fetches + caches in localStore
- `frontend/src/routes/exercises/ExerciseListPage.tsx` — Library browser
- `frontend/src/routes/exercises/ExerciseDetailPage.tsx` — View details (read-only for system)
- `frontend/src/routes/exercises/ExerciseFormPage.tsx` — Add/edit custom exercise
- `frontend/src/components/exercises/ExerciseCard.tsx` — List item
- `frontend/src/components/exercises/MuscleGroupFilter.tsx`
- `frontend/src/components/exercises/KindFilter.tsx`

**Registry update:**
- `backend/app/controllers/application_controller.rb` — Add `'Exercise' => ExercisePolicy` to `POLICY_CLASSES` and `POLICY_SCOPE_CLASSES`.

## Dependencies

**Internal:** Phase 1 (auth, policies, `Syncable` concern).

**External:** None — data comes from a vendored JSON file already in the repo.

## Implementation Notes

### Exercise schema

```ruby
create_table :exercises, id: :uuid do |t|
  t.string :name, null: false
  t.string :kind, null: false                      # 'strength' | 'cardio' | 'bodyweight'
  t.string :muscle_groups, array: true, default: [], null: false
  t.text :instructions                             # Optional, nullable
  t.string :equipment                              # Nullable
  t.string :level                                  # 'beginner' | 'intermediate' | 'expert' | nil
  t.string :seed_slug                              # Unique when not null; identifies system exercises
  t.boolean :is_system, default: false, null: false
  t.references :owner_user, type: :uuid, foreign_key: { to_table: :users }, null: true
  t.timestamps
end
add_index :exercises, :seed_slug, unique: true, where: 'seed_slug IS NOT NULL'
add_index :exercises, :owner_user_id
```

Validation: either `is_system = true AND owner_user_id IS NULL` or `is_system = false AND owner_user_id IS NOT NULL`. Enforce via model validation and DB check constraint.

### Seeding

`db/seeds.rb` reads `lib/exercises_seed_data.json` and calls `Exercise.upsert_all(...)` matching on `seed_slug`. Upsert sets `is_system: true`, `owner_user_id: nil`. Safe to run multiple times.

### Curating the seed file

Start with the pre-combined `dist/exercises.json` from `yuhonas/free-exercise-db`. Transform:
- Their `category` → our `kind` (map strength-like categories to `strength`, cardio/aerobic to `cardio`, bodyweight/stretch to `bodyweight`)
- Their `primaryMuscles + secondaryMuscles` → our `muscle_groups` (primary first, normalized to lowercase snake_case)
- Their `instructions` → our `instructions` (join with newlines)
- Their `id` (e.g., `"Alternate_Incline_Dumbbell_Curl"`) → our `seed_slug` (lowercased, e.g., `"alternate_incline_dumbbell_curl"`)
- Skip their `images` — out of scope for v1

Filter to ~80-100 exercises covering:
- Barbell compound lifts (bench, squat, deadlift, OHP, row)
- Common dumbbell movements
- Common machine movements (leg press, lat pulldown, cable row, etc.)
- Core bodyweight (push-up, pull-up, plank, sit-up)
- Common cardio (running, cycling, rowing, elliptical, walking)

### ExercisePolicy

```ruby
class ExercisePolicy
  include PolicyResult
  attr_reader :user, :exercise

  def initialize(user, exercise)
    @user = user
    @exercise = exercise
  end

  def show?    = visible? ? allow : deny(:not_visible)
  def create?  = allow
  def update?  = exercise.is_system ? deny(:system_exercise_readonly) : (own? ? allow : deny(:not_visible))
  def destroy? = exercise.is_system ? deny(:system_exercise_readonly) : (own? ? allow : deny(:not_visible))

  private

  def visible? = exercise.is_system || own?
  def own?     = exercise.owner_user_id == user.id

  class Scope
    attr_reader :user, :scope
    def initialize(user, scope); @user = user; @scope = scope; end

    def resolve
      scope.where('is_system = TRUE OR owner_user_id = ?', user.id).order(:name)
    end
  end
end
```

Register `:system_exercise_readonly` in `authorization_message` → "System exercises can't be modified or deleted."

### Controller

- `index` — returns `policy_scope(Exercise)`, optionally filtered by `kind` and `muscle_group` query params
- `update` (PUT) — upsert via `Syncable`, setting `is_system: false, owner_user_id: current_user.id`
- `destroy` — guarded by policy

No `create` (POST) route — PUT upsert handles both.

### Frontend

- Fetch-on-mount via `useExercises()`; hydrate `localStore` on success
- Search uses simple case-insensitive substring match on `name` (client-side)
- Muscle group filter: multi-select chip UI
- Kind filter: tabs (All | Strength | Cardio | Bodyweight)
- Adding a custom exercise: generate UUID client-side, `PUT /api/v1/exercises/:uuid` with the form payload

## Validation

- [ ] `rails db:seed` populates ~80-100 exercises with `is_system: true`
- [ ] Re-running `rails db:seed` is idempotent (count stays the same, no duplicates)
- [ ] Modifying `exercises_seed_data.json` (e.g., renaming) and re-seeding updates in place (no duplicates)
- [ ] `GET /api/v1/exercises` returns user's custom + all system exercises; is scoped per-user
- [ ] `PUT /api/v1/exercises/:uuid` with a new UUID creates a custom exercise owned by `current_user`
- [ ] `PUT /api/v1/exercises/:uuid` with another user's UUID returns 404
- [ ] `DELETE /api/v1/exercises/:uuid` on a system exercise returns 403 with the `:system_exercise_readonly` message
- [ ] Frontend exercise list loads, search works, filters work
- [ ] User can add a custom exercise and see it in the list; can edit and delete it
- [ ] System exercises show no edit/delete buttons
