"use client";

import { useState } from "react";
import { Activity, ArrowRight, ChevronDown, Flame, HeartHandshake, Sparkles } from "lucide-react";

import { DailyBibleCard } from "@/components/daily-bible-card";
import { DailyStretchCard } from "@/components/daily-stretch-card";
import { StreakRings } from "@/components/streak-rings";
import { Card, MiniMetric, StatCard } from "@/components/ui";
import type { BibleVerse, Profile, SharedSummary, StretchRecommendation, WorkoutPlanDay, WorkoutSession } from "@/lib/types";

const formatDate = (value: string) =>
  new Intl.DateTimeFormat("en-NZ", { month: "short", day: "numeric" }).format(new Date(value));

const getDailyMotivation = (lines: string[] | undefined) => {
  if (!lines?.length) {
    return null;
  }

  const now = new Date();
  const dayOfYear = Math.floor(
    (Date.UTC(now.getFullYear(), now.getMonth(), now.getDate()) - Date.UTC(now.getFullYear(), 0, 0)) /
      86_400_000,
  );

  return lines[dayOfYear % lines.length];
};

export function HomeScreen({
  profile,
  todaysWorkout,
  activeWorkoutName,
  weeklyCount,
  streak,
  pbCount,
  dailyVerse,
  dailyStretch,
  stretchCompletedToday,
  sharedSummary,
  recentWorkouts,
  onOpenDailyVerse,
  onCompleteStretch,
  onStartWorkout,
  onResumeWorkout,
  onBrowse,
  onOpenExercise,
}: {
  profile: Profile;
  todaysWorkout: WorkoutPlanDay;
  activeWorkoutName: string | null;
  weeklyCount: number;
  streak: number;
  pbCount: number;
  dailyVerse: BibleVerse;
  dailyStretch: StretchRecommendation;
  stretchCompletedToday: boolean;
  sharedSummary: SharedSummary;
  recentWorkouts: WorkoutSession[];
  onOpenDailyVerse: () => void;
  onCompleteStretch: () => void;
  onStartWorkout: () => void;
  onResumeWorkout: () => void;
  onBrowse: () => void;
  onOpenExercise: (id: string | null) => void;
}) {
  const dailyMotivation = getDailyMotivation(profile.motivationLines);
  const [showSecondary, setShowSecondary] = useState(false);
  const isJoshuaTheme = profile.id === "joshua";
  const heroGlow = isJoshuaTheme
    ? "radial-gradient(circle at top right, rgba(255,255,255,0.05), transparent 34%)"
    : "radial-gradient(circle at top right, rgba(95,143,255,0.12), transparent 34%)";
  const motivationGlow = isJoshuaTheme
    ? "radial-gradient(circle at top, rgba(255,255,255,0.08), transparent 60%)"
    : "radial-gradient(circle at top, rgba(242,143,178,0.16), transparent 60%)";

  return (
    <>
      <Card className="overflow-hidden">
        <div
          className="pointer-events-none absolute inset-0 rounded-[32px]"
          style={{ backgroundImage: heroGlow }}
        />
        <div className="relative z-10 flex items-center justify-between gap-4">
          <div>
            <p className="text-sm text-muted">Today</p>
            <h2 className="mt-1 text-[30px] font-bold tracking-[-0.05em]">
              {activeWorkoutName ?? todaysWorkout.name}
            </h2>
            <p className="mt-1 text-sm text-muted">
              {activeWorkoutName ? "Workout in progress" : todaysWorkout.focus}
            </p>
          </div>
          <div className="rounded-[24px] border border-white/40 bg-accentSoft px-3 py-2 text-right text-accent shadow-[var(--shadow-soft)] dark:border-white/10">
            <p className="text-xs uppercase tracking-[0.18em]">Plan</p>
            <p className="text-sm font-medium">
              {activeWorkoutName ? `${todaysWorkout.exercises.length} exercises` : `${todaysWorkout.durationMinutes} min`}
            </p>
          </div>
        </div>
        <div className="relative z-10 mt-5 flex items-center gap-3">
          <button
            className="flex-1 rounded-[24px] bg-accent px-5 py-4 text-base font-bold text-white shadow-[var(--shadow-glow)] transition-all duration-300 hover:-translate-y-0.5 hover:opacity-95"
            onClick={activeWorkoutName ? onResumeWorkout : onStartWorkout}
          >
            {activeWorkoutName ? "Resume Workout" : "Start Workout"}
          </button>
          <button
            className="rounded-[24px] border border-stroke bg-[var(--card-strong)]/70 px-4 py-4 text-sm font-semibold text-muted shadow-[var(--shadow-soft)] transition-all duration-300 hover:-translate-y-0.5"
            onClick={onBrowse}
          >
            Browse
          </button>
        </div>
      </Card>

      <section className="grid grid-cols-3 gap-3">
        <StatCard label="This week" value={`${weeklyCount}`} sublabel="workouts" icon={Activity} />
        <StatCard label="Streak" value={`${streak}`} sublabel="days" icon={Flame} />
        <StatCard label="PBs" value={`${pbCount}`} sublabel="saved" icon={Sparkles} />
      </section>

      <StreakRings completed={weeklyCount} goal={profile.workoutPlan.length} />

      <DailyStretchCard
        stretch={dailyStretch}
        completed={stretchCompletedToday}
        onComplete={onCompleteStretch}
      />

      <Card>
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm text-muted">Shared dashboard</p>
            <h3 className="mt-1 text-[24px] font-bold tracking-[-0.04em]">Couple summary</h3>
          </div>
          <div className="rounded-full border border-stroke bg-[var(--card-strong)]/70 px-3 py-1 text-xs text-muted shadow-[var(--shadow-soft)]">
            Team streak {sharedSummary.teamStreak} days
          </div>
        </div>
        <div className="mt-4 grid grid-cols-2 gap-3">
          <MiniMetric label="Combined workouts" value={`${sharedSummary.combinedWorkouts}`} />
          <MiniMetric label="Current profile" value={profile.name} />
        </div>
        <p className="mt-4 text-sm leading-6 text-muted">{sharedSummary.weeklyHighlight}</p>
      </Card>

      <Card>
        <button
          className="flex w-full items-center justify-between text-left"
          onClick={() => setShowSecondary((current) => !current)}
        >
          <div>
            <p className="text-sm text-muted">More for today</p>
            <h3 className="mt-1 text-[22px] font-bold tracking-[-0.04em]">Optional cards</h3>
            <p className="mt-2 text-sm text-muted">
              Open motivation, Bible, and recent workout history when you want it.
            </p>
          </div>
          <div className="rounded-[22px] border border-stroke bg-[var(--card-strong)]/70 p-3 shadow-[var(--shadow-soft)]">
            <ChevronDown
              className={`h-5 w-5 text-muted transition-transform duration-300 ${
                showSecondary ? "rotate-180" : ""
              }`}
            />
          </div>
        </button>

        {showSecondary ? (
          <div className="mt-5 space-y-5">
            {dailyMotivation ? (
              <div
                className="rounded-[26px] border border-white/60 p-4 dark:border-white/10"
                style={{ backgroundImage: motivationGlow }}
              >
                <p className="text-sm text-muted">Motivation</p>
                <h3 className="mt-1 text-[24px] font-bold tracking-[-0.04em]">For {profile.name}</h3>
                <p className="mt-3 max-w-[26ch] text-base font-semibold leading-7 text-foreground">
                  {dailyMotivation}
                </p>
              </div>
            ) : null}

            <DailyBibleCard verse={dailyVerse} onOpen={onOpenDailyVerse} />

            <div>
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted">Recent</p>
                  <h3 className="mt-1 text-[24px] font-bold tracking-[-0.04em]">Completed workouts</h3>
                </div>
                <div className="rounded-[24px] bg-accentSoft p-3 text-accent shadow-[var(--shadow-soft)]">
                  <HeartHandshake className="h-5 w-5" />
                </div>
              </div>
              <div className="mt-4 space-y-3">
                {recentWorkouts.length ? (
                  recentWorkouts.map((session) => (
                    <button
                      key={session.id}
                      className="w-full rounded-[24px] border border-stroke bg-[var(--card-strong)]/72 px-4 py-4 text-left shadow-[var(--shadow-soft)]"
                      onClick={() => onOpenExercise(session.exercises[0]?.exerciseId ?? null)}
                    >
                      <div className="flex items-center justify-between">
                        <p className="font-medium">{session.workoutName}</p>
                        <p className="text-sm text-muted">{formatDate(session.performedAt)}</p>
                      </div>
                      <p className="mt-1 text-sm text-muted">
                        {session.exercises.length} exercises - {session.durationMinutes} min
                      </p>
                    </button>
                  ))
                ) : (
                  <div className="rounded-[24px] border border-stroke bg-[var(--card-strong)]/72 px-4 py-4 text-sm text-muted shadow-[var(--shadow-soft)]">
                    No workouts logged yet. Your history will show here once you complete your first session.
                  </div>
                )}
              </div>
              <div className="mt-4 flex items-center justify-end gap-2 text-sm text-muted">
                Open details <ArrowRight className="h-4 w-4" />
              </div>
            </div>
          </div>
        ) : null}
      </Card>
    </>
  );
}
