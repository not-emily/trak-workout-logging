class SessionExercisePolicy
  include PolicyResult

  attr_reader :user, :session_exercise

  def initialize(user, session_exercise)
    @user = user
    @session_exercise = session_exercise
  end

  def show?    = visible? ? allow : deny(:not_visible)
  def create?  = allow
  def update?  = visible? ? allow : deny(:not_visible)
  def destroy? = visible? ? allow : deny(:not_visible)

  private

  def visible?
    session_exercise.session.user_id == user.id
  end
end
