"use client";

import { useState } from "react";
import { ChevronDown } from "lucide-react";

import { DailyBibleCard } from "@/components/daily-bible-card";
import { DailyMobilityPromptCard } from "@/components/daily-mobility-prompt-card";
import { ScrollReveal } from "@/components/scroll-reveal";
import { StrengthPredictionCard } from "@/components/strength-prediction-card";
import { Card, MiniMetric } from "@/components/ui";
import { getSessionPresentation, getSessionSupportLine } from "@/lib/session-presentation";
import type { RecentTrainingUpdate } from "@/lib/types";
import type {
  BibleVerse,
  DailyMobilityPrompt,
  Profile,
  SharedSummary,
  StrengthPrediction,
  WorkoutPlanDay,
  WorkoutSession,
} from "@/lib/types";

function formatDate(value: string) {
  return new Intl.DateTimeFormat("en-NZ", {
    month: "short",
    day: "numeric",
  }).format(new Date(value));
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
  dailyMobilityPrompt: DailyMobilityPrompt | null;
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
  onOpenRecentWorkout: (workoutDayId: string, exerciseId?: string) => void;
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
  dailyMobilityPrompt,
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
  onOpenRecentWorkout,
}: HomeScreenProps) {
  const [showDetails, setShowDetails] = useState(false);
  const [showMoveChoices, setShowMoveChoices] = useState(false);

  const sessionPresentation = getSessionPresentation(profile, todaysWorkout);
  const latestSession = recentWorkouts[0] ?? null;
  const pendingPartial =
    latestSession?.partial && latestSession.workoutDayId === todaysWorkout.id ? latestSession : null;
  const homeStateLabel = activeWorkoutName
    ? "Live now"
    : pendingPartial
      ? "Resume ready"
      : "Queued today";
  const homeStateDetail = activeWorkoutName
    ? `${activeWorkoutName} is still open. Pick it back up where you left it.`
    : pendingPartial
      ? `${pendingPartial.workoutName} is ready to resume.`
      : getSessionSupportLine(todaysWorkout, workoutRhythmNote);
  const primaryActionLabel = activeWorkoutName
    ? "Resume Session"
    : pendingPartial
      ? "Resume Session"
      : "Start Session";
  const recentUpdateBadge = recentTrainingUpdate ? formatRecentTrainingUpdate(recentTrainingUpdate) : null;

  return (
    <div className="space-y-6 pb-28">
      <ScrollReveal delay={30}>
        <Card className="home-session-hero space-y-5 px-6 py-6">
          <div className="space-y-4">
            <div className="flex items-center justify-between gap-3">
              <p className="text-[11px] uppercase tracking-[0.26em] text-white/40">
                {sessionPresentation.splitLabel}
              </p>
              <span className="rounded-full bg-white/[0.06] px-3 py-1 text-[11px] font-medium text-white/58">
                {homeStateLabel}
              </span>
            </div>
            <div className="space-y-2">
              <h2 className="text-[2.2rem] font-semibold tracking-[-0.06em] text-white">
                {sessionPresentation.title}
              </h2>
              <p className="text-sm leading-6 text-white/56">
                {homeStateDetail}
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 gap-3">
            <button
              type="button"
              onClick={() =>
                activeWorkoutName ? onResumeWorkout() : onStartWorkout(todaysWorkout.id)
              }
              className="rounded-[26px] bg-white px-5 py-4 text-base font-semibold tracking-[-0.02em] text-black transition duration-200 active:scale-[0.99]"
            >
              {primaryActionLabel}
            </button>
            <div className="flex items-center justify-between gap-3 text-sm">
              <button
                type="button"
                onClick={() => onPreviewWorkout(todaysWorkout.id)}
                className="rounded-full px-1 py-1 transition text-white/58 hover:text-white/82"
              >
                Preview
              </button>
              <button
                type="button"
                onClick={() => setShowMoveChoices((value) => !value)}
                className="rounded-full px-1 py-1 transition text-white/42 hover:text-white/72"
              >
                Move or skip
              </button>
            </div>
          </div>

          {recentUpdateBadge ? (
            <div className="training-refresh-chip rounded-[22px] border border-white/8 bg-white/[0.03] px-4 py-3">
              <div className="flex items-center justify-between gap-3">
                <p className="text-[11px] uppercase tracking-[0.18em] text-white/46">
                  {recentUpdateBadge.label}
                </p>
                <span className="rounded-full bg-white/[0.07] px-2.5 py-1 text-[10px] font-medium uppercase tracking-[0.12em] text-white/54">
                  In sync
                </span>
              </div>
              <p className="mt-2 text-sm leading-6 text-white/60">{recentUpdateBadge.detail}</p>
            </div>
          ) : null}

          {showMoveChoices ? (
            <div className="space-y-2 rounded-[22px] border border-white/8 bg-white/[0.04] p-3">
              {profile.workoutPlan.map((workout) => (
                <button
                  key={workout.id}
                  type="button"
                  onClick={() => {
                    onMoveWorkout(workout.id);
                    setShowMoveChoices(false);
                  }}
                  className="flex w-full items-center justify-between rounded-[18px] px-3 py-3 text-left transition hover:bg-white/[0.05]"
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
                className="w-full rounded-[18px] border border-white/8 px-3 py-3 text-sm text-white/58 transition hover:bg-white/[0.05]"
              >
                Skip for now
              </button>
            </div>
          ) : null}
        </Card>
      </ScrollReveal>

      <ScrollReveal delay={55}>
        <div className="grid grid-cols-2 gap-3">
          <Card className="home-quiet-card space-y-2 px-4 py-4">
            <p className="text-[11px] uppercase tracking-[0.24em] text-white/38">Today&apos;s note</p>
            <p className="text-sm font-medium text-white/88">{sessionPresentation.noteLines[0]}</p>
            <p className="text-sm leading-6 text-white/54">{sessionPresentation.noteLines[1]}</p>
          </Card>
          <Card className="home-quiet-card space-y-2 px-4 py-4">
            <p className="text-[11px] uppercase tracking-[0.24em] text-white/38">Countdown</p>
            <p className="text-xl font-semibold tracking-[-0.04em] text-white">
              {weddingCountdown.months}m {"\u2022"} {weddingCountdown.days}d
            </p>
            <p className="text-sm leading-6 text-white/52">{weddingCountdown.label}</p>
          </Card>
        </div>
      </ScrollReveal>

      <ScrollReveal delay={75}>
        <div className="grid grid-cols-3 gap-3">
          <MiniMetric label="Sessions" value={String(weeklyCount)} />
          <MiniMetric label="Streak" value={`${streak}d`} />
          <MiniMetric label="PRs" value={String(pbCount)} />
        </div>
      </ScrollReveal>

      {dailyMobilityPrompt ? (
        <ScrollReveal delay={120}>
          <DailyMobilityPromptCard
            prompt={dailyMobilityPrompt}
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
              <p className="text-[11px] uppercase tracking-[0.24em] text-white/38">
                More
              </p>
              <p className="text-sm leading-6 text-white/62">
                Extra detail, recent sessions, and shared momentum.
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
                        onClick={() =>
                          onOpenRecentWorkout(workout.workoutDayId, workout.exercises[0]?.exerciseId)
                        }
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
                        <span className="text-xs text-white/38">Reopen</span>
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
