class Routine < ApplicationRecord
  belongs_to :user
  has_many :routine_exercises, -> { order(:position) }, dependent: :destroy, inverse_of: :routine

  validates :name, presence: true
  validates :position, numericality: { only_integer: true, greater_than_or_equal_to: 0 }

  scope :owned_by, ->(user) { where(user_id: user.id) }
  scope :ordered, -> { order(:position, :created_at) }
end
