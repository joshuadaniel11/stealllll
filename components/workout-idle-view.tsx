"use client";

import { useMemo, useState } from "react";
import { Dumbbell, List } from "lucide-react";

import { ExerciseMusclePills } from "@/components/exercise-muscle-pills";
import { ScrollReveal } from "@/components/scroll-reveal";
import { ActivityDropdown, type ActivityDropdownItem } from "@/components/ui/activity-dropdown";
import { BackgroundPaths } from "@/components/ui/background-paths";
import { selectDailyCardioPrompt } from "@/lib/daily-cardio";
import type { SuggestedFocusSession } from "@/lib/training-load";
import type { CoachReadModel } from "@/lib/view-models";
import { getWorkoutPreviewMuscleProfile, getWorkoutPreviewTags } from "@/lib/workout-preview";
import type { Profile, WorkoutPlanDay, WorkoutSession } from "@/lib/types";

function getLatestPartialByWorkout(userSessions: WorkoutSession[]) {
  return userSessions.reduce<Record<string, WorkoutSession>>((accumulator, session) => {
    if (!session.partial || accumulator[session.workoutDayId]) {
      return accumulator;
    }

    accumulator[session.workoutDayId] = session;
    return accumulator;
  }, {});
}

export function WorkoutIdleView({
  profile,
  todaysWorkoutId,
  previewWorkoutId,
  suggestedFocusSession,
  suggestedSessionPreview,
  userSessions,
  coach,
  onStartWorkout,
}: {
  profile: Profile;
  todaysWorkoutId: string;
  previewWorkoutId?: string | null;
  suggestedFocusSession: SuggestedFocusSession | null;
  suggestedSessionPreview: boolean;
  userSessions: WorkoutSession[];
  coach: CoachReadModel;
  onStartWorkout: (workout: WorkoutPlanDay) => void;
}) {
  const partialByWorkout = useMemo(() => getLatestPartialByWorkout(userSessions), [userSessions]);
  const recommendedWorkoutId =
    suggestedSessionPreview && suggestedFocusSession?.sourceWorkoutId
      ? suggestedFocusSession.sourceWorkoutId
      : todaysWorkoutId;
  const [selectedWorkoutId, setSelectedWorkoutId] = useState(() => previewWorkoutId ?? recommendedWorkoutId);
  const [showWorkoutPreviews, setShowWorkoutPreviews] = useState(
    () => Boolean(previewWorkoutId) || suggestedSessionPreview,
  );

  const selectedWorkout =
    profile.workoutPlan.find((workout) => workout.id === selectedWorkoutId) ??
    profile.workoutPlan.find((workout) => workout.id === todaysWorkoutId) ??
    profile.workoutPlan[0];
  const selectedPartial = partialByWorkout[selectedWorkout.id] ?? null;
  const selectedWorkoutMuscles = useMemo(() => getWorkoutPreviewMuscleProfile(selectedWorkout), [selectedWorkout]);
  const selectedCardioPrompt = useMemo(
    () => selectDailyCardioPrompt(profile.id, selectedWorkout.id),
    [profile.id, selectedWorkout.id],
  );
  const workoutPreviewItems = useMemo<ActivityDropdownItem[]>(
    () =>
      profile.workoutPlan.map((workout) => {
        const rowTags = getWorkoutPreviewTags(workout);
        const isRecommended = workout.id === recommendedWorkoutId;
        const isSelected = workout.id === selectedWorkout.id;
        const partial = partialByWorkout[workout.id];

        return {
          id: workout.id,
          icon: <Dumbbell className="h-4 w-4" strokeWidth={1.5} />,
          title: workout.name,
          description: `${rowTags.join(" · ")}${partial ? " · Resume ready" : ""}`,
          meta: workout.dayLabel,
          badgeLabel: isRecommended ? "Recommended" : undefined,
          selected: isSelected,
          onClick: () => setSelectedWorkoutId(workout.id),
        };
      }),
    [partialByWorkout, profile.workoutPlan, recommendedWorkoutId, selectedWorkout.id],
  );

  return (
    <div className="space-y-3">
      <ScrollReveal delay={0}>
        <div className="px-1">
          <p className="body-copy text-white/78">
            {selectedPartial
              ? `${selectedWorkout.name} already has saved progress. Finish it clean.`
              : selectedWorkout.id === recommendedWorkoutId
                ? coach.workoutRationale
                : `${selectedWorkout.name} is the clean next move.`}
          </p>
        </div>
      </ScrollReveal>

      <ScrollReveal delay={40}>
        <section className="glass-panel overflow-hidden px-5 py-5">
          <BackgroundPaths profileId={profile.id} className="opacity-90" />
          <div className="relative z-10">
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="label-eyebrow">Session</p>
                <h2 className="mt-3 text-[24px] font-semibold tracking-[-0.02em] text-white/95">{selectedWorkout.name}</h2>
              </div>
            </div>

            <ExerciseMusclePills
              profileId={profile.id}
              primaryMuscles={selectedWorkoutMuscles.primary}
              secondaryMuscles={selectedWorkoutMuscles.secondary}
              className="mt-4"
            />

            <div className="mt-4 grid gap-3">
              <button
                type="button"
                onClick={() => onStartWorkout(selectedWorkout)}
                className="flex h-[54px] w-full items-center justify-center rounded-full bg-[color:var(--accent)] text-[16px] font-semibold text-black"
              >
                {selectedPartial ? "Resume Session" : "Start Session"}
              </button>
              <button
                type="button"
                onClick={() => setShowWorkoutPreviews((current) => !current)}
                className="glass-button-secondary flex h-[54px] w-full items-center justify-center rounded-full text-[15px] font-medium text-white/60"
                aria-expanded={showWorkoutPreviews}
              >
                Preview
              </button>
            </div>
          </div>
        </section>
      </ScrollReveal>

      <ScrollReveal delay={80}>
        <ActivityDropdown
          title="Workout previews"
          description={`${profile.workoutPlan.length} splits ready. Tap one to load its exercise list.`}
          icon={<List className="h-5 w-5" strokeWidth={1.5} />}
          items={workoutPreviewItems}
          open={showWorkoutPreviews}
          onOpenChange={setShowWorkoutPreviews}
          contentClassName="px-3 pb-4"
        />
      </ScrollReveal>

      <ScrollReveal delay={120}>
        <section className="glass-panel px-5 py-5">
          <p className="label-eyebrow">Exercise list</p>
          <div className="mt-3 rounded-[16px] border border-white/[0.07] bg-[var(--bg-elevated)]">
            {selectedWorkout.exercises.map((exercise, index) => (
              <div
                key={exercise.id}
                className={`px-4 py-3 ${index !== selectedWorkout.exercises.length - 1 || selectedCardioPrompt ? "border-b border-white/[0.04]" : ""}`}
              >
                <p className="text-[15px] text-white/80">{exercise.name}</p>
                <p className="mt-1 text-[11px] uppercase tracking-[0.08em] text-white/30">
                  {exercise.sets} sets  {"\u00b7"}  {exercise.repRange}
                </p>
              </div>
            ))}

            {selectedCardioPrompt ? (
              <div className="px-4 py-3">
                <p className="text-[15px] text-white/80">Cardio</p>
                <p className="mt-1 text-[13px] text-white/55">{selectedCardioPrompt.title}</p>
                <p className="mt-1 text-[11px] uppercase tracking-[0.08em] text-white/30">
                  {selectedCardioPrompt.duration}  {"\u00b7"}  {selectedCardioPrompt.intensity}
                </p>
              </div>
            ) : null}
          </div>
        </section>
      </ScrollReveal>
    </div>
  );
}
