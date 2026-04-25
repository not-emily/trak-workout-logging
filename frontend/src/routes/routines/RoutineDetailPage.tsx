import { useState } from "react";
import { Link, Navigate, useNavigate, useParams } from "react-router";
import {
  DndContext,
  closestCenter,
  PointerSensor,
  TouchSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
} from "@dnd-kit/core";
import { SortableContext, verticalListSortingStrategy } from "@dnd-kit/sortable";
import { ArrowLeft, Plus, Play, Trash2 } from "lucide-react";
import { useRoutine } from "@/features/routine/useRoutines";
import {
  addRoutineExercise,
  deleteRoutine,
  reorderRoutineExercises,
  startSessionFromRoutine,
  updateRoutine,
} from "@/features/routine/routineActions";
import { useExercises } from "@/features/exercise/useExercises";
import { AddExerciseSheet } from "@/components/sessions/AddExerciseSheet";
import { RoutineExerciseBlock } from "@/components/routines/RoutineExerciseBlock";

export function RoutineDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const routine = useRoutine(id);
  const { exercises: exerciseLibrary } = useExercises();
  const [pickerOpen, setPickerOpen] = useState(false);
  const [editingName, setEditingName] = useState(false);
  const [draftName, setDraftName] = useState("");
  const [editingDescription, setEditingDescription] = useState(false);
  const [draftDescription, setDraftDescription] = useState("");

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
    useSensor(TouchSensor, { activationConstraint: { delay: 200, tolerance: 5 } }),
  );

  if (!id) return <Navigate to="/routines" replace />;
  if (!routine) {
    return <p className="p-6 text-sm text-gray-500">Routine not found.</p>;
  }

  function findExercise(exerciseId: string) {
    return exerciseLibrary.find((e) => e.id === exerciseId);
  }

  function handleAddExercise(exercise: { id: string }) {
    addRoutineExercise(routine!.id, exercise.id);
  }

  function handleStartSession() {
    const session = startSessionFromRoutine(routine!, findExercise);
    navigate(`/sessions/${session.id}`);
  }

  function handleDelete() {
    if (!confirm(`Delete "${routine!.name}"? This cannot be undone.`)) return;
    deleteRoutine(routine!.id);
    navigate("/routines", { replace: true });
  }

  function startEditingName() {
    setDraftName(routine!.name);
    setEditingName(true);
  }

  function commitName() {
    const trimmed = draftName.trim();
    if (trimmed && trimmed !== routine!.name) {
      updateRoutine(routine!.id, { name: trimmed });
    }
    setEditingName(false);
  }

  function startEditingDescription() {
    setDraftDescription(routine!.description ?? "");
    setEditingDescription(true);
  }

  function commitDescription() {
    const trimmed = draftDescription.trim();
    updateRoutine(routine!.id, { description: trimmed || null });
    setEditingDescription(false);
  }

  function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event;
    if (!over || active.id === over.id) return;
    const oldIds = routine!.exercises.map((re) => re.id);
    const oldIndex = oldIds.indexOf(active.id as string);
    const newIndex = oldIds.indexOf(over.id as string);
    if (oldIndex < 0 || newIndex < 0) return;
    const newOrder = [...oldIds];
    newOrder.splice(oldIndex, 1);
    newOrder.splice(newIndex, 0, active.id as string);
    reorderRoutineExercises(routine!.id, newOrder);
  }

  return (
    <div className="flex flex-col gap-4 p-4">
      <Link to="/routines" className="flex items-center gap-1 text-sm text-gray-600">
        <ArrowLeft className="h-4 w-4" />
        Back
      </Link>

      <header className="flex items-start justify-between gap-3">
        <div className="flex flex-1 flex-col gap-1">
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
              className="rounded-md bg-gray-100 px-2 py-1 text-2xl font-semibold focus:outline-none focus:ring-2 focus:ring-black"
            />
          ) : (
            <button
              type="button"
              onClick={startEditingName}
              className="text-left text-2xl font-semibold text-gray-900"
            >
              {routine.name}
            </button>
          )}

          {editingDescription ? (
            <textarea
              value={draftDescription}
              onChange={(e) => setDraftDescription(e.target.value)}
              onBlur={commitDescription}
              autoFocus
              rows={2}
              placeholder="Description"
              className="rounded-md bg-gray-100 px-2 py-1 text-sm focus:outline-none focus:ring-2 focus:ring-black"
            />
          ) : (
            <button
              type="button"
              onClick={startEditingDescription}
              className="text-left text-sm text-gray-600"
            >
              {routine.description || (
                <span className="text-gray-400">Add description</span>
              )}
            </button>
          )}
        </div>

        <button
          type="button"
          onClick={handleDelete}
          aria-label="Delete routine"
          className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-red-50 text-red-600"
        >
          <Trash2 className="h-4 w-4" />
        </button>
      </header>

      {routine.exercises.length > 0 && (
        <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
          <SortableContext items={routine.exercises.map((re) => re.id)} strategy={verticalListSortingStrategy}>
            <div className="flex flex-col gap-2">
              {routine.exercises.map((re) => {
                const exercise = findExercise(re.exerciseId);
                if (!exercise) return null;
                return (
                  <RoutineExerciseBlock
                    key={re.id}
                    routineExercise={re}
                    exercise={exercise}
                  />
                );
              })}
            </div>
          </SortableContext>
        </DndContext>
      )}

      <button
        type="button"
        onClick={() => setPickerOpen(true)}
        className="flex items-center justify-center gap-1 rounded-xl border-2 border-dashed border-gray-300 bg-white py-3 text-sm font-medium text-gray-700"
      >
        <Plus className="h-4 w-4" />
        Add exercise
      </button>

      {routine.exercises.length > 0 && (
        <button
          type="button"
          onClick={handleStartSession}
          className="flex items-center justify-center gap-2 rounded-xl bg-black py-3 text-base font-medium text-white"
        >
          <Play className="h-4 w-4" />
          Start session
        </button>
      )}

      <AddExerciseSheet
        open={pickerOpen}
        onClose={() => setPickerOpen(false)}
        onSelect={handleAddExercise}
      />
    </div>
  );
}
