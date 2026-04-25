require "test_helper"

module Api
  module V1
    class RoutinesControllerTest < ActionDispatch::IntegrationTest
      def setup
        @alice = User.create!(email: "alice-r@example.com", password: "password123")
        @bob = User.create!(email: "bob-r@example.com", password: "password123")
        @exercise = Exercise.find_or_create_by!(seed_slug: "test_exercise") do |e|
          e.name = "Test Exercise"
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
        get "/api/v1/routines"
        assert_response :unauthorized
      end

      test "index returns only current user's routines, ordered by position" do
        b = Routine.create!(user: @alice, name: "B", position: 1)
        a = Routine.create!(user: @alice, name: "A", position: 0)
        Routine.create!(user: @bob, name: "Bob's")

        get "/api/v1/routines", headers: alice_headers
        assert_response :success
        ids = JSON.parse(response.body)["data"].map { |r| r["id"] }
        assert_equal [a.id, b.id], ids
      end

      test "show returns nested routine_exercises in position order" do
        routine = Routine.create!(user: @alice, name: "Arm Day")
        re_b = routine.routine_exercises.create!(exercise: @exercise, position: 1, planned_sets: 4)
        re_a = routine.routine_exercises.create!(exercise: @exercise, position: 0, planned_sets: 3)

        get "/api/v1/routines/#{routine.id}", headers: alice_headers
        assert_response :success
        body = JSON.parse(response.body)
        ids = body.dig("data", "routine_exercises").map { |re| re["id"] }
        assert_equal [re_a.id, re_b.id], ids
      end

      test "show another user's routine returns 404" do
        bob_routine = Routine.create!(user: @bob, name: "Bob's")
        get "/api/v1/routines/#{bob_routine.id}", headers: alice_headers
        assert_response :not_found
      end

      test "update creates a routine" do
        id = SecureRandom.uuid
        put "/api/v1/routines/#{id}",
            params: { name: "Arm Day", description: "Biceps + triceps" },
            headers: alice_headers
        assert_response :success
        assert_equal @alice.id, JSON.parse(response.body).dig("data", "user_id")
      end

      test "update is idempotent" do
        id = SecureRandom.uuid
        2.times do
          put "/api/v1/routines/#{id}", params: { name: "Arm Day" }, headers: alice_headers
        end
        assert_equal 1, Routine.where(id: id).count
      end

      test "update another user's routine returns 404" do
        bob_routine = Routine.create!(user: @bob, name: "Bob's")
        put "/api/v1/routines/#{bob_routine.id}",
            params: { name: "Stolen" }, headers: alice_headers
        assert_response :not_found
        assert_equal "Bob's", bob_routine.reload.name
      end

      test "update forces user to current_user" do
        id = SecureRandom.uuid
        put "/api/v1/routines/#{id}",
            params: { name: "X", user_id: @bob.id }, headers: alice_headers
        assert_response :success
        assert_equal @alice.id, Routine.find(id).user_id
      end

      test "destroy cascades routine_exercises" do
        routine = Routine.create!(user: @alice, name: "Arm Day")
        re = routine.routine_exercises.create!(exercise: @exercise, position: 0, planned_sets: 3)

        delete "/api/v1/routines/#{routine.id}", headers: alice_headers
        assert_response :no_content
        assert_nil RoutineExercise.find_by(id: re.id)
      end

      test "destroy another user's routine returns 404" do
        bob_routine = Routine.create!(user: @bob, name: "Bob's")
        delete "/api/v1/routines/#{bob_routine.id}", headers: alice_headers
        assert_response :not_found
        assert Routine.exists?(bob_routine.id)
      end
    end
  end
end
