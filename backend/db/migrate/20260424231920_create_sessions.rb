class CreateSessions < ActiveRecord::Migration[8.1]
  def change
    create_table :sessions, id: :uuid, default: -> { "gen_random_uuid()" } do |t|
      t.references :user, type: :uuid, null: false, foreign_key: true
      t.references :routine, type: :uuid, null: true, foreign_key: false
      t.string :name
      t.datetime :started_at, null: false
      t.datetime :ended_at
      t.text :notes

      t.timestamps
    end

    add_index :sessions, [:user_id, :started_at]
  end
end
