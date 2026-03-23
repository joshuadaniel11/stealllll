"use client";

import { useEffect, useRef, useState } from "react";
import { Check, ChevronRight } from "lucide-react";

import { ExitSessionModal } from "@/components/exit-session-modal";
import { ScrollReveal } from "@/components/scroll-reveal";
import { Card } from "@/components/ui";
import { getExerciseSwapOptions, getSwapSectionLabel } from "@/lib/exercise-swaps";
import { getPreviousBestScore, getSuggestedStartingWeight, isPersonalBestSet } from "@/lib/progression";
import { getSessionPresentation, getSessionSupportLine } from "@/lib/session-presentation";
import { getAdaptiveCompressionInsight, getRecommendedExercise } from "@/lib/workout-intelligence";
import type { SuggestedFocusSession } from "@/lib/training-load";
import type { ActiveWorkout, ExerciseLibraryItem, Profile, WorkoutPlanDay, WorkoutSession } from "@/lib/types";

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
  const [showPreviewExercises, setShowPreviewExercises] = useState(false);
  const [showSwapOptions, setShowSwapOptions] = useState(false);
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
    setShowSwapOptions(false);
  }, [activeWorkout?.id, activeWorkout?.userId, profile.id]);

  useEffect(() => {
    if (!activeWorkout || activeWorkout.userId !== profile.id) {
      setLocalPreviewWorkoutId(previewWorkoutId ?? null);
      setShowPreviewExercises(false);
    }
  }, [activeWorkout, previewWorkoutId, profile.id]);

  useEffect(() => {
    if (!activeWorkout || activeWorkout.userId !== profile.id || showExercisePicker) {
      return;
    }

    const focusTimer = window.setTimeout(() => {
      weightInputRef.current?.focus();
    }, 120);

    return () => window.clearTimeout(focusTimer);
  }, [
    activeWorkout?.id,
    activeWorkout?.userId,
    currentExerciseIndex,
    focusSet?.id,
    profile.id,
    showExercisePicker,
  ]);

  useEffect(() => {
    setShowSwapOptions(false);
  }, [currentExerciseIndex, activeWorkout?.id]);

  if (!activeWorkout || activeWorkout.userId !== profile.id) {
    const previewWorkout = profile.workoutPlan.find((workout) => workout.id === localPreviewWorkoutId) ?? null;
    const previewPartialSession = previewWorkout ? partialByWorkout[previewWorkout.id] ?? null : null;
    const todaysWorkout = profile.workoutPlan.find((workout) => workout.id === todaysWorkoutId) ?? profile.workoutPlan[0];
    const heroPresentation = getSessionPresentation(profile, todaysWorkout);
    const todaysPartial = partialByWorkout[todaysWorkout.id] ?? null;
    const showSuggestedSessionBlock =
      suggestedSessionPreview &&
      suggestedFocusSession &&
      previewWorkout &&
      previewWorkout.id === (suggestedFocusSession.sourceWorkoutId ?? previewWorkout.id);

    return (
      <>
        <ScrollReveal delay={0} y={14} scale={0.996}>
        <Card className="space-y-5">
          <div className="space-y-2">
            <p className="text-sm text-muted">Your plan</p>
            <h2 className="large-title mt-2 font-semibold text-text">Start with the next session</h2>
          </div>

          <div className="progress-focus-card rounded-[26px] border px-5 py-5">
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="text-[11px] uppercase tracking-[0.24em] text-white/42">{heroPresentation.splitLabel}</p>
                <h3 className="mt-3 text-[1.95rem] font-semibold tracking-[-0.06em] text-white/94">{heroPresentation.title}</h3>
              </div>
              <span className="rounded-full bg-white/[0.07] px-3 py-1 text-[11px] font-medium text-white/62">
                {todaysPartial ? "Resume ready" : "Planned next"}
              </span>
            </div>
            <p className="mt-2 text-sm leading-6 text-white/58">
              {todaysPartial
                ? `${todaysPartial.workoutName} is ready to pick back up.`
                : getSessionSupportLine(todaysWorkout)}
            </p>
            {todaysPartial ? (
              <div className="mt-4 rounded-[22px] border border-white/8 bg-white/[0.04] px-4 py-3">
                <p className="text-[11px] uppercase tracking-[0.14em] text-white/40">Resume state</p>
                <p className="mt-1 text-sm font-medium text-white/84">
                  {todaysPartial.exercises.reduce((sum, exercise) => sum + exercise.sets.length, 0)} sets already logged
                </p>
              </div>
            ) : null}
            <div className="mt-4 flex items-center justify-between gap-3">
              <button
                className="rounded-[24px] bg-white px-4 py-3 text-sm font-semibold text-black"
                onClick={() => onStartWorkout(todaysWorkout)}
              >
                {todaysPartial ? "Resume Session" : "Start Session"}
              </button>
              <button
                className="rounded-full px-2 py-1 text-sm text-white/54 transition hover:text-white/78"
                onClick={() => {
                  setLocalPreviewWorkoutId(todaysWorkout.id);
                  setShowPreviewExercises(false);
                }}
              >
                Preview
              </button>
            </div>
          </div>

          <div className="space-y-3">
            <div className="flex items-center justify-between gap-3">
              <p className="text-[12px] font-medium text-white/52">Training split</p>
              <p className="text-[11px] uppercase tracking-[0.12em] text-white/34">{profile.workoutPlan.length} days</p>
            </div>
            {profile.workoutPlan.map((workout) => (
              <div
                key={workout.id}
                className={`rounded-[24px] border px-4 py-4 transition duration-300 ${
                  workout.id === localPreviewWorkoutId
                    ? "border-white/10 bg-white/[0.055] text-text"
                    : workout.id === todaysWorkoutId
                      ? "border-white/8 bg-white/[0.04] text-text"
                      : "border-white/4 bg-[var(--card-strong)]/55 text-text"
                }`}
              >
                <div className="flex items-center justify-between gap-4">
                  <div>
                    <div className="flex flex-wrap items-center gap-2">
                      <p className="text-[15px] font-medium">{workout.name}</p>
                      {workout.id === todaysWorkoutId ? (
                        <span className="rounded-full bg-white/[0.08] px-2.5 py-1 text-[10px] font-medium uppercase tracking-[0.12em] text-white/70">
                          Planned
                        </span>
                      ) : null}
                      {partialByWorkout[workout.id] ? (
                        <span className="rounded-full bg-white/10 px-2.5 py-1 text-[10px] font-medium uppercase tracking-[0.12em] text-white/78">
                          Resume ready
                        </span>
                      ) : null}
                    </div>
                    <p className="caption-text mt-1 text-muted">
                      {getSessionPresentation(profile, workout).splitLabel} - {workout.exercises.length} exercises
                    </p>
                    {partialByWorkout[workout.id] ? (
                      <p className="mt-1 text-[11px] font-medium text-white/64">
                        {partialByWorkout[workout.id].exercises.reduce((sum, exercise) => sum + exercise.sets.length, 0)} sets already logged
                      </p>
                    ) : null}
                  </div>
                  <div className="flex items-center gap-3">
                    <button
                      className="rounded-full px-2 py-1 text-sm text-white/46 transition hover:text-white/76"
                      onClick={() => {
                        setLocalPreviewWorkoutId(workout.id);
                        setShowPreviewExercises(false);
                      }}
                    >
                      Open
                    </button>
                    <button
                      className={`rounded-[20px] px-3 py-2 text-sm font-semibold ${
                        workout.id === todaysWorkoutId || partialByWorkout[workout.id]
                          ? "bg-white text-black"
                          : "bg-white/8 text-white/78"
                      }`}
                      onClick={() => onStartWorkout(workout)}
                    >
                      {partialByWorkout[workout.id] ? "Resume" : "Start"}
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
                <p className="text-sm text-muted">Planned session</p>
                <h3 className="large-title mt-2 font-semibold text-text">{previewWorkout.name}</h3>
                <p className="medium-label mt-2 text-muted">
                  {previewWorkout.exercises.length} exercises - ~{previewWorkout.durationMinutes} min
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
                            {previewPartialSession.exercises.reduce((sum, exercise) => sum + exercise.sets.length, 0)} sets are already logged here.
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
                        <p className="text-sm font-medium text-text">Suggested session</p>
                        <p className="mt-1 text-sm font-medium text-text">{suggestedFocusSession.focusText}</p>
                      </div>
                      <span className="rounded-full bg-white/8 px-3 py-1 text-[11px] font-medium uppercase tracking-[0.12em] text-text">
                        Guided
                      </span>
                    </div>
                    <div className="mt-3 flex items-center justify-between gap-3 text-sm text-muted">
                        <p>{suggestedFocusSession.exercises.length} moves - ~{suggestedFocusSession.estimatedDurationMinutes} min</p>
                        <p>{suggestedFocusSession.targetLabels.slice(0, 2).join(" + ")}</p>
                      </div>
                    </div>
                ) : null}

                <div className="mt-5 rounded-[24px] bg-[var(--card-strong)] px-4 py-4">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="text-sm font-medium text-text">Session plan</p>
                        <p className="mt-1 text-sm leading-6 text-muted">
                          Starts with {previewWorkout.exercises[0]?.name}.
                        </p>
                    </div>
                    <button
                      type="button"
                      onClick={() => setShowPreviewExercises((value) => !value)}
                      className="text-sm font-medium text-white/56 transition hover:text-white/82"
                    >
                      {showPreviewExercises ? "Hide list" : "Show list"}
                    </button>
                  </div>
                  {showPreviewExercises ? (
                    <div className="mt-4 space-y-3">
                      {previewWorkout.exercises.map((exercise, index) => (
                        <ScrollReveal key={exercise.id} delay={index * 35} y={18} scale={0.992}>
                          <div className="rounded-[24px] bg-black/10 px-4 py-4">
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
                  ) : null}
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
                    {previewPartialSession ? "Resume Session" : "Start Session"}
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
  const substitutions = getExerciseSwapOptions(profile.id, currentExercise.exerciseName, currentExercise.muscleGroup, exerciseLibrary);
  const swapSectionLabel = getSwapSectionLabel(profile.id);
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
            <p className="mt-2 text-sm text-muted">Pick the next exercise and keep moving.</p>
            {compressionInsight ? (
              <div className="mt-4 rounded-[22px] bg-[var(--card-strong)] px-4 py-4">
                <p className="text-sm font-medium text-text">Short version</p>
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
                Back to session
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
            Next: <span className="text-text">{nextExerciseName}</span>
          </p>
        ) : (
          <p className="caption-text mt-2 text-muted">Final exercise.</p>
        )}

        <div className="mt-3 rounded-[24px] bg-[var(--card-strong)] px-4 py-3">
          <div className="flex items-center justify-between gap-3">
            <div>
                <p className="text-sm text-muted">Progress</p>
              <p className="mt-1 text-sm font-medium text-text">
                {completedExerciseCount} of {activeWorkout.exercises.length} exercises done
              </p>
                <p className="mt-1 text-[11px] font-medium text-white/50">
                  {workoutComplete
                    ? "Everything is logged. Finish when ready."
                    : currentExerciseComplete
                      ? "This exercise is done. Pick the next one."
                      : "Keep the session moving."}
                </p>
            </div>
            <button
              className="inline-flex items-center gap-2 rounded-full bg-white/6 px-3 py-2 text-sm text-text"
              onClick={() => setShowExercisePicker(true)}
            >
              Exercises
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
          {currentExerciseComplete ? "Exercise complete." : `Targets ${currentExercise.muscleGroup}`}
        </p>
        {suggestedStart ? (
          <div className="mt-2 rounded-[20px] border border-white/6 bg-white/[0.025] px-3 py-2.5">
            <p className="text-[11px] uppercase tracking-[0.14em] text-white/38">Starting point</p>
            <p className="mt-1 text-sm text-white/76">
              {suggestedStart.suggestedWeight}kg from {suggestedStart.lastWeight}kg x {suggestedStart.lastAverageReps}
            </p>
          </div>
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
          <div className="mt-2.5 rounded-[22px] border border-white/6 bg-white/[0.025] px-3 py-3">
            <button
              type="button"
              onClick={() => setShowSwapOptions((value) => !value)}
              className="flex w-full items-center justify-between gap-3 text-left"
            >
              <div>
                <p className="text-sm text-muted">Swap options</p>
                <p className="mt-1 text-[10px] uppercase tracking-[0.14em] text-white/42">{swapSectionLabel}</p>
              </div>
              <span className="text-sm text-white/50">{showSwapOptions ? "Hide" : `${substitutions.length} choices`}</span>
            </button>
            {showSwapOptions ? (
              <div className="mt-3 flex flex-wrap gap-2">
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
            ) : null}
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
          Save / exit
        </button>
        <button
          className="rounded-[22px] bg-[var(--card-strong)] px-3 py-2.5 text-sm font-medium text-text"
          onClick={() => setShowExercisePicker(true)}
        >
          <div className="flex items-center justify-center gap-2">
            Exercises
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

