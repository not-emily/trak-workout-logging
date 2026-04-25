class CreateSets < ActiveRecord::Migration[8.1]
  def change
    create_table :sets, id: :uuid, default: -> { "gen_random_uuid()" } do |t|
      t.references :session_exercise, type: :uuid, null: false, foreign_key: true
      t.integer :position, null: false, default: 0
      t.integer :reps
      t.decimal :weight_lb, precision: 7, scale: 2
      t.integer :duration_seconds
      t.decimal :distance_meters, precision: 9, scale: 2
      t.integer :rpe
      t.boolean :is_warmup, null: false, default: false
      t.datetime :completed_at
      t.text :notes

      t.timestamps
    end

    add_index :sets, [:session_exercise_id, :position]
    add_check_constraint :sets, "rpe IS NULL OR (rpe >= 1 AND rpe <= 10)", name: "sets_rpe_range_check"
  end
end
