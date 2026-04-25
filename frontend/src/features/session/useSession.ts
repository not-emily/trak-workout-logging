import { useEffect, useState } from "react";
import { localStore } from "@/sync/localStore";
import type { AssembledSession, AssembledSessionExercise, Session, SessionExercise, WorkoutSet } from "@/types/session";

function buildAssembledSession(id: string): AssembledSession | null {
  const session = localStore.get<Session>("sessions", id);
  if (!session) return null;

  const exercises = localStore
    .list<SessionExercise>("session_exercises")
    .filter((se) => se.sessionId === id)
    .sort((a, b) => a.position - b.position);

  const allSets = localStore.list<WorkoutSet>("sets");

  const assembledExercises: AssembledSessionExercise[] = exercises.map((se) => ({
    ...se,
    sets: allSets
      .filter((s) => s.sessionExerciseId === se.id)
      .sort((a, b) => a.position - b.position),
  }));

  return { ...session, exercises: assembledExercises };
}

// Reactive assembled session view. Re-renders on changes to sessions,
// session_exercises, or sets.
export function useSession(id: string | undefined): AssembledSession | null {
  const [snapshot, setSnapshot] = useState(() => (id ? buildAssembledSession(id) : null));

  useEffect(() => {
    if (!id) {
      setSnapshot(null);
      return;
    }
    const update = () => setSnapshot(buildAssembledSession(id));
    update();
    const unsubs = [
      localStore.subscribe("sessions", update),
      localStore.subscribe("session_exercises", update),
      localStore.subscribe("sets", update),
    ];
    return () => {
      for (const u of unsubs) u();
    };
  }, [id]);

  return snapshot;
}
