class CreateBodyMeasurements < ActiveRecord::Migration[8.1]
  def change
    create_table :body_measurements, id: :uuid, default: -> { "gen_random_uuid()" } do |t|
      t.references :user, type: :uuid, null: false, foreign_key: true
      t.string :metric, null: false
      t.decimal :value, precision: 8, scale: 3, null: false
      t.string :unit, null: false
      t.datetime :recorded_at, null: false
      t.text :notes

      t.timestamps
    end

    add_index :body_measurements, [:user_id, :metric, :recorded_at]
  end
end
