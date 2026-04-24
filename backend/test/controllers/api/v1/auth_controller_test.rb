require "test_helper"

module Api
  module V1
    class AuthControllerTest < ActionDispatch::IntegrationTest
      def setup
        @existing = User.create!(email: "emily@example.com", password: "password123", name: "Emily")
      end

      # --- signup ---

      test "signup with valid params creates a user and returns token" do
        post "/api/v1/auth/signup", params: { email: "new@example.com", password: "password123", name: "New" }
        assert_response :created
        body = JSON.parse(response.body)
        assert body.dig("data", "token").present?
        assert_equal "new@example.com", body.dig("data", "user", "email")
      end

      test "signup normalizes email to lowercase" do
        post "/api/v1/auth/signup", params: { email: "  MiXeD@Example.com ", password: "password123" }
        assert_response :created
        body = JSON.parse(response.body)
        assert_equal "mixed@example.com", body.dig("data", "user", "email")
      end

      test "signup rejects duplicate email case-insensitively" do
        post "/api/v1/auth/signup", params: { email: "EMILY@example.com", password: "password123" }
        assert_response :unprocessable_entity
      end

      test "signup rejects short password" do
        post "/api/v1/auth/signup", params: { email: "shortpw@example.com", password: "short" }
        assert_response :unprocessable_entity
      end

      test "signup rejects invalid email" do
        post "/api/v1/auth/signup", params: { email: "not-an-email", password: "password123" }
        assert_response :unprocessable_entity
      end

      # --- login ---

      test "login with correct credentials returns a token" do
        post "/api/v1/auth/login", params: { email: "emily@example.com", password: "password123" }
        assert_response :success
        body = JSON.parse(response.body)
        assert body.dig("data", "token").present?
      end

      test "login is case-insensitive on email" do
        post "/api/v1/auth/login", params: { email: "EMILY@Example.com", password: "password123" }
        assert_response :success
      end

      test "login with wrong password returns 401" do
        post "/api/v1/auth/login", params: { email: "emily@example.com", password: "wrong" }
        assert_response :unauthorized
      end

      test "login with unknown email returns 401" do
        post "/api/v1/auth/login", params: { email: "nobody@example.com", password: "whatever" }
        assert_response :unauthorized
      end

      # --- me ---

      test "me without token returns 401" do
        get "/api/v1/auth/me"
        assert_response :unauthorized
      end

      test "me with valid token returns the user" do
        token = AuthController.issue_token(@existing)
        get "/api/v1/auth/me", headers: { "Authorization" => "Bearer #{token}" }
        assert_response :success
        body = JSON.parse(response.body)
        assert_equal @existing.id, body.dig("data", "id")
      end

      test "me with malformed token returns 401" do
        get "/api/v1/auth/me", headers: { "Authorization" => "Bearer not.a.real.jwt" }
        assert_response :unauthorized
      end

      test "me with expired token returns 401" do
        expired_payload = { sub: @existing.id, iat: 1.hour.ago.to_i, exp: 1.minute.ago.to_i }
        expired_token = JWT.encode(expired_payload, Trak::Jwt.secret, Trak::Jwt::ALGORITHM)
        get "/api/v1/auth/me", headers: { "Authorization" => "Bearer #{expired_token}" }
        assert_response :unauthorized
      end

      test "me returns X-Refreshed-Token when token is within refresh window" do
        near_expiry_payload = {
          sub: @existing.id,
          iat: 25.days.ago.to_i,
          exp: (Trak::Jwt::REFRESH_WINDOW - 1.day).from_now.to_i
        }
        token = JWT.encode(near_expiry_payload, Trak::Jwt.secret, Trak::Jwt::ALGORITHM)
        get "/api/v1/auth/me", headers: { "Authorization" => "Bearer #{token}" }
        assert_response :success
        refreshed = response.get_header("X-Refreshed-Token")
        assert refreshed.present?, "expected X-Refreshed-Token header"
      end

      test "me does not refresh when token is fresh" do
        token = AuthController.issue_token(@existing)
        get "/api/v1/auth/me", headers: { "Authorization" => "Bearer #{token}" }
        assert_response :success
        assert_nil response.get_header("X-Refreshed-Token")
      end
    end
  end
end
