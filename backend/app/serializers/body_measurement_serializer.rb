class BodyMeasurementSerializer
  def self.call(m)
    {
      id: m.id,
      user_id: m.user_id,
      metric: m.metric,
      value: m.value.to_s,
      unit: m.unit,
      recorded_at: m.recorded_at.iso8601,
      notes: m.notes,
      created_at: m.created_at.iso8601,
      updated_at: m.updated_at.iso8601,
    }
  end

  def self.call_many(records)
    records.map { |r| call(r) }
  end
end
