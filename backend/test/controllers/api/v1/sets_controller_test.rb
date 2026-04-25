require "test_helper"

module Api
  module V1
    class SetsControllerTest < ActionDispatch::IntegrationTest
      def setup
        @alice = User.create!(email: "alice-set@example.com", password: "password123")
        @bob = User.create!(email: "bob-set@example.com", password: "password123")
        @exercise = Exercise.find_or_create_by!(seed_slug: "test_exercise") do |e|
          e.name = "Test Exercise"
          e.kind = "strength"
          e.muscle_groups = ["chest"]
          e.is_system = true
        end
        @alice_session = Session.create!(user: @alice, started_at: Time.current)
        @bob_session = Session.create!(user: @bob, started_at: Time.current)
        @alice_se = @alice_session.session_exercises.create!(exercise: @exercise, position: 0)
        @bob_se = @bob_session.session_exercises.create!(exercise: @exercise, position: 0)
      end

      def alice_headers
        { "Authorization" => "Bearer #{AuthController.issue_token(@alice)}" }
      end

      test "update creates a set under Alice's session_exercise" do
        id = SecureRandom.uuid
        put "/api/v1/sets/#{id}",
            params: { session_exercise_id: @alice_se.id, position: 0, reps: 5, weight_lb: 135 },
            headers: alice_headers
        assert_response :success
        body = JSON.parse(response.body)
        assert_equal 5, body.dig("data", "reps")
      end

      test "update referencing another user's session_exercise returns 404" do
        id = SecureRandom.uuid
        put "/api/v1/sets/#{id}",
            params: { session_exercise_id: @bob_se.id, position: 0, reps: 5 },
            headers: alice_headers
        assert_response :not_found
        assert_nil WorkoutSet.find_by(id: id)
      end

      test "update existing set in another user's session returns 404" do
        bob_set = @bob_se.sets.create!(position: 0, reps: 5)
        put "/api/v1/sets/#{bob_set.id}",
            params: { session_exercise_id: @bob_se.id, position: 0, reps: 99 },
            headers: alice_headers
        assert_response :not_found
        assert_equal 5, bob_set.reload.reps
      end

      test "update is idempotent" do
        id = SecureRandom.uuid
        2.times do
          put "/api/v1/sets/#{id}",
              params: { session_exercise_id: @alice_se.id, position: 0, reps: 5, weight_lb: 135 },
              headers: alice_headers
        end
        assert_equal 1, WorkoutSet.where(id: id).count
      end

      test "update rejects invalid rpe" do
        id = SecureRandom.uuid
        put "/api/v1/sets/#{id}",
            params: { session_exercise_id: @alice_se.id, position: 0, rpe: 42 },
            headers: alice_headers
        assert_response :unprocessable_entity
      end

      test "destroy owned set" do
        set = @alice_se.sets.create!(position: 0, reps: 5)
        delete "/api/v1/sets/#{set.id}", headers: alice_headers
        assert_response :no_content
      end

      test "destroy another user's set returns 404" do
        bob_set = @bob_se.sets.create!(position: 0, reps: 5)
        delete "/api/v1/sets/#{bob_set.id}", headers: alice_headers
        assert_response :not_found
      end
    end
  end
end
