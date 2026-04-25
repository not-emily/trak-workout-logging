class SessionExercise < ApplicationRecord
  belongs_to :session, inverse_of: :session_exercises
  belongs_to :exercise
  has_many :sets, -> { order(:position) }, class_name: "WorkoutSet", foreign_key: :session_exercise_id, dependent: :destroy, inverse_of: :session_exercise

  validates :position, numericality: { only_integer: true, greater_than_or_equal_to: 0 }

  delegate :user_id, to: :session
end
