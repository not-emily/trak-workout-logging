class ExercisePolicy
  include PolicyResult

  attr_reader :user, :exercise

  def initialize(user, exercise)
    @user = user
    @exercise = exercise
  end

  def show?
    visible? ? allow : deny(:not_visible)
  end

  def create?
    allow
  end

  def update?
    return deny(:system_exercise_readonly) if exercise.is_system
    own? ? allow : deny(:not_visible)
  end

  def destroy?
    return deny(:system_exercise_readonly) if exercise.is_system
    own? ? allow : deny(:not_visible)
  end

  private

  def visible?
    exercise.is_system || own?
  end

  def own?
    exercise.owner_user_id == user.id
  end

  class Scope
    attr_reader :user, :scope

    def initialize(user, scope)
      @user = user
      @scope = scope
    end

    def resolve
      scope.where("is_system = TRUE OR owner_user_id = ?", user.id).order(:name)
    end
  end
end
