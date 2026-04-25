class RoutinePolicy
  include PolicyResult

  attr_reader :user, :routine

  def initialize(user, routine)
    @user = user
    @routine = routine
  end

  def show?    = visible? ? allow : deny(:not_visible)
  def create?  = allow
  def update?  = visible? ? allow : deny(:not_visible)
  def destroy? = visible? ? allow : deny(:not_visible)

  private

  def visible?
    routine.user_id == user.id
  end

  class Scope
    attr_reader :user, :scope

    def initialize(user, scope)
      @user = user
      @scope = scope
    end

    def resolve
      scope.where(user_id: user.id).order(:position, :created_at)
    end
  end
end
