class HealthController < ApplicationController
  def show
    checks = { database: database_ok? }
    healthy = checks.values.all?

    render json: {
      status: healthy ? "ok" : "degraded",
      checks: checks,
      time: Time.current.iso8601
    }, status: healthy ? :ok : :service_unavailable
  end

  private

  # verify! forces a real round trip (and reconnect attempt) rather than
  # trusting a cached connection that may be dead.
  def database_ok?
    ActiveRecord::Base.connection.verify!
    true
  rescue StandardError
    false
  end
end
