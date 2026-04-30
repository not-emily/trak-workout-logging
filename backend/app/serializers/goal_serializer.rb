class GoalSerializer
  def self.call(g)
    {
      id: g.id,
      user_id: g.user_id,
      name: g.name,
      target_type: g.target_type,
      exercise_id: g.exercise_id,
      metric: g.metric,
      target_value: g.target_value.to_s,
      start_value: g.start_value&.to_s,
      unit: g.unit,
      direction: g.direction,
      target_date: g.target_date&.iso8601,
      achieved_at: g.achieved_at&.iso8601,
      created_at: g.created_at.iso8601,
      updated_at: g.updated_at.iso8601,
    }
  end

  def self.call_many(records)
    records.map { |r| call(r) }
  end
end
