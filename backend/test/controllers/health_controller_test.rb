require "test_helper"

class HealthControllerTest < ActionDispatch::IntegrationTest
  test "returns 200 with database check when healthy" do
    get "/health"

    assert_response :success
    body = JSON.parse(response.body)
    assert_equal "ok", body["status"]
    assert_equal true, body["checks"]["database"]
    assert body["time"].present?
  end

  test "requires no authentication" do
    get "/health", headers: { "Authorization" => "Bearer garbage" }

    assert_response :success
  end

  test "returns 503 when the database is unreachable" do
    connection = ActiveRecord::Base.connection
    connection.define_singleton_method(:verify!) { raise ActiveRecord::ConnectionNotEstablished }

    get "/health"

    assert_response :service_unavailable
    body = JSON.parse(response.body)
    assert_equal "degraded", body["status"]
    assert_equal false, body["checks"]["database"]
  ensure
    connection.singleton_class.remove_method(:verify!)
  end
end
