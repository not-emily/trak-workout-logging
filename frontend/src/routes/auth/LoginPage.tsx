import { useState } from "react";
import { Link, useNavigate } from "react-router";
import { useAuth } from "@/features/auth/useAuth";
import { ApiError } from "@/types/api";

export function LoginPage() {
  const navigate = useNavigate();
  const { login } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    setError(null);
    try {
      await login(email, password);
      navigate("/", { replace: true });
    } catch (err) {
      setError(err instanceof ApiError ? err.body.error : "Login failed");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="mx-auto flex min-h-full max-w-sm flex-col justify-center p-6">
      <div className="mb-8 flex flex-col items-center gap-1">
        <h1 className="font-display text-6xl leading-none text-fg">trak</h1>
        <span className="text-[10px] font-semibold uppercase tracking-[0.32em] text-fg-subtle">
          log it / lift it
        </span>
      </div>
      <h2 className="mb-5 text-center text-[11px] font-semibold uppercase tracking-[0.18em] text-fg-subtle">
        Log in
      </h2>
      <form onSubmit={onSubmit} className="flex flex-col gap-4">
        <label className="flex flex-col gap-1.5 text-[11px] font-semibold uppercase tracking-[0.18em] text-fg-subtle">
          Email
          <input
            type="email"
            autoComplete="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            className="rounded-lg border border-line-strong bg-surface-2 px-3 py-2.5 font-sans text-base normal-case tracking-normal text-fg placeholder:text-fg-faint focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent-soft"
          />
        </label>
        <label className="flex flex-col gap-1.5 text-[11px] font-semibold uppercase tracking-[0.18em] text-fg-subtle">
          Password
          <input
            type="password"
            autoComplete="current-password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            minLength={8}
            className="rounded-lg border border-line-strong bg-surface-2 px-3 py-2.5 font-sans text-base normal-case tracking-normal text-fg focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent-soft"
          />
        </label>
        {error && <p className="text-sm text-danger">{error}</p>}
        <button
          type="submit"
          disabled={submitting}
          className="mt-2 rounded-lg bg-accent px-4 py-2.5 font-semibold text-accent-fg transition-colors hover:bg-accent-hover disabled:bg-surface-3 disabled:text-fg-faint"
        >
          {submitting ? "Logging in…" : "Log in"}
        </button>
      </form>
      <p className="mt-6 text-center text-sm text-fg-muted">
        No account?{" "}
        <Link to="/signup" className="font-semibold text-accent transition-colors hover:text-accent-hover">
          Sign up
        </Link>
      </p>
    </div>
  );
}
