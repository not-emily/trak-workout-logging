class ExerciseSerializer
  def self.call(exercise)
    {
      id: exercise.id,
      name: exercise.name,
      kind: exercise.kind,
      muscle_groups: exercise.muscle_groups,
      instructions: exercise.instructions,
      equipment: exercise.equipment,
      level: exercise.level,
      is_system: exercise.is_system,
      owner_user_id: exercise.owner_user_id,
      created_at: exercise.created_at.iso8601,
      updated_at: exercise.updated_at.iso8601,
    }
  end

  def self.call_many(exercises)
    exercises.map { |e| call(e) }
  end
end
