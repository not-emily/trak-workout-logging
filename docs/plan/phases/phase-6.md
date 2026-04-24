# Phase 6: Body & Goals

> **Depends on:** [Phase 5 (reuses LineChart)](phase-5.md)
> **Enables:** Completes the v1 feature set
>
> See: [Full Plan](../plan.md)

## Goal

Let users track body metrics (weight, waist, arms, etc.) and set goals (target lift, target body metric, target frequency). Goals auto-detect achievement from logged data.

## Key Deliverables

- `BodyMeasurement` model (flexible `metric` + `value` + `unit`) with policy and controller
- `Goal` model (polymorphic: lift / body / frequency) with policy and controller
- Body route: enter daily measurements, view history chart per metric
- Goals route: create, view progress, auto-mark achieved when data crosses the target

## Files to Create

**Backend:**
- `backend/db/migrate/*_create_body_measurements.rb`
- `backend/db/migrate/*_create_goals.rb`
- `backend/app/models/body_measurement.rb`
- `backend/app/models/goal.rb`
- `backend/app/policies/body_measurement_policy.rb` — With `Scope`
- `backend/app/policies/goal_policy.rb` — With `Scope`
- `backend/app/controllers/api/v1/body_measurements_controller.rb`
- `backend/app/controllers/api/v1/goals_controller.rb`
- `backend/app/serializers/body_measurement_serializer.rb`
- `backend/app/serializers/goal_serializer.rb`

**Frontend:**
- `frontend/src/types/bodyMeasurement.ts`, `frontend/src/types/goal.ts`
- `frontend/src/sync/apiClient.ts` — Add body/goal methods
- `frontend/src/features/body/useBodyMeasurements.ts`
- `frontend/src/features/goal/useGoals.ts`
- `frontend/src/features/goal/useGoalProgress.ts` — Computes progress toward each goal from latest data
- `frontend/src/routes/body/BodyPage.tsx` — Replace Phase 1 placeholder
- `frontend/src/routes/body/MetricDetailPage.tsx` — Individual metric chart
- `frontend/src/routes/goals/GoalsListPage.tsx`
- `frontend/src/routes/goals/GoalFormPage.tsx` — Create/edit
- `frontend/src/components/body/MetricCard.tsx`
- `frontend/src/components/body/LogMeasurementSheet.tsx`
- `frontend/src/components/goals/GoalCard.tsx` — Shows progress toward target
- `frontend/src/components/goals/GoalTypePicker.tsx`

**Registry updates:**
- Add `BodyMeasurement` and `Goal` to `POLICY_CLASSES` and `POLICY_SCOPE_CLASSES`.

## Dependencies

**Internal:** Phase 5 (reuses `LineChart`).

**External:** None.

## Implementation Notes

### BodyMeasurement schema

```ruby
create_table :body_measurements, id: :uuid do |t|
  t.references :user, type: :uuid, null: false, foreign_key: true
  t.string :metric, null: false            # 'weight', 'body_fat_pct', 'chest', 'waist', 'arm', ...
  t.decimal :value, precision: 8, scale: 3, null: false
  t.string :unit, null: false              # 'lb', 'in', 'pct'
  t.datetime :recorded_at, null: false
  t.text :notes
  t.timestamps
end
add_index :body_measurements, [:user_id, :metric, :recorded_at]
```

Supported metrics (string enum at the application layer):
`weight`, `body_fat_pct`, `chest`, `waist`, `hips`, `arm_left`, `arm_right`, `thigh_left`, `thigh_right`, `calf_left`, `calf_right`, `neck`, `shoulders`

Unit defaults per metric: weight → lb, body_fat_pct → pct, all else → in.

### Goal schema

```ruby
create_table :goals, id: :uuid do |t|
  t.references :user, type: :uuid, null: false, foreign_key: true
  t.string :name, null: false
  t.string :target_type, null: false        # 'lift' | 'body' | 'frequency'
  t.references :exercise, type: :uuid, null: true, foreign_key: true
  t.string :metric                          # For body goals: 'weight', 'waist', etc. For frequency: 'sessions_per_week'
  t.decimal :target_value, precision: 8, scale: 3, null: false
  t.string :unit, null: false
  t.date :target_date                       # Nullable
  t.datetime :achieved_at                   # Nullable
  t.timestamps
end
add_index :goals, [:user_id, :target_type]
```

Validation rules:
- `target_type = 'lift'` requires `exercise_id`
- `target_type = 'body'` requires `metric`
- `target_type = 'frequency'` requires `metric` (e.g., `'sessions_per_week'`)

### Goal progress & auto-achievement

`useGoalProgress(goal)` returns a number 0-100 and the current-value.

- **Lift goal:** look up the user's best 1RM-equivalent for the goal's exercise. If current ≥ target, goal is achieved.
- **Body goal:** look up the latest body_measurement for the goal's metric. If current meets the target (direction depends on metric — higher or lower), achieved. Include metric-specific direction: for weight, we infer direction from `target vs. current` at goal creation. Simpler: user picks "increase to" vs "decrease to" at goal creation.
- **Frequency goal:** count sessions in the last 7 days. If ≥ target, count as "hit this week" (but don't mark permanently achieved — this is a recurring goal, tracked rolling).

When a goal transitions to achieved, set `achieved_at` via client (and enqueue). Show a celebration toast once (`lib/celebrations.ts` or similar — keep it small).

### Body UX

- `BodyPage`: list of metric cards showing current value + small trend chart thumbnail
- Tap a card → `MetricDetailPage` with big `LineChart` and list of entries
- Floating action to log a measurement: quick sheet with metric + value
- For weight (most common), dedicated shortcut on the BodyPage

### Goals UX

- `GoalsListPage`: cards sorted by in-progress first, then achieved
- Each card: name, progress bar, current vs. target, target date if set
- Tap a card → detail view (could be just the form page in edit mode)
- Create form picks target_type first, then exposes fields specific to that type

### No recurring goal logic in v1

"Sessions per week" is the only frequency type. It always displays "this week so far" and a streak count. No complex recurrence rules. That's a v1.5 enhancement.

## Validation

- [ ] Log a body weight → appears on BodyPage
- [ ] MetricDetailPage chart renders weight over time correctly
- [ ] Log measurements for multiple metrics (weight, waist, arms) — each has its own card
- [ ] Create a lift goal ("bench 225") — GoalCard shows current 1RM progress
- [ ] Log a set that crosses the goal threshold — goal auto-marks achieved, toast fires
- [ ] Create a body goal (weight ≤ 180) — progress updates on new measurements
- [ ] Create a frequency goal (4 sessions/week) — shows current count
- [ ] Goals list scoped to current user; 404 on cross-user access
- [ ] Works offline; goal achievement detection happens client-side on local data
