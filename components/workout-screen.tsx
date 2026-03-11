"use client";

import { useEffect, useMemo, useState } from "react";
import { Check, CheckCircle2, ChevronRight, X } from "lucide-react";

import { Card } from "@/components/ui";
import { getExercisePerformance } from "@/lib/progression";
import type { ActiveWorkout, Profile, WorkoutPlanDay, WorkoutSession } from "@/lib/types";

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
  userSessions,
  onStartWorkout,
  onUpdateSet,
  onCompleteSet,
  onCompleteWorkout,
  onCancelWorkout,
}: {
  profile: Profile;
  todaysWorkoutId: string;
  activeWorkout: ActiveWorkout | null;
  activeWorkoutTemplate: WorkoutPlanDay | undefined;
  userSessions: WorkoutSession[];
  onStartWorkout: (workout: WorkoutPlanDay) => void;
  onUpdateSet: (
    exerciseIndex: number,
    setIndex: number,
    field: "weight" | "reps",
    value: number,
  ) => void;
  onCompleteSet: (exerciseIndex: number, setIndex: number) => void;
  onCompleteWorkout: () => void;
  onCancelWorkout: () => void;
}) {
  const [currentExerciseIndex, setCurrentExerciseIndex] = useState(0);

  useEffect(() => {
    if (!activeWorkout || activeWorkout.userId !== profile.id) {
      setCurrentExerciseIndex(0);
      return;
    }
    setCurrentExerciseIndex(getFirstPendingExerciseIndex(activeWorkout.exercises));
  }, [activeWorkout?.id, activeWorkout?.userId, profile.id]);

  useEffect(() => {
    if (!activeWorkout || activeWorkout.userId !== profile.id) {
      return;
    }
    setCurrentExerciseIndex((current) => Math.min(current, activeWorkout.exercises.length - 1));
  }, [activeWorkout, profile.id]);

  if (!activeWorkout || activeWorkout.userId !== profile.id) {
    return (
      <Card>
        <p className="text-sm text-muted">Preset plan</p>
        <h2 className="mt-1 text-2xl font-semibold tracking-[-0.04em]">Begin any workout day</h2>
        <p className="mt-2 text-sm leading-6 text-muted">
          Begin Session opens a focused workout mode with only the current exercise and set logging.
        </p>
        <div className="mt-4 space-y-3">
          {profile.workoutPlan.map((workout) => (
            <button
              key={workout.id}
              className={`animate-fade-up w-full rounded-[24px] border px-4 py-4 text-left transition duration-300 dark:bg-white/5 ${
                workout.id === todaysWorkoutId
                  ? "border-accent bg-accentSoft/70 shadow-glow"
                  : "border-stroke bg-white/50 hover:-translate-y-0.5 hover:bg-white/70"
              }`}
              onClick={() => onStartWorkout(workout)}
            >
              <div className="flex items-center justify-between gap-4">
                <div>
                  <div className="flex items-center gap-2">
                    <p className="font-medium">{workout.name}</p>
                    <span className="rounded-full border border-stroke bg-[var(--card-strong)]/70 px-2.5 py-1 text-[11px] font-medium text-muted shadow-[var(--shadow-soft)]">
                      {workout.exercises.length} exercises
                    </span>
                    {workout.id === todaysWorkoutId && (
                      <span className="rounded-full bg-accent px-2.5 py-1 text-[11px] font-semibold text-white">
                        Today
                      </span>
                    )}
                  </div>
                  <p className="mt-1 text-sm text-muted">{workout.focus}</p>
                </div>
                <div className="text-right">
                  <p className="text-sm text-muted">{workout.dayLabel}</p>
                  <p className="mt-2 rounded-full bg-[var(--card-strong)]/70 px-3 py-2 text-xs font-semibold text-text shadow-[var(--shadow-soft)]">
                    Begin Session
                  </p>
                </div>
              </div>
            </button>
          ))}
        </div>
      </Card>
    );
  }

  const totalSets = activeWorkout.exercises.reduce((sum, exercise) => sum + exercise.sets.length, 0);
  const completedSets = activeWorkout.exercises.reduce(
    (sum, exercise) => sum + exercise.sets.filter((set) => set.completed).length,
    0,
  );
  const progressPercent = Math.round((completedSets / Math.max(totalSets, 1)) * 100);
  const currentExercise = activeWorkout.exercises[currentExerciseIndex];
  const currentTemplate = activeWorkoutTemplate?.exercises.find((exercise) => exercise.id === currentExercise.exerciseId);
  const currentSetIndex = getFirstIncompleteSetIndex(currentExercise.sets);
  const currentSet = currentExercise.sets[currentSetIndex];
  const exerciseComplete = currentExercise.sets.every((set) => set.completed);
  const performance = currentTemplate
    ? getExercisePerformance(currentTemplate, userSessions)
    : {
        lastSession: "No previous session yet",
        bestPerformance: "Set a baseline today",
        suggestion: "Start comfortably and keep 1 to 2 reps in reserve.",
      };
  const hasNextExercise = currentExerciseIndex < activeWorkout.exercises.length - 1;
  const nextExerciseName = hasNextExercise ? activeWorkout.exercises[currentExerciseIndex + 1].exerciseName : null;
  const currentExerciseCompletedSets = currentExercise.sets.filter((set) => set.completed).length;
  const canCompleteSet = Boolean(currentSet && (currentSet.reps > 0 || currentSet.weight > 0) && !currentSet.completed);

  const exerciseProgressLabel = useMemo(
    () => `${currentExerciseIndex + 1} of ${activeWorkout.exercises.length}`,
    [activeWorkout.exercises.length, currentExerciseIndex],
  );

  const handleCompleteSet = () => {
    if (!currentSet || !canCompleteSet) {
      return;
    }

    const nextSetIndex = currentExercise.sets.findIndex((set, index) => index > currentSetIndex && !set.completed);
    const nextExerciseIndex = getNextExerciseIndex(activeWorkout.exercises, currentExerciseIndex);

    onCompleteSet(currentExerciseIndex, currentSetIndex);

    if (nextSetIndex !== -1) {
      return;
    }

    if (nextExerciseIndex !== currentExerciseIndex) {
      setCurrentExerciseIndex(nextExerciseIndex);
    }
  };

  const handleNextExercise = () => {
    if (!hasNextExercise) {
      return;
    }
    setCurrentExerciseIndex((current) => Math.min(current + 1, activeWorkout.exercises.length - 1));
  };

  return (
    <div className="space-y-4">
      <Card className="overflow-hidden border-white/10 bg-[rgba(2,2,4,0.92)] px-5 py-5 shadow-[0_30px_80px_rgba(0,0,0,0.62)]">
        <div className="pointer-events-none absolute inset-0 rounded-[32px] bg-[radial-gradient(circle_at_top,rgba(255,255,255,0.08),transparent_42%)] opacity-80" />
        <div className="relative z-10 flex items-start justify-between gap-3">
          <div>
            <p className="text-xs uppercase tracking-[0.24em] text-white/55">Workout Mode</p>
            <h2 className="mt-2 text-[15px] font-semibold text-white/75">{activeWorkout.workoutName}</h2>
          </div>
          <button
            className="rounded-full border border-white/10 bg-white/[0.04] p-3 text-white/72"
            onClick={onCancelWorkout}
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="relative z-10 mt-6">
          <div className="flex items-center justify-between text-sm text-white/62">
            <span>Exercise {exerciseProgressLabel}</span>
            <span>{progressPercent}% complete</span>
          </div>
          <div className="mt-3 h-2 rounded-full bg-white/10">
            <div
              className="h-2 rounded-full bg-white transition-all duration-500"
              style={{ width: `${progressPercent}%` }}
            />
          </div>
        </div>

        <div className="relative z-10 mt-8">
          <p className="text-sm font-medium text-white/52">Current exercise</p>
          <h1 className="mt-2 text-[34px] font-bold leading-[1.02] text-white">{currentExercise.exerciseName}</h1>
          <div className="mt-4 flex flex-wrap items-center gap-2 text-sm text-white/68">
            <span className="rounded-full border border-white/10 bg-white/[0.04] px-3 py-2">
              Set {Math.min(currentSetIndex + 1, currentExercise.sets.length)} of {currentExercise.sets.length}
            </span>
            <span className="rounded-full border border-white/10 bg-white/[0.04] px-3 py-2">
              Target: {currentTemplate?.repRange ?? "Track reps"}
            </span>
          </div>
          {currentTemplate?.note ? (
            <p className="mt-4 max-w-[28ch] text-sm leading-6 text-white/55">{currentTemplate.note}</p>
          ) : null}
        </div>

        <div className="relative z-10 mt-6 grid grid-cols-2 gap-3">
          <div className="rounded-[28px] border border-white/10 bg-white/[0.04] px-4 py-4">
            <p className="text-xs uppercase tracking-[0.22em] text-white/45">Weight</p>
            <input
              className="mt-3 w-full bg-transparent text-[36px] font-bold text-white outline-none"
              inputMode="decimal"
              type="number"
              value={currentSet?.weight || ""}
              placeholder="0"
              onChange={(event) =>
                onUpdateSet(currentExerciseIndex, currentSetIndex, "weight", Number(event.target.value))
              }
            />
            <p className="mt-1 text-xs text-white/38">Auto-loads from last session</p>
          </div>
          <div className="rounded-[28px] border border-white/10 bg-white/[0.04] px-4 py-4">
            <p className="text-xs uppercase tracking-[0.22em] text-white/45">Reps</p>
            <input
              className="mt-3 w-full bg-transparent text-[36px] font-bold text-white outline-none"
              inputMode="numeric"
              type="number"
              value={currentSet?.reps || ""}
              placeholder="0"
              onChange={(event) =>
                onUpdateSet(currentExerciseIndex, currentSetIndex, "reps", Number(event.target.value))
              }
            />
            <p className="mt-1 text-xs text-white/38">
              {currentTemplate ? `Target ${currentTemplate.repRange} reps` : "Log today's result"}
            </p>
          </div>
        </div>

        <div className="relative z-10 mt-6 rounded-[28px] border border-white/10 bg-white/[0.035] px-4 py-4">
          <div className="flex items-center justify-between">
            <p className="text-sm font-medium text-white">Completed sets</p>
            <p className="text-sm text-white/55">{currentExerciseCompletedSets} logged</p>
          </div>
          <div className="mt-4 grid grid-cols-2 gap-3">
            {currentExercise.sets.map((set, index) => (
              <div
                key={set.id}
                className={`rounded-[22px] border px-3 py-3 transition duration-300 ${
                  set.completed
                    ? "border-white/12 bg-white text-black"
                    : index === currentSetIndex
                      ? "border-white/20 bg-white/[0.08] text-white"
                      : "border-white/8 bg-white/[0.03] text-white/68"
                }`}
              >
                <div className="flex items-center justify-between">
                  <p className="text-sm font-semibold">Set {index + 1}</p>
                  {set.completed ? <Check className="h-4 w-4" /> : null}
                </div>
                <p className="mt-2 text-sm">
                  {set.completed
                    ? `${set.weight > 0 ? `${set.weight}kg` : "Bodyweight"} x ${set.reps}`
                    : "Waiting"}
                </p>
              </div>
            ))}
          </div>
        </div>

        <div className="relative z-10 mt-5 rounded-[24px] border border-white/10 bg-white/[0.03] px-4 py-4">
          <p className="text-xs uppercase tracking-[0.22em] text-white/42">Previous performance</p>
          <p className="mt-3 text-sm text-white/78">Last: {performance.lastSession}</p>
          <p className="mt-1 text-sm text-white/52">Best: {performance.bestPerformance}</p>
        </div>

        <button
          className={`relative z-10 mt-6 flex w-full items-center justify-center gap-2 rounded-[28px] px-5 py-5 text-base font-bold transition duration-300 ${
            canCompleteSet
              ? "bg-white text-black shadow-[0_18px_34px_rgba(255,255,255,0.18)]"
              : "cursor-not-allowed bg-white/[0.08] text-white/45"
          }`}
          disabled={!canCompleteSet}
          onClick={handleCompleteSet}
        >
          <CheckCircle2 className="h-5 w-5" />
          Complete Set
        </button>
      </Card>

      <div className="grid grid-cols-2 gap-3">
        <button
          className={`rounded-[28px] border px-4 py-4 text-sm font-semibold transition duration-300 ${
            hasNextExercise
              ? "border-white/10 bg-[rgba(6,6,8,0.92)] text-white shadow-[0_18px_34px_rgba(0,0,0,0.36)]"
              : "cursor-not-allowed border-white/6 bg-[rgba(6,6,8,0.72)] text-white/35"
          }`}
          disabled={!hasNextExercise}
          onClick={handleNextExercise}
        >
          <div className="flex items-center justify-center gap-2">
            Next Exercise
            <ChevronRight className="h-4 w-4" />
          </div>
          <p className="mt-1 text-xs text-white/42">{nextExerciseName ?? "Last exercise"}</p>
        </button>
        <button
          className="rounded-[28px] bg-white px-4 py-4 text-sm font-bold text-black shadow-[0_20px_38px_rgba(255,255,255,0.12)]"
          onClick={onCompleteWorkout}
        >
          Finish Workout
        </button>
      </div>
    </div>
  );
}
