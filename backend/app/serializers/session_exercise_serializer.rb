class SessionExerciseSerializer
  def self.call(session_exercise, include_sets: false)
    hash = {
      id: session_exercise.id,
      session_id: session_exercise.session_id,
      exercise_id: session_exercise.exercise_id,
      position: session_exercise.position,
      notes: session_exercise.notes,
      created_at: session_exercise.created_at.iso8601,
      updated_at: session_exercise.updated_at.iso8601,
    }
    if include_sets
      hash[:sets] = WorkoutSetSerializer.call_many(session_exercise.sets)
    end
    hash
  end

  def self.call_many(session_exercises, include_sets: false)
    session_exercises.map { |se| call(se, include_sets: include_sets) }
  end
end
