"use client";

import { useState } from "react";
import { ChevronDown } from "lucide-react";

import { DailyBibleCard } from "@/components/daily-bible-card";
import { DailyStretchCard } from "@/components/daily-stretch-card";
import { ScrollReveal } from "@/components/scroll-reveal";
import { StrengthPredictionCard } from "@/components/strength-prediction-card";
import { Card, MiniMetric } from "@/components/ui";
import type { RecentTrainingUpdate } from "@/lib/types";
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
      "\u{1F351}\u{1F525} Build those round, juicy glutes until Joshua can't stop thinking about getting his hands all over you later.",
    "natasha-back-arms":
      "\u{1F608}\u{1F5A4} Make that back look so tempting Joshua goes crazy watching you walk away from him.",
    "natasha-glutes-quads":
      "\u{1F351}\u{1F48B} Train legs and curves so good Joshua is desperate to pull you closer the second he sees you.",
    "natasha-upper-core":
      "\u2728\u{1FAE6} Tighten that waist and shape that body until Joshua is fully obsessed with how sinful you look.",
    "natasha-core-explosive":
      "\u26A1\u{1F60F} Move hot, feel dangerous, and carry that teasing little energy straight back to Joshua.",
  },
  joshua: {
    "joshua-chest-triceps":
      "\u{1F608}\u{1F4AA} Press up that thick chest and triceps until Natasha wants herself pinned up close against you.",
    "joshua-back-biceps":
      "\u{1F5A4}\u{1F4AA} Train that wide back and biceps until Natasha gets hot just thinking about your arms wrapped tight around her.",
    "joshua-legs":
      "\u{1F525}\u{1F9B5} Build those shoulders and legs so Natasha feels that hard, athletic look and wants you on her instantly.",
    "joshua-shoulders-arms":
      "\u{1F4AA}\u{1F60F} Hit chest and triceps again so Natasha can feel exactly how much thicker and harder you've gotten.",
    "joshua-upper-strength":
      "\u{1F5A4}\u{1F525} Finish back and biceps hard so Natasha can see that wider, sexier shape and start wanting you on sight.",
  },
};

function getWorkoutMotivation(profileId: string, workoutId: string) {
  return (
    workoutMotivationByProfile[profileId]?.[workoutId] ??
    "Train with intent today and let the results speak for themselves."
  );
}

function formatRecentTrainingUpdate(update: {
  timestamp: string;
  workoutName: string;
  kind: "partial" | "complete" | "edit";
}) {
  const minutesAgo = Math.max(0, Math.round((Date.now() - new Date(update.timestamp).getTime()) / 60000));
  const freshness =
    minutesAgo <= 1 ? "just now" : minutesAgo < 60 ? `${minutesAgo} min ago` : "recently";
  const actionLabel =
    update.kind === "partial"
      ? "Progress saved"
      : update.kind === "edit"
        ? "Session updated"
        : "Workout landed";

  return {
    label: actionLabel,
    detail: `${update.workoutName} refreshed your training view ${freshness}.`,
  };
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
  recentTrainingUpdate: RecentTrainingUpdate | null;
  onOpenDailyVerse: () => void;
  onToggleStretch: () => void;
  onStartWorkout: (workoutId?: string) => void;
  onResumeWorkout: () => void;
  onPreviewWorkout: (workoutId: string) => void;
  onSkipWorkout: () => void;
  onMoveWorkout: (workoutId: string) => void;
  onOpenExercise: (exerciseId: string) => void;
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
  recentTrainingUpdate,
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

  const dailyMotivation = getWorkoutMotivation(
    profile.id,
    todaysWorkout.id,
  );
  const latestSession = recentWorkouts[0] ?? null;
  const pendingPartial =
    latestSession?.partial && latestSession.workoutDayId === todaysWorkout.id ? latestSession : null;
  const homeStateLabel = activeWorkoutName
    ? "Active workout"
    : pendingPartial
      ? "Partial workout saved"
      : "Ready when you are";
  const homeStateDetail = activeWorkoutName
    ? `${activeWorkoutName} is still open on this phone. Jump back in where you left it.`
    : pendingPartial
      ? `You saved part of ${pendingPartial.workoutName}. Resume it when ready, or leave it and move on later.`
      : workoutRhythmNote ?? "Today is lined up. Start clean and train with intent.";
  const primaryActionLabel = activeWorkoutName
    ? "Resume Workout Mode"
    : pendingPartial
      ? "Resume Partial Workout"
      : "Begin Session";
  const recentUpdateBadge = recentTrainingUpdate ? formatRecentTrainingUpdate(recentTrainingUpdate) : null;

  return (
    <div className="space-y-5 pb-28">
      <ScrollReveal delay={0}>
        <div className="text-center">
          <p className="text-[11px] uppercase tracking-[0.28em] text-white/45">
            Until November 2, 2026
          </p>
          <h2 className="mt-3 text-4xl font-semibold tracking-[-0.05em] text-white">
            {weddingCountdown.months} months {"\u2022"} {weddingCountdown.days} days
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
            <p className="text-sm leading-7 text-white/70">{dailyMotivation}</p>
          </div>
        </Card>
      </ScrollReveal>

      <ScrollReveal delay={60}>
        <Card className="space-y-4">
          <div className="space-y-3">
            <div className="flex items-center justify-between gap-3">
              <p className="text-[11px] uppercase tracking-[0.24em] text-white/42">
                Today&apos;s workout
              </p>
              <span className="rounded-full bg-white/8 px-3 py-1 text-[11px] font-medium text-white/62">
                {homeStateLabel}
              </span>
            </div>
            <div className="space-y-1.5">
              <h2 className="text-2xl font-semibold tracking-[-0.04em] text-white">
                {todaysWorkout.name}
              </h2>
              <p className="text-sm leading-6 text-white/62">
                {todaysWorkout.focus} {"\u2022"} {todaysWorkout.exercises.length} exercises {"\u2022"}{" "}
                {todaysWorkout.durationMinutes} min
              </p>
            </div>
            <p className="text-sm leading-6 text-white/58">{homeStateDetail}</p>
          </div>

          <div className="grid grid-cols-1 gap-2">
            <button
              type="button"
              onClick={() =>
                activeWorkoutName ? onResumeWorkout() : onStartWorkout(todaysWorkout.id)
              }
              className="rounded-[24px] bg-white px-5 py-4 text-base font-medium tracking-[-0.02em] text-black transition duration-200 active:scale-[0.99]"
            >
              {primaryActionLabel}
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

          {recentUpdateBadge ? (
            <div className="training-refresh-chip rounded-[22px] border border-white/10 bg-white/[0.04] px-4 py-3">
              <div className="flex items-center justify-between gap-3">
                <p className="text-[11px] uppercase tracking-[0.18em] text-white/46">
                  {recentUpdateBadge.label}
                </p>
                <span className="rounded-full bg-white/8 px-2.5 py-1 text-[10px] font-medium uppercase tracking-[0.12em] text-white/58">
                  In sync
                </span>
              </div>
              <p className="mt-2 text-sm leading-6 text-white/68">{recentUpdateBadge.detail}</p>
            </div>
          ) : null}

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
                    {workout.dayLabel} {"\u2022"} {workout.name}
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
                        onClick={() => onOpenExercise(workout.exercises[0]?.exerciseId ?? "")}
                        className="flex w-full items-center justify-between rounded-[18px] px-3 py-3 text-left transition hover:bg-white/6"
                      >
                        <div className="space-y-1">
                          <p className="text-sm font-medium text-white/86">
                            {workout.workoutName}
                          </p>
                          <p className="text-xs leading-5 text-white/48">
                            {formatDate(workout.performedAt)} {"\u2022"}{" "}
                            {workout.exercises.reduce(
                              (total, exercise) =>
                                total +
                                exercise.sets.filter((set) => set.completed).length,
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

              <Card className="space-y-3 border border-white/6 bg-white/[0.03]">
                <p className="text-[11px] uppercase tracking-[0.24em] text-white/42">
                  Together
                </p>
                <p className="text-sm font-medium text-white/88">
                  {sharedSummary.weeklyHighlight}
                </p>
                <div className="grid grid-cols-2 gap-3">
                  <MiniMetric
                    label="Shared streak"
                    value={`${sharedSummary.teamStreak}w`}
                  />
                  <MiniMetric
                    label="This week"
                    value={String(sharedSummary.combinedWorkouts)}
                  />
                </div>
                <div className="space-y-2">
                  {sharedSummary.recentMilestones.slice(0, 3).map((milestone) => (
                    <div
                      key={milestone}
                      className="rounded-[18px] border border-white/6 bg-white/[0.03] px-3 py-3 text-sm leading-6 text-white/64"
                    >
                      {milestone}
                    </div>
                  ))}
                </div>
              </Card>
            </div>
          ) : null}
        </Card>
      </ScrollReveal>
    </div>
  );
}
