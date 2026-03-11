"use client";

import { useEffect, useState } from "react";
import { ChevronRight } from "lucide-react";

import { ExitSessionModal } from "@/components/exit-session-modal";
import { Card } from "@/components/ui";
import type { ActiveWorkout, Profile, WorkoutPlanDay } from "@/lib/types";

function getFirstIncompleteSetIndex(sets: ActiveWorkout["exercises"][number]["sets"]) {
  const index = sets.findIndex((set) => !set.completed);
  return index === -1 ? sets.length - 1 : index;
}

function getNextExerciseIndex(exercises: ActiveWorkout["exercises"], currentIndex: number) {
  for (let index = currentIndex + 1; index < exercises.length; index += 1) {
    if (exercises[index].sets.some((set) => !set.completed)) {
      return index;
    }
  }
  return Math.min(currentIndex + 1, exercises.length - 1);
}

function getFirstPendingExerciseIndex(exercises: ActiveWorkout["exercises"]) {
  const index = exercises.findIndex((exercise) => exercise.sets.some((set) => !set.completed));
  return index === -1 ? 0 : index;
}

export function WorkoutScreen({
  profile,
  todaysWorkoutId,
  activeWorkout,
  activeWorkoutTemplate,
  onStartWorkout,
  onUpdateSet,
  onCompleteSet,
  onTriggerRestTimer,
  onCompleteWorkout,
  onCancelWorkout,
}: {
  profile: Profile;
  todaysWorkoutId: string;
  activeWorkout: ActiveWorkout | null;
  activeWorkoutTemplate: WorkoutPlanDay | undefined;
  onStartWorkout: (workout: WorkoutPlanDay) => void;
  onUpdateSet: (
    exerciseIndex: number,
    setIndex: number,
    field: "weight" | "reps",
    value: number,
  ) => void;
  onCompleteSet: (exerciseIndex: number, setIndex: number) => void;
  onTriggerRestTimer: (seconds: number) => void;
  onCompleteWorkout: () => void;
  onCancelWorkout: () => void;
}) {
  const [currentExerciseIndex, setCurrentExerciseIndex] = useState(0);
  const [showExitConfirmation, setShowExitConfirmation] = useState(false);
  const [previewWorkoutId, setPreviewWorkoutId] = useState<string | null>(null);

  useEffect(() => {
    if (!activeWorkout || activeWorkout.userId !== profile.id) {
      setCurrentExerciseIndex(0);
      setShowExitConfirmation(false);
      return;
    }
    setPreviewWorkoutId(null);
    setCurrentExerciseIndex(getFirstPendingExerciseIndex(activeWorkout.exercises));
  }, [activeWorkout?.id, activeWorkout?.userId, profile.id]);

  if (!activeWorkout || activeWorkout.userId !== profile.id) {
    const previewWorkout = profile.workoutPlan.find((workout) => workout.id === previewWorkoutId) ?? null;

    return (
      <>
        <Card className="animate-page-in">
          <p className="text-sm text-muted">Workout plan</p>
          <h2 className="large-title mt-2 font-semibold text-text">Choose a day</h2>
          <div className="mt-4 space-y-3">
            {profile.workoutPlan.map((workout) => (
              <div
                key={workout.id}
                className={`rounded-[28px] px-4 py-4 transition duration-300 ${
                  workout.id === todaysWorkoutId ? "bg-accentSoft text-text" : "bg-[var(--card-strong)] text-text"
                }`}
              >
                <div className="flex items-center justify-between gap-4">
                  <div>
                    <p className="text-base font-medium">{workout.name}</p>
                    <p className="caption-text mt-1 text-muted">
                      {workout.dayLabel} | {workout.exercises.length} exercises
                    </p>
                  </div>
                  <div className="flex gap-2">
                    <button
                      className="rounded-[22px] bg-black/10 px-3 py-2 text-sm font-medium text-muted"
                      onClick={() => setPreviewWorkoutId(workout.id)}
                    >
                      Preview
                    </button>
                    <button
                      className="rounded-[22px] bg-white px-3 py-2 text-sm font-semibold text-black"
                      onClick={() => onStartWorkout(workout)}
                    >
                      Begin
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </Card>

        {previewWorkout ? (
          <div className="sheet-backdrop">
            <div className="sheet-panel animate-sheet-up">
              <Card className="bg-[var(--surface)]">
                <p className="text-sm text-muted">Workout preview</p>
                <h3 className="large-title mt-2 font-semibold text-text">{previewWorkout.name}</h3>
                <p className="medium-label mt-2 text-muted">
                  {previewWorkout.focus} | {previewWorkout.durationMinutes} min
                </p>

                <div className="mt-5 space-y-3">
                  {previewWorkout.exercises.map((exercise, index) => (
                    <div key={exercise.id} className="rounded-[24px] bg-[var(--card-strong)] px-4 py-4">
                      <div className="flex items-center justify-between gap-3">
                        <p className="text-sm font-medium text-text">
                          {index + 1}. {exercise.name}
                        </p>
                        <p className="caption-text text-muted">
                          {exercise.sets} x {exercise.repRange}
                        </p>
                      </div>
                      {exercise.note ? <p className="medium-label mt-2 text-muted">{exercise.note}</p> : null}
                    </div>
                  ))}
                </div>

                <div className="mt-6 grid grid-cols-2 gap-3">
                  <button
                    className="rounded-[28px] bg-[var(--card-strong)] px-4 py-4 text-sm font-medium text-muted"
                    onClick={() => setPreviewWorkoutId(null)}
                  >
                    Close
                  </button>
                  <button
                    className="rounded-[28px] bg-white px-4 py-4 text-sm font-semibold text-black"
                    onClick={() => onStartWorkout(previewWorkout)}
                  >
                    Begin Session
                  </button>
                </div>
              </Card>
            </div>
          </div>
        ) : null}
      </>
    );
  }

  const currentExercise = activeWorkout.exercises[currentExerciseIndex];
  const currentTemplate = activeWorkoutTemplate?.exercises.find((exercise) => exercise.id === currentExercise.exerciseId);
  const currentSetIndex = getFirstIncompleteSetIndex(currentExercise.sets);
  const currentSet = currentExercise.sets[currentSetIndex];
  const hasNextExercise = currentExerciseIndex < activeWorkout.exercises.length - 1;
  const nextExerciseName = hasNextExercise ? activeWorkout.exercises[currentExerciseIndex + 1].exerciseName : null;
  const canCompleteSet = Boolean(currentSet && (currentSet.weight > 0 || currentSet.reps > 0) && !currentSet.completed);

  const handleCompleteSet = () => {
    if (!currentSet || !canCompleteSet) {
      return;
    }

    const nextSetIndex = currentExercise.sets.findIndex((set, index) => index > currentSetIndex && !set.completed);
    const nextExerciseIndex = getNextExerciseIndex(activeWorkout.exercises, currentExerciseIndex);

    onCompleteSet(currentExerciseIndex, currentSetIndex);
    onTriggerRestTimer(currentTemplate?.restSeconds ?? 90);

    if (nextSetIndex === -1 && nextExerciseIndex !== currentExerciseIndex) {
      setCurrentExerciseIndex(nextExerciseIndex);
    }
  };

  return (
    <div className="space-y-4">
      <Card className="animate-page-in bg-[rgba(5,6,8,0.92)] px-5 py-6 shadow-[var(--shadow-card)]">
        <p className="text-sm text-muted">Current exercise</p>
        <h1 className="large-title mt-3 font-semibold text-text">{currentExercise.exerciseName}</h1>
        {nextExerciseName ? (
          <p className="caption-text mt-3 text-muted">
            Next up: <span className="text-text">{nextExerciseName}</span>
          </p>
        ) : (
          <p className="caption-text mt-3 text-muted">Final exercise in this session.</p>
        )}

        <div className="mt-6 grid grid-cols-2 gap-3">
          <div className="rounded-[28px] bg-[var(--card-strong)] px-4 py-4">
            <p className="text-sm text-muted">Set</p>
            <p className="mt-2 text-2xl font-semibold text-text">
              {Math.min(currentSetIndex + 1, currentExercise.sets.length)} of {currentExercise.sets.length}
            </p>
          </div>
          <div className="rounded-[28px] bg-[var(--card-strong)] px-4 py-4">
            <p className="text-sm text-muted">Target</p>
            <p className="mt-2 text-2xl font-semibold text-text">{currentTemplate?.repRange ?? "Track reps"}</p>
          </div>
        </div>

        <div className="mt-6 grid grid-cols-2 gap-3">
          <label className="rounded-[28px] bg-[var(--card-strong)] px-4 py-4">
            <span className="text-sm text-muted">Weight</span>
            <input
              className="mt-3 w-full bg-transparent text-[36px] font-semibold text-text outline-none"
              inputMode="decimal"
              type="number"
              value={currentSet?.weight || ""}
              placeholder="0"
              onChange={(event) =>
                onUpdateSet(currentExerciseIndex, currentSetIndex, "weight", Number(event.target.value))
              }
            />
          </label>
          <label className="rounded-[28px] bg-[var(--card-strong)] px-4 py-4">
            <span className="text-sm text-muted">Reps</span>
            <input
              className="mt-3 w-full bg-transparent text-[36px] font-semibold text-text outline-none"
              inputMode="numeric"
              type="number"
              value={currentSet?.reps || ""}
              placeholder="0"
              onChange={(event) =>
                onUpdateSet(currentExerciseIndex, currentSetIndex, "reps", Number(event.target.value))
              }
            />
          </label>
        </div>

        <div className="mt-6">
          <p className="text-sm text-muted">Completed sets</p>
          <div className="mt-3 grid grid-cols-2 gap-3">
            {currentExercise.sets.map((set, index) => (
              <div
                key={set.id}
                className={`rounded-[28px] px-4 py-4 text-sm ${
                  set.completed
                    ? "bg-white text-black"
                    : index === currentSetIndex
                      ? "bg-accentSoft text-text"
                      : "bg-[var(--card-strong)] text-muted"
                }`}
              >
                <p className="font-medium">Set {index + 1}</p>
                <p className="mt-2">
                  {set.completed ? `${set.weight > 0 ? `${set.weight}kg` : "Bodyweight"} x ${set.reps}` : "Waiting"}
                </p>
              </div>
            ))}
          </div>
        </div>

        <button
          className={`mt-6 w-full rounded-[28px] px-5 py-5 text-base font-semibold ${
            canCompleteSet ? "bg-white text-black" : "bg-[var(--card-strong)] text-muted"
          }`}
          disabled={!canCompleteSet}
          onClick={handleCompleteSet}
        >
          Complete Set
        </button>
      </Card>

      <div className="grid grid-cols-3 gap-3 animate-soft-in">
        <button
          className="rounded-[28px] bg-[var(--card-strong)] px-4 py-4 text-sm font-medium text-muted"
          onClick={() => setShowExitConfirmation(true)}
        >
          Exit Session
        </button>
        <button
          className={`rounded-[28px] px-4 py-4 text-sm font-medium ${
            hasNextExercise ? "bg-[var(--card-strong)] text-text" : "bg-[var(--card-strong)] text-muted"
          }`}
          disabled={!hasNextExercise}
          onClick={() => setCurrentExerciseIndex((current) => Math.min(current + 1, activeWorkout.exercises.length - 1))}
        >
          <div className="flex items-center justify-center gap-2">
            Next Exercise
            <ChevronRight className="h-4 w-4" />
          </div>
          <p className="caption-text mt-1 text-muted">{nextExerciseName ?? "Session finish next"}</p>
        </button>
        <button
          className="rounded-[28px] bg-white px-4 py-4 text-sm font-semibold text-black"
          onClick={onCompleteWorkout}
        >
          Finish Workout
        </button>
      </div>

      <ExitSessionModal
        open={showExitConfirmation}
        onClose={() => setShowExitConfirmation(false)}
        onConfirm={onCancelWorkout}
      />
    </div>
  );
}
