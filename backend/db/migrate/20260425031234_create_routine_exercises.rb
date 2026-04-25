class CreateRoutineExercises < ActiveRecord::Migration[8.1]
  def change
    create_table :routine_exercises, id: :uuid, default: -> { "gen_random_uuid()" } do |t|
      t.references :routine, type: :uuid, null: false, foreign_key: true
      t.references :exercise, type: :uuid, null: false, foreign_key: true
      t.integer :position, null: false, default: 0
      t.integer :planned_sets, null: false, default: 3
      t.integer :planned_reps
      t.decimal :planned_weight_lb, precision: 7, scale: 2
      t.integer :planned_duration_seconds
      t.decimal :planned_distance_meters, precision: 9, scale: 2
      t.text :notes

      t.timestamps
    end

    add_index :routine_exercises, [:routine_id, :position]
  end
end
