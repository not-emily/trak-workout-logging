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

export function RetroactiveSessionPage() {
  const navigate = useNavigate();
  const [datetime, setDatetime] = useState(defaultDateTime());
  const [name, setName] = useState("");

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    // Retroactive sessions are created already-finished — endedAt = startedAt
    // by default. Editing/adding sets later auto-completes them; the user can
    // edit the start/end times if they want a real duration.
    const startedAt = new Date(datetime).toISOString();
    const session = startEmptySession({
      startedAt,
      endedAt: startedAt,
      name: name.trim() || null,
    });
    // startInEdit so the session lands in editing mode — finished sessions are
    // read-only by default, but a freshly-retroactive one is the user actively
    // logging a past workout.
    navigate(`/sessions/${session.id}`, { replace: true, state: { startInEdit: true } });
  }

  return (
    <div className="mx-auto flex max-w-2xl flex-col gap-4 px-4 pt-6 pb-8">
      <Link to="/" className="flex items-center gap-1 text-sm text-gray-600">
        <ArrowLeft className="h-4 w-4" />
        Back
      </Link>
      <h1 className="text-2xl font-semibold">Log past workout</h1>
      <p className="text-sm text-gray-600">
        Pick when the workout happened, then add exercises and sets like a normal session.
      </p>

      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        <label className="flex flex-col gap-1 text-sm">
          When
          <input
            type="datetime-local"
            value={datetime}
            onChange={(e) => setDatetime(e.target.value)}
            required
            className="rounded-lg border border-gray-300 px-3 py-2 text-base"
          />
        </label>

        <label className="flex flex-col gap-1 text-sm">
          Name <span className="text-gray-400">(optional)</span>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Arm Day, Cardio, etc."
            className="rounded-lg border border-gray-300 px-3 py-2 text-base"
          />
        </label>

        <button
          type="submit"
          className="mt-2 rounded-lg bg-black px-4 py-2 font-medium text-white"
        >
          Continue
        </button>
      </form>
    </div>
  );
}
