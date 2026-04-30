class BodyMeasurement < ApplicationRecord
  belongs_to :user

  ALLOWED_METRICS = %w[
    weight body_fat_pct chest waist hips
    arm_left arm_right thigh_left thigh_right
    calf_left calf_right neck shoulders
  ].freeze

  validates :metric, presence: true, inclusion: { in: ALLOWED_METRICS }
  validates :value, presence: true, numericality: { greater_than: 0 }
  validates :unit, presence: true
  validates :recorded_at, presence: true
end
