module Authenticatable
  extend ActiveSupport::Concern

  class NotAuthenticated < StandardError; end

  included do
    before_action :authenticate_user!
    after_action :maybe_refresh_token

    rescue_from NotAuthenticated do |e|
      render json: { error: e.message.presence || "Not authenticated" }, status: :unauthorized
    end
  end

  private

  def authenticate_user!
    token = bearer_token
    raise NotAuthenticated, "Missing token" if token.blank?

    payload = decode_token(token)
    @current_user = User.find_by(id: payload["sub"])
    raise NotAuthenticated, "Invalid token" if @current_user.nil?

    @token_expires_at = Time.at(payload["exp"].to_i).utc
  end

  def current_user
    @current_user
  end

  def bearer_token
    header = request.headers["Authorization"]
    return nil if header.blank?
    match = header.match(/\ABearer (.+)\z/)
    match && match[1]
  end

  def decode_token(token)
    JWT.decode(token, Trak::Jwt.secret, true, algorithm: Trak::Jwt::ALGORITHM).first
  rescue JWT::DecodeError => e
    raise NotAuthenticated, e.message
  end

  def maybe_refresh_token
    return unless @current_user && @token_expires_at
    return unless (@token_expires_at - Time.current) < Trak::Jwt::REFRESH_WINDOW

    response.set_header("X-Refreshed-Token", self.class.issue_token(@current_user))
  end

  class_methods do
    def issue_token(user)
      payload = {
        sub: user.id,
        iat: Time.current.to_i,
        exp: Trak::Jwt::EXPIRY.from_now.to_i
      }
      JWT.encode(payload, Trak::Jwt.secret, Trak::Jwt::ALGORITHM)
    end
  end
end
