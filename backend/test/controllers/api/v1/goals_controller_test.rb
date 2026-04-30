require "test_helper"

module Api
  module V1
    class GoalsControllerTest < ActionDispatch::IntegrationTest
      def setup
        @alice = User.create!(email: "alice-g@example.com", password: "password123")
        @bob = User.create!(email: "bob-g@example.com", password: "password123")
        @exercise = Exercise.find_or_create_by!(seed_slug: "test_g_exercise") do |e|
          e.name = "Test G Exercise"
          e.kind = "strength"
          e.muscle_groups = ["chest"]
          e.is_system = true
        end
      end

      def alice_headers
        { "Authorization" => "Bearer #{AuthController.issue_token(@alice)}" }
      end

      def bob_headers
        { "Authorization" => "Bearer #{AuthController.issue_token(@bob)}" }
      end

      test "index requires authentication" do
        get "/api/v1/goals"
        assert_response :unauthorized
      end

      test "index returns only current user's goals, active before achieved" do
        achieved = Goal.create!(user: @alice, name: "Old", target_type: "frequency", metric: "sessions_per_week", target_value: 3, unit: "sessions", direction: "increase", achieved_at: 1.week.ago)
        active = Goal.create!(user: @alice, name: "New", target_type: "frequency", metric: "sessions_per_week", target_value: 4, unit: "sessions", direction: "increase")
        Goal.create!(user: @bob, name: "Bob's", target_type: "frequency", metric: "sessions_per_week", target_value: 5, unit: "sessions", direction: "increase")

        get "/api/v1/goals", headers: alice_headers
        assert_response :success
        ids = JSON.parse(response.body)["data"].map { |g| g["id"] }
        assert_equal [active.id, achieved.id], ids
      end

      test "update creates a lift goal" do
        id = SecureRandom.uuid
        put "/api/v1/goals/#{id}",
            params: {
              name: "Bench 225",
              target_type: "lift",
              exercise_id: @exercise.id,
              target_value: 225,
              unit: "lb",
              direction: "increase",
            },
            headers: alice_headers
        assert_response :success
        assert_equal @alice.id, JSON.parse(response.body).dig("data", "user_id")
      end

      test "lift goal requires an exercise" do
        id = SecureRandom.uuid
        put "/api/v1/goals/#{id}",
            params: { name: "X", target_type: "lift", target_value: 100, unit: "lb", direction: "increase" },
            headers: alice_headers
        assert_response :unprocessable_entity
      end

      test "body goal requires a metric" do
        id = SecureRandom.uuid
        put "/api/v1/goals/#{id}",
            params: { name: "Lose 10 lb", target_type: "body", target_value: 170, unit: "lb", direction: "decrease" },
            headers: alice_headers
        assert_response :unprocessable_entity
      end

      test "update persists start_value and serializer returns it" do
        id = SecureRandom.uuid
        put "/api/v1/goals/#{id}",
            params: {
              name: "Bench 225",
              target_type: "lift",
              exercise_id: @exercise.id,
              target_value: 225,
              start_value: 180,
              unit: "lb",
              direction: "increase",
            },
            headers: alice_headers
        assert_response :success
        assert_equal "180.0", JSON.parse(response.body).dig("data", "start_value")
        assert_equal BigDecimal("180"), Goal.find(id).start_value
      end

      test "start_value is null when omitted" do
        id = SecureRandom.uuid
        put "/api/v1/goals/#{id}",
            params: {
              name: "Bench 225",
              target_type: "lift",
              exercise_id: @exercise.id,
              target_value: 225,
              unit: "lb",
              direction: "increase",
            },
            headers: alice_headers
        assert_response :success
        assert_nil JSON.parse(response.body).dig("data", "start_value")
      end

      test "update is idempotent" do
        id = SecureRandom.uuid
        2.times do
          put "/api/v1/goals/#{id}",
              params: {
                name: "Bench 225",
                target_type: "lift",
                exercise_id: @exercise.id,
                target_value: 225,
                unit: "lb",
                direction: "increase",
              },
              headers: alice_headers
        end
        assert_equal 1, Goal.where(id: id).count
      end

      test "update another user's goal returns 404" do
        bob_g = Goal.create!(user: @bob, name: "Bob's", target_type: "frequency", metric: "sessions_per_week", target_value: 4, unit: "sessions", direction: "increase")
        put "/api/v1/goals/#{bob_g.id}",
            params: { name: "Stolen", target_type: "frequency", metric: "sessions_per_week", target_value: 1, unit: "sessions", direction: "increase" },
            headers: alice_headers
        assert_response :not_found
        assert_equal "Bob's", bob_g.reload.name
      end

      test "destroy removes the goal" do
        g = Goal.create!(user: @alice, name: "X", target_type: "frequency", metric: "sessions_per_week", target_value: 3, unit: "sessions", direction: "increase")
        delete "/api/v1/goals/#{g.id}", headers: alice_headers
        assert_response :no_content
        assert_nil Goal.find_by(id: g.id)
      end

      test "destroy another user's goal returns 404" do
        bob_g = Goal.create!(user: @bob, name: "Bob's", target_type: "frequency", metric: "sessions_per_week", target_value: 3, unit: "sessions", direction: "increase")
        delete "/api/v1/goals/#{bob_g.id}", headers: alice_headers
        assert_response :not_found
        assert Goal.exists?(bob_g.id)
      end
    end
  end
end
