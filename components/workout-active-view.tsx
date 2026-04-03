"use client";

import { useEffect, useRef, useState } from "react";
import { Check, ChevronRight } from "lucide-react";

import { CardHelpButton } from "@/components/card-help-button";
import { ExerciseMusclePills } from "@/components/exercise-muscle-pills";
import { ScrollReveal } from "@/components/scroll-reveal";
import { selectDailyCardioPrompt } from "@/lib/daily-cardio";
import { getExerciseSwapOptions } from "@/lib/exercise-swaps";
import {
  getExerciseProgressionRead,
  getLastExerciseSets,
  getSuggestedLoadStep,
  getSuggestedStartingWeight,
} from "@/lib/progression";
import { buildSessionAutoregulationRead } from "@/lib/session-autoregulation";
import type { SignatureLiftsState } from "@/lib/profile-training-state";
import type { CoachReadModel } from "@/lib/view-models";
import type { ActiveWorkout, ExerciseLibraryItem, LiveSessionSignal, Profile, WorkoutPlanDay, WorkoutSession } from "@/lib/types";

function getFirstIncompleteSetIndex(sets: ActiveWorkout["exercises"][number]["sets"]) {
  const index = sets.findIndex((set) => !set.completed);
  return index === -1 ? sets.length - 1 : index;
}

function getFirstPendingExerciseIndex(exercises: ActiveWorkout["exercises"]) {
  const index = exercises.findIndex((exercise) => exercise.sets.some((set) => !set.completed));
  return index === -1 ? 0 : index;
}

function getNextExerciseIndex(exercises: ActiveWorkout["exercises"], currentIndex: number) {
  for (let index = currentIndex + 1; index < exercises.length; index += 1) {
    if (exercises[index].sets.some((set) => !set.completed)) {
      return index;
    }
  }
  return Math.min(currentIndex + 1, exercises.length - 1);
}

function isExerciseComplete(exercise: ActiveWorkout["exercises"][number]) {
  return exercise.sets.every((set) => set.completed);
}

function getTargetRepSuggestion(repRange?: string) {
  if (!repRange) {
    return null;
  }
  const match = repRange.match(/(\d+)\s*[-–]\s*(\d+)/);
  if (!match) {
    return Number.parseInt(repRange, 10) || null;
  }
  return Number.parseInt(match[1], 10);
}

function formatWeightKg(value: number) {
  return `${value} kg`;
}

export function WorkoutActiveView({
  profile,
  activeWorkout,
  activeWorkoutTemplate,
  signatureLifts,
  liveSignal,
  userSessions,
  exerciseLibrary,
  coach,
  onUpdateSet,
  onCopyPreviousSet,
  onCompleteSet,
  onSwapExercise,
  onCompleteWorkout,
  onSaveAndExitWorkout,
  onDismissLiveSignal,
}: {
  profile: Profile;
  activeWorkout: ActiveWorkout;
  activeWorkoutTemplate: WorkoutPlanDay | undefined;
  signatureLifts: SignatureLiftsState;
  liveSignal: LiveSessionSignal | null;
  userSessions: WorkoutSession[];
  exerciseLibrary: ExerciseLibraryItem[];
  coach: CoachReadModel;
  onUpdateSet: (exerciseIndex: number, setIndex: number, field: "weight" | "reps", value: number) => void;
  onCopyPreviousSet: (exerciseIndex: number, setIndex: number) => void;
  onCompleteSet: (exerciseIndex: number, setIndex: number) => void;
  onSwapExercise: (exerciseIndex: number, exerciseId: string) => void;
  onCompleteWorkout: () => void;
  onSaveAndExitWorkout: () => void;
  onDismissLiveSignal: () => void;
  onCancelWorkout: () => void;
}) {
  const [currentExerciseIndex, setCurrentExerciseIndex] = useState(() =>
    getFirstPendingExerciseIndex(activeWorkout.exercises),
  );
  const [showExercisePicker, setShowExercisePicker] = useState(false);
  const [showSwapOptions, setShowSwapOptions] = useState(false);
  const weightInputRef = useRef<HTMLInputElement | null>(null);

  const currentExercise = activeWorkout.exercises[currentExerciseIndex];
  const currentTemplate = activeWorkoutTemplate?.exercises[currentExerciseIndex];
  const currentSetIndex = getFirstIncompleteSetIndex(currentExercise.sets);
  const currentSet = currentExercise.sets[currentSetIndex];
  const previousSet = currentSetIndex > 0 ? currentExercise.sets[currentSetIndex - 1] : null;
  const progressionExercise = currentTemplate
    ? {
        ...currentTemplate,
        name: currentExercise.exerciseName,
        muscleGroup: currentExercise.muscleGroup,
        primaryMuscles: currentExercise.primaryMuscles,
        secondaryMuscles: currentExercise.secondaryMuscles,
        note: currentTemplate.note ?? currentExercise.note,
      }
    : {
        id: currentExercise.exerciseId,
        name: currentExercise.exerciseName,
        muscleGroup: currentExercise.muscleGroup,
        primaryMuscles: currentExercise.primaryMuscles,
        secondaryMuscles: currentExercise.secondaryMuscles,
        sets: currentExercise.sets.length,
        repRange: "8-12",
        note: currentExercise.note,
      };
  const progressionRead = getExerciseProgressionRead(progressionExercise, userSessions);
  const suggestedStart = getSuggestedStartingWeight(progressionExercise, userSessions);
  const lastLoggedSets = getLastExerciseSets(currentExercise.exerciseName, userSessions);
  const matchingLastLoggedSet = lastLoggedSets[currentSetIndex] ?? lastLoggedSets.at(-1) ?? null;
  const targetRepSuggestion = progressionRead.recommendedRepTarget ?? currentTemplate?.suggestedRepTarget ?? getTargetRepSuggestion(currentTemplate?.repRange);
  const substitutions = getExerciseSwapOptions(profile.id, currentExercise.exerciseName, currentExercise.muscleGroup, exerciseLibrary);
  const completedExerciseCount = activeWorkout.exercises.filter(isExerciseComplete).length;
  const totalExercises = activeWorkout.exercises.length;
  const canLogSet = Boolean(currentSet && !currentSet.completed && (currentSet.weight > 0 || currentSet.reps > 0));
  const workoutComplete = activeWorkout.exercises.every(isExerciseComplete);
  const autoregulationRead = buildSessionAutoregulationRead({
    activeWorkout,
    activeWorkoutTemplate,
    currentExerciseIndex,
    sessions: userSessions,
    liveSignal,
  });
  const loadStep = getSuggestedLoadStep(
    currentSet?.weight || progressionRead.recommendedWeight || matchingLastLoggedSet?.weight || 0,
  );
  const cardioPrompt = selectDailyCardioPrompt(profile.id, activeWorkout.workoutDayId);

  useEffect(() => {
    const timeout = window.setTimeout(() => {
      weightInputRef.current?.focus();
    }, 120);

    return () => window.clearTimeout(timeout);
  }, [currentExerciseIndex, currentSet?.id, showExercisePicker]);

  useEffect(() => {
    if (!liveSignal || liveSignal.dismissedAt) {
      return;
    }

    const timeout = window.setTimeout(() => {
      onDismissLiveSignal();
    }, 5000);

    return () => window.clearTimeout(timeout);
  }, [liveSignal, onDismissLiveSignal]);

  const handleCompleteSet = () => {
    if (!currentSet || !canLogSet) {
      return;
    }

    const nextSetIndex = currentExercise.sets.findIndex((set, index) => index > currentSetIndex && !set.completed);
    const nextExerciseIndex = getNextExerciseIndex(activeWorkout.exercises, currentExerciseIndex);
    const exerciseWillComplete = nextSetIndex === -1;
    onCompleteSet(currentExerciseIndex, currentSetIndex);

    if (exerciseWillComplete && nextExerciseIndex !== currentExerciseIndex) {
      setCurrentExerciseIndex(nextExerciseIndex);
    }
  };

  const applyTargetToCurrentSet = () => {
    if (!currentSet) {
      return;
    }

    if (progressionRead.recommendedWeight !== null) {
      onUpdateSet(currentExerciseIndex, currentSetIndex, "weight", progressionRead.recommendedWeight);
    }

    if (targetRepSuggestion !== null) {
      onUpdateSet(currentExerciseIndex, currentSetIndex, "reps", targetRepSuggestion);
    }
  };

  const applyPreviousSessionSet = () => {
    if (!currentSet || !matchingLastLoggedSet) {
      return;
    }

    onUpdateSet(currentExerciseIndex, currentSetIndex, "weight", matchingLastLoggedSet.weight);
    onUpdateSet(currentExerciseIndex, currentSetIndex, "reps", matchingLastLoggedSet.reps);
  };

  const nudgeWeight = (direction: -1 | 1) => {
    if (!currentSet) {
      return;
    }

    const nextWeight = Math.max(0, Math.round((currentSet.weight + loadStep * direction) * 2) / 2);
    onUpdateSet(currentExerciseIndex, currentSetIndex, "weight", nextWeight);
  };

  const nudgeReps = (direction: -1 | 1) => {
    if (!currentSet) {
      return;
    }

    onUpdateSet(currentExerciseIndex, currentSetIndex, "reps", Math.max(0, currentSet.reps + direction));
  };

  if (showExercisePicker) {
    return (
      <div className="space-y-3">
        <ScrollReveal delay={0}>
          <div className="flex items-center justify-between px-1">
            <div>
              <p className="label-eyebrow">Workout</p>
              <h2 className="card-title mt-2 text-white/92">{activeWorkout.workoutName}</h2>
            </div>
            <button
              type="button"
              onClick={() => setShowExercisePicker(false)}
              className="rounded-full border border-white/[0.12] px-4 py-2 text-[13px] text-white/60"
            >
              Back to current set
            </button>
          </div>
        </ScrollReveal>

        <ScrollReveal delay={40}>
          <section className="rounded-[20px] border border-white/[0.07] bg-[var(--bg-surface)]">
            {activeWorkout.exercises.map((exercise, index) => {
              const complete = isExerciseComplete(exercise);
              const isSignature = signatureLifts.ready
                ? signatureLifts.signatures.some((signature) => signature.exerciseName === exercise.exerciseName)
                : false;

              return (
                <button
                  key={`${exercise.exerciseId}-${index}`}
                  type="button"
                  onClick={() => {
                    setCurrentExerciseIndex(index);
                    setShowExercisePicker(false);
                  }}
                  className={`flex h-[60px] w-full items-center justify-between px-5 text-left ${
                    index !== activeWorkout.exercises.length - 1 ? "border-b border-white/[0.04]" : ""
                  }`}
                >
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <p className="truncate text-[15px] text-white/80">{exercise.exerciseName}</p>
                      {isSignature ? <span className="text-[10px] uppercase tracking-[0.08em] text-white/24">Key</span> : null}
                    </div>
                    <p className="mt-1 text-[11px] uppercase tracking-[0.08em] text-white/30">
                      {complete ? "Complete" : `${exercise.sets.length} sets`}
                    </p>
                  </div>
                  {complete ? (
                    <Check className="h-4 w-4 text-white/40" strokeWidth={1.5} />
                  ) : (
                    <ChevronRight className="h-4 w-4 text-white/20" strokeWidth={1.5} />
                  )}
                </button>
              );
            })}
            {cardioPrompt ? (
              <div className="px-5 py-3">
                <p className="text-[15px] text-white/80">Cardio</p>
                <p className="mt-1 text-[13px] text-white/55">{cardioPrompt.title}</p>
                <p className="mt-1 text-[11px] uppercase tracking-[0.08em] text-white/30">
                  {cardioPrompt.duration}  {"\u00b7"}  {cardioPrompt.intensity}
                </p>
              </div>
            ) : null}
          </section>
        </ScrollReveal>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <ScrollReveal delay={0}>
        <div className="flex items-start justify-between gap-3 px-1">
          <div>
            <p className="label-eyebrow">Workout</p>
            <p className="mt-2 text-[15px] leading-6 text-white/78">
              {autoregulationRead?.detail ?? coach.progressionTargetRead ?? `Log the next clean set for ${currentExercise.exerciseName}.`}
            </p>
          </div>
          <CardHelpButton
            title="Workout autopilot"
            summary="This is the app's short read on the next clean move for the set in front of you."
            points={[
              "It reacts to the current exercise and any live signal already fired.",
              "It stays short on purpose so you can keep logging.",
            ]}
          />
        </div>
      </ScrollReveal>

      <ScrollReveal delay={40}>
        <section className="rounded-[20px] border border-white/[0.07] bg-[var(--bg-surface)] px-5 py-5">
          {/* Progress arc */}
          {(() => {
            const r = 18;
            const circumference = 2 * Math.PI * r;
            const progress = totalExercises > 0 ? completedExerciseCount / totalExercises : 0;
            const dash = circumference * progress;
            return (
              <div className="flex items-center gap-3">
                <div className="relative flex h-11 w-11 flex-shrink-0 items-center justify-center">
                  <svg width="44" height="44" viewBox="0 0 44 44" fill="none" className="-rotate-90">
                    <circle cx="22" cy="22" r={r} stroke="rgba(255,255,255,0.07)" strokeWidth="2.5" fill="none" />
                    <circle
                      cx="22" cy="22" r={r}
                      stroke="var(--accent)"
                      strokeWidth="2.5"
                      fill="none"
                      strokeDasharray={`${dash} ${circumference}`}
                      strokeLinecap="round"
                      style={{ transition: "stroke-dasharray 400ms cubic-bezier(0.34,1.56,0.64,1)" }}
                    />
                  </svg>
                  <span className="absolute text-[10px] font-semibold text-white/60">{completedExerciseCount}/{totalExercises}</span>
                </div>
                <div className="min-w-0">
                  <p className="label-eyebrow">{activeWorkout.workoutName}</p>
                  <p className="mt-1 text-[11px] text-white/36">
                    Set {Math.min(currentSetIndex + 1, currentExercise.sets.length)} of {currentExercise.sets.length}
                  </p>
                </div>
              </div>
            );
          })()}
          <h2 className="mt-3 text-[24px] font-semibold tracking-[-0.02em] text-white/95">{currentExercise.exerciseName}</h2>
          <ExerciseMusclePills
            profileId={profile.id}
            primaryMuscles={currentExercise.primaryMuscles}
            secondaryMuscles={currentExercise.secondaryMuscles}
            className="mt-4"
          />
          <div className="mt-4 rounded-[16px] border border-white/[0.07] bg-[var(--bg-elevated)] px-4 py-4">
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="label-eyebrow">Progression read</p>
                <p className="mt-2 text-[15px] leading-6 text-white/80">
                  {progressionRead.actionLabel}. {progressionRead.reason}
                </p>
              </div>
              <span className="rounded-full border border-white/[0.08] px-2.5 py-1 text-[11px] uppercase tracking-[0.08em] text-white/38">
                {progressionRead.confidenceLabel}
              </span>
            </div>
            <div className="mt-3 flex flex-wrap gap-2">
              <span className="rounded-full border border-white/[0.08] px-3 py-1.5 text-[12px] text-white/52">
                Last {progressionRead.lastSession}
              </span>
              <span className="rounded-full border border-white/[0.08] px-3 py-1.5 text-[12px] text-white/52">
                Best {progressionRead.currentBest}
              </span>
              <span className="rounded-full border border-white/[0.08] px-3 py-1.5 text-[12px] text-white/42">
                {progressionRead.evidenceLabel}
              </span>
            </div>
          </div>

          <div className="mt-5 flex items-center justify-between gap-[8%]">
            <label className="flex h-[100px] w-[46%] flex-col items-center justify-center rounded-[16px] border border-white/[0.08] bg-[#111111]">
              <input
                ref={weightInputRef}
                className="w-full border-0 bg-transparent p-0 text-center text-[44px] font-bold leading-none tracking-[-0.03em] text-white focus:border-0 focus:bg-transparent"
                inputMode="decimal"
                type="number"
                value={currentSet?.weight || ""}
                placeholder="0"
                onChange={(event) => onUpdateSet(currentExerciseIndex, currentSetIndex, "weight", Number(event.target.value))}
              />
              <span className="mt-2 text-[11px] font-medium uppercase tracking-[0.08em] text-white/25">Weight</span>
            </label>

            <label className="flex h-[100px] w-[46%] flex-col items-center justify-center rounded-[16px] border border-white/[0.08] bg-[#111111]">
              <input
                className="w-full border-0 bg-transparent p-0 text-center text-[44px] font-bold leading-none tracking-[-0.03em] text-white focus:border-0 focus:bg-transparent"
                inputMode="numeric"
                type="number"
                value={currentSet?.reps || ""}
                placeholder={targetRepSuggestion ? String(targetRepSuggestion) : "0"}
                onChange={(event) => onUpdateSet(currentExerciseIndex, currentSetIndex, "reps", Number(event.target.value))}
              />
              <span className="mt-2 text-[11px] font-medium uppercase tracking-[0.08em] text-white/25">Reps</span>
            </label>
          </div>

          <div className="mt-3 grid grid-cols-2 gap-3">
            <div className="flex items-center justify-between rounded-full border border-white/[0.08] px-3 py-2">
              <button
                type="button"
                onClick={() => nudgeWeight(-1)}
                className="text-[13px] text-white/55"
              >
                -{formatWeightKg(loadStep)}
              </button>
              <span className="text-[11px] uppercase tracking-[0.08em] text-white/24">Weight</span>
              <button
                type="button"
                onClick={() => nudgeWeight(1)}
                className="text-[13px] text-white/55"
              >
                +{formatWeightKg(loadStep)}
              </button>
            </div>
            <div className="flex items-center justify-between rounded-full border border-white/[0.08] px-3 py-2">
              <button
                type="button"
                onClick={() => nudgeReps(-1)}
                className="text-[13px] text-white/55"
              >
                -1 rep
              </button>
              <span className="text-[11px] uppercase tracking-[0.08em] text-white/24">Reps</span>
              <button
                type="button"
                onClick={() => nudgeReps(1)}
                className="text-[13px] text-white/55"
              >
                +1 rep
              </button>
            </div>
          </div>

          <div className="mt-4 flex flex-wrap gap-2">
            {suggestedStart ? (
              <button
                type="button"
                onClick={applyTargetToCurrentSet}
                className="rounded-full border border-white/[0.12] px-3 py-2 text-[13px] text-white/60"
              >
                {progressionRead.projectedPerformance ? `Target ${progressionRead.projectedPerformance}` : "Use target"}
              </button>
            ) : null}
            {matchingLastLoggedSet ? (
              <button
                type="button"
                onClick={applyPreviousSessionSet}
                className="rounded-full border border-white/[0.12] px-3 py-2 text-[13px] text-white/60"
              >
                Last session {formatWeightKg(matchingLastLoggedSet.weight)} x {matchingLastLoggedSet.reps}
              </button>
            ) : null}
            {previousSet && currentSetIndex > 0 ? (
              <button
                type="button"
                onClick={() => onCopyPreviousSet(currentExerciseIndex, currentSetIndex)}
                className="rounded-full border border-white/[0.12] px-3 py-2 text-[13px] text-white/60"
              >
                Repeat last set
              </button>
            ) : null}
            {substitutions.length ? (
              <button
                type="button"
                onClick={() => setShowSwapOptions((value) => !value)}
                className="rounded-full border border-white/[0.12] px-3 py-2 text-[13px] text-white/60"
              >
                Swap exercise
              </button>
            ) : null}
          </div>

          {showSwapOptions && substitutions.length ? (
            <div className="mt-4 space-y-2">
              {substitutions.slice(0, 4).map((option) => (
                <button
                  key={option.id}
                  type="button"
                  onClick={() => {
                    onSwapExercise(currentExerciseIndex, option.id);
                    setShowSwapOptions(false);
                  }}
                  className="flex w-full items-center justify-between rounded-[16px] border border-white/[0.07] bg-[var(--bg-elevated)] px-4 py-3 text-left"
                >
                  <span className="text-[15px] text-white/80">{option.name}</span>
                  <ChevronRight className="h-4 w-4 text-white/20" strokeWidth={1.5} />
                </button>
              ))}
            </div>
          ) : null}

          <button
            type="button"
            disabled={!canLogSet}
            onClick={handleCompleteSet}
            className={`mt-5 flex h-[58px] w-full items-center justify-center rounded-full text-[17px] font-semibold ${
              canLogSet ? "bg-[color:var(--accent)] text-black" : "border border-white/[0.12] bg-transparent text-white/35"
            }`}
          >
            Log Set
          </button>
        </section>
      </ScrollReveal>

      <ScrollReveal delay={80}>
        <div className="grid gap-3">
          <button
            type="button"
            onClick={() => setShowExercisePicker(true)}
            className="flex h-[54px] w-full items-center justify-center rounded-full border border-white/[0.12] bg-transparent text-[15px] font-medium text-white/60"
          >
            All exercises
          </button>
          <div className="grid grid-cols-2 gap-3">
            <button
              type="button"
              onClick={onSaveAndExitWorkout}
              className="flex h-[54px] items-center justify-center rounded-full border border-white/[0.12] bg-transparent text-[15px] font-medium text-white/60"
            >
              Save and exit
            </button>
            <button
              type="button"
              onClick={onCompleteWorkout}
              disabled={!workoutComplete && completedExerciseCount === 0}
              className={`flex h-[54px] items-center justify-center rounded-full text-[15px] font-medium ${
                workoutComplete || completedExerciseCount > 0
                  ? "border border-white/[0.12] bg-transparent text-white/72"
                  : "border border-white/[0.08] bg-transparent text-white/30"
              }`}
            >
              Finish workout
            </button>
          </div>
        </div>
      </ScrollReveal>
    </div>
  );
}
