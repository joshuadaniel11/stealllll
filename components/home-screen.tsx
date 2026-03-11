"use client";

import { useState } from "react";
import { ChevronDown } from "lucide-react";

import { DailyBibleCard } from "@/components/daily-bible-card";
import { DailyStretchCard } from "@/components/daily-stretch-card";
import { StrengthPredictionCard } from "@/components/strength-prediction-card";
import { Card, StatCard } from "@/components/ui";
import type {
  BibleVerse,
  Profile,
  SharedSummary,
  StrengthPrediction,
  StretchRecommendation,
  WorkoutPlanDay,
  WorkoutSession,
} from "@/lib/types";

const formatDate = (value: string) =>
  new Intl.DateTimeFormat("en-NZ", { month: "short", day: "numeric" }).format(new Date(value));

const workoutMotivationByProfile: Record<string, Record<string, string>> = {
  natasha: {
    "natasha-glutes-hams": "Build those round, juicy glutes and give Joshua something sinful to think about later.",
    "natasha-back-arms": "Make that back look so sexy Joshua can't help staring when you're walking away from him.",
    "natasha-glutes-quads": "Train legs that look wickedly good and curves Joshua will want all over him.",
    "natasha-upper-core": "Tighten that waist and shape that body until Joshua is fully obsessed with the view.",
    "natasha-core-explosive": "Move hot, feel dangerous, and carry that sexy little energy straight back to Joshua.",
  },
  joshua: {
    "joshua-chest-triceps": "Build that thick chest so Natasha wants to press herself against you the second you're close.",
    "joshua-back-biceps": "Train that wide back and those strong arms until Natasha feels weak every time you hold her.",
    "joshua-legs": "Strong legs and broad shoulders make you look filthy good in exactly the way Natasha loves.",
    "joshua-shoulders-arms": "Fill out those shoulders and arms so Natasha can't keep her hands off you.",
    "joshua-upper-strength": "Get wider, thicker, and more tempting so Natasha sees exactly what all this work is doing to you.",
  },
};

function getWorkoutMotivation(profileId: string, workoutId: string) {
  return workoutMotivationByProfile[profileId]?.[workoutId] ?? null;
}

export function HomeScreen({
  profile,
  todaysWorkout,
  activeWorkoutName,
  weeklyCount,
  streak,
  pbCount,
  strengthPredictions,
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
  strengthPredictions: StrengthPrediction[];
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
  const [showDetails, setShowDetails] = useState(false);
  const dailyMotivation = getWorkoutMotivation(profile.id, todaysWorkout.id);
  const smallDailyMessage = dailyMotivation ?? dailyVerse.preview;

  return (
    <div className="space-y-4">
      <Card className="px-5 py-5">
        <p className="text-sm text-muted">{profile.name}</p>
        <p className="mt-3 max-w-[28ch] text-base font-medium leading-7 text-text">{smallDailyMessage}</p>
        <p className="mt-4 text-sm text-muted">Private note for today&apos;s session.</p>
      </Card>

      <Card className="px-5 py-5">
        <p className="text-sm text-muted">Today&apos;s workout</p>
        <h2 className="mt-2 text-[30px] font-semibold tracking-[-0.05em] text-text">
          {activeWorkoutName ?? todaysWorkout.name}
        </h2>
        <p className="mt-2 text-sm leading-6 text-muted">
          {activeWorkoutName
            ? "Session in progress. Jump back in when you are ready."
            : `${todaysWorkout.focus} · ${todaysWorkout.exercises.length} exercises · ${todaysWorkout.durationMinutes} min`}
        </p>
        <div className="mt-5 flex gap-3">
          <button
            className="flex-1 rounded-[28px] bg-accent px-5 py-4 text-base font-semibold text-white shadow-[var(--shadow-glow)]"
            onClick={activeWorkoutName ? onResumeWorkout : onStartWorkout}
          >
            {activeWorkoutName ? "Resume Session" : "Begin Session"}
          </button>
          <button
            className="rounded-[28px] bg-[var(--card-strong)] px-4 py-4 text-sm font-medium text-muted"
            onClick={onBrowse}
          >
            Plan
          </button>
        </div>
      </Card>

      <div className="grid grid-cols-3 gap-3">
        <StatCard label="This week" value={`${weeklyCount}`} sublabel="workouts" />
        <StatCard label="Streak" value={`${streak}`} sublabel="days" />
        <StatCard label="Last PR" value={`${pbCount}`} sublabel="saved" />
      </div>

      <DailyStretchCard
        stretch={dailyStretch}
        completed={stretchCompletedToday}
        onComplete={onCompleteStretch}
      />

      <Card className="px-5 py-5">
        <button
          className="flex w-full items-center justify-between text-left"
          onClick={() => setShowDetails((current) => !current)}
        >
          <div>
            <p className="text-sm text-muted">More</p>
            <h3 className="mt-2 text-xl font-semibold tracking-[-0.04em] text-text">Open extra details</h3>
          </div>
          <ChevronDown
            className={`h-5 w-5 text-muted transition-transform duration-300 ${showDetails ? "rotate-180" : ""}`}
          />
        </button>

        {showDetails ? (
          <div className="mt-5 space-y-4">
            <StrengthPredictionCard predictions={strengthPredictions} />
            <DailyBibleCard verse={dailyVerse} onOpen={onOpenDailyVerse} />

            <Card className="px-5 py-5">
              <p className="text-sm text-muted">Shared progress</p>
              <h3 className="mt-2 text-xl font-semibold tracking-[-0.04em] text-text">Couple summary</h3>
              <p className="mt-3 text-sm leading-6 text-muted">{sharedSummary.weeklyHighlight}</p>
              <div className="mt-4 grid grid-cols-2 gap-3">
                <div className="rounded-[28px] bg-[var(--card-strong)] px-4 py-4">
                  <p className="text-sm text-muted">Combined workouts</p>
                  <p className="mt-2 text-lg font-semibold text-text">{sharedSummary.combinedWorkouts}</p>
                </div>
                <div className="rounded-[28px] bg-[var(--card-strong)] px-4 py-4">
                  <p className="text-sm text-muted">Team streak</p>
                  <p className="mt-2 text-lg font-semibold text-text">{sharedSummary.teamStreak} days</p>
                </div>
              </div>
            </Card>

            <Card className="px-5 py-5">
              <p className="text-sm text-muted">Recent workouts</p>
              <div className="mt-4 space-y-3">
                {recentWorkouts.length ? (
                  recentWorkouts.map((session) => (
                    <button
                      key={session.id}
                      className="w-full rounded-[28px] bg-[var(--card-strong)] px-4 py-4 text-left"
                      onClick={() => onOpenExercise(session.exercises[0]?.exerciseId ?? null)}
                    >
                      <p className="text-base font-medium text-text">{session.workoutName}</p>
                      <p className="mt-1 text-sm text-muted">
                        {formatDate(session.performedAt)} · {session.exercises.length} exercises
                      </p>
                    </button>
                  ))
                ) : (
                  <div className="rounded-[28px] bg-[var(--card-strong)] px-4 py-4 text-sm text-muted">
                    No workouts logged yet. Your history will show here after your first session.
                  </div>
                )}
              </div>
            </Card>
          </div>
        ) : null}
      </Card>
    </div>
  );
}
