class UserSerializer
  def self.call(user)
    {
      id: user.id,
      email: user.email,
      name: user.name,
      created_at: user.created_at.iso8601,
      updated_at: user.updated_at.iso8601
    }
  end
end
