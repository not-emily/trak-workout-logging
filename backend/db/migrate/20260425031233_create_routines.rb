class CreateRoutines < ActiveRecord::Migration[8.1]
  def change
    create_table :routines, id: :uuid, default: -> { "gen_random_uuid()" } do |t|
      t.references :user, type: :uuid, null: false, foreign_key: true
      t.string :name, null: false
      t.text :description
      t.integer :position, null: false, default: 0

      t.timestamps
    end

    add_index :routines, [:user_id, :position]
  end
end
