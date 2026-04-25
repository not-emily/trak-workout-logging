import { useSessions } from "@/features/session/useSessions";
import { SessionCard } from "@/components/sessions/SessionCard";

export function SessionsListPage() {
  const sessions = useSessions();

  return (
    <div className="flex flex-col gap-3 p-4">
      <h1 className="text-2xl font-semibold">Sessions</h1>

      {sessions.length === 0 ? (
        <p className="text-sm text-gray-500">
          No sessions yet. Tap <span className="font-medium">+</span> to start your first one.
        </p>
      ) : (
        <ul className="flex flex-col gap-2">
          {sessions.map((s) => (
            <li key={s.id}>
              <SessionCard session={s} />
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
