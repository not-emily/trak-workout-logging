class Exercise < ApplicationRecord
  KINDS = %w[strength cardio bodyweight].freeze
  LEVELS = %w[beginner intermediate expert].freeze

  belongs_to :owner_user, class_name: "User", optional: true

  validates :name, presence: true
  validates :kind, presence: true, inclusion: { in: KINDS }
  validates :level, inclusion: { in: LEVELS }, allow_nil: true
  validates :seed_slug, uniqueness: true, allow_nil: true
  validate :ownership_invariant

  scope :system, -> { where(is_system: true) }
  scope :owned_by, ->(user) { where(owner_user_id: user.id) }
  scope :visible_to, ->(user) { where("is_system = TRUE OR owner_user_id = ?", user.id) }
  scope :with_kind, ->(k) { where(kind: k) if k.present? }
  scope :with_muscle_group, ->(mg) { where("? = ANY(muscle_groups)", mg) if mg.present? }

  private

  def ownership_invariant
    if is_system && owner_user_id.present?
      errors.add(:owner_user_id, "must be null for system exercises")
    elsif !is_system && owner_user_id.blank?
      errors.add(:owner_user_id, "must be set for custom exercises")
    end
  end
end
