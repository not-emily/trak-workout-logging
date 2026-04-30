class BodyMeasurementPolicy
  include PolicyResult

  attr_reader :user, :measurement

  def initialize(user, measurement)
    @user = user
    @measurement = measurement
  end

  def show?    = visible? ? allow : deny(:not_visible)
  def create?  = allow
  def update?  = visible? ? allow : deny(:not_visible)
  def destroy? = visible? ? allow : deny(:not_visible)

  private

  def visible?
    measurement.user_id == user.id
  end

  class Scope
    attr_reader :user, :scope

    def initialize(user, scope)
      @user = user
      @scope = scope
    end

    def resolve
      scope.where(user_id: user.id).order(recorded_at: :desc)
    end
  end
end
