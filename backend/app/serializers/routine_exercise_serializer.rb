class RoutineExerciseSerializer
  def self.call(re)
    {
      id: re.id,
      routine_id: re.routine_id,
      exercise_id: re.exercise_id,
      position: re.position,
      planned_sets: re.planned_sets,
      planned_reps: re.planned_reps,
      planned_weight_lb: re.planned_weight_lb&.to_s,
      planned_duration_seconds: re.planned_duration_seconds,
      planned_distance_meters: re.planned_distance_meters&.to_s,
      notes: re.notes,
      created_at: re.created_at.iso8601,
      updated_at: re.updated_at.iso8601,
    }
  end

  def self.call_many(records)
    records.map { |r| call(r) }
  end
end
