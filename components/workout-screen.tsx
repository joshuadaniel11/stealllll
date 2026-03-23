"use client";

import { useEffect, useRef, useState } from "react";
import { Check, ChevronRight } from "lucide-react";

import { ExitSessionModal } from "@/components/exit-session-modal";
import { ScrollReveal } from "@/components/scroll-reveal";
import { Card } from "@/components/ui";
import { areEquivalentExerciseNames, buildCanonicalExerciseLibrary, findExerciseLibraryItemByName } from "@/lib/exercise-data";
import { getPreviousBestScore, getSuggestedStartingWeight, isPersonalBestSet } from "@/lib/progression";
import { getAdaptiveCompressionInsight, getRecommendedExercise } from "@/lib/workout-intelligence";
import type { SuggestedFocusSession } from "@/lib/training-load";
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
  const canonicalLibrary = buildCanonicalExerciseLibrary(library);
  const preferredNames = substitutionHints[currentExerciseName] ?? [];
  const preferred = preferredNames
    .map((name) => findExerciseLibraryItemByName(canonicalLibrary, name))
    .filter((item): item is ExerciseLibraryItem => Boolean(item));

  const fallback = canonicalLibrary.filter(
    (item) =>
      item.muscleGroup === muscleGroup &&
      !areEquivalentExerciseNames(item.name, currentExerciseName) &&
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

function getLatestPartialByWorkout(userSessions: WorkoutSession[]) {
  return userSessions.reduce<Record<string, WorkoutSession>>((acc, session) => {
    if (!session.partial || acc[session.workoutDayId]) {
      return acc;
    }

    acc[session.workoutDayId] = session;
    return acc;
  }, {});
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
  suggestedFocusSession,
  suggestedSessionPreview,
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
  suggestedFocusSession: SuggestedFocusSession | null;
  suggestedSessionPreview: boolean;
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
  const partialByWorkout = getLatestPartialByWorkout(userSessions);

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
    const previewPartialSession = previewWorkout ? partialByWorkout[previewWorkout.id] ?? null : null;
    const showSuggestedSessionBlock =
      suggestedSessionPreview &&
      suggestedFocusSession &&
      previewWorkout &&
      previewWorkout.id === (suggestedFocusSession.sourceWorkoutId ?? previewWorkout.id);

    return (
      <>
        <ScrollReveal delay={0} y={14} scale={0.996}>
        <Card>
          <p className="text-sm text-muted">Workout plan</p>
          <h2 className="large-title mt-2 font-semibold text-text">Choose your next lift</h2>
          <p className="mt-2 text-sm leading-6 text-muted">
            Queued days, saved partials, and previews stay in one place so you always know whether you&apos;re starting fresh or picking back up.
          </p>
          <div className="mt-4 space-y-3">
            {profile.workoutPlan.map((workout) => (
              <div
                key={workout.id}
                className={`rounded-[28px] border px-4 py-4 transition duration-300 ${
                  workout.id === localPreviewWorkoutId
                    ? "border-white/12 bg-white/[0.07] text-text"
                    : workout.id === todaysWorkoutId
                      ? "border-white/10 bg-accentSoft text-text"
                      : "border-white/6 bg-[var(--card-strong)] text-text"
                }`}
              >
                <div className="flex items-center justify-between gap-4">
                  <div>
                    <div className="flex flex-wrap items-center gap-2">
                      <p className="text-base font-medium">{workout.name}</p>
                      {workout.id === todaysWorkoutId ? (
                        <span className="rounded-full bg-white/10 px-2.5 py-1 text-[10px] font-medium uppercase tracking-[0.12em] text-white/78">
                          Queued today
                        </span>
                      ) : null}
                      {partialByWorkout[workout.id] ? (
                        <span className="rounded-full bg-white px-2.5 py-1 text-[10px] font-medium uppercase tracking-[0.12em] text-black">
                          Partial saved
                        </span>
                      ) : null}
                    </div>
                    <p className="caption-text mt-1 text-muted">
                      {workout.dayLabel} - {workout.exercises.length} exercises
                    </p>
                    {partialByWorkout[workout.id] ? (
                      <p className="mt-1 text-[11px] font-medium text-white/64">
                        {partialByWorkout[workout.id].exercises.reduce((sum, exercise) => sum + exercise.sets.length, 0)} sets already logged
                      </p>
                    ) : null}
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
                      {partialByWorkout[workout.id] ? "Resume" : "Begin"}
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

                {previewPartialSession ? (
                  <div className="mt-4 rounded-[24px] bg-white/[0.06] px-4 py-4">
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <p className="text-sm font-medium text-text">Saved partial ready</p>
                        <p className="mt-1 text-sm leading-6 text-muted">
                          {previewPartialSession.exercises.reduce((sum, exercise) => sum + exercise.sets.length, 0)} sets are already logged here, so starting this day will resume instead of restarting.
                        </p>
                      </div>
                      <span className="rounded-full bg-white px-3 py-1 text-[11px] font-medium uppercase tracking-[0.12em] text-black">
                        Resume
                      </span>
                    </div>
                  </div>
                ) : null}

                {showSuggestedSessionBlock ? (
                  <div className="mt-4 rounded-[24px] bg-[var(--card-strong)] px-4 py-4">
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <p className="text-sm font-medium text-text">Today&apos;s focus session</p>
                        <p className="mt-1 text-sm font-medium text-text">{suggestedFocusSession.focusText}</p>
                        <div className="mt-2 flex flex-wrap gap-1.5">
                          {suggestedFocusSession.targetLabels.map((label) => (
                            <span
                              key={label}
                              className="rounded-full border border-white/8 bg-black/10 px-2.5 py-1 text-[10px] uppercase tracking-[0.12em] text-muted"
                            >
                              {label}
                            </span>
                          ))}
                        </div>
                      </div>
                      <span className="rounded-full bg-white/8 px-3 py-1 text-[11px] font-medium uppercase tracking-[0.12em] text-text">
                        Open workout
                      </span>
                    </div>
                    <div className="mt-3 grid grid-cols-2 gap-2">
                      <div className="rounded-[18px] border border-white/6 bg-black/10 px-3 py-2.5">
                        <p className="text-[10px] uppercase tracking-[0.12em] text-muted">Session length</p>
                        <p className="mt-1 text-sm font-medium text-text">~{suggestedFocusSession.estimatedDurationMinutes} min</p>
                      </div>
                      <div className="rounded-[18px] border border-white/6 bg-black/10 px-3 py-2.5">
                        <p className="text-[10px] uppercase tracking-[0.12em] text-muted">Total sets</p>
                        <p className="mt-1 text-sm font-medium text-text">{suggestedFocusSession.totalSets || "Flexible"}</p>
                      </div>
                    </div>
                    <div className="mt-3 space-y-2">
                      {suggestedFocusSession.exercises.map((exercise, index) => (
                        <div
                          key={`${exercise.name}-${index}`}
                          className="flex items-start justify-between rounded-[18px] border border-white/6 bg-black/10 px-3 py-2.5"
                        >
                          <div>
                            <p className="text-sm font-medium text-text">{index + 1}. {exercise.name}</p>
                            <p className="mt-1 text-[11px] uppercase tracking-[0.12em] text-muted">
                              {exercise.sets && exercise.repRange
                                ? `${exercise.sets} x ${exercise.repRange}`
                                : exercise.muscleGroup}
                            </p>
                          </div>
                          <p className="max-w-[42%] text-right text-[10px] uppercase tracking-[0.12em] text-muted">
                            {exercise.matchedLabels.join(" + ")}
                          </p>
                        </div>
                      ))}
                    </div>
                  </div>
                ) : null}

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
                    {previewPartialSession ? "Resume Session" : "Begin Session"}
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
  const canCompleteSet = Boolean(
    currentSet && (currentSet.weight > 0 || currentSet.reps > 0) && !currentSet.completed,
  );
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
  const compressionInsight = getAdaptiveCompressionInsight(activeWorkoutTemplate, userSessions);
  const recommendedExercise = getRecommendedExercise(activeWorkout, activeWorkoutTemplate);

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

  if (showExercisePicker) {
    return (
      <>
        <ScrollReveal delay={0} y={12} scale={0.996}>
          <Card className="bg-[rgba(4,5,7,0.96)] px-4 py-4 shadow-[var(--shadow-card)]">
            <p className="text-sm text-muted">Workout mode</p>
            <h1 className="mt-1.5 text-[1.75rem] font-semibold leading-[1.02] tracking-[-0.06em] text-text">
              {activeWorkout.workoutName}
            </h1>
            <p className="mt-2 text-sm text-muted">
              Pick the exercise you want to log next. Finished ones stay marked done.
            </p>
            {compressionInsight ? (
              <div className="mt-4 rounded-[22px] bg-[var(--card-strong)] px-4 py-4">
                <p className="text-sm font-medium text-text">Smart short version</p>
                <p className="mt-1 text-sm text-muted">{compressionInsight.note}</p>
                <p className="mt-2 text-sm text-text">
                  {compressionInsight.suggestedExerciseNames.join(" • ")}
                </p>
              </div>
            ) : null}

            <div className="mt-4 grid grid-cols-1 gap-2">
              {activeWorkout.exercises.map((exercise, index) => {
                const done = isExerciseComplete(exercise);
                const selected = index === currentExerciseIndex;
                const recommended = recommendedExercise?.index === index;

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
                      {!done && recommended ? (
                        <p className={`mt-1 text-[11px] font-medium ${selected ? "text-text/80" : "text-accent"}`}>
                          Best next
                        </p>
                      ) : null}
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

            <div className="mt-4 grid grid-cols-2 gap-3">
              <button
                className="rounded-[24px] bg-[var(--card-strong)] px-4 py-3 text-sm font-medium text-text"
                onClick={() => setShowExercisePicker(false)}
              >
                Resume current
              </button>
              <button
                className="rounded-[24px] bg-[var(--card-strong)] px-4 py-3 text-sm font-medium text-muted"
                onClick={() => {
                  setShowExercisePicker(false);
                  setShowExitConfirmation(true);
                }}
              >
                Save / exit
              </button>
            </div>
          </Card>
        </ScrollReveal>

        <ExitSessionModal
          open={showExitConfirmation}
          canSaveProgress={activeWorkout.exercises.some((exercise) =>
            exercise.sets.some((set) => set.completed && (set.reps > 0 || set.weight > 0)),
          )}
          onClose={() => setShowExitConfirmation(false)}
          onSaveProgress={() => {
            setShowExitConfirmation(false);
            onSaveAndExitWorkout();
          }}
          onDiscard={() => {
            setShowExitConfirmation(false);
            onCancelWorkout();
          }}
        />
      </>
    );
  }

  return (
    <div className="space-y-2.5">
      <ScrollReveal delay={0} y={12} scale={0.996}>
      <Card className="bg-[rgba(4,5,7,0.94)] px-4 py-4 shadow-[var(--shadow-card)]">
        <p className="text-sm text-muted">Workout mode</p>
        <h1 className="mt-1.5 text-[1.95rem] font-semibold leading-[0.98] tracking-[-0.07em] text-text">{currentExercise.exerciseName}</h1>
        <div className="mt-2 flex flex-wrap items-center gap-2">
          <span className="rounded-full bg-white px-2.5 py-1 text-[10px] font-medium uppercase tracking-[0.12em] text-black">
            Live session
          </span>
          <span className="rounded-full bg-white/8 px-2.5 py-1 text-[10px] font-medium uppercase tracking-[0.12em] text-white/70">
            Exercise {currentExerciseIndex + 1} of {activeWorkout.exercises.length}
          </span>
        </div>
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

        <div className="mt-3 rounded-[24px] bg-[var(--card-strong)] px-4 py-3">
          <div className="flex items-center justify-between gap-3">
            <div>
              <p className="text-sm text-muted">Session progress</p>
              <p className="mt-1 text-sm font-medium text-text">
                {completedExerciseCount} of {activeWorkout.exercises.length} exercises done
              </p>
              <p className="mt-1 text-[11px] font-medium text-white/50">
                {workoutComplete
                  ? "Everything is logged. You can finish the workout now."
                  : currentExerciseComplete
                    ? "This exercise is wrapped. Pick another one from the list."
                    : "Log this set and the flow will move you forward automatically."}
              </p>
            </div>
            <button
              className="inline-flex items-center gap-2 rounded-full bg-white/6 px-3 py-2 text-sm text-text"
              onClick={() => setShowExercisePicker(true)}
            >
              Pick exercise
              <ChevronRight className="h-4 w-4" />
            </button>
          </div>
        </div>

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

          <div className="mt-3 grid grid-cols-2 gap-2">
            <label className="rounded-[24px] bg-[var(--card-strong)] px-4 py-3">
            <span className="text-sm text-muted">Weight</span>
            <input
              ref={weightInputRef}
              className="mt-1 w-full bg-transparent text-[2.2rem] font-semibold tracking-[-0.06em] text-text outline-none"
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
          <label className="rounded-[24px] bg-[var(--card-strong)] px-4 py-3">
            <span className="text-sm text-muted">Reps</span>
            <input
              ref={repsInputRef}
              className="mt-1 w-full bg-transparent text-[2.2rem] font-semibold tracking-[-0.06em] text-text outline-none"
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
            <div className="flex items-center justify-between gap-3">
              <p className="text-sm text-muted">Quick swap</p>
              <p className="text-[10px] uppercase tracking-[0.14em] text-white/42">Same target, cleaner fit</p>
            </div>
            <div className="mt-1.5 flex flex-wrap gap-2">
              {substitutions.map((option) => (
                <button
                  key={option.id}
                  className="swap-chip rounded-[18px] px-3 py-2 text-sm font-medium text-muted"
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
          className={`mt-3 w-full rounded-[28px] px-5 py-4 text-base font-semibold ${
            canCompleteSet ? "bg-white text-black shadow-[var(--shadow-soft)]" : "bg-[var(--card-strong)] text-muted"
          }`}
          disabled={!canCompleteSet}
          onClick={handleCompleteSet}
        >
          Complete set and move on
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
    </div>
  );
}

