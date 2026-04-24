class User < ApplicationRecord
  EMAIL_REGEX = URI::MailTo::EMAIL_REGEXP

  has_secure_password

  before_validation :normalize_email

  validates :email, presence: true, format: { with: EMAIL_REGEX }, uniqueness: { case_sensitive: false }
  validates :password, length: { minimum: 8 }, allow_nil: true

  private

  def normalize_email
    self.email = email.to_s.strip.downcase if email.present?
  end
end
