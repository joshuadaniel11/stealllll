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
  const accentText = isJoshua ? "text-emerald-300/90" : "text-sky-300/90";
  const accentBtn = isJoshua
    ? "bg-emerald-500/90 hover:bg-emerald-500 active:bg-emerald-600"
    : "bg-sky-500/90 hover:bg-sky-500 active:bg-sky-600";

  return (
    <div className="space-y-3 pb-28">

      {/* ── Phase transition notice ────────────────────── */}
      {phaseTransitionLine ? (
        <ScrollReveal>
          <Card className="px-5 py-4">
            <p className="text-[13px] leading-6 text-white/68">{phaseTransitionLine}</p>
          </Card>
        </ScrollReveal>
      ) : null}

      {/* ── Monthly report (last day of month) ────────── */}
      {monthlyReport ? (
        <ScrollReveal>
          <Card className="home-hero-card space-y-5 px-6 py-6">
            <div className="text-center space-y-1">
              <p className="label-eyebrow">Month closed</p>
              <h2 className="text-[1.7rem] font-medium tracking-[-0.04em] text-white">
                {monthlyReport.month} {monthlyReport.year}
              </h2>
            </div>

            <div className="grid grid-cols-[1fr_1px_1fr] items-start gap-4">
              <div className="space-y-2">
                <p className="text-sm font-medium text-emerald-300/85">Joshua</p>
                <p className="text-sm text-white/55">{monthlyReport.joshua.sessions} sessions</p>
                <p className="text-sm text-white/55">{monthlyReport.joshua.totalSets} sets</p>
                <p className="text-sm text-white/55">{monthlyReport.joshua.topMuscleGroup}</p>
                {monthlyReport.joshua.newPRs > 0 ? (
                  <p className="text-sm text-white/55">{monthlyReport.joshua.newPRs} PRs</p>
                ) : null}
              </div>
              <div className="self-stretch bg-white/[0.08]" />
              <div className="space-y-2 text-right">
                <p className="text-sm font-medium text-sky-300/85">Natasha</p>
                <p className="text-sm text-white/55">{monthlyReport.natasha.sessions} sessions</p>
                <p className="text-sm text-white/55">{monthlyReport.natasha.totalSets} sets</p>
                <p className="text-sm text-white/55">{monthlyReport.natasha.topMuscleGroup}</p>
                {monthlyReport.natasha.newPRs > 0 ? (
                  <p className="text-sm text-white/55">{monthlyReport.natasha.newPRs} PRs</p>
                ) : null}
              </div>
            </div>

            <div className="rounded-[12px] border border-white/8 bg-white/[0.02] px-4 py-3 space-y-1.5">
              <p className="label-eyebrow">Rivalry</p>
              <p className="text-sm text-white/60">
                Week wins — Joshua {monthlyReport.rivalry.weekWins.joshua} · Natasha {monthlyReport.rivalry.weekWins.natasha}
                {monthlyReport.rivalry.weekWins.tied > 0 ? ` · Tied ${monthlyReport.rivalry.weekWins.tied}` : ""}
              </p>
              <p className="text-sm text-white/60">
                Steals — Joshua {monthlyReport.rivalry.totalSteals.joshua} · Natasha {monthlyReport.rivalry.totalSteals.natasha}
              </p>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <p className="text-[13px] italic text-emerald-300/70">{monthlyReport.closingLine.joshua}</p>
              <p className="text-[13px] italic text-right text-sky-300/70">{monthlyReport.closingLine.natasha}</p>
            </div>
          </Card>
        </ScrollReveal>
      ) : null}

      {/* ── Active session banner ──────────────────────── */}
      {isLive ? (
        <ScrollReveal>
          <Card className="home-hero-card space-y-4 px-6 py-6">
            <div className="space-y-1">
              <p className="label-eyebrow">In progress</p>
              <h2 className={`text-[1.9rem] font-medium tracking-[-0.06em] ${accentText}`}>
                {activeWorkoutName}
              </h2>
              <p className="text-sm text-white/46">{activeSessionSetCount} sets logged</p>
            </div>
            <button
              type="button"
              onClick={onResumeWorkout}
              className={`inline-flex h-[52px] w-full items-center justify-center rounded-[14px] text-[15px] font-semibold text-white transition-colors ${accentBtn}`}
            >
              Return to session
            </button>
          </Card>
        </ScrollReveal>
      ) : null}

      {/* ── Rest day card ──────────────────────────────── */}
      {!isLive && isRestDay && restDayRead ? (
        <ScrollReveal>
          <Card className="space-y-4 px-6 py-6">
            <div className="space-y-1">
              <p className="label-eyebrow">Rest day</p>
              <h2 className="text-[1.65rem] font-medium tracking-[-0.04em] text-white leading-snug">
                {restDayRead}
              </h2>
            </div>
            <p className="text-[13px] leading-6 text-white/50">{restRecoveryLabel}</p>
            <div className="flex items-center gap-2">
              <span className="label-eyebrow">Next</span>
              <span className="text-[13px] text-white/64">
                {restDayState.nextBestSession}
                {restDayState.nextBestSessionDaysOut === 0
                  ? " · today"
                  : restDayState.nextBestSessionDaysOut === 1
                    ? " · tomorrow"
                    : ` · in ${restDayState.nextBestSessionDaysOut} days`}
              </span>
            </div>
          </Card>
        </ScrollReveal>
      ) : null}

      {/* ── Today's workout hero ───────────────────────── */}
      {!isLive && !isRestDay ? (
        <ScrollReveal>
          <Card className="home-hero-card space-y-5 px-6 py-6">
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0 flex-1 space-y-1.5">
                <p className="label-eyebrow">{sessionPresentation.splitLabel}</p>
                <h2 className="text-[2rem] font-medium tracking-[-0.04em] text-white leading-[1.08]">
                  {sessionPresentation.title}
                </h2>
              </div>
              <span className="mt-1 flex-shrink-0 rounded-full border border-white/[0.10] bg-white/[0.035] px-3 py-1.5 text-[11px] text-white/42">
                Queued
              </span>
            </div>

            <p className="text-[13px] leading-[1.65] text-white/54">{trainingInsight}</p>

            {momentumPillText ? (
              <span className="inline-block rounded-full border border-white/[0.10] bg-white/[0.03] px-3 py-1 text-[12px] text-white/48">
                {momentumPillText}
              </span>
            ) : null}

            <button
              type="button"
              onClick={() => onStartWorkout()}
              className={`hero-cta-shimmer inline-flex h-[54px] w-full items-center justify-center rounded-[16px] text-[15px] font-semibold tracking-[-0.01em] text-white transition-colors ${accentBtn}`}
            >
              Start Session
            </button>

            <div className="flex items-center gap-4">
              <button
                type="button"
                onClick={() => onPreviewWorkout(todaysWorkout.id)}
                className="text-[13px] text-white/38 transition-colors hover:text-white/66"
              >
                Preview
              </button>
              <span className="text-white/18">·</span>
              <button
                type="button"
                onClick={() => setShowSchedulePicker((v) => !v)}
                className="text-[13px] text-white/38 transition-colors hover:text-white/66"
              >
                Rearrange
              </button>
              <span className="text-white/18">·</span>
              <button
                type="button"
                onClick={onSkipWorkout}
                className="text-[13px] text-white/38 transition-colors hover:text-white/66"
              >
                Skip
              </button>
            </div>

            {showSchedulePicker ? (
              <div className="rounded-[14px] border border-white/[0.08] bg-white/[0.02] p-2">
                {profile.workoutPlan.map((workout) => (
                  <button
                    key={workout.id}
                    type="button"
                    onClick={() => {
                      onMoveWorkout(workout.id);
                      setShowSchedulePicker(false);
                    }}
                    className={`flex w-full items-center justify-between rounded-[10px] px-3 py-2.5 text-left transition-colors hover:bg-white/[0.05] ${
                      workout.id === todaysWorkout.id ? "text-white/88" : "text-white/44"
                    }`}
                  >
                    <span className="text-[13px]">{workout.name}</span>
                    <span className="text-[11px] text-white/28">{workout.dayLabel}</span>
                  </button>
                ))}
              </div>
            ) : null}
          </Card>
        </ScrollReveal>
      ) : null}

      {/* ── Stats row ─────────────────────────────────── */}
      <ScrollReveal delay={40}>
        <div className="grid grid-cols-2 gap-3">
          <Card className="px-4 py-4">
            <p className="label-eyebrow">This week</p>
            <p className="mt-2 text-[36px] font-bold tracking-[-0.05em] text-white leading-none">
              {weeklyCount}
            </p>
            <p className="mt-1 text-[12px] text-white/38">
              {weeklyCount === 1 ? "session" : "sessions"}
            </p>
          </Card>
          <Card className="px-4 py-4">
            <p className="label-eyebrow">Streak</p>
            <p className="mt-2 text-[36px] font-bold tracking-[-0.05em] text-white leading-none">
              {streak}
            </p>
            <p className="mt-1 text-[12px] text-white/38">
              {streak === 1 ? "day" : "days"}
            </p>
          </Card>
        </div>
      </ScrollReveal>

      {/* ── Rivalry card ──────────────────────────────── */}
      <ScrollReveal delay={60}>
        <Card className="space-y-3 px-5 py-5">
          <p className="label-eyebrow">Rivalry</p>
          <h3 className="text-[1.1rem] font-medium tracking-[-0.02em] text-white/88 leading-snug">
            <RivalryHeadline copy={rivalryCopy} />
          </h3>
          {rivalryCopy.stealDetail ? (
            <p className="text-[13px] leading-5 text-white/40">{rivalryCopy.stealDetail}</p>
          ) : null}
          {rivalSessions.length > 0 ? (
            <div className="space-y-2 rounded-[12px] border border-white/[0.07] bg-white/[0.02] px-3 py-3">
              <p className="label-eyebrow">
                {profile.id === "joshua" ? "Natasha" : "Joshua"} this week
              </p>
              {rivalSessions.slice(0, 3).map((session) => (
                <div key={session.id} className="flex items-center justify-between gap-3">
                  <span className="truncate text-[13px] text-white/56">{session.workoutName}</span>
                  <span className="flex-shrink-0 text-[11px] text-white/30">
                    {shortDate(session.performedAt)}
                  </span>
                </div>
              ))}
            </div>
          ) : null}
        </Card>
      </ScrollReveal>

      {/* ── Weekly calendar ───────────────────────────── */}
      {calendarRows.length > 0 ? (
        <ScrollReveal delay={80}>
          <Card className="px-4 py-4">
            <WeeklyTrainingCalendar rows={calendarRows} />
          </Card>
        </ScrollReveal>
      ) : null}

      {/* ── Recent sessions ───────────────────────────── */}
      {recentWorkouts.length > 0 ? (
        <ScrollReveal delay={100}>
          <Card className="space-y-3 px-5 py-5">
            <p className="label-eyebrow">Recent</p>
            <div className="divide-y divide-white/[0.05]">
              {recentWorkouts.slice(0, 4).map((session) => (
                <button
                  key={session.id}
                  type="button"
                  className="flex w-full items-start justify-between gap-4 py-3 text-left first:pt-0 last:pb-0"
                  onClick={() => onOpenRecentWorkout(session.workoutDayId)}
                >
                  <div className="min-w-0">
                    <p className="truncate text-[14px] font-medium text-white/80">
                      {session.workoutName}
                      {session.partial ? (
                        <span className="ml-2 text-[11px] font-normal text-white/32">Partial</span>
                      ) : null}
                    </p>
                    <p className="mt-0.5 text-[12px] text-white/34">
                      {session.exercises.length} exercises · {session.durationMinutes} min
                    </p>
                  </div>
                  <span className="flex-shrink-0 pt-0.5 text-[12px] text-white/28">
                    {timeAgo(session.performedAt)}
                  </span>
                </button>
              ))}
            </div>
          </Card>
        </ScrollReveal>
      ) : null}

      {/* ── Bible verse ───────────────────────────────── */}
      <ScrollReveal delay={120}>
        <DailyBibleCard verse={dailyVerse} onOpen={onOpenDailyVerse} />
      </ScrollReveal>

      {/* ── Mobility prompt ───────────────────────────── */}
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
