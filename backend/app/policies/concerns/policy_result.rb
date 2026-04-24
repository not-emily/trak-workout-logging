module PolicyResult
  def allow
    { allowed: true }
  end

  def deny(reason, **extra)
    { allowed: false, reason: reason, **extra }
  end
end
