"use client";

import { WorkoutActiveView } from "@/components/workout-active-view";
import { WorkoutIdleView } from "@/components/workout-idle-view";
import type { WorkoutDayViewModel } from "@/lib/view-models";
import type { WorkoutPlanDay } from "@/lib/types";

export function WorkoutScreen({
  viewModel,
  onStartWorkout,
  onUpdateSet,
  onCopyPreviousSet,
  onCompleteSet,
  onSwapExercise,
  onCompleteWorkout,
  onSaveAndExitWorkout,
  onDismissLiveSignal,
  onCancelWorkout,
}: {
  viewModel: WorkoutDayViewModel;
  onStartWorkout: (workout: WorkoutPlanDay) => void;
  onUpdateSet: (exerciseIndex: number, setIndex: number, field: "weight" | "reps", value: number) => void;
  onCopyPreviousSet: (exerciseIndex: number, setIndex: number) => void;
  onCompleteSet: (exerciseIndex: number, setIndex: number) => void;
  onSwapExercise: (exerciseIndex: number, exerciseId: string) => void;
  onCompleteWorkout: () => void;
  onSaveAndExitWorkout: () => void;
  onDismissLiveSignal: () => void;
  onCancelWorkout: () => void;
}) {
  const {
    profile,
    todaysWorkoutId,
    previewWorkoutId,
    suggestedFocusSession,
    suggestedSessionPreview,
    signatureLifts,
    activeWorkout,
    activeWorkoutTemplate,
    liveSignal,
    userSessions,
    exerciseLibrary,
    coach,
  } = viewModel;
  const forcePreviewMode = Boolean(previewWorkoutId) || suggestedSessionPreview;

  if (!activeWorkout || activeWorkout.userId !== profile.id || forcePreviewMode) {
    return (
      <WorkoutIdleView
        key={`${profile.id}:${previewWorkoutId ?? (suggestedSessionPreview && suggestedFocusSession?.sourceWorkoutId ? suggestedFocusSession.sourceWorkoutId : todaysWorkoutId)}`}
        profile={profile}
        todaysWorkoutId={todaysWorkoutId}
        previewWorkoutId={previewWorkoutId}
        suggestedFocusSession={suggestedFocusSession}
        suggestedSessionPreview={suggestedSessionPreview}
        userSessions={userSessions}
        coach={coach}
        onStartWorkout={onStartWorkout}
      />
    );
  }

  return (
    <WorkoutActiveView
      key={activeWorkout.id}
      profile={profile}
      activeWorkout={activeWorkout}
      activeWorkoutTemplate={activeWorkoutTemplate}
      signatureLifts={signatureLifts}
      liveSignal={liveSignal}
      userSessions={userSessions}
      exerciseLibrary={exerciseLibrary}
      coach={coach}
      onUpdateSet={onUpdateSet}
      onCopyPreviousSet={onCopyPreviousSet}
      onCompleteSet={onCompleteSet}
      onSwapExercise={onSwapExercise}
      onCompleteWorkout={onCompleteWorkout}
      onSaveAndExitWorkout={onSaveAndExitWorkout}
      onDismissLiveSignal={onDismissLiveSignal}
      onCancelWorkout={onCancelWorkout}
    />
  );
}
