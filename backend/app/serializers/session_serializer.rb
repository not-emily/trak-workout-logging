class SessionSerializer
  # include_nested: when true, includes session_exercises → sets.
  # Default shallow for index, nested for show.
  def self.call(session, include_nested: false)
    hash = {
      id: session.id,
      user_id: session.user_id,
      routine_id: session.routine_id,
      name: session.name,
      started_at: session.started_at.iso8601,
      ended_at: session.ended_at&.iso8601,
      notes: session.notes,
      duration_seconds: session.duration_seconds,
      created_at: session.created_at.iso8601,
      updated_at: session.updated_at.iso8601,
    }
    if include_nested
      hash[:session_exercises] = SessionExerciseSerializer.call_many(session.session_exercises, include_sets: true)
    end
    hash
  end

  def self.call_many(sessions)
    sessions.map { |s| call(s) }
  end
end
