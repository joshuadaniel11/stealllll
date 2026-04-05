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

  // Accent primitives
  const accentText   = isJoshua ? "text-emerald-400"       : "text-sky-400";
  const accentMuted  = isJoshua ? "text-emerald-300/70"    : "text-sky-300/70";
  const accentBtn    = isJoshua
    ? "bg-emerald-500 hover:bg-emerald-400 active:bg-emerald-600"
    : "bg-sky-500    hover:bg-sky-400    active:bg-sky-600";
  const accentRing   = isJoshua ? "border-emerald-500/25"  : "border-sky-500/25";
  const accentTint   = isJoshua ? "bg-emerald-500/[0.07]"  : "bg-sky-500/[0.07]";
  const accentDot    = isJoshua ? "bg-emerald-400"         : "bg-sky-400";

  return (
    <div className="space-y-3 pb-28">

      {/* ── Phase transition ─────────────────────────── */}
      {phaseTransitionLine ? (
        <ScrollReveal>
          <div className={`rounded-[18px] border px-5 py-4 ${accentTint} ${accentRing}`}>
            <p className={`text-[13px] font-medium leading-[1.6] ${accentMuted}`}>
              {phaseTransitionLine}
            </p>
          </div>
        </ScrollReveal>
      ) : null}

      {/* ── Monthly report ───────────────────────────── */}
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
                  <p className="text-[13px] text-white/58">{monthlyReport.joshua.sessions} sessions</p>
                  <p className="text-[13px] text-white/58">{monthlyReport.joshua.totalSets} sets</p>
                  <p className="text-[13px] text-white/58">{monthlyReport.joshua.topMuscleGroup}</p>
                  {monthlyReport.joshua.newPRs > 0 && (
                    <p className="text-[13px] text-emerald-400/80">{monthlyReport.joshua.newPRs} PRs</p>
                  )}
                </div>
              </div>
              <div className="self-stretch bg-white/[0.07]" />
              <div className="space-y-2.5 text-right">
                <p className="text-[13px] font-semibold text-sky-400">Natasha</p>
                <div className="space-y-1.5">
                  <p className="text-[13px] text-white/58">{monthlyReport.natasha.sessions} sessions</p>
                  <p className="text-[13px] text-white/58">{monthlyReport.natasha.totalSets} sets</p>
                  <p className="text-[13px] text-white/58">{monthlyReport.natasha.topMuscleGroup}</p>
                  {monthlyReport.natasha.newPRs > 0 && (
                    <p className="text-[13px] text-sky-400/80">{monthlyReport.natasha.newPRs} PRs</p>
                  )}
                </div>
              </div>
            </div>

            <div className="rounded-[14px] border border-white/[0.07] bg-white/[0.025] px-5 py-4 space-y-2">
              <p className="label-eyebrow">Rivalry</p>
              <p className="text-[13px] text-white/52">
                Week wins — Joshua {monthlyReport.rivalry.weekWins.joshua} · Natasha {monthlyReport.rivalry.weekWins.natasha}
                {monthlyReport.rivalry.weekWins.tied > 0 ? ` · Tied ${monthlyReport.rivalry.weekWins.tied}` : ""}
              </p>
              <p className="text-[13px] text-white/52">
                Steals — Joshua {monthlyReport.rivalry.totalSteals.joshua} · Natasha {monthlyReport.rivalry.totalSteals.natasha}
              </p>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <p className="text-[13px] italic leading-[1.55] text-emerald-300/60">{monthlyReport.closingLine.joshua}</p>
              <p className="text-[13px] italic leading-[1.55] text-right text-sky-300/60">{monthlyReport.closingLine.natasha}</p>
            </div>
          </Card>
        </ScrollReveal>
      ) : null}

      {/* ── Active session banner ────────────────────── */}
      {isLive ? (
        <ScrollReveal>
          <Card className={`home-hero-card px-6 py-7 ${accentTint}`}>
            <div className="space-y-5">
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <span className={`h-2 w-2 rounded-full animate-pulse ${accentDot}`} />
                  <p className="label-eyebrow">In progress</p>
                </div>
                <h2 className={`text-[2.2rem] font-semibold tracking-[-0.05em] leading-[1.03] ${accentText}`}>
                  {activeWorkoutName}
                </h2>
                <p className="text-[14px] text-white/40">{activeSessionSetCount} sets logged</p>
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
              <p className="label-eyebrow">Rest day</p>
              <h2 className="text-[2rem] font-semibold tracking-[-0.045em] text-white leading-[1.06]">
                {restDayRead}
              </h2>
              <p className="text-[14px] leading-[1.65] text-white/45">{restRecoveryLabel}</p>
              <div className="flex items-center gap-2.5 pt-1 border-t border-white/[0.06]">
                <p className="label-eyebrow">Next up</p>
                <p className="text-[13px] text-white/55">
                  {restDayState.nextBestSession}
                  {restDayState.nextBestSessionDaysOut === 0
                    ? " · today"
                    : restDayState.nextBestSessionDaysOut === 1
                      ? " · tomorrow"
                      : ` · in ${restDayState.nextBestSessionDaysOut} days`}
                </p>
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
              <div className="space-y-2.5">
                <p className="label-eyebrow">{sessionPresentation.splitLabel}</p>
                <h2 className="text-[2.3rem] font-semibold tracking-[-0.055em] text-white leading-[1.03]">
                  {sessionPresentation.title}
                </h2>
                <p className="text-[14px] leading-[1.65] text-white/48">{trainingInsight}</p>
              </div>

              {momentumPillText ? (
                <span className={`inline-flex items-center rounded-full border px-3.5 py-1.5 text-[12px] font-medium ${accentTint} ${accentRing} ${accentMuted}`}>
                  {momentumPillText}
                </span>
              ) : null}

              <button
                type="button"
                onClick={() => onStartWorkout()}
                className={`hero-cta-shimmer inline-flex h-[56px] w-full items-center justify-center rounded-[16px] text-[15px] font-semibold tracking-[-0.01em] text-white transition-colors ${accentBtn}`}
              >
                Start Session
              </button>

              <div className="flex items-center justify-center gap-7">
                <button
                  type="button"
                  onClick={() => onPreviewWorkout(todaysWorkout.id)}
                  className="text-[13px] text-white/32 transition-colors hover:text-white/60"
                >
                  Preview
                </button>
                <span className="text-white/12">·</span>
                <button
                  type="button"
                  onClick={() => setShowSchedulePicker((v) => !v)}
                  className="text-[13px] text-white/32 transition-colors hover:text-white/60"
                >
                  Rearrange
                </button>
                <span className="text-white/12">·</span>
                <button
                  type="button"
                  onClick={onSkipWorkout}
                  className="text-[13px] text-white/32 transition-colors hover:text-white/60"
                >
                  Skip
                </button>
              </div>

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
                        workout.id === todaysWorkout.id ? "text-white/88" : "text-white/38"
                      }`}
                    >
                      <span className="text-[14px]">{workout.name}</span>
                      <span className="text-[11px] text-white/24">{workout.dayLabel}</span>
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
          {[
            { label: "Week", value: weeklyCount, unit: weeklyCount === 1 ? "session" : "sessions", accent: false },
            { label: "Streak", value: streak, unit: streak === 1 ? "day" : "days", accent: false },
            { label: "PRs", value: pbCount, unit: "all time", accent: pbCount > 0 },
          ].map(({ label, value, unit, accent }) => (
            <Card key={label} className="px-4 py-5">
              <p className="label-eyebrow">{label}</p>
              <p className={`mt-3 text-[40px] font-bold tracking-[-0.06em] leading-none ${accent ? accentText : "text-white"}`}>
                {value}
              </p>
              <p className="mt-1.5 text-[11px] text-white/34">{unit}</p>
            </Card>
          ))}
        </div>
      </ScrollReveal>

      {/* ── Rivalry card ────────────────────────────── */}
      <ScrollReveal delay={60}>
        <Card className="px-6 py-6">
          <div className="space-y-3.5">
            <p className="label-eyebrow">Rivalry</p>
            <h3 className="text-[1.25rem] font-semibold tracking-[-0.03em] text-white/92 leading-[1.3]">
              <RivalryHeadline copy={rivalryCopy} />
            </h3>
            {rivalryCopy.stealDetail ? (
              <p className="text-[13px] leading-[1.6] text-white/36">{rivalryCopy.stealDetail}</p>
            ) : null}
            {rivalSessions.length > 0 ? (
              <div className="mt-1 rounded-[14px] border border-white/[0.06] bg-white/[0.02] px-4 py-4 space-y-2.5">
                <p className="label-eyebrow">
                  {profile.id === "joshua" ? "Natasha" : "Joshua"} this week
                </p>
                {rivalSessions.slice(0, 3).map((session) => (
                  <div key={session.id} className="flex items-center justify-between gap-3">
                    <span className="truncate text-[13px] text-white/52">{session.workoutName}</span>
                    <span className="flex-shrink-0 text-[11px] text-white/28 tabular-nums">
                      {shortDate(session.performedAt)}
                    </span>
                  </div>
                ))}
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
              <div className="divide-y divide-white/[0.05]">
                {recentWorkouts.slice(0, 4).map((session) => (
                  <button
                    key={session.id}
                    type="button"
                    className="flex w-full items-center justify-between gap-4 py-3.5 text-left first:pt-0 last:pb-0"
                    onClick={() => onOpenRecentWorkout(session.workoutDayId)}
                  >
                    <div className="min-w-0 space-y-0.5">
                      <p className="truncate text-[14px] font-medium text-white/84">
                        {session.workoutName}
                        {session.partial ? (
                          <span className="ml-2 text-[11px] font-normal text-white/30">Partial</span>
                        ) : null}
                      </p>
                      <p className="text-[12px] text-white/30">
                        {session.exercises.length} exercises · {session.durationMinutes} min
                      </p>
                    </div>
                    <span className="flex-shrink-0 text-[12px] text-white/24 tabular-nums">
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
