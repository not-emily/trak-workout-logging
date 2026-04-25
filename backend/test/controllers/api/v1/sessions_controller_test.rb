require "test_helper"

module Api
  module V1
    class SessionsControllerTest < ActionDispatch::IntegrationTest
      def setup
        @alice = User.create!(email: "alice-s@example.com", password: "password123")
        @bob = User.create!(email: "bob-s@example.com", password: "password123")
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
        get "/api/v1/sessions"
        assert_response :unauthorized
      end

      test "index returns only current user's sessions, most recent first" do
        alice_old = Session.create!(user: @alice, started_at: 2.days.ago, name: "Old")
        alice_new = Session.create!(user: @alice, started_at: Time.current, name: "New")
        Session.create!(user: @bob, started_at: Time.current, name: "Bob's")

        get "/api/v1/sessions", headers: alice_headers
        assert_response :success
        ids = JSON.parse(response.body)["data"].map { |s| s["id"] }
        assert_equal [alice_new.id, alice_old.id], ids
      end

      test "show another user's session returns 404" do
        bob_session = Session.create!(user: @bob, started_at: Time.current)
        get "/api/v1/sessions/#{bob_session.id}", headers: alice_headers
        assert_response :not_found
      end

      test "show returns nested session_exercises and sets" do
        session = Session.create!(user: @alice, started_at: Time.current)
        se = session.session_exercises.create!(exercise: @exercise, position: 0)
        se.sets.create!(position: 0, reps: 5, weight_lb: 100, completed_at: Time.current)

        get "/api/v1/sessions/#{session.id}", headers: alice_headers
        assert_response :success
        body = JSON.parse(response.body)
        assert_equal 1, body.dig("data", "session_exercises").size
        assert_equal 1, body.dig("data", "session_exercises", 0, "sets").size
      end

      test "update creates a new session" do
        id = SecureRandom.uuid
        put "/api/v1/sessions/#{id}",
            params: { name: "Arm Day", started_at: Time.current.iso8601 },
            headers: alice_headers
        assert_response :success
        assert_equal @alice.id, JSON.parse(response.body).dig("data", "user_id")
      end

      test "update is idempotent on repeat" do
        id = SecureRandom.uuid
        2.times do
          put "/api/v1/sessions/#{id}",
              params: { name: "Arm Day", started_at: Time.current.iso8601 },
              headers: alice_headers
        end
        assert_equal 1, Session.where(id: id, user_id: @alice.id).count
      end

      test "update another user's session returns 404" do
        bob_session = Session.create!(user: @bob, started_at: Time.current, name: "Bob's")
        put "/api/v1/sessions/#{bob_session.id}",
            params: { name: "Stolen", started_at: Time.current.iso8601 },
            headers: alice_headers
        assert_response :not_found
        assert_equal "Bob's", bob_session.reload.name
      end

      test "update forces user to current_user even if client sends user_id" do
        id = SecureRandom.uuid
        put "/api/v1/sessions/#{id}",
            params: { name: "Tampered", started_at: Time.current.iso8601, user_id: @bob.id },
            headers: alice_headers
        assert_response :success
        assert_equal @alice.id, Session.find(id).user_id
      end

      test "destroy owned session works and cascades" do
        session = Session.create!(user: @alice, started_at: Time.current)
        se = session.session_exercises.create!(exercise: @exercise, position: 0)
        se.sets.create!(position: 0, reps: 5)

        delete "/api/v1/sessions/#{session.id}", headers: alice_headers
        assert_response :no_content
        assert_nil Session.find_by(id: session.id)
        assert_equal 0, WorkoutSet.where(session_exercise_id: se.id).count
      end

      test "destroy another user's session returns 404" do
        bob_session = Session.create!(user: @bob, started_at: Time.current)
        delete "/api/v1/sessions/#{bob_session.id}", headers: alice_headers
        assert_response :not_found
        assert Session.exists?(bob_session.id)
      end
    end
  end
end
