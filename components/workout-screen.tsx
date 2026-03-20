"use client";

import { useEffect, useRef, useState } from "react";
import { Check, ChevronRight } from "lucide-react";

import { ExitSessionModal } from "@/components/exit-session-modal";
import { ScrollReveal } from "@/components/scroll-reveal";
import { Card } from "@/components/ui";
import { getPreviousBestScore, getSuggestedStartingWeight, isPersonalBestSet } from "@/lib/progression";
import type { ActiveWorkout, ExerciseLibraryItem, Profile, WorkoutPlanDay, WorkoutSession } from "@/lib/types";

const substitutionHints: Record<string, string[]> = {
    "Barbell Hip Thrust": ["Smith Machine Hip Thrust", "Machine Hip Thrust", "Glute Bridge Machine"],
    "Machine Hip Thrust": ["Smith Machine Hip Thrust", "Glute Bridge Machine", "Leg Press High Foot Placement"],
    "Lat Pulldown": ["Single-Arm Lat Pulldown", "Assisted Pull-Up", "Machine Lat Pullover"],
    "Wide-Grip Lat Pulldown": ["Single-Arm Lat Pulldown", "Assisted Pull-Up", "Machine Lat Pullover"],
    "Neutral-Grip Lat Pulldown": ["Single-Arm Lat Pulldown", "Assisted Pull-Up", "Machine Lat Pullover"],
    "Lat Pullover": ["Machine Lat Pullover", "Straight-Arm Pulldown", "Single-Arm Lat Pulldown"],
    "Barbell Row": ["Seated Cable Row", "Machine Row", "Chest-Supported Dumbbell Row"],
    "Single-Arm Seated Row": ["Seated Cable Row", "Machine Row", "Single-Arm Dumbbell Row"],
    "Flat Dumbbell Press": ["Flat Machine Press", "Smith Machine Flat Press", "Plate-Loaded Chest Press"],
    "Incline Dumbbell Press": ["Incline Machine Press", "Smith Incline Press", "Plate-Loaded Chest Press"],
    "Machine Chest Fly": ["Flat Machine Press", "Incline Machine Press", "Plate-Loaded Chest Press"],
    "Chest-Supported Dumbbell Row": ["Seated Cable Row", "Machine Row", "Single-Arm Lat Pulldown"],
    "Single-Arm Dumbbell Row": ["Seated Cable Row", "Machine Row", "Chest-Supported Dumbbell Row"],
    "Seated Cable Row": ["Machine Row", "Single-Arm Dumbbell Row", "Chest-Supported Dumbbell Row"],
    "Close-Grip Seated Cable Row": ["Machine Row", "Seated Cable Row", "Single-Arm Dumbbell Row"],
    "Smith Machine Squat": ["Pendulum Squat", "Goblet Squat", "Leg Press"],
    "Hack Squat": ["Leg Press", "Pendulum Squat", "Walking Lunge"],
    Squat: ["Pendulum Squat", "Goblet Squat", "Leg Press"],
    "Leg Press (Glute Bias)": ["Leg Press High Foot Placement", "Smith Machine Hip Thrust", "Walking Lunge"],
    "Dumbbell Shoulder Press": ["Plate-Loaded Shoulder Press", "Machine Shoulder Press", "Cable Lateral Raise"],
    "Machine Shoulder Press": ["Plate-Loaded Shoulder Press", "Seated Dumbbell Shoulder Press", "Cable Lateral Raise"],
    "Seated Dumbbell Shoulder Press": ["Plate-Loaded Shoulder Press", "Machine Shoulder Press", "Cable Lateral Raise"],
    "Cable Tricep Pushdown": ["Rope Pushdown", "Single-Arm Cable Extension", "Overhead Cable Tricep Extension"],
    "Overhead Cable Tricep Extension": ["Single-Arm Cable Extension", "Rope Pushdown", "Cable Skull Crusher"],
    "Cable Triceps Extension": ["Rope Pushdown", "Single-Arm Cable Extension", "Overhead Rope Extension"],
    "Cable Skull Crusher": ["Overhead Cable Tricep Extension", "Rope Pushdown", "Single-Arm Cable Extension"],
    "Preacher Curl": ["Cable Curl", "EZ-Bar Curl", "Incline Dumbbell Curl"],
    "Cable Bicep Curl": ["Cable Curl", "EZ-Bar Curl", "Preacher Curl"],
    "Dumbbell Bicep Curl": ["Cable Curl", "Preacher Curl", "EZ-Bar Curl"],
    "Machine Preacher Curl": ["Cable Curl", "EZ-Bar Curl", "Incline Dumbbell Curl"],
    Hyperextensions: ["45 Degree Back Extension", "Back Hyperextensions", "Romanian Deadlift"],
  };

function getSubstitutions(currentExerciseName: string, muscleGroup: string, library: ExerciseLibraryItem[]) {
  const preferredNames = substitutionHints[currentExerciseName] ?? [];
  const preferred = preferredNames
    .map((name) => library.find((item) => item.name === name))
    .filter((item): item is ExerciseLibraryItem => Boolean(item));

  const fallback = library.filter(
    (item) =>
      item.muscleGroup === muscleGroup &&
      item.name !== currentExerciseName &&
      !preferred.some((option) => option.id === item.id),
  );

  return [...preferred, ...fallback].slice(0, 2);
}

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

function isExerciseComplete(exercise: ActiveWorkout["exercises"][number]) {
  return exercise.sets.every((set) => set.completed);
}

function getPreviewTease(profileId: string, workoutId: string) {
  const previewTeases: Record<string, Record<string, string>> = {
    natasha: {
      "natasha-glutes-hams":
        "A slower, dirtier glute day that leaves Joshua thinking about your shape long after the gym.",
      "natasha-back-arms":
        "Back detail, arm tone, and that tempting line through your waist and shoulders.",
      "natasha-glutes-quads":
        "Legs and curves with the exact kind of fullness that keeps Joshua staring.",
      "natasha-upper-core":
        "Upper-body shape work for that feminine, dangerous little silhouette.",
      "natasha-core-explosive":
        "Sharp movement, hot energy, and a body that looks even better when it moves well.",
    },
    joshua: {
      "joshua-chest-triceps":
        "A pressing day built to make your upper body look thicker, broader, and harder to ignore.",
      "joshua-back-biceps":
        "Width, arm detail, and the kind of back Natasha wants wrapped around her.",
      "joshua-legs":
        "Broad shoulders, strong legs, and that solid athletic look landing all at once.",
      "joshua-shoulders-arms":
        "Another chest and triceps hit to keep you looking fuller, firmer, and more tempting.",
      "joshua-upper-strength":
        "Back and biceps again, because that wider, sexier frame is worth repeating.",
    },
  };

  return (
    previewTeases[profileId]?.[workoutId] ??
    "A clean session that keeps your body moving in the exact direction you want."
  );
}

function getLoadCue(repRange?: string) {
  if (!repRange) {
    return "Moderate load";
  }

  const lowerRange = repRange.toLowerCase();
  const firstNumber = Number.parseInt(lowerRange, 10);

  if (Number.isNaN(firstNumber)) {
    return "Moderate load";
  }

  if (lowerRange.includes("30-45")) {
    return "Light load";
  }

  if (firstNumber <= 8) {
    return "Heavy load";
  }

  if (firstNumber <= 12) {
    return "Moderate load";
  }

  return "Light load";
}

export function WorkoutScreen({
  profile,
  todaysWorkoutId,
  previewWorkoutId,
  activeWorkout,
  activeWorkoutTemplate,
  userSessions,
  exerciseLibrary,
    onStartWorkout,
    onUpdateSet,
    onCopyPreviousSet,
    onCompleteSet,
  onSwapExercise,
  onCompleteWorkout,
  onSaveAndExitWorkout,
  onCancelWorkout,
}: {
  profile: Profile;
  todaysWorkoutId: string;
  previewWorkoutId?: string | null;
  activeWorkout: ActiveWorkout | null;
  activeWorkoutTemplate: WorkoutPlanDay | undefined;
  userSessions: WorkoutSession[];
  exerciseLibrary: ExerciseLibraryItem[];
  onStartWorkout: (workout: WorkoutPlanDay) => void;
    onUpdateSet: (
      exerciseIndex: number,
      setIndex: number,
      field: "weight" | "reps",
      value: number,
    ) => void;
    onCopyPreviousSet: (exerciseIndex: number, setIndex: number) => void;
    onCompleteSet: (exerciseIndex: number, setIndex: number) => void;
  onSwapExercise: (exerciseIndex: number, exerciseId: string) => void;
  onCompleteWorkout: () => void;
  onSaveAndExitWorkout: () => void;
  onCancelWorkout: () => void;
}) {
  const [currentExerciseIndex, setCurrentExerciseIndex] = useState(0);
  const [showExitConfirmation, setShowExitConfirmation] = useState(false);
  const [showExercisePicker, setShowExercisePicker] = useState(false);
  const [localPreviewWorkoutId, setLocalPreviewWorkoutId] = useState<string | null>(null);
  const weightInputRef = useRef<HTMLInputElement | null>(null);
  const repsInputRef = useRef<HTMLInputElement | null>(null);
  const focusExercise = activeWorkout?.exercises[currentExerciseIndex];
  const focusSetIndex = focusExercise ? getFirstIncompleteSetIndex(focusExercise.sets) : 0;
  const focusSet = focusExercise?.sets[focusSetIndex];

  useEffect(() => {
    if (!activeWorkout || activeWorkout.userId !== profile.id) {
      setCurrentExerciseIndex(0);
      setShowExitConfirmation(false);
      setShowExercisePicker(false);
      return;
    }
    setLocalPreviewWorkoutId(null);
    setCurrentExerciseIndex(getFirstPendingExerciseIndex(activeWorkout.exercises));
    setShowExercisePicker(true);
  }, [activeWorkout?.id, activeWorkout?.userId, profile.id]);

  useEffect(() => {
    if (!activeWorkout || activeWorkout.userId !== profile.id) {
      setLocalPreviewWorkoutId(previewWorkoutId ?? null);
    }
  }, [activeWorkout, previewWorkoutId, profile.id]);

  useEffect(() => {
    if (!activeWorkout || activeWorkout.userId !== profile.id || showExercisePicker) {
      return;
    }

    const focusTimer = window.setTimeout(() => {
      if (focusSet?.weight && focusSet.weight > 0) {
        repsInputRef.current?.focus();
        return;
      }
      weightInputRef.current?.focus();
    }, 120);

    return () => window.clearTimeout(focusTimer);
  }, [
    activeWorkout?.id,
    activeWorkout?.userId,
    currentExerciseIndex,
    focusSet?.id,
    focusSet?.weight,
    profile.id,
    showExercisePicker,
  ]);

  if (!activeWorkout || activeWorkout.userId !== profile.id) {
    const previewWorkout = profile.workoutPlan.find((workout) => workout.id === localPreviewWorkoutId) ?? null;

    return (
      <>
        <ScrollReveal delay={0} y={14} scale={0.996}>
        <Card>
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
                      {workout.dayLabel} - {workout.exercises.length} exercises
                    </p>
                  </div>
                  <div className="flex gap-2">
                    <button
                      className="rounded-[22px] bg-black/10 px-3 py-2 text-sm font-medium text-muted"
                      onClick={() => setLocalPreviewWorkoutId(workout.id)}
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
        </ScrollReveal>

        {previewWorkout ? (
          <div className="sheet-backdrop">
            <div className="sheet-panel sheet-detent-large animate-sheet-up">
              <Card className="sheet-card bg-[var(--surface)]">
                <div className="sheet-drag-handle" />
                <p className="text-sm text-muted">Workout preview</p>
                <h3 className="large-title mt-2 font-semibold text-text">{previewWorkout.name}</h3>
                <p className="medium-label mt-2 text-muted">
                  {previewWorkout.focus} | {previewWorkout.durationMinutes} min
                </p>
                <p className="mt-3 text-sm leading-6 text-muted">
                  {getPreviewTease(profile.id, previewWorkout.id)}
                </p>

                <div className="mt-5 space-y-3">
                  {previewWorkout.exercises.map((exercise, index) => (
                    <ScrollReveal key={exercise.id} delay={index * 45} y={22} scale={0.992}>
                    <div className="rounded-[24px] bg-[var(--card-strong)] px-4 py-4">
                      <div className="flex items-center justify-between gap-3">
                        <p className="text-sm font-medium text-text">
                          {index + 1}. {exercise.name}
                        </p>
                        <p className="caption-text text-muted">
                          {exercise.sets} x {exercise.repRange}
                        </p>
                      </div>
                      <p className="medium-label mt-2 text-muted">Targets: {exercise.muscleGroup}</p>
                    </div>
                    </ScrollReveal>
                  ))}
                </div>

                <div className="mt-6 grid grid-cols-2 gap-3">
                  <button
                    className="rounded-[28px] bg-[var(--card-strong)] px-4 py-4 text-sm font-medium text-muted"
                    onClick={() => setLocalPreviewWorkoutId(null)}
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
  const currentTemplate = activeWorkoutTemplate?.exercises[currentExerciseIndex];
  const currentSetIndex = getFirstIncompleteSetIndex(currentExercise.sets);
  const currentSet = currentExercise.sets[currentSetIndex];
  const previousSet = currentSetIndex > 0 ? currentExercise.sets[currentSetIndex - 1] : null;
  const hasNextExercise = currentExerciseIndex < activeWorkout.exercises.length - 1;
  const nextExerciseName = hasNextExercise ? activeWorkout.exercises[currentExerciseIndex + 1].exerciseName : null;
  const currentExerciseComplete = isExerciseComplete(currentExercise);
  const workoutComplete = activeWorkout.exercises.every(isExerciseComplete);
  const canCompleteSet = Boolean(currentSet && (currentSet.weight > 0 || currentSet.reps > 0) && !currentSet.completed);
  const canCopyPreviousSet = Boolean(
    previousSet &&
      !currentSet?.completed &&
      (previousSet.weight > 0 || previousSet.reps > 0),
  );
  const substitutions = getSubstitutions(currentExercise.exerciseName, currentExercise.muscleGroup, exerciseLibrary);
  const loadCue = getLoadCue(currentTemplate?.repRange);
  const completedExerciseCount = activeWorkout.exercises.filter(isExerciseComplete).length;
  const suggestedStart = currentTemplate ? getSuggestedStartingWeight(currentTemplate, userSessions) : null;
  const previousBestScore = getPreviousBestScore(currentExercise.exerciseName, userSessions);
  const currentExerciseHasPr = currentExercise.sets.some((set) => isPersonalBestSet(set, previousBestScore));

  const handleCompleteSet = () => {
    if (!currentSet || !canCompleteSet) {
      return;
    }

    const nextSetIndex = currentExercise.sets.findIndex((set, index) => index > currentSetIndex && !set.completed);
    const nextExerciseIndex = getNextExerciseIndex(activeWorkout.exercises, currentExerciseIndex);
    const exerciseWillComplete = nextSetIndex === -1;
    const workoutWillComplete = activeWorkout.exercises.every((exercise, index) =>
      index === currentExerciseIndex
        ? exercise.sets.filter((set) => !set.completed).length === 1
        : isExerciseComplete(exercise),
    );

    onCompleteSet(currentExerciseIndex, currentSetIndex);

    if (exerciseWillComplete && !workoutWillComplete) {
      setCurrentExerciseIndex(nextExerciseIndex);
      setShowExercisePicker(true);
      return;
    }

    if (nextSetIndex === -1 && nextExerciseIndex !== currentExerciseIndex) {
      setCurrentExerciseIndex(nextExerciseIndex);
    }
  };

  return (
    <div className="space-y-2.5">
      <ScrollReveal delay={0} y={12} scale={0.996}>
      <Card className="bg-[rgba(4,5,7,0.94)] px-4 py-3.5 shadow-[var(--shadow-card)]">
        <p className="text-sm text-muted">Workout mode</p>
        <h1 className="mt-1.5 text-[1.75rem] font-semibold leading-[1.02] tracking-[-0.06em] text-text">{currentExercise.exerciseName}</h1>
        {currentExerciseHasPr ? (
          <p className="mt-1 text-sm font-medium text-accent">PR hit on this exercise</p>
        ) : null}
        {nextExerciseName ? (
          <p className="caption-text mt-2 text-muted">
            Next up: <span className="text-text">{nextExerciseName}</span>
          </p>
        ) : (
          <p className="caption-text mt-2 text-muted">Final exercise in this session.</p>
        )}

        <button
          className="mt-3 flex w-full items-center justify-between rounded-[22px] bg-[var(--card-strong)] px-4 py-2.5 text-left"
          onClick={() => setShowExercisePicker(true)}
        >
          <div>
            <p className="text-sm text-muted">Exercise chooser</p>
            <p className="mt-1 text-sm font-medium text-text">
              {completedExerciseCount} of {activeWorkout.exercises.length} exercises done
            </p>
          </div>
          <div className="flex items-center gap-2 text-sm text-muted">
            Pick exercise
            <ChevronRight className="h-4 w-4" />
          </div>
        </button>

        <div className="mt-3 grid grid-cols-2 gap-2">
          <div className="rounded-[24px] bg-[var(--card-strong)] px-4 py-2.5">
            <p className="text-sm text-muted">Set</p>
            <p className="mt-1 text-[1.8rem] font-semibold text-text">
              {Math.min(currentSetIndex + 1, currentExercise.sets.length)} of {currentExercise.sets.length}
            </p>
          </div>
          <div className="rounded-[24px] bg-[var(--card-strong)] px-4 py-2.5">
            <p className="text-sm text-muted">Target</p>
            <p className="mt-1 text-[1.8rem] font-semibold text-text">{currentTemplate?.repRange ?? "Track reps"}</p>
            <p className="mt-1 text-sm text-muted">{loadCue}</p>
          </div>
        </div>
        <p className="mt-2 text-sm text-muted">
          {currentExerciseComplete ? "Exercise complete. Pick another one from the list above." : `Targets ${currentExercise.muscleGroup}`}
        </p>
        {suggestedStart ? (
          <p className="mt-1 text-sm text-muted">
            Suggested start: <span className="text-text">{suggestedStart.suggestedWeight}kg</span> from last time&apos;s{" "}
            {suggestedStart.lastWeight}kg x {suggestedStart.lastAverageReps}
          </p>
        ) : null}

          <div className="mt-2.5 grid grid-cols-2 gap-2">
            <label className="rounded-[22px] bg-[var(--card-strong)] px-4 py-2.5">
            <span className="text-sm text-muted">Weight</span>
            <input
              ref={weightInputRef}
              className="mt-1 w-full bg-transparent text-[1.8rem] font-semibold tracking-[-0.05em] text-text outline-none"
              inputMode="decimal"
              type="number"
              value={currentSet?.weight || ""}
              placeholder="0"
              onChange={(event) =>
                onUpdateSet(currentExerciseIndex, currentSetIndex, "weight", Number(event.target.value))
              }
              onKeyDown={(event) => {
                if (event.key === "Enter") {
                  event.preventDefault();
                  repsInputRef.current?.focus();
                }
              }}
            />
          </label>
          <label className="rounded-[22px] bg-[var(--card-strong)] px-4 py-2.5">
            <span className="text-sm text-muted">Reps</span>
            <input
              ref={repsInputRef}
              className="mt-1 w-full bg-transparent text-[1.8rem] font-semibold tracking-[-0.05em] text-text outline-none"
              inputMode="numeric"
              type="number"
              value={currentSet?.reps || ""}
              placeholder="0"
              onChange={(event) =>
                onUpdateSet(currentExerciseIndex, currentSetIndex, "reps", Number(event.target.value))
              }
              onKeyDown={(event) => {
                if (event.key === "Enter" && canCompleteSet) {
                  event.preventDefault();
                  handleCompleteSet();
                }
              }}
            />
            </label>
          </div>

          {currentSetIndex > 0 ? (
            <button
              className={`mt-2.5 w-full rounded-[20px] px-4 py-2 text-sm font-medium transition-all ${
                canCopyPreviousSet ? "bg-[var(--card-strong)] text-text" : "bg-[var(--card-strong)] text-muted"
              }`}
              disabled={!canCopyPreviousSet}
              onClick={() => onCopyPreviousSet(currentExerciseIndex, currentSetIndex)}
            >
              {canCopyPreviousSet
                ? `Same as Set ${currentSetIndex}${previousSet?.weight ? ` | ${previousSet.weight}kg` : ""}${previousSet?.reps ? ` x ${previousSet.reps}` : ""}`
                : `Same as Set ${currentSetIndex}`}
            </button>
          ) : null}

          {substitutions.length ? (
          <div className="mt-2.5">
            <p className="text-sm text-muted">Quick swap</p>
            <div className="mt-1.5 flex flex-wrap gap-2">
              {substitutions.map((option) => (
                <button
                  key={option.id}
                  className="rounded-[18px] bg-[var(--card-strong)] px-3 py-2 text-sm font-medium text-muted"
                  onClick={() => onSwapExercise(currentExerciseIndex, option.id)}
                >
                  {option.name}
                </button>
              ))}
            </div>
          </div>
        ) : null}

        <div className="mt-2.5">
          <p className="text-sm text-muted">Completed sets</p>
          <div className="hide-scrollbar mt-1.5 flex gap-2 overflow-x-auto pb-0.5">
            {currentExercise.sets.map((set, index) => (
              <div
                key={set.id}
                className={`min-w-[84px] rounded-[20px] px-3 py-2.5 text-sm ${
                  set.completed
                    ? "bg-white text-black"
                    : index === currentSetIndex
                      ? "bg-accentSoft text-text"
                      : "bg-[var(--card-strong)] text-muted"
                }`}
              >
                <p className="font-medium">Set {index + 1}</p>
                <p className="mt-1 text-xs">
                  {set.completed ? `${set.weight > 0 ? `${set.weight}kg` : "Bodyweight"} x ${set.reps}` : "Waiting"}
                </p>
                {isPersonalBestSet(set, previousBestScore) ? (
                  <p className="mt-1 text-[11px] font-semibold uppercase tracking-[0.08em] text-accent">
                    PR
                  </p>
                ) : null}
              </div>
            ))}
          </div>
        </div>

        <button
          className={`mt-3 w-full rounded-[26px] px-5 py-3.5 text-base font-semibold ${
            canCompleteSet ? "bg-white text-black shadow-[var(--shadow-soft)]" : "bg-[var(--card-strong)] text-muted"
          }`}
          disabled={!canCompleteSet}
          onClick={handleCompleteSet}
        >
          Complete Set
        </button>
      </Card>
      </ScrollReveal>

      <ScrollReveal delay={50} y={10} scale={0.998}>
      <div className="grid grid-cols-3 gap-2">
        <button
          className="rounded-[22px] bg-[var(--card-strong)] px-3 py-2.5 text-sm font-medium text-muted"
          onClick={() => {
            setShowExercisePicker(false);
            setShowExitConfirmation(true);
          }}
        >
          Exit Session
        </button>
        <button
          className="rounded-[22px] bg-[var(--card-strong)] px-3 py-2.5 text-sm font-medium text-text"
          onClick={() => setShowExercisePicker(true)}
        >
          <div className="flex items-center justify-center gap-2">
            Pick Exercise
            <ChevronRight className="h-4 w-4" />
          </div>
          <p className="caption-text mt-1 text-muted">
            {completedExerciseCount}/{activeWorkout.exercises.length} done
          </p>
        </button>
        <button
          className={`rounded-[22px] px-3 py-2.5 text-sm font-semibold ${
            workoutComplete ? "bg-white text-black" : "bg-[var(--card-strong)] text-muted"
          }`}
          disabled={!workoutComplete}
          onClick={onCompleteWorkout}
        >
          Finish Workout
        </button>
      </div>
      </ScrollReveal>

      <ExitSessionModal
        open={showExitConfirmation}
        onClose={() => setShowExitConfirmation(false)}
        canSaveProgress={activeWorkout.exercises.some((exercise) =>
          exercise.sets.some((set) => set.completed && (set.reps > 0 || set.weight > 0)),
        )}
        onSaveProgress={() => {
          setShowExitConfirmation(false);
          onSaveAndExitWorkout();
        }}
        onDiscard={() => {
          setShowExitConfirmation(false);
          onCancelWorkout();
        }}
      />

      {showExercisePicker ? (
        <div className="sheet-backdrop">
          <div className="sheet-panel sheet-detent-large animate-sheet-up">
            <Card className="sheet-card bg-[var(--surface)]">
              <div className="sheet-drag-handle" />
              <p className="text-sm text-muted">Exercise chooser</p>
              <h3 className="large-title mt-2 font-semibold text-text">{activeWorkout.workoutName}</h3>
              <p className="mt-2 text-sm text-muted">
                Tap any exercise to bring it forward for logging.
              </p>

              <div className="mt-5 grid grid-cols-1 gap-2">
                {activeWorkout.exercises.map((exercise, index) => {
                  const done = isExerciseComplete(exercise);
                  const selected = index === currentExerciseIndex;

                  return (
                    <button
                      key={exercise.exerciseId}
                      className={`flex items-center justify-between rounded-[22px] px-4 py-4 text-left transition ${
                        done
                          ? "bg-white text-black"
                          : selected
                            ? "bg-accentSoft text-text"
                            : "bg-[var(--card-strong)] text-text"
                      }`}
                      onClick={() => {
                        setCurrentExerciseIndex(index);
                        setShowExercisePicker(false);
                      }}
                    >
                      <div>
                        <p className="text-sm font-medium">
                          {index + 1}. {exercise.exerciseName}
                        </p>
                        <p className={`caption-text mt-1 ${done ? "text-black/65" : "text-muted"}`}>
                          {done ? "Done" : `Targets ${exercise.muscleGroup}`}
                        </p>
                      </div>
                      <div className="flex items-center gap-2">
                        {done ? (
                          <span className="inline-flex h-8 w-8 items-center justify-center rounded-full bg-black text-white">
                            <Check className="h-4 w-4" />
                          </span>
                        ) : (
                          <span className="text-xs text-muted">{exercise.sets.length} sets</span>
                        )}
                      </div>
                    </button>
                  );
                })}
              </div>

              <div className="mt-6 grid grid-cols-2 gap-3">
                <button
                  className="rounded-[28px] bg-[var(--card-strong)] px-4 py-4 text-sm font-medium text-text"
                  onClick={() => setShowExercisePicker(false)}
                >
                  Resume workout
                </button>
                <button
                  className="rounded-[28px] bg-[var(--card-strong)] px-4 py-4 text-sm font-medium text-muted"
                  onClick={() => {
                    setShowExercisePicker(false);
                    setShowExitConfirmation(true);
                  }}
                >
                  Exit session
                </button>
              </div>
            </Card>
          </div>
        </div>
      ) : null}
    </div>
  );
}
