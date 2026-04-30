import { useEffect, useRef, useState } from "react";
import { Link, Navigate, useLocation, useNavigate, useParams } from "react-router";
import { AnimatePresence } from "framer-motion";
import { ArrowLeft, Plus, Check, Pencil, Trash2 } from "lucide-react";
import { useSession } from "@/features/session/useSession";
import {
  addExerciseToSession,
  deleteSession,
  finishSession,
  hydrateSession,
  updateSession,
} from "@/features/session/sessionActions";
import { useRestTimer } from "@/features/session/useRestTimer";
import { usePRDetection } from "@/features/session/usePRDetection";
import { useExercises } from "@/features/exercise/useExercises";
import { SessionExerciseBlock } from "@/components/sessions/SessionExerciseBlock";
import { ExercisePicker } from "@/components/exercises/ExercisePicker";
import { RestTimerBar } from "@/components/sessions/RestTimerBar";
import { ConfirmDialog } from "@/components/ui/ConfirmDialog";
import { formatDuration, useElapsedSeconds } from "@/lib/time";

const DEFAULT_REST_SECONDS = 90;

// Convert ISO ↔ datetime-local input format (YYYY-MM-DDTHH:MM in local time).
function isoToLocalInput(iso: string): string {
  const d = new Date(iso);
  const local = new Date(d.getTime() - d.getTimezoneOffset() * 60000);
  return local.toISOString().slice(0, 16);
}

function localInputToIso(local: string): string {
  return new Date(local).toISOString();
}

export function ActiveSessionPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const location = useLocation();
  const session = useSession(id);
  const { exercises: exerciseLibrary } = useExercises();

  const [pickerOpen, setPickerOpen] = useState(false);
  const [editingName, setEditingName] = useState(false);
  const [draftName, setDraftName] = useState("");
  const [editingTimes, setEditingTimes] = useState(false);
  const [draftStartedAt, setDraftStartedAt] = useState("");
  const [draftEndedAt, setDraftEndedAt] = useState("");
  const [confirmFinish, setConfirmFinish] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const timesRef = useRef<HTMLDivElement>(null);

  const restTimer = useRestTimer(DEFAULT_REST_SECONDS);
  const elapsed = useElapsedSeconds(session?.startedAt ?? null, session?.endedAt ?? null);
  usePRDetection(session);

  // UI-only edit toggle for finished sessions. Live sessions are always editing;
  // finished sessions land in read-only unless: (a) navigated with intent to edit
  // (fresh retroactive flow), (b) the session is empty (no exercises yet — must be
  // freshly retroactive), or (c) the user explicitly clicks Edit.
  const startInEdit = (location.state as { startInEdit?: boolean } | null)?.startInEdit;
  const [isEditing, setIsEditing] = useState(() => {
    if (!session) return Boolean(startInEdit);
    if (session.endedAt === null) return true;
    if (startInEdit) return true;
    return session.exercises.length === 0;
  });

  useEffect(() => {
    if (id) hydrateSession(id);
  }, [id]);

  // Reconcile when the session loads (lazy data) — live sessions must always be editing.
  useEffect(() => {
    if (session && session.endedAt === null) setIsEditing(true);
  }, [session?.endedAt]); // eslint-disable-line react-hooks/exhaustive-deps

  // Tap outside the time editor commits + collapses.
  useEffect(() => {
    if (!editingTimes) return;
    function handler(e: MouseEvent) {
      if (timesRef.current && !timesRef.current.contains(e.target as Node)) {
        commitTimes();
      }
    }
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [editingTimes, draftStartedAt, draftEndedAt]);

  if (!id) return <Navigate to="/" replace />;
  if (!session) {
    return (
      <div className="p-6">
        <p className="text-sm text-gray-500">Session not found.</p>
      </div>
    );
  }

  const isFinished = session.endedAt !== null;
  const canEdit = isEditing;

  function findExercise(exerciseId: string) {
    return exerciseLibrary.find((e) => e.id === exerciseId);
  }

  function handleSelectExercise(exercise: { id: string }) {
    addExerciseToSession(session!.id, exercise.id);
  }

  function startEditingName() {
    setDraftName(session!.name ?? "");
    setEditingName(true);
  }

  function commitName() {
    updateSession(session!.id, { name: draftName.trim() || null });
    setEditingName(false);
  }

  function startEditingTimes() {
    setDraftStartedAt(isoToLocalInput(session!.startedAt));
    setDraftEndedAt(session!.endedAt ? isoToLocalInput(session!.endedAt) : "");
    setEditingTimes(true);
  }

  function commitTimes() {
    const patch: { startedAt?: string; endedAt?: string | null } = {};
    if (draftStartedAt) patch.startedAt = localInputToIso(draftStartedAt);
    if (draftEndedAt) {
      patch.endedAt = localInputToIso(draftEndedAt);
    }
    updateSession(session!.id, patch);
    setEditingTimes(false);
  }

  return (
    <div className="mx-auto flex max-w-3xl flex-col gap-3 px-4 pt-6 pb-8">
      <Link to="/" className="flex items-center gap-1 text-sm text-gray-600">
        <ArrowLeft className="h-4 w-4" />
        Back
      </Link>

      <header className="flex items-start justify-between gap-3">
        <div className="flex min-w-0 flex-1 flex-col gap-1">
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
              autoComplete="off"
              placeholder="Session name"
              className="w-full rounded-md bg-gray-100 px-2 py-1 text-2xl font-semibold focus:outline-none focus:ring-2 focus:ring-black"
            />
          ) : (
            <button
              type="button"
              onClick={canEdit ? startEditingName : undefined}
              disabled={!canEdit}
              className="truncate text-left text-2xl font-semibold text-gray-900 disabled:cursor-default"
            >
              {session.name || "Untitled session"}
            </button>
          )}

          {editingTimes ? (
            <div ref={timesRef} className="flex flex-col gap-2 rounded-md bg-white p-2 ring-2 ring-black">
              <label className="flex flex-col gap-0.5 text-xs text-gray-500">
                Started
                <input
                  type="datetime-local"
                  value={draftStartedAt}
                  onChange={(e) => setDraftStartedAt(e.target.value)}
                  className="rounded-md bg-gray-50 px-2 py-1 text-sm text-gray-900 ring-1 ring-gray-300 focus:outline-none focus:ring-2 focus:ring-black"
                />
              </label>
              {isFinished && (
                <label className="flex flex-col gap-0.5 text-xs text-gray-500">
                  Ended
                  <input
                    type="datetime-local"
                    value={draftEndedAt}
                    onChange={(e) => setDraftEndedAt(e.target.value)}
                    className="rounded-md bg-gray-50 px-2 py-1 text-sm text-gray-900 ring-1 ring-gray-300 focus:outline-none focus:ring-2 focus:ring-black"
                  />
                </label>
              )}
              <button
                type="button"
                onClick={commitTimes}
                className="self-end rounded-full bg-black px-3 py-1 text-sm font-medium text-white"
              >
                Done
              </button>
            </div>
          ) : (
            <button
              type="button"
              onClick={canEdit ? startEditingTimes : undefined}
              disabled={!canEdit}
              className="text-left font-mono text-sm tabular-nums text-gray-500 disabled:cursor-default"
            >
              {isFinished ? (
                <>
                  {new Date(session.startedAt).toLocaleDateString(undefined, {
                    month: "short",
                    day: "numeric",
                  })}
                  {elapsed > 0 && ` · ${formatDuration(elapsed)}`}
                  {" · finished"}
                </>
              ) : (
                formatDuration(elapsed)
              )}
            </button>
          )}
        </div>

        {!editingName && !editingTimes && (
          <div className="flex shrink-0 items-center gap-2">
            {!isFinished ? (
              <button
                type="button"
                onClick={() => setConfirmFinish(true)}
                className="flex items-center gap-1 rounded-full bg-black px-4 py-2 text-sm font-medium text-white"
              >
                <Check className="h-4 w-4" />
                Finish
              </button>
            ) : isEditing ? (
              <button
                type="button"
                onClick={() => setIsEditing(false)}
                className="flex items-center gap-1 rounded-full bg-black px-4 py-2 text-sm font-medium text-white"
              >
                <Check className="h-4 w-4" />
                Done
              </button>
            ) : (
              <>
                <button
                  type="button"
                  onClick={() => setIsEditing(true)}
                  className="flex items-center gap-1 rounded-full bg-gray-100 px-3 py-2 text-sm font-medium text-gray-700"
                >
                  <Pencil className="h-4 w-4" />
                  Edit
                </button>
                <button
                  type="button"
                  onClick={() => setConfirmDelete(true)}
                  aria-label="Delete session"
                  className="flex h-9 w-9 items-center justify-center rounded-full bg-red-50 text-red-600"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </>
            )}
          </div>
        )}
      </header>

      {session.exercises.map((se) => {
        const exercise = findExercise(se.exerciseId);
        if (!exercise) return null;
        return (
          <SessionExerciseBlock
            key={se.id}
            sessionExercise={se}
            exercise={exercise}
            sessionFinished={isFinished}
            readOnly={!canEdit}
            onSetCompleted={() => restTimer.start(DEFAULT_REST_SECONDS)}
          />
        );
      })}

      {canEdit && (
        <button
          type="button"
          onClick={() => setPickerOpen(true)}
          className="flex items-center justify-center gap-1 rounded-xl border-2 border-dashed border-gray-300 bg-white py-3 text-sm font-medium text-gray-700"
        >
          <Plus className="h-4 w-4" />
          Add exercise
        </button>
      )}

      <ExercisePicker
        open={pickerOpen}
        onClose={() => setPickerOpen(false)}
        onSelect={handleSelectExercise}
      />

      <ConfirmDialog
        open={confirmFinish}
        title="Finish this session?"
        message="It'll move to read-only — tap Edit later if you need to fix anything."
        confirmLabel="Finish"
        onCancel={() => setConfirmFinish(false)}
        onConfirm={() => {
          finishSession(session.id);
          setConfirmFinish(false);
          navigate("/", { replace: true });
        }}
      />

      <ConfirmDialog
        open={confirmDelete}
        variant="danger"
        title="Delete this session?"
        message="All exercises and sets logged in this session will be permanently removed."
        confirmLabel="Delete"
        onCancel={() => setConfirmDelete(false)}
        onConfirm={() => {
          deleteSession(session.id);
          setConfirmDelete(false);
          navigate("/", { replace: true });
        }}
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
