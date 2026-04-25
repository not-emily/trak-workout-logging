class RoutineExercisePolicy
  include PolicyResult

  attr_reader :user, :routine_exercise

  def initialize(user, routine_exercise)
    @user = user
    @routine_exercise = routine_exercise
  end

  def show?    = visible? ? allow : deny(:not_visible)
  def create?  = allow
  def update?  = visible? ? allow : deny(:not_visible)
  def destroy? = visible? ? allow : deny(:not_visible)

  private

  def visible?
    routine_exercise.routine.user_id == user.id
  end
end
