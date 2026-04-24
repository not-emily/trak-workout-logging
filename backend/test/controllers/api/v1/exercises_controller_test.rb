require "test_helper"

module Api
  module V1
    class ExercisesControllerTest < ActionDispatch::IntegrationTest
      def setup
        @alice = User.create!(email: "alice@example.com", password: "password123")
        @bob = User.create!(email: "bob@example.com", password: "password123")

        @system = Exercise.create!(
          name: "Barbell Bench Press",
          kind: "strength",
          muscle_groups: %w[chest triceps],
          is_system: true,
          seed_slug: "test_barbell_bench_press"
        )
        @alice_custom = Exercise.create!(
          name: "Alice's Weird Move",
          kind: "strength",
          muscle_groups: %w[lats],
          is_system: false,
          owner_user: @alice
        )
        @bob_custom = Exercise.create!(
          name: "Bob's Cardio",
          kind: "cardio",
          muscle_groups: %w[quadriceps],
          is_system: false,
          owner_user: @bob
        )
      end

      def alice_headers
        { "Authorization" => "Bearer #{AuthController.issue_token(@alice)}" }
      end

      def bob_headers
        { "Authorization" => "Bearer #{AuthController.issue_token(@bob)}" }
      end

      # --- index ---

      test "index requires authentication" do
        get "/api/v1/exercises"
        assert_response :unauthorized
      end

      test "index returns system + owned exercises" do
        get "/api/v1/exercises", headers: alice_headers
        assert_response :success
        body = JSON.parse(response.body)
        ids = body["data"].map { |e| e["id"] }
        assert_includes ids, @system.id
        assert_includes ids, @alice_custom.id
        refute_includes ids, @bob_custom.id
      end

      test "index filters by kind" do
        get "/api/v1/exercises", params: { kind: "cardio" }, headers: bob_headers
        body = JSON.parse(response.body)
        kinds = body["data"].map { |e| e["kind"] }.uniq
        assert_equal ["cardio"], kinds
      end

      test "index filters by muscle_group" do
        get "/api/v1/exercises", params: { muscle_group: "chest" }, headers: alice_headers
        body = JSON.parse(response.body)
        assert body["data"].all? { |e| e["muscle_groups"].include?("chest") }
      end

      # --- update (upsert) ---

      test "update creates a new custom exercise" do
        new_id = SecureRandom.uuid
        put "/api/v1/exercises/#{new_id}",
            params: { name: "My Curl", kind: "strength", muscle_groups: ["biceps"] },
            headers: alice_headers
        assert_response :success
        body = JSON.parse(response.body)
        assert_equal new_id, body.dig("data", "id")
        assert_equal false, body.dig("data", "is_system")
        assert_equal @alice.id, body.dig("data", "owner_user_id")
      end

      test "update is idempotent by UUID" do
        id = SecureRandom.uuid
        2.times do
          put "/api/v1/exercises/#{id}",
              params: { name: "My Curl", kind: "strength", muscle_groups: ["biceps"] },
              headers: alice_headers
          assert_response :success
        end
        assert_equal 1, Exercise.where(id: id).count
      end

      test "update an owned exercise modifies it" do
        put "/api/v1/exercises/#{@alice_custom.id}",
            params: { name: "Alice's Renamed Move", kind: "strength", muscle_groups: ["biceps"] },
            headers: alice_headers
        assert_response :success
        assert_equal "Alice's Renamed Move", @alice_custom.reload.name
      end

      test "update cannot modify a system exercise" do
        put "/api/v1/exercises/#{@system.id}",
            params: { name: "Hacked", kind: "strength", muscle_groups: ["chest"] },
            headers: alice_headers
        assert_response :forbidden
        body = JSON.parse(response.body)
        assert_match(/system exercises/i, body["error"])
        assert_equal "Barbell Bench Press", @system.reload.name
      end

      test "update another user's exercise returns 404" do
        put "/api/v1/exercises/#{@bob_custom.id}",
            params: { name: "Stolen", kind: "strength", muscle_groups: ["chest"] },
            headers: alice_headers
        assert_response :not_found
        assert_equal "Bob's Cardio", @bob_custom.reload.name
      end

      test "update forces is_system=false and owner_user=current_user even if client sends otherwise" do
        id = SecureRandom.uuid
        put "/api/v1/exercises/#{id}",
            params: { name: "Bad Input", kind: "strength", muscle_groups: ["chest"], is_system: true, owner_user_id: @bob.id },
            headers: alice_headers
        assert_response :success
        created = Exercise.find(id)
        assert_equal false, created.is_system
        assert_equal @alice.id, created.owner_user_id
      end

      test "update rejects invalid kind" do
        id = SecureRandom.uuid
        put "/api/v1/exercises/#{id}",
            params: { name: "Bad", kind: "magic", muscle_groups: [] },
            headers: alice_headers
        assert_response :unprocessable_entity
      end

      # --- destroy ---

      test "destroy an owned exercise works" do
        delete "/api/v1/exercises/#{@alice_custom.id}", headers: alice_headers
        assert_response :no_content
        assert_nil Exercise.find_by(id: @alice_custom.id)
      end

      test "destroy a system exercise is forbidden" do
        delete "/api/v1/exercises/#{@system.id}", headers: alice_headers
        assert_response :forbidden
      end

      test "destroy another user's exercise returns 404" do
        delete "/api/v1/exercises/#{@bob_custom.id}", headers: alice_headers
        assert_response :not_found
      end

      test "destroy missing record returns 404" do
        delete "/api/v1/exercises/#{SecureRandom.uuid}", headers: alice_headers
        assert_response :not_found
      end
    end
  end
end
