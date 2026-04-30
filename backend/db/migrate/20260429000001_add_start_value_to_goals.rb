class AddStartValueToGoals < ActiveRecord::Migration[8.1]
  def change
    add_column :goals, :start_value, :decimal, precision: 8, scale: 3
  end
end
