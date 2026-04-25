class WorkoutSetPolicy
  include PolicyResult

  attr_reader :user, :workout_set

  def initialize(user, workout_set)
    @user = user
    @workout_set = workout_set
  end

  def show?    = visible? ? allow : deny(:not_visible)
  def create?  = allow
  def update?  = visible? ? allow : deny(:not_visible)
  def destroy? = visible? ? allow : deny(:not_visible)

  private

  def visible?
    workout_set.session_exercise.session.user_id == user.id
  end
end
