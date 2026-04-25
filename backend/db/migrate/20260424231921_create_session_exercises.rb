class CreateSessionExercises < ActiveRecord::Migration[8.1]
  def change
    create_table :session_exercises, id: :uuid, default: -> { "gen_random_uuid()" } do |t|
      t.references :session, type: :uuid, null: false, foreign_key: true
      t.references :exercise, type: :uuid, null: false, foreign_key: true
      t.integer :position, null: false, default: 0
      t.text :notes

      t.timestamps
    end

    add_index :session_exercises, [:session_id, :position]
  end
end
