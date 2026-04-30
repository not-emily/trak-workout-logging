class Goal < ApplicationRecord
  belongs_to :user
  belongs_to :exercise, optional: true

  TARGET_TYPES = %w[lift body frequency].freeze
  DIRECTIONS = %w[increase decrease].freeze

  validates :name, presence: true
  validates :target_type, presence: true, inclusion: { in: TARGET_TYPES }
  validates :target_value, presence: true, numericality: { greater_than: 0 }
  validates :unit, presence: true
  validates :direction, presence: true, inclusion: { in: DIRECTIONS }

  validate :type_specific_requirements

  private

  def type_specific_requirements
    case target_type
    when "lift"
      errors.add(:exercise_id, "is required for lift goals") if exercise_id.blank?
    when "body"
      errors.add(:metric, "is required for body goals") if metric.blank?
    when "frequency"
      errors.add(:metric, "is required for frequency goals") if metric.blank?
    end
  end
end
