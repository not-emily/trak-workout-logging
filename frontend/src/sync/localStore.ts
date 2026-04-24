// Skeleton local store. Phase 3 implements the full API surface
// (subscribe, indexed lookups, etc.). For Phase 1 we only need
// the type to exist so other modules can import it.

export type Resource =
  | "exercises"
  | "routines"
  | "sessions"
  | "session_exercises"
  | "sets"
  | "body_measurements"
  | "goals";

export interface LocalStore {
  get<T>(resource: Resource, id: string): T | null;
  list<T>(resource: Resource, filter?: (r: T) => boolean): T[];
  put<T>(resource: Resource, record: T): void;
  remove(resource: Resource, id: string): void;
  subscribe(resource: Resource, cb: () => void): () => void;
}
