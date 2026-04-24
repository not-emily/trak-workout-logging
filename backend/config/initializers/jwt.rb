module Trak
  module Jwt
    ALGORITHM = "HS256".freeze
    EXPIRY = 30.days
    REFRESH_WINDOW = 7.days

    def self.secret
      Rails.application.credentials.jwt_secret ||
        ENV["JWT_SECRET"] ||
        (Rails.env.production? ? raise("JWT_SECRET must be set in production") : "trak-dev-secret")
    end
  end
end
