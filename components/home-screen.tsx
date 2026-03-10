import { Activity, ArrowRight, Flame, HeartHandshake, Sparkles } from "lucide-react";

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

  return (
    <>
      <Card>
        <div className="flex items-center justify-between gap-4">
          <div>
            <p className="text-sm text-muted">Today</p>
            <h2 className="mt-1 text-[30px] font-bold tracking-[-0.05em]">
              {activeWorkoutName ?? todaysWorkout.name}
            </h2>
            <p className="mt-1 text-sm text-muted">
              {activeWorkoutName ? "Workout in progress" : todaysWorkout.focus}
            </p>
          </div>
          <div className="rounded-[24px] bg-accentSoft px-3 py-2 text-right text-accent">
            <p className="text-xs uppercase tracking-[0.18em]">Plan</p>
            <p className="text-sm font-medium">
              {activeWorkoutName ? `${todaysWorkout.exercises.length} exercises` : `${todaysWorkout.durationMinutes} min`}
            </p>
          </div>
        </div>
        <div className="mt-4 flex items-center gap-3">
          <button
            className="flex-1 rounded-[22px] bg-accent px-5 py-4 text-base font-bold text-white shadow-glow transition-all duration-300 hover:-translate-y-0.5 hover:opacity-95"
            onClick={activeWorkoutName ? onResumeWorkout : onStartWorkout}
          >
            {activeWorkoutName ? "Resume Workout" : "Start Workout"}
          </button>
          <button
            className="rounded-[22px] border border-stroke px-4 py-4 text-sm font-semibold text-muted transition-all duration-300 hover:-translate-y-0.5"
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

      {dailyMotivation ? (
        <Card className="overflow-hidden">
          <div className="rounded-[26px] border border-white/60 bg-[radial-gradient(circle_at_top,_rgba(242,143,178,0.16),_transparent_60%)] p-1 dark:border-white/10 dark:bg-[radial-gradient(circle_at_top,_rgba(242,143,178,0.2),_transparent_60%)]">
            <p className="text-sm text-muted">Motivation</p>
            <h3 className="mt-1 text-[24px] font-bold tracking-[-0.04em]">For {profile.name}</h3>
            <p className="mt-3 max-w-[26ch] text-base font-semibold leading-7 text-foreground">
              {dailyMotivation}
            </p>
          </div>
        </Card>
      ) : null}

      <DailyBibleCard verse={dailyVerse} onOpen={onOpenDailyVerse} />

      <Card>
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm text-muted">Shared dashboard</p>
            <h3 className="mt-1 text-[24px] font-bold tracking-[-0.04em]">Couple summary</h3>
          </div>
          <div className="rounded-full bg-white/60 px-3 py-1 text-xs text-muted dark:bg-white/5">
            Team streak {sharedSummary.teamStreak} days
          </div>
        </div>
        <div className="mt-4 grid grid-cols-2 gap-3">
          <MiniMetric label="Combined workouts" value={`${sharedSummary.combinedWorkouts}`} />
          <MiniMetric label="Current profile" value={profile.name} />
        </div>
        <p className="mt-4 text-sm leading-6 text-muted">{sharedSummary.weeklyHighlight}</p>
        <div className="mt-4 space-y-2">
          {sharedSummary.recentMilestones.map((milestone) => (
            <div
              key={milestone}
              className="rounded-[20px] border border-stroke bg-white/50 px-4 py-3 text-sm text-muted dark:bg-white/5"
            >
              {milestone}
            </div>
          ))}
        </div>
      </Card>

      <Card>
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm text-muted">Recent</p>
            <h3 className="mt-1 text-[24px] font-bold tracking-[-0.04em]">Completed workouts</h3>
          </div>
          <div className="rounded-[24px] bg-accentSoft p-3 text-accent">
            <HeartHandshake className="h-5 w-5" />
          </div>
        </div>
        <div className="mt-4 space-y-3">
          {recentWorkouts.map((session) => (
            <button
              key={session.id}
              className="w-full rounded-[24px] border border-stroke bg-white/50 px-4 py-4 text-left dark:bg-white/5"
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
          ))}
        </div>
        <div className="mt-4 flex items-center justify-end gap-2 text-sm text-muted">
          Open details <ArrowRight className="h-4 w-4" />
        </div>
      </Card>
    </>
  );
}
