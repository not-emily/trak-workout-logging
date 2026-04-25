class RoutineExercise < ApplicationRecord
  belongs_to :routine, inverse_of: :routine_exercises
  belongs_to :exercise

  validates :position, numericality: { only_integer: true, greater_than_or_equal_to: 0 }
  validates :planned_sets, numericality: { only_integer: true, greater_than_or_equal_to: 1 }
  validates :planned_reps, numericality: { only_integer: true, greater_than_or_equal_to: 0 }, allow_nil: true
  validates :planned_weight_lb, numericality: { greater_than_or_equal_to: 0 }, allow_nil: true
  validates :planned_duration_seconds, numericality: { only_integer: true, greater_than_or_equal_to: 0 }, allow_nil: true
  validates :planned_distance_meters, numericality: { greater_than_or_equal_to: 0 }, allow_nil: true

  delegate :user_id, to: :routine
end
