class Session < ApplicationRecord
  self.table_name = "sessions"

  belongs_to :user
  has_many :session_exercises, -> { order(:position) }, dependent: :destroy, inverse_of: :session
  has_many :sets, through: :session_exercises

  validates :started_at, presence: true
  validate :ended_at_not_before_started_at

  scope :owned_by, ->(user) { where(user_id: user.id) }
  scope :most_recent_first, -> { order(started_at: :desc) }

  def duration_seconds
    return nil unless ended_at
    (ended_at - started_at).to_i
  end

  private

  def ended_at_not_before_started_at
    return unless ended_at && started_at
    errors.add(:ended_at, "must be after started_at") if ended_at < started_at
  end
end
