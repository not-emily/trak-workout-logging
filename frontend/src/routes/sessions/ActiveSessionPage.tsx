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

  useEffect(() => {
    if (session && session.endedAt === null) setIsEditing(true);
  }, [session?.endedAt]); // eslint-disable-line react-hooks/exhaustive-deps

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
        <p className="text-sm text-fg-muted">Session not found.</p>
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
    <div className="mx-auto flex max-w-3xl flex-col gap-4 px-4 pt-6 pb-8">
      <Link
        to="/"
        className="flex w-fit items-center gap-1 text-xs font-semibold uppercase tracking-[0.18em] text-fg-subtle transition-colors hover:text-fg-muted"
      >
        <ArrowLeft className="h-3.5 w-3.5" />
        Back
      </Link>

      <header className="flex items-start justify-between gap-3">
        <div className="flex min-w-0 flex-1 flex-col">
          {/* Session name — small label for live, hero for finished */}
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
              className={`w-full rounded-md bg-surface-2 px-2 py-1 text-fg ring-2 ring-accent focus:outline-none ${
                isFinished ? "font-display text-3xl" : "text-base"
              }`}
            />
          ) : !isFinished ? (
            <button
              type="button"
              onClick={canEdit ? startEditingName : undefined}
              disabled={!canEdit}
              className="flex items-center gap-2 self-start text-left text-[11px] font-semibold uppercase tracking-[0.18em] text-fg-subtle disabled:cursor-default"
            >
              <span className="relative flex h-1.5 w-1.5">
                <span className="absolute inset-0 animate-ping rounded-full bg-accent opacity-60" />
                <span className="relative h-1.5 w-1.5 rounded-full bg-accent" />
              </span>
              {session.name || "Live session"}
            </button>
          ) : (
            <button
              type="button"
              onClick={canEdit ? startEditingName : undefined}
              disabled={!canEdit}
              className="truncate text-left font-display text-3xl leading-none text-fg disabled:cursor-default"
            >
              {session.name || "Untitled session"}
            </button>
          )}

          {/* Time row — hero timer for live, datestamp for finished */}
          {editingTimes ? (
            <div
              ref={timesRef}
              className="mt-2 flex flex-col gap-2 rounded-lg border border-line-strong bg-surface-2 p-3"
            >
              <label className="flex flex-col gap-1 text-[10px] font-semibold uppercase tracking-[0.18em] text-fg-subtle">
                Started
                <input
                  type="datetime-local"
                  value={draftStartedAt}
                  onChange={(e) => setDraftStartedAt(e.target.value)}
                  className="rounded-md border border-line-strong bg-surface-1 px-2 py-1.5 text-sm text-fg [color-scheme:dark] focus:border-accent focus:outline-none"
                />
              </label>
              {isFinished && (
                <label className="flex flex-col gap-1 text-[10px] font-semibold uppercase tracking-[0.18em] text-fg-subtle">
                  Ended
                  <input
                    type="datetime-local"
                    value={draftEndedAt}
                    onChange={(e) => setDraftEndedAt(e.target.value)}
                    className="rounded-md border border-line-strong bg-surface-1 px-2 py-1.5 text-sm text-fg [color-scheme:dark] focus:border-accent focus:outline-none"
                  />
                </label>
              )}
              <button
                type="button"
                onClick={commitTimes}
                className="self-end rounded-full bg-accent px-3 py-1 text-xs font-semibold text-accent-fg"
              >
                Done
              </button>
            </div>
          ) : !isFinished ? (
            <button
              type="button"
              onClick={canEdit ? startEditingTimes : undefined}
              disabled={!canEdit}
              className="mt-1 text-left font-display text-6xl leading-none text-fg tabular disabled:cursor-default"
            >
              {formatDuration(elapsed)}
            </button>
          ) : (
            <button
              type="button"
              onClick={canEdit ? startEditingTimes : undefined}
              disabled={!canEdit}
              className="mt-1.5 text-left text-xs font-medium text-fg-muted disabled:cursor-default"
            >
              <span className="font-mono uppercase tracking-wide">
                {new Date(session.startedAt).toLocaleDateString(undefined, {
                  month: "short",
                  day: "numeric",
                })}
                {elapsed > 0 && ` · ${formatDuration(elapsed)}`}
              </span>
              <span className="ml-2 rounded-sm bg-surface-2 px-1.5 py-0.5 text-[9px] font-semibold uppercase tracking-[0.18em] text-fg-subtle">
                finished
              </span>
            </button>
          )}
        </div>

        {!editingName && !editingTimes && (
          <div className="flex shrink-0 items-center gap-2">
            {!isFinished ? (
              <button
                type="button"
                onClick={() => setConfirmFinish(true)}
                className="flex items-center gap-1.5 rounded-full bg-accent px-4 py-2 text-sm font-semibold text-accent-fg transition-colors hover:bg-accent-hover"
              >
                <Check className="h-4 w-4" strokeWidth={2.5} />
                Finish
              </button>
            ) : isEditing ? (
              <button
                type="button"
                onClick={() => setIsEditing(false)}
                className="flex items-center gap-1.5 rounded-full bg-accent px-4 py-2 text-sm font-semibold text-accent-fg transition-colors hover:bg-accent-hover"
              >
                <Check className="h-4 w-4" strokeWidth={2.5} />
                Done
              </button>
            ) : (
              <>
                <button
                  type="button"
                  onClick={() => setIsEditing(true)}
                  className="flex items-center gap-1.5 rounded-full bg-surface-2 px-3 py-2 text-sm font-medium text-fg-muted transition-colors hover:bg-surface-3 hover:text-fg"
                >
                  <Pencil className="h-4 w-4" />
                  Edit
                </button>
                <button
                  type="button"
                  onClick={() => setConfirmDelete(true)}
                  aria-label="Delete session"
                  className="flex h-9 w-9 items-center justify-center rounded-full bg-danger-soft text-danger transition-colors hover:bg-danger hover:text-fg"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </>
            )}
          </div>
        )}
      </header>

      <div className="mt-2 flex flex-col gap-3">
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
            className="flex items-center justify-center gap-1.5 rounded-xl border border-dashed border-line-strong bg-surface-1/50 py-3.5 text-sm font-medium text-fg-muted transition-colors hover:border-accent hover:bg-surface-1 hover:text-accent"
          >
            <Plus className="h-4 w-4" />
            Add exercise
          </button>
        )}
      </div>

      <ExercisePicker
        open={pickerOpen}
        onClose={() => setPickerOpen(false)}
        onSelect={handleSelectExercise}
        maxWidth="md:max-w-3xl"
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
