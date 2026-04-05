"use client";

import { useState } from "react";

import { DailyBibleCard } from "@/components/daily-bible-card";
import { DailyMobilityPromptCard } from "@/components/daily-mobility-prompt-card";
import { ScrollReveal } from "@/components/scroll-reveal";
import { Card } from "@/components/ui";
import { WeeklyTrainingCalendar } from "@/components/weekly-training-calendar";
import type { MonthlyReportCard, RestDayState, RivalryCardCopy, WeeklyRivalryState } from "@/lib/profile-training-state";
import { getSessionPresentation } from "@/lib/session-presentation";
import type { WeddingDateState } from "@/lib/wedding-date";
import type {
  BibleVerse,
  DailyMobilityPrompt,
  Profile,
  RecentTrainingUpdate,
  SharedSummary,
  StrengthPrediction,
  WorkoutPlanDay,
  WorkoutSession,
} from "@/lib/types";

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
  rivalSessions: WorkoutSession[];
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

function timeAgo(dateStr: string) {
  const mins = Math.round((Date.now() - new Date(dateStr).getTime()) / 60000);
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  return `${Math.floor(hours / 24)}d ago`;
}

function shortDate(dateStr: string) {
  return new Intl.DateTimeFormat("en-NZ", { month: "short", day: "numeric" }).format(new Date(dateStr));
}

function RivalryHeadline({ copy }: { copy: RivalryCardCopy }) {
  if (!copy.highlightName || !copy.headline.includes(copy.highlightName)) {
    return <>{copy.headline}</>;
  }
  const [prefix, ...rest] = copy.headline.split(copy.highlightName);
  return (
    <>
      {prefix}
      <span className={copy.leaderColorClass ?? undefined}>{copy.highlightName}</span>
      {rest.join(copy.highlightName)}
    </>
  );
}

export function HomeScreen({
  profile,
  todaysWorkout,
  activeWorkoutName,
  isSessionActive,
  activeSessionSetCount,
  trainingInsight,
  restDayState,
  restDayRead,
  restRecoveryLabel,
  weeklyCount,
  streak,
  pbCount,
  dailyVerse,
  dailyMobilityPrompt,
  stretchCompletedToday,
  recentWorkouts,
  phaseTransitionLine,
  momentumPillText,
  rivalryCopy,
  rivalSessions,
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
  const [showSchedulePicker, setShowSchedulePicker] = useState(false);

  const sessionPresentation = getSessionPresentation(profile, todaysWorkout);
  const isLive = isSessionActive && Boolean(activeWorkoutName);
  const isRestDay = restDayState.isRest && !isLive;

  const isJoshua = profile.id === "joshua";
  const accentText = isJoshua ? "text-emerald-400" : "text-sky-400";
  const accentTextSoft = isJoshua ? "text-emerald-300/75" : "text-sky-300/75";
  const accentBtn = isJoshua
    ? "bg-emerald-500 hover:bg-emerald-400 active:bg-emerald-600"
    : "bg-sky-500 hover:bg-sky-400 active:bg-sky-600";
  const accentBg = isJoshua ? "bg-emerald-500/10" : "bg-sky-500/10";
  const accentBorder = isJoshua ? "border-emerald-500/20" : "border-sky-500/20";

  return (
    <div className="space-y-3 pb-28">

      {/* ── Phase transition notice ──────────────────── */}
      {phaseTransitionLine ? (
        <ScrollReveal>
          <div className={`rounded-[16px] border px-5 py-4 ${accentBg} ${accentBorder}`}>
            <p className={`text-[13px] leading-[1.6] font-medium ${accentTextSoft}`}>{phaseTransitionLine}</p>
          </div>
        </ScrollReveal>
      ) : null}

      {/* ── Monthly report ──────────────────────────── */}
      {monthlyReport ? (
        <ScrollReveal>
          <Card className="home-hero-card space-y-6 px-6 py-7">
            <div className="text-center space-y-1">
              <p className="label-eyebrow">Month closed</p>
              <h2 className="text-[1.9rem] font-semibold tracking-[-0.04em] text-white">
                {monthlyReport.month} {monthlyReport.year}
              </h2>
            </div>

            <div className="grid grid-cols-[1fr_1px_1fr] items-start gap-5">
              <div className="space-y-2.5">
                <p className="text-[13px] font-semibold text-emerald-400">Joshua</p>
                <div className="space-y-1.5">
                  <p className="text-[13px] text-white/60">{monthlyReport.joshua.sessions} sessions</p>
                  <p className="text-[13px] text-white/60">{monthlyReport.joshua.totalSets} sets</p>
                  <p className="text-[13px] text-white/60">{monthlyReport.joshua.topMuscleGroup}</p>
                  {monthlyReport.joshua.newPRs > 0 ? (
                    <p className="text-[13px] text-emerald-400/80">{monthlyReport.joshua.newPRs} PRs</p>
                  ) : null}
                </div>
              </div>
              <div className="self-stretch bg-white/[0.07]" />
              <div className="space-y-2.5 text-right">
                <p className="text-[13px] font-semibold text-sky-400">Natasha</p>
                <div className="space-y-1.5">
                  <p className="text-[13px] text-white/60">{monthlyReport.natasha.sessions} sessions</p>
                  <p className="text-[13px] text-white/60">{monthlyReport.natasha.totalSets} sets</p>
                  <p className="text-[13px] text-white/60">{monthlyReport.natasha.topMuscleGroup}</p>
                  {monthlyReport.natasha.newPRs > 0 ? (
                    <p className="text-[13px] text-sky-400/80">{monthlyReport.natasha.newPRs} PRs</p>
                  ) : null}
                </div>
              </div>
            </div>

            <div className="rounded-[14px] border border-white/[0.07] bg-white/[0.025] px-5 py-4 space-y-2">
              <p className="label-eyebrow">Rivalry</p>
              <p className="text-[13px] text-white/55">
                Week wins — Joshua {monthlyReport.rivalry.weekWins.joshua} · Natasha {monthlyReport.rivalry.weekWins.natasha}
                {monthlyReport.rivalry.weekWins.tied > 0 ? ` · Tied ${monthlyReport.rivalry.weekWins.tied}` : ""}
              </p>
              <p className="text-[13px] text-white/55">
                Steals — Joshua {monthlyReport.rivalry.totalSteals.joshua} · Natasha {monthlyReport.rivalry.totalSteals.natasha}
              </p>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <p className="text-[13px] italic leading-[1.5] text-emerald-300/65">{monthlyReport.closingLine.joshua}</p>
              <p className="text-[13px] italic leading-[1.5] text-right text-sky-300/65">{monthlyReport.closingLine.natasha}</p>
            </div>
          </Card>
        </ScrollReveal>
      ) : null}

      {/* ── Active session banner ────────────────────── */}
      {isLive ? (
        <ScrollReveal>
          <Card className="home-hero-card px-6 py-7">
            <div className="space-y-5">
              <div className="space-y-1.5">
                <div className="flex items-center gap-2">
                  <span className={`h-2 w-2 rounded-full ${isJoshua ? "bg-emerald-400" : "bg-sky-400"} animate-pulse`} />
                  <p className="label-eyebrow">In progress</p>
                </div>
                <h2 className={`text-[2.1rem] font-semibold tracking-[-0.05em] leading-[1.05] ${accentText}`}>
                  {activeWorkoutName}
                </h2>
                <p className="text-[14px] text-white/42">{activeSessionSetCount} sets logged</p>
              </div>
              <button
                type="button"
                onClick={onResumeWorkout}
                className={`inline-flex h-[56px] w-full items-center justify-center rounded-[16px] text-[15px] font-semibold tracking-[-0.01em] text-white transition-colors ${accentBtn}`}
              >
                Return to session
              </button>
            </div>
          </Card>
        </ScrollReveal>
      ) : null}

      {/* ── Rest day card ────────────────────────────── */}
      {!isLive && isRestDay && restDayRead ? (
        <ScrollReveal>
          <Card className="px-6 py-7">
            <div className="space-y-4">
              <div className="space-y-1.5">
                <p className="label-eyebrow">Rest day</p>
                <h2 className="text-[1.75rem] font-semibold tracking-[-0.04em] text-white leading-[1.1]">
                  {restDayRead}
                </h2>
              </div>
              <p className="text-[14px] leading-[1.6] text-white/48">{restRecoveryLabel}</p>
              <div className="flex items-center gap-2 pt-1">
                <span className="label-eyebrow">Next</span>
                <span className="text-[13px] text-white/58">
                  {restDayState.nextBestSession}
                  {restDayState.nextBestSessionDaysOut === 0
                    ? " · today"
                    : restDayState.nextBestSessionDaysOut === 1
                      ? " · tomorrow"
                      : ` · in ${restDayState.nextBestSessionDaysOut} days`}
                </span>
              </div>
            </div>
          </Card>
        </ScrollReveal>
      ) : null}

      {/* ── Today's workout hero ─────────────────────── */}
      {!isLive && !isRestDay ? (
        <ScrollReveal>
          <Card className="home-hero-card px-6 py-7">
            <div className="space-y-5">
              {/* Header */}
              <div className="space-y-2">
                <p className="label-eyebrow">{sessionPresentation.splitLabel}</p>
                <h2 className="text-[2.25rem] font-semibold tracking-[-0.05em] text-white leading-[1.04]">
                  {sessionPresentation.title}
                </h2>
                <p className="text-[14px] leading-[1.65] text-white/50">{trainingInsight}</p>
              </div>

              {/* Momentum pill */}
              {momentumPillText ? (
                <span className={`inline-flex items-center rounded-full border px-3.5 py-1.5 text-[12px] font-medium ${accentBg} ${accentBorder} ${accentTextSoft}`}>
                  {momentumPillText}
                </span>
              ) : null}

              {/* CTA */}
              <button
                type="button"
                onClick={() => onStartWorkout()}
                className={`hero-cta-shimmer inline-flex h-[56px] w-full items-center justify-center rounded-[16px] text-[15px] font-semibold tracking-[-0.01em] text-white transition-colors ${accentBtn}`}
              >
                Start Session
              </button>

              {/* Secondary actions */}
              <div className="flex items-center justify-center gap-6 pt-0.5">
                <button
                  type="button"
                  onClick={() => onPreviewWorkout(todaysWorkout.id)}
                  className="text-[13px] text-white/34 transition-colors hover:text-white/60"
                >
                  Preview
                </button>
                <span className="text-white/14">·</span>
                <button
                  type="button"
                  onClick={() => setShowSchedulePicker((v) => !v)}
                  className="text-[13px] text-white/34 transition-colors hover:text-white/60"
                >
                  Rearrange
                </button>
                <span className="text-white/14">·</span>
                <button
                  type="button"
                  onClick={onSkipWorkout}
                  className="text-[13px] text-white/34 transition-colors hover:text-white/60"
                >
                  Skip
                </button>
              </div>

              {/* Schedule picker */}
              {showSchedulePicker ? (
                <div className="rounded-[14px] border border-white/[0.07] bg-white/[0.02] p-1.5">
                  {profile.workoutPlan.map((workout) => (
                    <button
                      key={workout.id}
                      type="button"
                      onClick={() => {
                        onMoveWorkout(workout.id);
                        setShowSchedulePicker(false);
                      }}
                      className={`flex w-full items-center justify-between rounded-[10px] px-4 py-3 text-left transition-colors hover:bg-white/[0.05] ${
                        workout.id === todaysWorkout.id ? "text-white/88" : "text-white/40"
                      }`}
                    >
                      <span className="text-[14px]">{workout.name}</span>
                      <span className="text-[11px] text-white/26">{workout.dayLabel}</span>
                    </button>
                  ))}
                </div>
              ) : null}
            </div>
          </Card>
        </ScrollReveal>
      ) : null}

      {/* ── Stats row ───────────────────────────────── */}
      <ScrollReveal delay={40}>
        <div className="grid grid-cols-3 gap-2.5">
          <Card className="px-4 py-5">
            <p className="label-eyebrow">Week</p>
            <p className="mt-3 text-[38px] font-bold tracking-[-0.055em] text-white leading-none">
              {weeklyCount}
            </p>
            <p className="mt-1.5 text-[11px] text-white/36">
              {weeklyCount === 1 ? "session" : "sessions"}
            </p>
          </Card>
          <Card className="px-4 py-5">
            <p className="label-eyebrow">Streak</p>
            <p className="mt-3 text-[38px] font-bold tracking-[-0.055em] text-white leading-none">
              {streak}
            </p>
            <p className="mt-1.5 text-[11px] text-white/36">
              {streak === 1 ? "day" : "days"}
            </p>
          </Card>
          <Card className="px-4 py-5">
            <p className="label-eyebrow">PRs</p>
            <p className={`mt-3 text-[38px] font-bold tracking-[-0.055em] leading-none ${pbCount > 0 ? accentText : "text-white"}`}>
              {pbCount}
            </p>
            <p className="mt-1.5 text-[11px] text-white/36">all time</p>
          </Card>
        </div>
      </ScrollReveal>

      {/* ── Rivalry card ────────────────────────────── */}
      <ScrollReveal delay={60}>
        <Card className="px-6 py-6">
          <div className="space-y-3.5">
            <p className="label-eyebrow">Rivalry</p>
            <h3 className="text-[1.2rem] font-semibold tracking-[-0.025em] text-white/90 leading-[1.3]">
              <RivalryHeadline copy={rivalryCopy} />
            </h3>
            {rivalryCopy.stealDetail ? (
              <p className="text-[13px] leading-[1.55] text-white/38">{rivalryCopy.stealDetail}</p>
            ) : null}
            {rivalSessions.length > 0 ? (
              <div className="mt-1 rounded-[14px] border border-white/[0.06] bg-white/[0.02] px-4 py-4 space-y-3">
                <p className="label-eyebrow">
                  {profile.id === "joshua" ? "Natasha" : "Joshua"} this week
                </p>
                <div className="space-y-2.5">
                  {rivalSessions.slice(0, 3).map((session) => (
                    <div key={session.id} className="flex items-center justify-between gap-3">
                      <span className="truncate text-[13px] text-white/55">{session.workoutName}</span>
                      <span className="flex-shrink-0 text-[11px] text-white/28">
                        {shortDate(session.performedAt)}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            ) : null}
          </div>
        </Card>
      </ScrollReveal>

      {/* ── Weekly calendar ─────────────────────────── */}
      {calendarRows.length > 0 ? (
        <ScrollReveal delay={80}>
          <Card className="px-4 py-5">
            <WeeklyTrainingCalendar rows={calendarRows} />
          </Card>
        </ScrollReveal>
      ) : null}

      {/* ── Recent sessions ─────────────────────────── */}
      {recentWorkouts.length > 0 ? (
        <ScrollReveal delay={100}>
          <Card className="px-6 py-6">
            <div className="space-y-4">
              <p className="label-eyebrow">Recent</p>
              <div className="space-y-1">
                {recentWorkouts.slice(0, 4).map((session, i) => (
                  <button
                    key={session.id}
                    type="button"
                    className={`flex w-full items-center justify-between gap-4 rounded-[12px] px-0 py-3 text-left transition-colors hover:bg-white/[0.03] ${
                      i < recentWorkouts.slice(0, 4).length - 1 ? "border-b border-white/[0.05]" : ""
                    }`}
                    onClick={() => onOpenRecentWorkout(session.workoutDayId)}
                  >
                    <div className="min-w-0 space-y-0.5">
                      <p className="truncate text-[14px] font-medium text-white/82">
                        {session.workoutName}
                        {session.partial ? (
                          <span className="ml-2 text-[11px] font-normal text-white/30">Partial</span>
                        ) : null}
                      </p>
                      <p className="text-[12px] text-white/32">
                        {session.exercises.length} exercises · {session.durationMinutes} min
                      </p>
                    </div>
                    <span className="flex-shrink-0 text-[12px] text-white/26 tabular-nums">
                      {timeAgo(session.performedAt)}
                    </span>
                  </button>
                ))}
              </div>
            </div>
          </Card>
        </ScrollReveal>
      ) : null}

      {/* ── Bible verse ─────────────────────────────── */}
      <ScrollReveal delay={120}>
        <DailyBibleCard verse={dailyVerse} onOpen={onOpenDailyVerse} />
      </ScrollReveal>

      {/* ── Mobility prompt ─────────────────────────── */}
      {dailyMobilityPrompt ? (
        <ScrollReveal delay={140}>
          <DailyMobilityPromptCard
            prompt={dailyMobilityPrompt}
            completed={stretchCompletedToday}
            onToggle={onToggleStretch}
          />
        </ScrollReveal>
      ) : null}

    </div>
  );
}
