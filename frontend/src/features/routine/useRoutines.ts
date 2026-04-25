import { useEffect, useState, useSyncExternalStore } from "react";
import { localStore } from "@/sync/localStore";
import { hydrateRoutine, hydrateRoutines } from "./routineActions";
import type { AssembledRoutine, Routine, RoutineExercise } from "@/types/routine";

function subscribe(cb: () => void): () => void {
  return localStore.subscribe("routines", cb);
}

function getSnapshot(): Routine[] {
  return localStore.list<Routine>("routines");
}

export function useRoutines(): Routine[] {
  const routines = useSyncExternalStore(subscribe, getSnapshot, getSnapshot);

  useEffect(() => {
    hydrateRoutines();
  }, []);

  return [...routines].sort(
    (a, b) => a.position - b.position || a.createdAt.localeCompare(b.createdAt)
  );
}

function buildAssembled(id: string): AssembledRoutine | null {
  const routine = localStore.get<Routine>("routines", id);
  if (!routine) return null;
  const exercises = localStore
    .list<RoutineExercise>("routine_exercises")
    .filter((re) => re.routineId === id)
    .sort((a, b) => a.position - b.position);
  return { ...routine, exercises };
}

export function useRoutine(id: string | undefined): AssembledRoutine | null {
  const [snap, setSnap] = useState(() => (id ? buildAssembled(id) : null));

  useEffect(() => {
    if (!id) {
      setSnap(null);
      return;
    }
    const update = () => setSnap(buildAssembled(id));
    update();
    hydrateRoutine(id);
    const unsubs = [
      localStore.subscribe("routines", update),
      localStore.subscribe("routine_exercises", update),
    ];
    return () => {
      for (const u of unsubs) u();
    };
  }, [id]);

  return snap;
}
