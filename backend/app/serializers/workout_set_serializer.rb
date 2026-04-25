class WorkoutSetSerializer
  def self.call(set)
    {
      id: set.id,
      session_exercise_id: set.session_exercise_id,
      position: set.position,
      reps: set.reps,
      weight_lb: set.weight_lb&.to_s,
      duration_seconds: set.duration_seconds,
      distance_meters: set.distance_meters&.to_s,
      rpe: set.rpe,
      is_warmup: set.is_warmup,
      completed_at: set.completed_at&.iso8601,
      notes: set.notes,
      created_at: set.created_at.iso8601,
      updated_at: set.updated_at.iso8601,
    }
  end

  def self.call_many(sets)
    sets.map { |s| call(s) }
  end
end
