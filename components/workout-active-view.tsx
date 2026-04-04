"use client";

import { useEffect, useRef, useState } from "react";
import { Check, ChevronLeft, ChevronRight, List } from "lucide-react";

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
import type { SignatureLiftsState } from "@/lib/profile-training-state";
import type { CoachReadModel } from "@/lib/view-models";
import type {
  ActiveWorkout,
  ExerciseLibraryItem,
  LiveSessionSignal,
  Profile,
  WorkoutPlanDay,
  WorkoutSession,
} from "@/lib/types";

// ── Helpers ───────────────────────────────────────────────────────────────────

function firstIncompleteSetIndex(sets: ActiveWorkout["exercises"][number]["sets"]) {
  const i = sets.findIndex((s) => !s.completed);
  return i === -1 ? sets.length - 1 : i;
}

function firstPendingExercise(exercises: ActiveWorkout["exercises"]) {
  const i = exercises.findIndex((ex) => ex.sets.some((s) => !s.completed));
  return i === -1 ? 0 : i;
}

function nextPendingExercise(exercises: ActiveWorkout["exercises"], from: number) {
  for (let i = from + 1; i < exercises.length; i++) {
    if (exercises[i].sets.some((s) => !s.completed)) return i;
  }
  return Math.min(from + 1, exercises.length - 1);
}

function isExerciseDone(exercise: ActiveWorkout["exercises"][number]) {
  return exercise.sets.every((s) => s.completed);
}

function formatKg(value: number) {
  return `${value} kg`;
}

function getRepHint(repRange?: string) {
  if (!repRange) return null;
  const m = repRange.match(/(\d+)\s*[-–]\s*(\d+)/);
  return m ? parseInt(m[1], 10) : parseInt(repRange, 10) || null;
}

// ── Exercise picker overlay ───────────────────────────────────────────────────

function ExercisePicker({
  workout,
  signatureLifts,
  cardioPrompt,
  onSelect,
  onClose,
}: {
  workout: ActiveWorkout;
  signatureLifts: SignatureLiftsState;
  cardioPrompt: ReturnType<typeof selectDailyCardioPrompt>;
  onSelect: (index: number) => void;
  onClose: () => void;
}) {
  return (
    <div className="space-y-3">
      <ScrollReveal>
        <div className="flex items-center justify-between px-1">
          <div>
            <p className="label-eyebrow">Workout</p>
            <h2 className="mt-2 text-[22px] font-semibold tracking-[-0.02em] text-white/92">
              {workout.workoutName}
            </h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-full border border-white/[0.10] px-4 py-2 text-[13px] text-white/54"
          >
            Back
          </button>
        </div>
      </ScrollReveal>

      <ScrollReveal delay={30}>
        <section className="rounded-[20px] border border-white/[0.07] bg-[var(--bg-surface)] overflow-hidden">
          {workout.exercises.map((exercise, index) => {
            const done = isExerciseDone(exercise);
            const isSig =
              signatureLifts.ready &&
              signatureLifts.signatures.some((s) => s.exerciseName === exercise.exerciseName);
            return (
              <button
                key={`${exercise.exerciseId}-${index}`}
                type="button"
                onClick={() => { onSelect(index); onClose(); }}
                className={`flex w-full items-center justify-between px-5 py-4 text-left ${
                  index !== workout.exercises.length - 1 ? "border-b border-white/[0.04]" : ""
                }`}
              >
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <p className={`truncate text-[15px] ${done ? "text-white/40" : "text-white/82"}`}>
                      {exercise.exerciseName}
                    </p>
                    {isSig ? (
                      <span className="text-[10px] uppercase tracking-[0.08em] text-white/22">Key</span>
                    ) : null}
                  </div>
                  <p className="mt-0.5 text-[11px] uppercase tracking-[0.08em] text-white/28">
                    {done
                      ? `${exercise.sets.length} sets · done`
                      : `${exercise.sets.filter((s) => s.completed).length}/${exercise.sets.length} sets`}
                  </p>
                </div>
                {done ? (
                  <Check className="h-4 w-4 flex-shrink-0 text-white/35" strokeWidth={1.5} />
                ) : (
                  <ChevronRight className="h-4 w-4 flex-shrink-0 text-white/20" strokeWidth={1.5} />
                )}
              </button>
            );
          })}
          {cardioPrompt ? (
            <div className="border-t border-white/[0.04] px-5 py-4">
              <p className="text-[15px] text-white/70">Cardio</p>
              <p className="mt-0.5 text-[13px] text-white/46">{cardioPrompt.title} · {cardioPrompt.duration} · {cardioPrompt.intensity}</p>
            </div>
          ) : null}
        </section>
      </ScrollReveal>
    </div>
  );
}

// ── Main component ────────────────────────────────────────────────────────────

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
  onCancelWorkout,
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
  const [exIndex, setExIndex] = useState(() => firstPendingExercise(activeWorkout.exercises));
  const [showPicker, setShowPicker] = useState(false);
  const [showSwaps, setShowSwaps] = useState(false);
  const weightRef = useRef<HTMLInputElement | null>(null);

  const exercise = activeWorkout.exercises[exIndex];
  const template = activeWorkoutTemplate?.exercises[exIndex];
  const activeSetIndex = firstIncompleteSetIndex(exercise.sets);
  const activeSet = exercise.sets[activeSetIndex];
  const prevSet = activeSetIndex > 0 ? exercise.sets[activeSetIndex - 1] : null;

  const progressionExercise = template
    ? { ...template, name: exercise.exerciseName, muscleGroup: exercise.muscleGroup, primaryMuscles: exercise.primaryMuscles, secondaryMuscles: exercise.secondaryMuscles }
    : { id: exercise.exerciseId, name: exercise.exerciseName, muscleGroup: exercise.muscleGroup, primaryMuscles: exercise.primaryMuscles, secondaryMuscles: exercise.secondaryMuscles, sets: exercise.sets.length, repRange: "8-12", note: exercise.note };

  const progression = getExerciseProgressionRead(progressionExercise, userSessions);
  const lastSets = getLastExerciseSets(exercise.exerciseName, userSessions);
  const matchingLastSet = lastSets[activeSetIndex] ?? lastSets.at(-1) ?? null;
  const suggestedStart = getSuggestedStartingWeight(progressionExercise, userSessions);
  const repHint = progression.recommendedRepTarget ?? template?.suggestedRepTarget ?? getRepHint(template?.repRange);
  const loadStep = getSuggestedLoadStep((activeSet?.weight || progression.recommendedWeight || matchingLastSet?.weight || 0));
  const swapOptions = getExerciseSwapOptions(profile.id, exercise.exerciseName, exercise.muscleGroup, exerciseLibrary);
  const cardioPrompt = selectDailyCardioPrompt(profile.id, activeWorkout.workoutDayId);

  const completedCount = activeWorkout.exercises.filter(isExerciseDone).length;
  const totalCount = activeWorkout.exercises.length;
  const workoutDone = activeWorkout.exercises.every(isExerciseDone);
  const canLog = Boolean(activeSet && !activeSet.completed && (activeSet.weight > 0 || activeSet.reps > 0));

  const isJoshua = profile.id === "joshua";
  const accentLogBtn = isJoshua
    ? "bg-emerald-500 text-white"
    : "bg-sky-500 text-white";

  // Auto-focus weight input when exercise / set changes
  useEffect(() => {
    const t = window.setTimeout(() => weightRef.current?.focus(), 100);
    return () => window.clearTimeout(t);
  }, [exIndex, activeSet?.id]);

  // Auto-dismiss live signal after 5s
  useEffect(() => {
    if (!liveSignal || liveSignal.dismissedAt) return;
    const t = window.setTimeout(onDismissLiveSignal, 5000);
    return () => window.clearTimeout(t);
  }, [liveSignal, onDismissLiveSignal]);

  const handleLogSet = () => {
    if (!activeSet || !canLog) return;
    const nextSet = exercise.sets.findIndex((s, i) => i > activeSetIndex && !s.completed);
    const nextEx = nextPendingExercise(activeWorkout.exercises, exIndex);
    onCompleteSet(exIndex, activeSetIndex);
    if (nextSet === -1 && nextEx !== exIndex) {
      setExIndex(nextEx);
    }
  };

  const nudgeWeight = (dir: -1 | 1) => {
    if (!activeSet) return;
    const next = Math.max(0, Math.round((activeSet.weight + loadStep * dir) * 2) / 2);
    onUpdateSet(exIndex, activeSetIndex, "weight", next);
  };

  const nudgeReps = (dir: -1 | 1) => {
    if (!activeSet) return;
    onUpdateSet(exIndex, activeSetIndex, "reps", Math.max(0, activeSet.reps + dir));
  };

  const applyTarget = () => {
    if (!activeSet) return;
    if (progression.recommendedWeight !== null) onUpdateSet(exIndex, activeSetIndex, "weight", progression.recommendedWeight);
    if (repHint !== null) onUpdateSet(exIndex, activeSetIndex, "reps", repHint);
  };

  const applyLastSession = () => {
    if (!activeSet || !matchingLastSet) return;
    onUpdateSet(exIndex, activeSetIndex, "weight", matchingLastSet.weight);
    onUpdateSet(exIndex, activeSetIndex, "reps", matchingLastSet.reps);
  };

  if (showPicker) {
    return (
      <ExercisePicker
        workout={activeWorkout}
        signatureLifts={signatureLifts}
        cardioPrompt={cardioPrompt}
        onSelect={setExIndex}
        onClose={() => setShowPicker(false)}
      />
    );
  }

  return (
    <div className="space-y-3">
      {/* ── Live signal banner ─────────────────────────── */}
      {liveSignal && !liveSignal.dismissedAt ? (
        <ScrollReveal>
          <div className="rounded-[14px] border border-white/[0.10] bg-white/[0.04] px-4 py-3">
            <div className="flex items-start justify-between gap-3">
              <p className="text-[13px] leading-5 text-white/78">{liveSignal.message}</p>
              <button
                type="button"
                onClick={onDismissLiveSignal}
                className="flex-shrink-0 text-[12px] text-white/36"
              >
                ✕
              </button>
            </div>
          </div>
        </ScrollReveal>
      ) : null}

      {/* ── Workout header ─────────────────────────────── */}
      <ScrollReveal>
        <div className="flex items-center justify-between px-1">
          <div>
            <p className="label-eyebrow">{activeWorkout.workoutName}</p>
            <p className="mt-1 text-[12px] text-white/36">
              {completedCount}/{totalCount} exercises done
            </p>
          </div>
          <div className="flex items-center gap-2">
            {/* Progress ring */}
            <div className="relative h-9 w-9">
              <svg width="36" height="36" viewBox="0 0 36 36" fill="none" className="-rotate-90">
                <circle cx="18" cy="18" r="14" stroke="rgba(255,255,255,0.07)" strokeWidth="2.5" fill="none" />
                <circle
                  cx="18" cy="18" r="14"
                  stroke="var(--accent)"
                  strokeWidth="2.5"
                  fill="none"
                  strokeDasharray={`${2 * Math.PI * 14 * (totalCount > 0 ? completedCount / totalCount : 0)} ${2 * Math.PI * 14}`}
                  strokeLinecap="round"
                  style={{ transition: "stroke-dasharray 400ms cubic-bezier(0.34,1.56,0.64,1)" }}
                />
              </svg>
            </div>
          </div>
        </div>
      </ScrollReveal>

      {/* ── Exercise card ──────────────────────────────── */}
      <ScrollReveal delay={30}>
        <section className="rounded-[20px] border border-white/[0.07] bg-[var(--bg-surface)] px-5 py-5 space-y-4">

          {/* Exercise name + muscles */}
          <div className="space-y-2">
            <h2 className="text-[24px] font-semibold tracking-[-0.02em] text-white/96">
              {exercise.exerciseName}
            </h2>
            <ExerciseMusclePills
              profileId={profile.id}
              primaryMuscles={exercise.primaryMuscles}
              secondaryMuscles={exercise.secondaryMuscles}
            />
          </div>

          {/* Progression hint */}
          <div className="rounded-[12px] border border-white/[0.06] bg-white/[0.02] px-3 py-3">
            <p className="text-[13px] leading-5 text-white/62">
              {progression.actionLabel}. {progression.reason}
            </p>
            <div className="mt-2 flex flex-wrap gap-1.5">
              <span className="rounded-full border border-white/[0.07] px-2.5 py-0.5 text-[11px] text-white/40">
                Last {progression.lastSession}
              </span>
              <span className="rounded-full border border-white/[0.07] px-2.5 py-0.5 text-[11px] text-white/40">
                Best {progression.currentBest}
              </span>
            </div>
          </div>

          {/* All sets — show each one */}
          <div className="space-y-2">
            <p className="label-eyebrow">Sets</p>
            {exercise.sets.map((set, si) => {
              const isActive = si === activeSetIndex && !set.completed;
              const isDone = set.completed;
              return (
                <div
                  key={set.id}
                  className={`flex items-center gap-3 rounded-[12px] px-3 py-2.5 transition-colors ${
                    isActive
                      ? "border border-white/[0.12] bg-white/[0.04]"
                      : isDone
                        ? "border border-white/[0.05] bg-white/[0.01]"
                        : "border border-transparent"
                  }`}
                >
                  <span className={`w-5 text-center text-[12px] font-medium ${isDone ? "text-white/30" : isActive ? "text-white/70" : "text-white/24"}`}>
                    {si + 1}
                  </span>
                  <span className={`flex-1 text-[14px] ${isDone ? "text-white/40 line-through decoration-white/20" : isActive ? "text-white/88" : "text-white/30"}`}>
                    {isDone || (!isActive && set.weight > 0)
                      ? `${set.weight} kg × ${set.reps}`
                      : isActive
                        ? "Active"
                        : "—"}
                  </span>
                  {isDone ? <Check className="h-3.5 w-3.5 text-white/35" strokeWidth={2} /> : null}
                </div>
              );
            })}
          </div>

          {/* Weight + Reps inputs */}
          <div className="grid grid-cols-2 gap-3">
            <label className="flex flex-col items-center justify-center rounded-[16px] border border-white/[0.08] bg-[#111] py-5">
              <input
                ref={weightRef}
                type="number"
                inputMode="decimal"
                value={activeSet?.weight || ""}
                placeholder="0"
                onChange={(e) => onUpdateSet(exIndex, activeSetIndex, "weight", Number(e.target.value))}
                className="w-full border-0 bg-transparent p-0 text-center text-[44px] font-bold leading-none tracking-[-0.03em] text-white focus:outline-none"
              />
              <span className="mt-2 text-[11px] font-medium uppercase tracking-[0.08em] text-white/24">kg</span>
            </label>
            <label className="flex flex-col items-center justify-center rounded-[16px] border border-white/[0.08] bg-[#111] py-5">
              <input
                type="number"
                inputMode="numeric"
                value={activeSet?.reps || ""}
                placeholder={repHint ? String(repHint) : "0"}
                onChange={(e) => onUpdateSet(exIndex, activeSetIndex, "reps", Number(e.target.value))}
                className="w-full border-0 bg-transparent p-0 text-center text-[44px] font-bold leading-none tracking-[-0.03em] text-white focus:outline-none"
              />
              <span className="mt-2 text-[11px] font-medium uppercase tracking-[0.08em] text-white/24">reps</span>
            </label>
          </div>

          {/* Nudge controls */}
          <div className="grid grid-cols-2 gap-3">
            <div className="flex items-center justify-between rounded-full border border-white/[0.08] px-3 py-2">
              <button type="button" onClick={() => nudgeWeight(-1)} className="text-[13px] text-white/52">
                −{formatKg(loadStep)}
              </button>
              <span className="text-[10px] uppercase tracking-[0.08em] text-white/22">Weight</span>
              <button type="button" onClick={() => nudgeWeight(1)} className="text-[13px] text-white/52">
                +{formatKg(loadStep)}
              </button>
            </div>
            <div className="flex items-center justify-between rounded-full border border-white/[0.08] px-3 py-2">
              <button type="button" onClick={() => nudgeReps(-1)} className="text-[13px] text-white/52">
                −1
              </button>
              <span className="text-[10px] uppercase tracking-[0.08em] text-white/22">Reps</span>
              <button type="button" onClick={() => nudgeReps(1)} className="text-[13px] text-white/52">
                +1
              </button>
            </div>
          </div>

          {/* Quick-fill chips */}
          <div className="flex flex-wrap gap-2">
            {suggestedStart ? (
              <button
                type="button"
                onClick={applyTarget}
                className="rounded-full border border-white/[0.10] px-3 py-1.5 text-[12px] text-white/56"
              >
                {progression.projectedPerformance ? `Target ${progression.projectedPerformance}` : "Use target"}
              </button>
            ) : null}
            {matchingLastSet ? (
              <button
                type="button"
                onClick={applyLastSession}
                className="rounded-full border border-white/[0.10] px-3 py-1.5 text-[12px] text-white/56"
              >
                Last: {matchingLastSet.weight} kg × {matchingLastSet.reps}
              </button>
            ) : null}
            {prevSet && activeSetIndex > 0 ? (
              <button
                type="button"
                onClick={() => onCopyPreviousSet(exIndex, activeSetIndex)}
                className="rounded-full border border-white/[0.10] px-3 py-1.5 text-[12px] text-white/56"
              >
                Repeat set {activeSetIndex}
              </button>
            ) : null}
            {swapOptions.length > 0 ? (
              <button
                type="button"
                onClick={() => setShowSwaps((v) => !v)}
                className="rounded-full border border-white/[0.10] px-3 py-1.5 text-[12px] text-white/44"
              >
                Swap exercise
              </button>
            ) : null}
          </div>

          {/* Swap options */}
          {showSwaps && swapOptions.length > 0 ? (
            <div className="space-y-2">
              {swapOptions.slice(0, 5).map((opt) => (
                <button
                  key={opt.id}
                  type="button"
                  onClick={() => { onSwapExercise(exIndex, opt.id); setShowSwaps(false); }}
                  className="flex w-full items-center justify-between rounded-[14px] border border-white/[0.07] bg-[var(--bg-elevated)] px-4 py-3 text-left"
                >
                  <span className="text-[14px] text-white/78">{opt.name}</span>
                  <ChevronRight className="h-4 w-4 text-white/22" strokeWidth={1.5} />
                </button>
              ))}
            </div>
          ) : null}

          {/* Log Set CTA */}
          <button
            type="button"
            disabled={!canLog}
            onClick={handleLogSet}
            className={`h-[56px] w-full rounded-full text-[17px] font-semibold transition-all ${
              canLog
                ? `${accentLogBtn} active:scale-[0.97]`
                : "border border-white/[0.10] text-white/30"
            }`}
          >
            Log Set
          </button>
        </section>
      </ScrollReveal>

      {/* ── Exercise navigation ────────────────────────── */}
      <ScrollReveal delay={60}>
        <div className="flex items-center gap-2">
          <button
            type="button"
            disabled={exIndex === 0}
            onClick={() => setExIndex((i) => Math.max(0, i - 1))}
            className="flex h-[50px] flex-1 items-center justify-center gap-1.5 rounded-full border border-white/[0.10] text-[13px] text-white/52 disabled:opacity-30"
          >
            <ChevronLeft className="h-4 w-4" strokeWidth={1.5} />
            Prev
          </button>
          <button
            type="button"
            onClick={() => setShowPicker(true)}
            className="flex h-[50px] flex-shrink-0 items-center justify-center rounded-full border border-white/[0.10] px-4"
          >
            <List className="h-5 w-5 text-white/50" strokeWidth={1.5} />
          </button>
          <button
            type="button"
            disabled={exIndex >= activeWorkout.exercises.length - 1}
            onClick={() => setExIndex((i) => Math.min(activeWorkout.exercises.length - 1, i + 1))}
            className="flex h-[50px] flex-1 items-center justify-center gap-1.5 rounded-full border border-white/[0.10] text-[13px] text-white/52 disabled:opacity-30"
          >
            Next
            <ChevronRight className="h-4 w-4" strokeWidth={1.5} />
          </button>
        </div>
      </ScrollReveal>

      {/* ── Session controls ───────────────────────────── */}
      <ScrollReveal delay={80}>
        <div className="grid grid-cols-2 gap-3">
          <button
            type="button"
            onClick={onSaveAndExitWorkout}
            className="flex h-[52px] items-center justify-center rounded-full border border-white/[0.10] text-[14px] font-medium text-white/54"
          >
            Save &amp; exit
          </button>
          <button
            type="button"
            onClick={onCompleteWorkout}
            disabled={completedCount === 0}
            className={`flex h-[52px] items-center justify-center rounded-full text-[14px] font-medium ${
              completedCount > 0
                ? "border border-white/[0.12] text-white/72"
                : "border border-white/[0.07] text-white/25"
            }`}
          >
            Finish workout
          </button>
        </div>
      </ScrollReveal>
    </div>
  );
}
