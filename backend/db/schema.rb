# This file is auto-generated from the current state of the database. Instead
# of editing this file, please use the migrations feature of Active Record to
# incrementally modify your database, and then regenerate this schema definition.
#
# This file is the source Rails uses to define your schema when running `bin/rails
# db:schema:load`. When creating a new database, `bin/rails db:schema:load` tends to
# be faster and is potentially less error prone than running all of your
# migrations from scratch. Old migrations may fail to apply correctly if those
# migrations use external dependencies or application code.
#
# It's strongly recommended that you check this file into your version control system.

ActiveRecord::Schema[8.1].define(version: 2026_04_24_231922) do
  # These are extensions that must be enabled in order to support this database
  enable_extension "pg_catalog.plpgsql"

  create_table "exercises", id: :uuid, default: -> { "gen_random_uuid()" }, force: :cascade do |t|
    t.datetime "created_at", null: false
    t.string "equipment"
    t.text "instructions"
    t.boolean "is_system", default: false, null: false
    t.string "kind", null: false
    t.string "level"
    t.string "muscle_groups", default: [], null: false, array: true
    t.string "name", null: false
    t.uuid "owner_user_id"
    t.string "seed_slug"
    t.datetime "updated_at", null: false
    t.index ["kind"], name: "index_exercises_on_kind"
    t.index ["muscle_groups"], name: "index_exercises_on_muscle_groups", using: :gin
    t.index ["owner_user_id"], name: "index_exercises_on_owner_user_id"
    t.index ["seed_slug"], name: "index_exercises_on_seed_slug", unique: true, where: "(seed_slug IS NOT NULL)"
    t.check_constraint "is_system = true AND owner_user_id IS NULL OR is_system = false AND owner_user_id IS NOT NULL", name: "exercises_ownership_check"
    t.check_constraint "kind::text = ANY (ARRAY['strength'::character varying::text, 'cardio'::character varying::text, 'bodyweight'::character varying::text])", name: "exercises_kind_check"
  end

  create_table "session_exercises", id: :uuid, default: -> { "gen_random_uuid()" }, force: :cascade do |t|
    t.datetime "created_at", null: false
    t.uuid "exercise_id", null: false
    t.text "notes"
    t.integer "position", default: 0, null: false
    t.uuid "session_id", null: false
    t.datetime "updated_at", null: false
    t.index ["exercise_id"], name: "index_session_exercises_on_exercise_id"
    t.index ["session_id", "position"], name: "index_session_exercises_on_session_id_and_position"
    t.index ["session_id"], name: "index_session_exercises_on_session_id"
  end

  create_table "sessions", id: :uuid, default: -> { "gen_random_uuid()" }, force: :cascade do |t|
    t.datetime "created_at", null: false
    t.datetime "ended_at"
    t.string "name"
    t.text "notes"
    t.uuid "routine_id"
    t.datetime "started_at", null: false
    t.datetime "updated_at", null: false
    t.uuid "user_id", null: false
    t.index ["routine_id"], name: "index_sessions_on_routine_id"
    t.index ["user_id", "started_at"], name: "index_sessions_on_user_id_and_started_at"
    t.index ["user_id"], name: "index_sessions_on_user_id"
  end

  create_table "sets", id: :uuid, default: -> { "gen_random_uuid()" }, force: :cascade do |t|
    t.datetime "completed_at"
    t.datetime "created_at", null: false
    t.decimal "distance_meters", precision: 9, scale: 2
    t.integer "duration_seconds"
    t.boolean "is_warmup", default: false, null: false
    t.text "notes"
    t.integer "position", default: 0, null: false
    t.integer "reps"
    t.integer "rpe"
    t.uuid "session_exercise_id", null: false
    t.datetime "updated_at", null: false
    t.decimal "weight_lb", precision: 7, scale: 2
    t.index ["session_exercise_id", "position"], name: "index_sets_on_session_exercise_id_and_position"
    t.index ["session_exercise_id"], name: "index_sets_on_session_exercise_id"
    t.check_constraint "rpe IS NULL OR rpe >= 1 AND rpe <= 10", name: "sets_rpe_range_check"
  end

  create_table "users", id: :uuid, default: -> { "gen_random_uuid()" }, force: :cascade do |t|
    t.datetime "created_at", null: false
    t.string "email", null: false
    t.string "name"
    t.string "password_digest", null: false
    t.datetime "updated_at", null: false
    t.index "lower((email)::text)", name: "index_users_on_lower_email", unique: true
  end

  add_foreign_key "exercises", "users", column: "owner_user_id"
  add_foreign_key "session_exercises", "exercises"
  add_foreign_key "session_exercises", "sessions"
  add_foreign_key "sessions", "users"
  add_foreign_key "sets", "session_exercises"
end
