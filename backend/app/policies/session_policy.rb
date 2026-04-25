class SessionPolicy
  include PolicyResult

  attr_reader :user, :session

  def initialize(user, session)
    @user = user
    @session = session
  end

  def show?    = visible? ? allow : deny(:not_visible)
  def create?  = allow
  def update?  = visible? ? allow : deny(:not_visible)
  def destroy? = visible? ? allow : deny(:not_visible)

  private

  def visible?
    session.user_id == user.id
  end

  class Scope
    attr_reader :user, :scope

    def initialize(user, scope)
      @user = user
      @scope = scope
    end

    def resolve
      scope.where(user_id: user.id).order(started_at: :desc)
    end
  end
end
