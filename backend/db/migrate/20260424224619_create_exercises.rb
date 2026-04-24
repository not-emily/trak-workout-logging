class CreateExercises < ActiveRecord::Migration[8.1]
  def change
    create_table :exercises, id: :uuid, default: -> { "gen_random_uuid()" } do |t|
      t.string :name, null: false
      t.string :kind, null: false
      t.string :muscle_groups, array: true, default: [], null: false
      t.text :instructions
      t.string :equipment
      t.string :level
      t.string :seed_slug
      t.boolean :is_system, default: false, null: false
      t.references :owner_user, type: :uuid, foreign_key: { to_table: :users }, null: true

      t.timestamps
    end

    add_index :exercises, :seed_slug, unique: true, where: "seed_slug IS NOT NULL"
    add_index :exercises, :kind
    add_index :exercises, :muscle_groups, using: :gin

    add_check_constraint :exercises, "kind IN ('strength', 'cardio', 'bodyweight')", name: "exercises_kind_check"
    add_check_constraint :exercises,
      "(is_system = TRUE AND owner_user_id IS NULL) OR (is_system = FALSE AND owner_user_id IS NOT NULL)",
      name: "exercises_ownership_check"
  end
end
