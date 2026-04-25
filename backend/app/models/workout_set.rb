class WorkoutSet < ApplicationRecord
  self.table_name = "sets"

  belongs_to :session_exercise, inverse_of: :sets
  has_one :session, through: :session_exercise

  validates :position, numericality: { only_integer: true, greater_than_or_equal_to: 0 }
  validates :reps, numericality: { only_integer: true, greater_than_or_equal_to: 0 }, allow_nil: true
  validates :weight_lb, numericality: { greater_than_or_equal_to: 0 }, allow_nil: true
  validates :duration_seconds, numericality: { only_integer: true, greater_than_or_equal_to: 0 }, allow_nil: true
  validates :distance_meters, numericality: { greater_than_or_equal_to: 0 }, allow_nil: true
  validates :rpe, numericality: { only_integer: true, greater_than_or_equal_to: 1, less_than_or_equal_to: 10 }, allow_nil: true

  delegate :user_id, to: :session_exercise
end
