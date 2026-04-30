class CreateGoals < ActiveRecord::Migration[8.1]
  def change
    create_table :goals, id: :uuid, default: -> { "gen_random_uuid()" } do |t|
      t.references :user, type: :uuid, null: false, foreign_key: true
      t.string :name, null: false
      t.string :target_type, null: false
      t.references :exercise, type: :uuid, null: true, foreign_key: true
      t.string :metric
      t.decimal :target_value, precision: 8, scale: 3, null: false
      t.string :unit, null: false
      t.string :direction, null: false, default: "increase"
      t.date :target_date
      t.datetime :achieved_at

      t.timestamps
    end

    add_index :goals, [:user_id, :target_type]
  end
end
