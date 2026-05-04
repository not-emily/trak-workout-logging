import { useState } from "react";
import { Link, useNavigate } from "react-router";
import { ArrowLeft } from "lucide-react";
import { startEmptySession } from "@/features/session/sessionActions";

function defaultDateTime(): string {
  // For an HTML datetime-local input, format YYYY-MM-DDTHH:MM in local time
  const now = new Date();
  const local = new Date(now.getTime() - now.getTimezoneOffset() * 60000);
  return local.toISOString().slice(0, 16);
}

const labelClass =
  "flex flex-col gap-1.5 text-[11px] font-semibold uppercase tracking-[0.18em] text-fg-subtle";
const fieldClass =
  "rounded-lg border border-line-strong bg-surface-2 px-3 py-2.5 text-base normal-case tracking-normal text-fg placeholder:text-fg-faint focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent-soft";

export function RetroactiveSessionPage() {
  const navigate = useNavigate();
  const [datetime, setDatetime] = useState(defaultDateTime());
  const [name, setName] = useState("");

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const startedAt = new Date(datetime).toISOString();
    const session = startEmptySession({
      startedAt,
      endedAt: startedAt,
      name: name.trim() || null,
    });
    navigate(`/sessions/${session.id}`, { replace: true, state: { startInEdit: true } });
  }

  return (
    <div className="mx-auto flex max-w-2xl flex-col gap-4 px-4 pt-6 pb-8">
      <Link
        to="/"
        className="flex w-fit items-center gap-1 text-xs font-semibold uppercase tracking-[0.18em] text-fg-subtle transition-colors hover:text-fg-muted"
      >
        <ArrowLeft className="h-3.5 w-3.5" />
        Back
      </Link>
      <h1 className="font-display text-3xl leading-none text-fg">Log past workout</h1>
      <p className="text-sm text-fg-muted">
        Pick when the workout happened, then add exercises and sets like a normal session.
      </p>

      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        <label className={labelClass}>
          When
          <input
            type="datetime-local"
            value={datetime}
            onChange={(e) => setDatetime(e.target.value)}
            required
            className={fieldClass + " font-sans [color-scheme:dark]"}
          />
        </label>

        <label className={labelClass}>
          <span>
            Name{" "}
            <span className="font-normal normal-case tracking-normal text-fg-faint">
              (optional)
            </span>
          </span>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Arm Day, Cardio, etc."
            className={fieldClass + " font-sans"}
          />
        </label>

        <button
          type="submit"
          className="mt-2 rounded-lg bg-accent px-4 py-2.5 font-semibold text-accent-fg transition-colors hover:bg-accent-hover"
        >
          Continue
        </button>
      </form>
    </div>
  );
}
