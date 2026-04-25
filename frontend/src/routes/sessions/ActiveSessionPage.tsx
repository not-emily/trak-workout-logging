import { useState } from "react";
import { Navigate, useNavigate, useParams } from "react-router";
import { AnimatePresence } from "framer-motion";
import { Plus, Check, Trash2 } from "lucide-react";
import { useSession } from "@/features/session/useSession";
import {
  addExerciseToSession,
  deleteSession,
  finishSession,
  hydrateSession,
  updateSession,
} from "@/features/session/sessionActions";
import { useRestTimer } from "@/features/session/useRestTimer";
import { useExercises } from "@/features/exercise/useExercises";
import { SessionExerciseBlock } from "@/components/sessions/SessionExerciseBlock";
import { AddExerciseSheet } from "@/components/sessions/AddExerciseSheet";
import { RestTimerBar } from "@/components/sessions/RestTimerBar";
import { formatDuration, useElapsedSeconds } from "@/lib/time";
import { useEffect } from "react";

const DEFAULT_REST_SECONDS = 90;

export function ActiveSessionPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const session = useSession(id);
  const { exercises: exerciseLibrary } = useExercises();
  const [pickerOpen, setPickerOpen] = useState(false);
  const [editingName, setEditingName] = useState(false);
  const [draftName, setDraftName] = useState("");
  const restTimer = useRestTimer(DEFAULT_REST_SECONDS);
  const elapsed = useElapsedSeconds(session?.startedAt ?? null, session?.endedAt ?? null);

  useEffect(() => {
    if (id) hydrateSession(id);
  }, [id]);

  if (!id) return <Navigate to="/sessions" replace />;
  if (!session) {
    return (
      <div className="p-6">
        <p className="text-sm text-gray-500">Session not found.</p>
      </div>
    );
  }

  function findExercise(exerciseId: string) {
    return exerciseLibrary.find((e) => e.id === exerciseId);
  }

  function handleSelectExercise(exercise: { id: string }) {
    addExerciseToSession(session!.id, exercise.id);
  }

  function handleFinish() {
    if (!confirm("Finish this session?")) return;
    finishSession(session!.id);
    navigate("/sessions", { replace: true });
  }

  function handleDelete() {
    if (!confirm("Delete this session? This cannot be undone.")) return;
    deleteSession(session!.id);
    navigate("/sessions", { replace: true });
  }

  function startEditingName() {
    setDraftName(session!.name ?? "");
    setEditingName(true);
  }

  function commitName() {
    updateSession(session!.id, { name: draftName.trim() || null });
    setEditingName(false);
  }

  return (
    <div className="flex flex-col gap-3 p-4">
      <header className="flex items-start justify-between gap-3">
        <div className="flex flex-col gap-1">
          {editingName ? (
            <input
              type="text"
              value={draftName}
              onChange={(e) => setDraftName(e.target.value)}
              onBlur={commitName}
              onKeyDown={(e) => {
                if (e.key === "Enter") commitName();
              }}
              autoFocus
              placeholder="Session name"
              className="rounded-md bg-gray-100 px-2 py-1 text-2xl font-semibold focus:outline-none focus:ring-2 focus:ring-black"
            />
          ) : (
            <button
              type="button"
              onClick={startEditingName}
              className="text-left text-2xl font-semibold text-gray-900"
            >
              {session.name || "Untitled session"}
            </button>
          )}
          <span className="font-mono text-sm tabular-nums text-gray-500">
            {formatDuration(elapsed)}
            {session.endedAt && " · finished"}
          </span>
        </div>

        <div className="flex items-center gap-2">
          {!session.endedAt ? (
            <button
              type="button"
              onClick={handleFinish}
              className="flex items-center gap-1 rounded-full bg-black px-4 py-2 text-sm font-medium text-white"
            >
              <Check className="h-4 w-4" />
              Finish
            </button>
          ) : (
            <button
              type="button"
              onClick={handleDelete}
              aria-label="Delete session"
              className="flex h-9 w-9 items-center justify-center rounded-full bg-red-50 text-red-600"
            >
              <Trash2 className="h-4 w-4" />
            </button>
          )}
        </div>
      </header>

      {session.exercises.map((se) => {
        const exercise = findExercise(se.exerciseId);
        if (!exercise) return null;
        return (
          <SessionExerciseBlock
            key={se.id}
            sessionExercise={se}
            exercise={exercise}
            onSetCompleted={() => restTimer.start(DEFAULT_REST_SECONDS)}
          />
        );
      })}

      <button
        type="button"
        onClick={() => setPickerOpen(true)}
        className="flex items-center justify-center gap-1 rounded-xl border-2 border-dashed border-gray-300 bg-white py-3 text-sm font-medium text-gray-700"
      >
        <Plus className="h-4 w-4" />
        Add exercise
      </button>

      <AddExerciseSheet
        open={pickerOpen}
        onClose={() => setPickerOpen(false)}
        onSelect={handleSelectExercise}
      />

      <AnimatePresence>
        {restTimer.running && (
          <RestTimerBar
            remainingSeconds={restTimer.remainingSeconds}
            totalSeconds={restTimer.totalSeconds}
            onAdjust={(delta) =>
              restTimer.start(Math.max(1, restTimer.remainingSeconds + delta))
            }
            onCancel={restTimer.stop}
          />
        )}
      </AnimatePresence>
    </div>
  );
}
