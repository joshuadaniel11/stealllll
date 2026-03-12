"use client";

import { useState } from "react";
import { ChevronDown } from "lucide-react";

import { DailyBibleCard } from "@/components/daily-bible-card";
import { DailyStretchCard } from "@/components/daily-stretch-card";
import { ScrollReveal } from "@/components/scroll-reveal";
import { StrengthPredictionCard } from "@/components/strength-prediction-card";
import { Card, MiniMetric } from "@/components/ui";
import type {
  BibleVerse,
  Profile,
  SharedSummary,
  StrengthPrediction,
  StretchRecommendation,
  WorkoutPlanDay,
  WorkoutSession,
} from "@/lib/types";

function formatDate(value: string) {
  return new Intl.DateTimeFormat("en-NZ", {
    month: "short",
    day: "numeric",
  }).format(new Date(value));
}

const workoutMotivationByProfile: Record<string, Record<string, string>> = {
  natasha: {
    "natasha-glutes-hams":
      "🍑🔥 Build those round, juicy glutes until Joshua can't stop thinking about getting his hands all over you later.",
    "natasha-back-arms":
      "😈🖤 Make that back look so tempting Joshua goes crazy watching you walk away from him.",
    "natasha-glutes-quads":
      "🍑💋 Train legs and curves so good Joshua is desperate to pull you closer the second he sees you.",
    "natasha-upper-core":
      "✨🫦 Tighten that waist and shape that body until Joshua is fully obsessed with how sinful you look.",
    "natasha-core-explosive":
      "⚡😏 Move hot, feel dangerous, and carry that teasing little energy straight back to Joshua.",
  },
  joshua: {
    "joshua-chest-triceps":
      "😈💪 Press up that thick chest and triceps until Natasha wants herself pinned up close against you.",
    "joshua-back-biceps":
      "🖤💪 Train that wide back and biceps until Natasha gets hot just thinking about your arms wrapped tight around her.",
    "joshua-legs":
      "🔥🦵 Build those shoulders and legs so Natasha feels that hard, athletic look and wants you on her instantly.",
    "joshua-shoulders-arms":
      "💪😏 Hit chest and triceps again so Natasha can feel exactly how much thicker and harder you've gotten.",
    "joshua-upper-strength":
      "🖤🔥 Finish back and biceps hard so Natasha can see that wider, sexier shape and start wanting you on sight.",
  },
};

function getWorkoutMotivation(profileId: string, workoutId: string) {
  return (
    workoutMotivationByProfile[profileId]?.[workoutId] ??
    "Train with intent today and let the results speak for themselves."
  );
}

type HomeScreenProps = {
  profile: Profile;
  todaysWorkout: WorkoutPlanDay;
  activeWorkoutName: string | null;
  workoutRhythmNote: string | null;
  weeklyCount: number;
  streak: number;
  pbCount: number;
  strengthPredictions: StrengthPrediction[];
  dailyVerse: BibleVerse;
  dailyStretch: StretchRecommendation | null;
  stretchCompletedToday: boolean;
  sharedSummary: SharedSummary;
  recentWorkouts: WorkoutSession[];
  weddingCountdown: {
    months: number;
    days: number;
    label: string;
  };
  onOpenDailyVerse: () => void;
  onToggleStretch: () => void;
  onStartWorkout: (workoutId?: string) => void;
  onResumeWorkout: () => void;
  onPreviewWorkout: (workoutId: string) => void;
  onSkipWorkout: () => void;
  onMoveWorkout: (workoutId: string) => void;
  onOpenExercise: (exerciseName: string) => void;
};

export function HomeScreen({
  profile,
  todaysWorkout,
  activeWorkoutName,
  workoutRhythmNote,
  weeklyCount,
  streak,
  pbCount,
  strengthPredictions,
  dailyVerse,
  dailyStretch,
  stretchCompletedToday,
  sharedSummary,
  recentWorkouts,
  weddingCountdown,
  onOpenDailyVerse,
  onToggleStretch,
  onStartWorkout,
  onResumeWorkout,
  onPreviewWorkout,
  onSkipWorkout,
  onMoveWorkout,
  onOpenExercise,
}: HomeScreenProps) {
  const [showDetails, setShowDetails] = useState(false);
  const [showMoveChoices, setShowMoveChoices] = useState(false);

  const dailyMotivation = getWorkoutMotivation(profile.id, todaysWorkout.id);
  const smallDailyMessage =
    dailyMotivation.length > 108
      ? `${dailyMotivation.slice(0, 105).trimEnd()}...`
      : dailyMotivation;

  return (
    <div className="space-y-5 pb-28">
      <ScrollReveal delay={0}>
        <div className="text-center">
          <p className="text-[11px] uppercase tracking-[0.28em] text-white/45">
            Until November 2, 2026
          </p>
          <h2 className="mt-3 text-4xl font-semibold tracking-[-0.05em] text-white">
            {weddingCountdown.months} months • {weddingCountdown.days} days
          </h2>
          <p className="mt-2 text-sm leading-6 text-white/58">
            {weddingCountdown.label}
          </p>
        </div>
      </ScrollReveal>

      <ScrollReveal delay={30}>
        <Card className="space-y-3">
          <div className="space-y-1.5">
            <p className="text-[11px] uppercase tracking-[0.24em] text-white/42">
              Today&apos;s note
            </p>
            <h1 className="text-2xl font-semibold tracking-[-0.04em] text-white">
              {profile.name}
            </h1>
            <p className="text-sm leading-6 text-white/70">{smallDailyMessage}</p>
          </div>
        </Card>
      </ScrollReveal>

      <ScrollReveal delay={60}>
        <Card className="space-y-4">
          <div className="space-y-2">
            <p className="text-[11px] uppercase tracking-[0.24em] text-white/42">
              Today&apos;s workout
            </p>
            <div className="space-y-1">
              <h2 className="text-2xl font-semibold tracking-[-0.04em] text-white">
                {todaysWorkout.name}
              </h2>
              <p className="text-sm leading-6 text-white/62">
                {todaysWorkout.focus} • {todaysWorkout.exercises.length} exercises •{" "}
                {todaysWorkout.durationMinutes} min
              </p>
            </div>
            {workoutRhythmNote ? (
              <p className="text-sm leading-6 text-white/58">{workoutRhythmNote}</p>
            ) : null}
          </div>

          <div className="grid grid-cols-1 gap-2">
            <button
              type="button"
              onClick={() =>
                activeWorkoutName ? onResumeWorkout() : onStartWorkout(todaysWorkout.id)
              }
              className="rounded-[24px] bg-white px-5 py-4 text-base font-medium tracking-[-0.02em] text-black transition duration-200 active:scale-[0.99]"
            >
              {activeWorkoutName ? "Resume Workout Mode" : "Begin Session"}
            </button>
            <div className="flex items-center justify-between gap-3 text-sm text-white/70">
              <button
                type="button"
                onClick={() => onPreviewWorkout(todaysWorkout.id)}
                className="rounded-full px-1 py-1 transition text-white/74 hover:text-white"
              >
                Preview workout
              </button>
              <button
                type="button"
                onClick={() => setShowMoveChoices((value) => !value)}
                className="rounded-full px-1 py-1 transition text-white/52 hover:text-white"
              >
                Move or skip
              </button>
            </div>
          </div>

          {showMoveChoices ? (
            <div className="space-y-2 rounded-[22px] border border-white/10 bg-white/5 p-3">
              {profile.workoutPlan.map((workout) => (
                <button
                  key={workout.id}
                  type="button"
                  onClick={() => {
                    onMoveWorkout(workout.id);
                    setShowMoveChoices(false);
                  }}
                  className="flex w-full items-center justify-between rounded-[18px] px-3 py-3 text-left transition hover:bg-white/6"
                >
                  <span className="text-sm font-medium text-white/86">
                    {workout.dayLabel} • {workout.name}
                  </span>
                  <span className="text-xs text-white/45">Move here</span>
                </button>
              ))}
              <button
                type="button"
                onClick={() => {
                  onSkipWorkout();
                  setShowMoveChoices(false);
                }}
                className="w-full rounded-[18px] border border-white/10 px-3 py-3 text-sm text-white/65 transition hover:bg-white/6"
              >
                Skip for now
              </button>
            </div>
          ) : null}
        </Card>
      </ScrollReveal>

      <ScrollReveal delay={90}>
        <div className="grid grid-cols-3 gap-3">
          <MiniMetric label="This week" value={String(weeklyCount)} />
          <MiniMetric label="Streak" value={`${streak}d`} />
          <MiniMetric label="Last PRs" value={String(pbCount)} />
        </div>
      </ScrollReveal>

      {dailyStretch ? (
        <ScrollReveal delay={120}>
          <DailyStretchCard
            stretch={dailyStretch}
            completed={stretchCompletedToday}
            onToggle={onToggleStretch}
          />
        </ScrollReveal>
      ) : null}

      <ScrollReveal delay={150}>
        <Card className="space-y-4">
          <button
            type="button"
            onClick={() => setShowDetails((value) => !value)}
            className="flex w-full items-center justify-between text-left"
          >
            <div className="space-y-1">
              <p className="text-[11px] uppercase tracking-[0.24em] text-white/42">
                More
              </p>
              <p className="text-sm leading-6 text-white/62">
                Extra insight, quiet motivation, and recent activity.
              </p>
            </div>
            <ChevronDown
              className={`h-4 w-4 text-white/46 transition-transform duration-300 ${
                showDetails ? "rotate-180" : ""
              }`}
            />
          </button>

          {showDetails ? (
            <div className="space-y-4">
              <StrengthPredictionCard predictions={strengthPredictions} />

              <DailyBibleCard verse={dailyVerse} onOpen={onOpenDailyVerse} />

              <Card className="space-y-3 border border-white/6 bg-white/[0.03]">
                <p className="text-[11px] uppercase tracking-[0.24em] text-white/42">
                  Together
                </p>
                <div className="space-y-2">
                  <p className="text-sm font-medium text-white/88">
                    {sharedSummary.weeklyHighlight}
                  </p>
                  <p className="text-sm leading-6 text-white/58">
                    {sharedSummary.recentMilestones[0] ??
                      "Show up together and the week starts building itself."}
                  </p>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <MiniMetric
                    label="Team streak"
                    value={`${sharedSummary.teamStreak}d`}
                  />
                  <MiniMetric
                    label="Combined"
                    value={String(sharedSummary.combinedWorkouts)}
                  />
                </div>
              </Card>

              <Card className="space-y-3 border border-white/6 bg-white/[0.03]">
                <div className="flex items-center justify-between gap-3">
                  <p className="text-[11px] uppercase tracking-[0.24em] text-white/42">
                    Recent workouts
                  </p>
                  <span className="text-xs text-white/40">Last 2</span>
                </div>
                {recentWorkouts.length ? (
                  <div className="space-y-2">
                    {recentWorkouts.slice(0, 2).map((workout) => (
                      <button
                        key={workout.id}
                        type="button"
                        onClick={() => onOpenExercise(workout.exercises[0]?.exerciseName ?? "")}
                        className="flex w-full items-center justify-between rounded-[18px] px-3 py-3 text-left transition hover:bg-white/6"
                      >
                        <div className="space-y-1">
                          <p className="text-sm font-medium text-white/86">
                            {workout.workoutName}
                          </p>
                          <p className="text-xs leading-5 text-white/48">
                            {formatDate(workout.performedAt)} •{" "}
                            {workout.exercises.reduce(
                              (total, exercise) => total + exercise.sets.filter((set) => set.completed).length,
                              0,
                            )}{" "}
                            sets
                          </p>
                        </div>
                        <span className="text-xs text-white/38">Open</span>
                      </button>
                    ))}
                  </div>
                ) : (
                  <p className="text-sm leading-6 text-white/52">
                    No sessions logged yet. Your recent workouts will appear here.
                  </p>
                )}
              </Card>
            </div>
          ) : null}
        </Card>
      </ScrollReveal>
    </div>
  );
}
