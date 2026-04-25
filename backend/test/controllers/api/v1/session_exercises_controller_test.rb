require "test_helper"

module Api
  module V1
    class SessionExercisesControllerTest < ActionDispatch::IntegrationTest
      def setup
        @alice = User.create!(email: "alice-se@example.com", password: "password123")
        @bob = User.create!(email: "bob-se@example.com", password: "password123")
        @exercise = Exercise.find_or_create_by!(seed_slug: "test_exercise") do |e|
          e.name = "Test Exercise"
          e.kind = "strength"
          e.muscle_groups = ["chest"]
          e.is_system = true
        end
        @alice_session = Session.create!(user: @alice, started_at: Time.current)
        @bob_session = Session.create!(user: @bob, started_at: Time.current)
      end

      def alice_headers
        { "Authorization" => "Bearer #{AuthController.issue_token(@alice)}" }
      end

      test "update creates a session_exercise under Alice's session" do
        id = SecureRandom.uuid
        put "/api/v1/session_exercises/#{id}",
            params: { session_id: @alice_session.id, exercise_id: @exercise.id, position: 0 },
            headers: alice_headers
        assert_response :success
      end

      test "update referencing another user's session returns 404" do
        id = SecureRandom.uuid
        put "/api/v1/session_exercises/#{id}",
            params: { session_id: @bob_session.id, exercise_id: @exercise.id, position: 0 },
            headers: alice_headers
        assert_response :not_found
        assert_nil SessionExercise.find_by(id: id)
      end

      test "update existing session_exercise in another user's session returns 404" do
        bob_se = @bob_session.session_exercises.create!(exercise: @exercise, position: 0)
        put "/api/v1/session_exercises/#{bob_se.id}",
            params: { session_id: @bob_session.id, exercise_id: @exercise.id, position: 99 },
            headers: alice_headers
        assert_response :not_found
        assert_equal 0, bob_se.reload.position
      end

      test "update is idempotent" do
        id = SecureRandom.uuid
        2.times do
          put "/api/v1/session_exercises/#{id}",
              params: { session_id: @alice_session.id, exercise_id: @exercise.id, position: 0 },
              headers: alice_headers
        end
        assert_equal 1, SessionExercise.where(id: id).count
      end

      test "destroy owned session_exercise" do
        se = @alice_session.session_exercises.create!(exercise: @exercise, position: 0)
        delete "/api/v1/session_exercises/#{se.id}", headers: alice_headers
        assert_response :no_content
      end

      test "destroy another user's session_exercise returns 404" do
        bob_se = @bob_session.session_exercises.create!(exercise: @exercise, position: 0)
        delete "/api/v1/session_exercises/#{bob_se.id}", headers: alice_headers
        assert_response :not_found
      end
    end
  end
end
