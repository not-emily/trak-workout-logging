require "test_helper"

module Api
  module V1
    class BodyMeasurementsControllerTest < ActionDispatch::IntegrationTest
      def setup
        @alice = User.create!(email: "alice-bm@example.com", password: "password123")
        @bob = User.create!(email: "bob-bm@example.com", password: "password123")
      end

      def alice_headers
        { "Authorization" => "Bearer #{AuthController.issue_token(@alice)}" }
      end

      def bob_headers
        { "Authorization" => "Bearer #{AuthController.issue_token(@bob)}" }
      end

      test "index requires authentication" do
        get "/api/v1/body_measurements"
        assert_response :unauthorized
      end

      test "index returns only current user's measurements, newest first" do
        older = BodyMeasurement.create!(user: @alice, metric: "weight", value: 180, unit: "lb", recorded_at: 2.days.ago)
        newer = BodyMeasurement.create!(user: @alice, metric: "weight", value: 179, unit: "lb", recorded_at: 1.hour.ago)
        BodyMeasurement.create!(user: @bob, metric: "weight", value: 200, unit: "lb", recorded_at: Time.current)

        get "/api/v1/body_measurements", headers: alice_headers
        assert_response :success
        ids = JSON.parse(response.body)["data"].map { |m| m["id"] }
        assert_equal [newer.id, older.id], ids
      end

      test "update creates a measurement" do
        id = SecureRandom.uuid
        put "/api/v1/body_measurements/#{id}",
            params: { metric: "weight", value: 175.5, unit: "lb", recorded_at: Time.current.iso8601 },
            headers: alice_headers
        assert_response :success
        assert_equal @alice.id, JSON.parse(response.body).dig("data", "user_id")
      end

      test "update is idempotent" do
        id = SecureRandom.uuid
        2.times do
          put "/api/v1/body_measurements/#{id}",
              params: { metric: "weight", value: 175, unit: "lb", recorded_at: Time.current.iso8601 },
              headers: alice_headers
        end
        assert_equal 1, BodyMeasurement.where(id: id).count
      end

      test "update rejects an unknown metric" do
        id = SecureRandom.uuid
        put "/api/v1/body_measurements/#{id}",
            params: { metric: "elbow_circumference", value: 12, unit: "in", recorded_at: Time.current.iso8601 },
            headers: alice_headers
        assert_response :unprocessable_entity
      end

      test "update another user's measurement returns 404" do
        bob_m = BodyMeasurement.create!(user: @bob, metric: "weight", value: 200, unit: "lb", recorded_at: Time.current)
        put "/api/v1/body_measurements/#{bob_m.id}",
            params: { metric: "weight", value: 100, unit: "lb", recorded_at: Time.current.iso8601 },
            headers: alice_headers
        assert_response :not_found
        assert_equal 200, bob_m.reload.value.to_i
      end

      test "destroy removes the measurement" do
        m = BodyMeasurement.create!(user: @alice, metric: "weight", value: 180, unit: "lb", recorded_at: Time.current)
        delete "/api/v1/body_measurements/#{m.id}", headers: alice_headers
        assert_response :no_content
        assert_nil BodyMeasurement.find_by(id: m.id)
      end

      test "destroy another user's measurement returns 404" do
        bob_m = BodyMeasurement.create!(user: @bob, metric: "weight", value: 200, unit: "lb", recorded_at: Time.current)
        delete "/api/v1/body_measurements/#{bob_m.id}", headers: alice_headers
        assert_response :not_found
        assert BodyMeasurement.exists?(bob_m.id)
      end
    end
  end
end
