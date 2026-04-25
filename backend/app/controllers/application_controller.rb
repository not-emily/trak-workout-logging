class ApplicationController < ActionController::API
  # Explicit allowlist of policy classes. We use a manual hash instead of
  # dynamic resolution (e.g., .constantize) to prevent unsafe reflection
  # (CWE-470) — only classes listed here can be used for authorization.
  POLICY_CLASSES = {
    "Exercise" => ExercisePolicy,
    "Session" => SessionPolicy,
    "SessionExercise" => SessionExercisePolicy,
    "WorkoutSet" => WorkoutSetPolicy,
    "Routine" => RoutinePolicy,
    "RoutineExercise" => RoutineExercisePolicy,
  }.freeze

  POLICY_SCOPE_CLASSES = {
    "Exercise" => ExercisePolicy::Scope,
    "Session" => SessionPolicy::Scope,
    "Routine" => RoutinePolicy::Scope,
  }.freeze

  # Returns a policy instance for a record.
  def get_policy(record)
    policy_class = POLICY_CLASSES[record.class.name]
    raise "No policy defined for #{record.class.name}" unless policy_class
    policy_class.new(current_user, record)
  end

  # Authorizes an action on a record. Infers the action from the controller
  # action name if not provided. Sets @policy for reuse. Returns true on
  # success; otherwise renders an error response and returns false.
  #
  # :not_visible denials render 404 (don't leak resource existence).
  # All other denials render 403 with a reason-specific message.
  def authorize!(record, action = nil, custom_message: nil)
    action ||= (action_name + "?").to_sym
    @policy = get_policy(record)
    result = @policy.public_send(action)

    return true if result.is_a?(Hash) && result[:allowed]

    if result.is_a?(Hash) && result[:reason] == :not_visible
      render json: { error: "Resource not found" }, status: :not_found
    else
      message = custom_message || authorization_message(result)
      render json: { error: message }, status: :forbidden
    end
    false
  end

  # Returns a scoped query for an index action. Keyword args are forwarded
  # to the Scope initializer.
  def policy_scope(scope_class, **kwargs)
    scope_klass = POLICY_SCOPE_CLASSES[scope_class.name]
    raise "No policy scope defined for #{scope_class.name}" unless scope_klass
    scope_klass.new(current_user, scope_class, **kwargs).resolve
  end

  # Maps policy reason codes to user-facing messages. Extended per-resource
  # as new reasons are introduced.
  def authorization_message(result)
    case result&.dig(:reason)
    when :not_owner
      "This resource belongs to another user"
    when :system_exercise_readonly
      "System exercises can't be modified or deleted"
    else
      "Not authorized"
    end
  end
end
