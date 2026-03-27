"use client";

import { useState } from "react";
import { ChevronDown } from "lucide-react";

import { DailyBibleCard } from "@/components/daily-bible-card";
import { DailyMobilityPromptCard } from "@/components/daily-mobility-prompt-card";
import { ScrollReveal } from "@/components/scroll-reveal";
import { StrengthPredictionCard } from "@/components/strength-prediction-card";
import { Card, MiniMetric } from "@/components/ui";
import { WeeklyTrainingCalendar } from "@/components/weekly-training-calendar";
import type { MonthlyReportCard, RestDayState, RivalryCardCopy, WeeklyRivalryState } from "@/lib/profile-training-state";
import { getSessionPresentation } from "@/lib/session-presentation";
import { getWeddingCountdownCardState, type WeddingDateState } from "@/lib/wedding-date";
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

function renderRivalryHeadline(copy: RivalryCardCopy) {
  if (!copy.highlightName || !copy.leaderColorClass || !copy.headline.includes(copy.highlightName)) {
    return copy.headline;
  }

  const [prefix, ...rest] = copy.headline.split(copy.highlightName);
  const suffix = rest.join(copy.highlightName);

  return (
    <>
      {prefix}
      <span className={copy.leaderColorClass}>{copy.highlightName}</span>
      {suffix}
    </>
  );
}

function getWeddingCountdownBorderClass(urgencyLevel: WeddingDateState["urgencyLevel"]) {
  switch (urgencyLevel) {
    case "low":
      return "border-white/8";
    case "medium":
      return "border-white/12";
    case "high":
      return "border-white/18";
    case "final":
      return "border-white/24";
  }
}

function getWeddingCountdownNumberClass(urgencyLevel: WeddingDateState["urgencyLevel"]) {
  switch (urgencyLevel) {
    case "low":
      return "text-white/72";
    case "medium":
      return "text-white/86";
    case "high":
    case "final":
      return "text-white";
  }
}

type HomeScreenProps = {
  profile: Profile;
  todaysWorkout: WorkoutPlanDay;
  activeWorkoutName: string | null;
  isSessionActive: boolean;
  activeSessionSetCount: number;
  trainingInsight: string;
  liftReadyLine: string | null;
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
  weddingDate: WeddingDateState;
  phaseTransitionLine: string | null;
  recentTrainingUpdate: RecentTrainingUpdate | null;
  momentumPillText: string | null;
  rivalryState: WeeklyRivalryState;
  rivalryCopy: RivalryCardCopy;
  monthlyReport: MonthlyReportCard | null;
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
      stolenBy?: "joshua" | "natasha" | null;
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
  isSessionActive,
  activeSessionSetCount,
  trainingInsight,
  liftReadyLine,
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
  weddingDate,
  phaseTransitionLine,
  recentTrainingUpdate,
  momentumPillText,
  rivalryState,
  rivalryCopy,
  monthlyReport,
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
  const showRestDayHero = restDayState.isRest && restDayRead;
  const showActiveSessionPulse = isSessionActive && Boolean(activeWorkoutName);
  const weddingCountdown = getWeddingCountdownCardState(profile.id, weddingDate);
  const moreSummary = showRestDayHero
    ? "Note first. One quiet utility layer."
    : dailyMobilityPrompt
      ? "Note first. Mobility if you want it."
      : "Note first. One quiet utility layer.";

  return (
    <div className="space-y-4 pb-28">
      {monthlyReport ? (
        <ScrollReveal delay={18}>
          <div className={showActiveSessionPulse ? "opacity-35" : ""}>
          <Card className="home-session-hero tab-fade-enter max-h-[70vh] space-y-5 overflow-y-auto px-6 py-6">
            <div className="space-y-1 text-center">
              <h2 className="text-[1.65rem] font-medium tracking-[-0.04em] text-white">
                {monthlyReport.month} {monthlyReport.year}
              </h2>
              <p className="text-[12px] text-white/42">Month closed.</p>
            </div>

            <div className="grid grid-cols-[1fr_auto_1fr] items-start gap-4">
              <div className="space-y-3">
                <p className="text-sm font-medium text-white/78">
                  <span className="text-emerald-300/85">Joshua</span>
                </p>
                <div className="space-y-2 text-sm text-white/58">
                  <p>{monthlyReport.joshua.sessions} sessions</p>
                  <p>{monthlyReport.joshua.totalSets} sets</p>
                  <p>{monthlyReport.joshua.topMuscleGroup}</p>
                  <p>{monthlyReport.joshua.streakBest} day streak</p>
                  {monthlyReport.joshua.newPRs > 0 ? <p>{monthlyReport.joshua.newPRs} PRs</p> : null}
                </div>
              </div>
              <div className="h-full w-px bg-white/10" />
              <div className="space-y-3 text-right">
                <p className="text-sm font-medium text-white/78">
                  <span className="text-sky-300/85">Natasha</span>
                </p>
                <div className="space-y-2 text-sm text-white/58">
                  <p>{monthlyReport.natasha.sessions} sessions</p>
                  <p>{monthlyReport.natasha.totalSets} sets</p>
                  <p>{monthlyReport.natasha.topMuscleGroup}</p>
                  <p>{monthlyReport.natasha.streakBest} day streak</p>
                  {monthlyReport.natasha.newPRs > 0 ? <p>{monthlyReport.natasha.newPRs} PRs</p> : null}
                </div>
              </div>
            </div>

            <div className="space-y-2 rounded-[12px] border border-white/8 bg-white/[0.02] px-4 py-4">
              <p className="text-[11px] uppercase tracking-[0.22em] text-white/36">Rivalry record this month</p>
              <p className="text-sm text-white/70">
                Week wins: Joshua {monthlyReport.rivalry.weekWins.joshua} {"\u2014"} Natasha {monthlyReport.rivalry.weekWins.natasha}
                {monthlyReport.rivalry.weekWins.tied > 0 ? ` \u2014 Tied ${monthlyReport.rivalry.weekWins.tied}` : ""}
              </p>
              <p className="text-sm text-white/58">
                Steals: Joshua {monthlyReport.rivalry.totalSteals.joshua} {"\u00b7"} Natasha {monthlyReport.rivalry.totalSteals.natasha}
              </p>
              <p className="text-sm font-medium text-white/82">
                Month winner:{" "}
                {monthlyReport.rivalry.monthWinner === "joshua" ? (
                  <span className="text-emerald-300/85">Joshua</span>
                ) : monthlyReport.rivalry.monthWinner === "natasha" ? (
                  <span className="text-sky-300/85">Natasha</span>
                ) : (
                  "Tied"
                )}
              </p>
            </div>

            <div className="grid grid-cols-2 gap-3 text-sm">
              <p className="text-left italic text-emerald-300/80">{monthlyReport.closingLine.joshua}</p>
              <p className="text-right italic text-sky-300/80">{monthlyReport.closingLine.natasha}</p>
            </div>
          </Card>
          </div>
        </ScrollReveal>
      ) : null}

      <ScrollReveal delay={30}>
        {showActiveSessionPulse ? (
          <Card className="home-session-hero tab-fade-enter space-y-4 px-6 py-6">
            <div className="space-y-1.5">
              <h2 className={`text-[1.9rem] tracking-[-0.06em] ${profile.id === "joshua" ? "text-emerald-300/88" : "text-sky-300/88"}`}>
                {activeWorkoutName}
              </h2>
              <p className="text-sm text-white/46">In progress</p>
              <p className="text-sm leading-6 text-white/58">{activeSessionSetCount} sets logged</p>
            </div>
            <button
              type="button"
              onClick={onResumeWorkout}
              className="text-left text-sm text-white/46 transition hover:text-white/72"
            >
              Return to session {"\u2192"}
            </button>
          </Card>
        ) : showRestDayHero ? (
          <Card className="home-session-hero tab-fade-enter space-y-5 px-6 py-6">
            <div className="space-y-2">
              <p className="text-[11px] uppercase tracking-[0.26em] text-white/40">Rest read</p>
              <h2 className="text-[1.85rem] tracking-[-0.06em] text-white">{restDayRead}</h2>
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
                <span className="rounded-full border border-white/8 bg-white/[0.03] px-3 py-1 text-[11px] text-white/54">
                  {homeStateLabel}
                </span>
              </div>
              <div className="space-y-1.5">
                <h2 className="text-[2rem] tracking-[-0.06em] text-white">
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
                className="rounded-[12px] border border-[color:var(--accent-border)] bg-[color:var(--accent-soft)] px-5 py-4 text-base tracking-[-0.02em] text-[color:var(--accent)] transition duration-200 active:scale-[0.99]"
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
              <div className="space-y-2 rounded-[12px] border border-white/8 bg-white/[0.02] p-3">
                {profile.workoutPlan.map((workout) => (
                  <button
                    key={workout.id}
                    type="button"
                    onClick={() => {
                      onMoveWorkout(workout.id);
                      setShowMoveChoices(false);
                    }}
                    className="flex w-full items-center justify-between rounded-[12px] px-3 py-3 text-left transition hover:bg-white/[0.03]"
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
                  className="w-full rounded-[12px] border border-white/8 px-3 py-3 text-sm text-white/58 transition hover:bg-white/[0.03]"
                >
                  Skip for now
                </button>
              </div>
            ) : null}
          </Card>
        )}
      </ScrollReveal>

      {liftReadyLine ? (
        <ScrollReveal delay={34}>
          <p className="px-2 text-[11px] tracking-[-0.01em] text-white/40">
            {liftReadyLine}
          </p>
        </ScrollReveal>
      ) : null}

      <div className={showActiveSessionPulse ? "opacity-35" : ""}>
        {phaseTransitionLine ? (
          <ScrollReveal delay={34}>
            <p className="px-2 text-[11px] tracking-[-0.01em] text-white/40">
              {phaseTransitionLine}
            </p>
          </ScrollReveal>
        ) : null}

        {weddingCountdown.visible ? (
          <ScrollReveal delay={38}>
            <Card className={`tab-fade-enter px-5 py-5 ${getWeddingCountdownBorderClass(weddingDate.urgencyLevel)}`}>
              {weddingDate.isWeddingDay ? (
                <div className="py-2 text-center">
                  <p className="text-[1.5rem] font-medium tracking-[-0.05em] text-white">{weddingCountdown.copy}</p>
                </div>
              ) : (
                <div className="grid grid-cols-[auto_1fr] items-center gap-5">
                  <div className="min-w-[92px]">
                    <p className={`text-[3.15rem] leading-none tracking-[-0.08em] ${getWeddingCountdownNumberClass(weddingDate.urgencyLevel)}`}>
                      {weddingCountdown.heroValue}
                    </p>
                    <p className="mt-2 text-[11px] uppercase tracking-[0.24em] text-white/36">{weddingCountdown.heroUnit}</p>
                  </div>
                  <div className="space-y-2">
                    <p className="text-sm leading-6 text-white/74">{weddingCountdown.copy}</p>
                    <p className="text-[11px] uppercase tracking-[0.24em] text-white/34">{weddingCountdown.phaseLabel}</p>
                  </div>
                </div>
              )}
            </Card>
          </ScrollReveal>
        ) : null}

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
          <p className="px-2 text-[11px] tracking-[-0.01em] text-white/34">
            {momentumPillText}
          </p>
          </ScrollReveal>
        ) : null}

        <ScrollReveal delay={44}>
          <Card className="space-y-4 px-4 py-4">
          <div className="space-y-3">
            <p className="text-[11px] uppercase tracking-[0.24em] text-white/38">This week</p>
            <div className="grid grid-cols-[1fr_auto_1fr] items-start gap-3">
              <div className="rounded-[12px] border border-white/6 bg-white/[0.02] px-3 py-3">
                <p className="text-sm font-medium text-white/78">
                  <span className="text-emerald-300/80">Joshua</span> {"\u00b7"} {rivalryState.joshuaSessions} sessions
                </p>
              </div>
              <p className="pt-4 text-[11px] uppercase tracking-[0.2em] text-white/28">vs</p>
              <div className="rounded-[12px] border border-white/6 bg-white/[0.02] px-3 py-3 text-right">
                <p className="text-sm font-medium text-white/78">
                  <span className="text-sky-300/80">Natasha</span> {"\u00b7"} {rivalryState.natashaSessions} sessions
                </p>
              </div>
            </div>
            {rivalryCopy.headline ? (
              <p className="text-[1.02rem] tracking-[-0.04em] text-white/9">{renderRivalryHeadline(rivalryCopy)}</p>
            ) : null}
            {rivalryCopy.detail ? (
              <p className="text-sm leading-6 text-white/52">{rivalryCopy.detail}</p>
            ) : null}
            {rivalryCopy.stealDetail ? (
              <p className="text-[12px] leading-5 text-white/40">{rivalryCopy.stealDetail}</p>
            ) : null}
            {rivalryCopy.weddingGoalDetail ? (
              <>
                <div className="h-px bg-white/8" />
                <div className="space-y-1.5">
                  <p className="text-[11px] uppercase tracking-[0.24em] text-white/34">Wedding goal</p>
                  <p className="text-[12px] leading-5 text-white/48">{rivalryCopy.weddingGoalDetail}</p>
                </div>
              </>
            ) : null}
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
                className="flex w-full items-center justify-between rounded-[12px] border border-white/6 bg-white/[0.02] px-4 py-3 text-left transition hover:bg-white/[0.03]"
              >
                <div>
                  <p className="text-[11px] uppercase tracking-[0.24em] text-white/42">Extras</p>
                  <p className="mt-1 text-sm leading-6 text-white/54">Stats, then deeper utility.</p>
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
              <div className="grid grid-cols-1 gap-3">
                  <MiniMetric label="Sessions" value={String(weeklyCount)} />
                  <MiniMetric label="Streak" value={`${streak}d`} />
                  <MiniMetric label="PRs" value={String(pbCount)} />
              </div>

              <button
                type="button"
                onClick={() => setShowUtilityStack((value) => !value)}
                className="flex w-full items-center justify-between rounded-[12px] border border-white/6 bg-white/[0.02] px-4 py-3 text-left transition hover:bg-white/[0.03]"
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
                <Card className="space-y-3 border border-white/6 bg-white/[0.02]">
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
                  <div className="rounded-[12px] border border-white/6 bg-white/[0.02] px-4 py-4">
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
                        className="rounded-[12px] border border-white/6 bg-white/[0.02] px-3 py-3 text-sm leading-6 text-white/64"
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
    </div>
  );
}
