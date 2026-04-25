class RoutineSerializer
  def self.call(routine, include_exercises: false)
    hash = {
      id: routine.id,
      user_id: routine.user_id,
      name: routine.name,
      description: routine.description,
      position: routine.position,
      created_at: routine.created_at.iso8601,
      updated_at: routine.updated_at.iso8601,
    }
    if include_exercises
      hash[:routine_exercises] = RoutineExerciseSerializer.call_many(routine.routine_exercises)
    end
    hash
  end

  def self.call_many(routines)
    routines.map { |r| call(r) }
  end
end
