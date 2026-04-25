require "test_helper"

module Api
  module V1
    class RoutineExercisesControllerTest < ActionDispatch::IntegrationTest
      def setup
        @alice = User.create!(email: "alice-re@example.com", password: "password123")
        @bob = User.create!(email: "bob-re@example.com", password: "password123")
        @exercise = Exercise.find_or_create_by!(seed_slug: "test_exercise") do |e|
          e.name = "Test Exercise"
          e.kind = "strength"
          e.muscle_groups = ["chest"]
          e.is_system = true
        end
        @alice_routine = Routine.create!(user: @alice, name: "Alice")
        @bob_routine = Routine.create!(user: @bob, name: "Bob")
      end

      def alice_headers
        { "Authorization" => "Bearer #{AuthController.issue_token(@alice)}" }
      end

      test "update creates a routine_exercise under Alice's routine" do
        id = SecureRandom.uuid
        put "/api/v1/routine_exercises/#{id}",
            params: { routine_id: @alice_routine.id, exercise_id: @exercise.id, position: 0, planned_sets: 4, planned_reps: 10 },
            headers: alice_headers
        assert_response :success
        body = JSON.parse(response.body)
        assert_equal 4, body.dig("data", "planned_sets")
      end

      test "update referencing another user's routine returns 404" do
        id = SecureRandom.uuid
        put "/api/v1/routine_exercises/#{id}",
            params: { routine_id: @bob_routine.id, exercise_id: @exercise.id, position: 0, planned_sets: 3 },
            headers: alice_headers
        assert_response :not_found
        assert_nil RoutineExercise.find_by(id: id)
      end

      test "update existing routine_exercise in another user's routine returns 404" do
        bob_re = @bob_routine.routine_exercises.create!(exercise: @exercise, position: 0, planned_sets: 3)
        put "/api/v1/routine_exercises/#{bob_re.id}",
            params: { routine_id: @bob_routine.id, exercise_id: @exercise.id, position: 99, planned_sets: 99 },
            headers: alice_headers
        assert_response :not_found
        assert_equal 3, bob_re.reload.planned_sets
      end

      test "update is idempotent" do
        id = SecureRandom.uuid
        2.times do
          put "/api/v1/routine_exercises/#{id}",
              params: { routine_id: @alice_routine.id, exercise_id: @exercise.id, position: 0, planned_sets: 3 },
              headers: alice_headers
        end
        assert_equal 1, RoutineExercise.where(id: id).count
      end

      test "update rejects planned_sets less than 1" do
        id = SecureRandom.uuid
        put "/api/v1/routine_exercises/#{id}",
            params: { routine_id: @alice_routine.id, exercise_id: @exercise.id, position: 0, planned_sets: 0 },
            headers: alice_headers
        assert_response :unprocessable_entity
      end

      test "destroy owned routine_exercise" do
        re = @alice_routine.routine_exercises.create!(exercise: @exercise, position: 0, planned_sets: 3)
        delete "/api/v1/routine_exercises/#{re.id}", headers: alice_headers
        assert_response :no_content
      end

      test "destroy another user's routine_exercise returns 404" do
        bob_re = @bob_routine.routine_exercises.create!(exercise: @exercise, position: 0, planned_sets: 3)
        delete "/api/v1/routine_exercises/#{bob_re.id}", headers: alice_headers
        assert_response :not_found
      end
    end
  end
end
