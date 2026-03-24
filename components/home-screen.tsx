"use client";

import { useState } from "react";
import { ChevronDown } from "lucide-react";

import { DailyBibleCard } from "@/components/daily-bible-card";
import { DailyMobilityPromptCard } from "@/components/daily-mobility-prompt-card";
import { ScrollReveal } from "@/components/scroll-reveal";
import { StrengthPredictionCard } from "@/components/strength-prediction-card";
import { Card, MiniMetric } from "@/components/ui";
import { WeeklyTrainingCalendar } from "@/components/weekly-training-calendar";
import type { RestDayState } from "@/lib/profile-training-state";
import { getSessionPresentation } from "@/lib/session-presentation";
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

  return {
    detail: `${update.workoutName} refreshed your training view ${freshness}.`,
  };
}

function formatNextSessionDaysOut(daysOut: number) {
  if (daysOut <= 0) {
    return "today";
  }
  if (daysOut === 1) {
    return "tomorrow";
  }
  return `in ${daysOut} days`;
}

type HomeScreenProps = {
  profile: Profile;
  todaysWorkout: WorkoutPlanDay;
  activeWorkoutName: string | null;
  trainingInsight: string;
  restDayState: RestDayState;
  restDayRead: string | null;
  restRecoveryLabel: string;
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
  momentumPillText: string | null;
  calendarRows: Array<{
    label: string;
    isCurrentWeek: boolean;
    days: Array<{
      key: string;
      dayLabel: string;
      dayNumber: number;
      completed: boolean;
      isToday: boolean;
      joshuaCompleted: boolean;
      natashaCompleted: boolean;
    }>;
  }>;
  onOpenDailyVerse: () => void;
  onToggleStretch: () => void;
  onStartWorkout: (workoutId?: string) => void;
  onResumeWorkout: () => void;
  onPreviewWorkout: (workoutId: string) => void;
  onSkipWorkout: () => void;
  onMoveWorkout: (workoutId: string) => void;
  onOpenRecentWorkout: (workoutDayId: string, exerciseId?: string) => void;
};

export function HomeScreen({
  profile,
  todaysWorkout,
  activeWorkoutName,
  trainingInsight,
  restDayState,
  restDayRead,
  restRecoveryLabel,
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
  momentumPillText,
  calendarRows,
  onOpenDailyVerse,
  onToggleStretch,
  onStartWorkout,
  onResumeWorkout,
  onPreviewWorkout,
  onSkipWorkout,
  onMoveWorkout,
  onOpenRecentWorkout,
}: HomeScreenProps) {
  const [showDetails, setShowDetails] = useState(false);
  const [showExtras, setShowExtras] = useState(false);
  const [showUtilityStack, setShowUtilityStack] = useState(false);
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
    ? `Resume when you're ready. ${trainingInsight}`
    : pendingPartial
      ? `Pick it back up. ${trainingInsight}`
      : trainingInsight;
  const primaryActionLabel = activeWorkoutName
    ? "Resume Session"
    : pendingPartial
      ? "Resume Session"
      : "Start Session";
  const recentUpdateBadge = recentTrainingUpdate ? formatRecentTrainingUpdate(recentTrainingUpdate) : null;
  const currentWeekRow = calendarRows.find((row) => row.isCurrentWeek) ?? calendarRows.at(-1) ?? null;
  const joshuaWeekCount = currentWeekRow ? currentWeekRow.days.filter((day) => day.joshuaCompleted).length : 0;
  const natashaWeekCount = currentWeekRow ? currentWeekRow.days.filter((day) => day.natashaCompleted).length : 0;
  const competitionSummary =
    joshuaWeekCount === natashaWeekCount
      ? joshuaWeekCount === 0
        ? "Fresh week. First session sets the tone."
        : `Tied this week at ${joshuaWeekCount} each.`
      : joshuaWeekCount > natashaWeekCount
        ? `Joshua leads ${joshuaWeekCount} to ${natashaWeekCount}.`
        : `Natasha leads ${natashaWeekCount} to ${joshuaWeekCount}.`;
  const showRestDayHero = restDayState.isRest && restDayRead;
  const moreSummary = showRestDayHero
    ? "Note first. One quiet utility layer."
    : dailyMobilityPrompt
      ? "Note first. Mobility if you want it."
      : "Note first. One quiet utility layer.";

  return (
    <div className="space-y-4 pb-28">
      <ScrollReveal delay={30}>
        {showRestDayHero ? (
          <Card className="home-session-hero tab-fade-enter space-y-5 px-6 py-6">
            <div className="space-y-2">
              <p className="text-[11px] uppercase tracking-[0.26em] text-white/40">Rest read</p>
              <h2 className="text-[2rem] font-semibold tracking-[-0.06em] text-white">{restDayRead}</h2>
            </div>
            <div className="space-y-1">
              <p className="text-[11px] uppercase tracking-[0.22em] text-white/34">Recovery state</p>
              <p className="text-sm leading-6 text-white/54">{restRecoveryLabel}</p>
            </div>
            <div className="space-y-1">
              <p className="text-[11px] uppercase tracking-[0.22em] text-white/34">Next session</p>
              <p className="text-base font-medium tracking-[-0.02em] text-white/88">
                {restDayState.nextBestSession} {"\u00b7"} {formatNextSessionDaysOut(restDayState.nextBestSessionDaysOut)}
              </p>
            </div>
          </Card>
        ) : (
          <Card className="home-session-hero tab-fade-enter space-y-4 px-6 py-6">
            <div className="space-y-2.5">
              <div className="flex items-center justify-between gap-3">
                <p className="text-[11px] uppercase tracking-[0.26em] text-white/40">
                  {sessionPresentation.splitLabel}
                </p>
                <span className="rounded-full bg-white/[0.06] px-3 py-1 text-[11px] font-medium text-white/58">
                  {homeStateLabel}
                </span>
              </div>
              <div className="space-y-1.5">
                <h2 className="text-[2.2rem] font-semibold tracking-[-0.06em] text-white">
                  {sessionPresentation.title}
                </h2>
                <p className="text-sm leading-6 text-white/56">
                  {homeStateDetail}
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 gap-2">
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
        )}
      </ScrollReveal>

      {showRestDayHero && dailyMobilityPrompt ? (
        <ScrollReveal delay={36}>
          <DailyMobilityPromptCard
            prompt={dailyMobilityPrompt}
            completed={stretchCompletedToday}
            onToggle={onToggleStretch}
          />
        </ScrollReveal>
      ) : null}

      {momentumPillText ? (
        <ScrollReveal delay={36}>
          <p className="px-2 text-[12px] font-medium tracking-[-0.01em] text-white/46">
            {momentumPillText}
          </p>
        </ScrollReveal>
      ) : null}

      <ScrollReveal delay={44}>
        <Card className="space-y-4 px-4 py-4">
          <div className="flex items-start justify-between gap-3">
            <div>
              <p className="text-[11px] uppercase tracking-[0.24em] text-white/38">This week</p>
              <h3 className="mt-1 text-[1.35rem] font-semibold tracking-[-0.05em] text-white/92">Head to head</h3>
              <p className="mt-1 text-sm leading-6 text-white/56">{competitionSummary}</p>
            </div>
            <div className="grid grid-cols-2 gap-2 text-right">
              <div className="rounded-[18px] border border-white/6 bg-white/[0.03] px-3 py-2">
                <p className="text-[10px] uppercase tracking-[0.14em] text-emerald-300/80">Joshua</p>
                <p className="mt-1 text-base font-semibold text-white">{joshuaWeekCount}</p>
              </div>
              <div className="rounded-[18px] border border-white/6 bg-white/[0.03] px-3 py-2">
                <p className="text-[10px] uppercase tracking-[0.14em] text-sky-300/80">Natasha</p>
                <p className="mt-1 text-base font-semibold text-white">{natashaWeekCount}</p>
              </div>
            </div>
          </div>
          <WeeklyTrainingCalendar rows={calendarRows} />
        </Card>
      </ScrollReveal>

      <ScrollReveal delay={55}>
        <Card className="tab-fade-enter space-y-3 px-4 py-4">
          <button
            type="button"
            onClick={() => setShowDetails((value) => !value)}
            className="flex w-full items-center justify-between text-left"
          >
            <div className="space-y-1">
              <p className="text-[11px] uppercase tracking-[0.24em] text-white/38">
                More
              </p>
              <p className="text-sm leading-6 text-white/54">{moreSummary}</p>
            </div>
            <ChevronDown
              className={`h-4 w-4 text-white/46 transition-transform duration-300 ${
                showDetails ? "rotate-180" : ""
              }`}
            />
          </button>

          {showDetails ? (
            <div className="space-y-4">
              <Card className="home-quiet-card space-y-2 px-4 py-4">
                <p className="text-[11px] uppercase tracking-[0.24em] text-white/38">Today&apos;s note</p>
                <p className="text-sm font-medium text-white/88">{sessionPresentation.noteLines[0]}</p>
                <p className="text-sm leading-6 text-white/54">{sessionPresentation.noteLines[1]}</p>
              </Card>

              {dailyMobilityPrompt && !showRestDayHero ? (
                <DailyMobilityPromptCard
                  prompt={dailyMobilityPrompt}
                  completed={stretchCompletedToday}
                  onToggle={onToggleStretch}
                />
              ) : null}

              <button
                type="button"
                onClick={() => setShowExtras((value) => !value)}
                className="flex w-full items-center justify-between rounded-[20px] border border-white/6 bg-white/[0.03] px-4 py-3 text-left transition hover:bg-white/[0.04]"
              >
                <div>
                  <p className="text-[11px] uppercase tracking-[0.24em] text-white/42">Extras</p>
                  <p className="mt-1 text-sm leading-6 text-white/54">Countdown, stats, then deeper utility.</p>
                </div>
                <ChevronDown
                  className={`h-4 w-4 text-white/46 transition-transform duration-300 ${
                    showExtras ? "rotate-180" : ""
                  }`}
                />
              </button>

              {recentUpdateBadge ? (
                <p className="text-[13px] leading-6 text-white/44">{recentUpdateBadge.detail}</p>
              ) : null}

              {showExtras ? (
              <>
              <div className="grid grid-cols-2 gap-3">
                <Card className="home-quiet-card space-y-2 px-4 py-4">
                  <p className="text-[11px] uppercase tracking-[0.24em] text-white/38">Countdown</p>
                  <p className="text-xl font-semibold tracking-[-0.04em] text-white">
                    {weddingCountdown.months}m {"\u2022"} {weddingCountdown.days}d
                  </p>
                  <p className="text-sm leading-6 text-white/52">{weddingCountdown.label}</p>
                </Card>
                <div className="grid grid-cols-1 gap-3">
                  <MiniMetric label="Sessions" value={String(weeklyCount)} />
                  <MiniMetric label="Streak" value={`${streak}d`} />
                  <MiniMetric label="PRs" value={String(pbCount)} />
                </div>
              </div>

              <button
                type="button"
                onClick={() => setShowUtilityStack((value) => !value)}
                className="flex w-full items-center justify-between rounded-[20px] border border-white/6 bg-white/[0.03] px-4 py-3 text-left transition hover:bg-white/[0.04]"
              >
                <div>
                  <p className="text-[11px] uppercase tracking-[0.24em] text-white/42">Utility stack</p>
                  <p className="mt-1 text-sm leading-6 text-white/54">Recent, shared, strength, and verse.</p>
                </div>
                <ChevronDown
                  className={`h-4 w-4 text-white/46 transition-transform duration-300 ${
                    showUtilityStack ? "rotate-180" : ""
                  }`}
                />
              </button>

              {showUtilityStack ? (
                <Card className="space-y-3 border border-white/6 bg-white/[0.03]">
                  <div className="flex items-center justify-between gap-3">
                    <p className="text-[11px] uppercase tracking-[0.24em] text-white/42">
                      Recent
                    </p>
                    <span className="text-xs text-white/40">One look</span>
                  </div>
                  {recentWorkouts.length ? (
                    <div className="space-y-2">
                      {recentWorkouts.slice(0, 1).map((workout) => (
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
                      No sessions yet. Your first workout will show here.
                    </p>
                  )}
                  <div className="rounded-[20px] border border-white/6 bg-white/[0.02] px-4 py-4">
                    <div className="flex items-center justify-between gap-3">
                      <p className="text-[11px] uppercase tracking-[0.2em] text-white/38">Shared</p>
                      <p className="text-[11px] text-white/42">
                        {sharedSummary.teamStreak}w • {sharedSummary.combinedWorkouts} this week
                      </p>
                    </div>
                    <p className="mt-2 text-sm font-medium text-white/82">
                      {sharedSummary.weeklyHighlight}
                    </p>
                  </div>
                  <div className="space-y-2 pt-1">
                    {sharedSummary.recentMilestones.slice(0, 2).map((milestone) => (
                      <div
                        key={milestone}
                        className="rounded-[18px] border border-white/6 bg-white/[0.03] px-3 py-3 text-sm leading-6 text-white/64"
                      >
                        {milestone}
                      </div>
                    ))}
                  </div>
                  <div className="grid grid-cols-1 gap-3 pt-1">
                    <StrengthPredictionCard predictions={strengthPredictions} />
                    <DailyBibleCard verse={dailyVerse} onOpen={onOpenDailyVerse} />
                  </div>
                </Card>
              ) : null}
              </>
              ) : null}
            </div>
          ) : null}
        </Card>
      </ScrollReveal>
    </div>
  );
}
