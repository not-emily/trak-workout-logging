class GoalPolicy
  include PolicyResult

  attr_reader :user, :goal

  def initialize(user, goal)
    @user = user
    @goal = goal
  end

  def show?    = visible? ? allow : deny(:not_visible)
  def create?  = allow
  def update?  = visible? ? allow : deny(:not_visible)
  def destroy? = visible? ? allow : deny(:not_visible)

  private

  def visible?
    goal.user_id == user.id
  end

  class Scope
    attr_reader :user, :scope

    def initialize(user, scope)
      @user = user
      @scope = scope
    end

    def resolve
      # Active (unachieved) goals first, then most-recently achieved.
      scope.where(user_id: user.id).order(Arel.sql("achieved_at IS NULL DESC, achieved_at DESC, created_at DESC"))
    end
  end
end
