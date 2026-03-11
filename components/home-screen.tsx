"use client";

import { useState } from "react";
import { ChevronDown, ChevronUp } from "lucide-react";

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

const workoutMotivationByProfile: Record<string, Record<string, { preview: string; full: string }>> = {
  natasha: {
    "natasha-glutes-hams": {
      preview: "Build those round, juicy glutes and give Joshua something filthy to think about later.",
      full: "Build those round, juicy glutes until Joshua is distracted by the thought of grabbing you closer and keeping his hands on you.",
    },
    "natasha-back-arms": {
      preview: "Make that back look so tempting Joshua can't help staring when you walk away from him.",
      full: "Carve that sexy back and arm line until Joshua is staring from behind and replaying that view in his head all day.",
    },
    "natasha-glutes-quads": {
      preview: "Train legs that look wickedly good and curves Joshua will be dying to pull closer.",
      full: "Shape those legs and curves until Joshua is worked up just watching the way you move around him.",
    },
    "natasha-upper-core": {
      preview: "Tighten that waist and shape that body until Joshua is fully obsessed with the view.",
      full: "Tighten that waist and shape that body into the kind of view that makes Joshua want you the second he sees you move.",
    },
    "natasha-core-explosive": {
      preview: "Move hot, feel dangerous, and carry that teasing little energy straight back to Joshua.",
      full: "Move hot, feel dangerous, and carry that charged-up energy back to Joshua so he feels it the second you get close.",
    },
  },
  joshua: {
      "joshua-chest-triceps": {
        preview: "Press up that thick chest and triceps so Natasha wants to feel herself pinned close against you.",
        full: "Build that thick chest and hard triceps until Natasha gets turned on just imagining herself pressed up against you and feeling all of it when she's close.",
      },
      "joshua-back-biceps": {
        preview: "Train that wide back and biceps until Natasha gets hot just thinking about your arms wrapped around her.",
        full: "Build that wide back and thick biceps until Natasha gets worked up picturing you pulling her in close and keeping those strong arms all over her.",
      },
      "joshua-legs": {
        preview: "Build those shoulders and legs so Natasha feels that hard, athletic look the second you walk in.",
        full: "Grow those capped shoulders and strong legs until Natasha can't stop thinking about how powerful you look and how good you'd feel all over her.",
      },
      "joshua-shoulders-arms": {
        preview: "Hit chest and triceps again so Natasha can feel the difference every time she leans into you.",
        full: "Train that second chest and triceps day until Natasha wants to run her hands over you and feel how much thicker and harder you've gotten.",
      },
      "joshua-upper-strength": {
        preview: "Finish back and biceps hard so Natasha can see that wider, sexier shape all over you.",
        full: "Finish this back and biceps session until Natasha can see that wider, thicker shape on you and gets turned on knowing exactly what all this work is building.",
      },
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
    onToggleStretch,
    onStartWorkout,
    onResumeWorkout,
    onPreviewWorkout,
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
    onToggleStretch: () => void;
    onStartWorkout: () => void;
    onResumeWorkout: () => void;
    onPreviewWorkout: () => void;
  onOpenExercise: (id: string | null) => void;
}) {
  const [showDetails, setShowDetails] = useState(false);
  const [showFullPrivateNote, setShowFullPrivateNote] = useState(false);
  const dailyMotivation = getWorkoutMotivation(profile.id, todaysWorkout.id);
  const smallDailyMessage = dailyMotivation?.preview ?? dailyVerse.preview;

  return (
    <div className="space-y-4 animate-page-in">
      <Card className="px-5 py-5">
        <p className="text-sm text-muted">{profile.name}</p>
        <p className="medium-label mt-3 max-w-[28ch] font-medium text-text">{smallDailyMessage}</p>
        {dailyMotivation ? (
          <button
            className="mt-4 inline-flex items-center gap-2 text-sm font-medium text-accent"
            onClick={() => setShowFullPrivateNote((current) => !current)}
          >
            {showFullPrivateNote ? "Hide full note" : "Open full note"}
            {showFullPrivateNote ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
          </button>
        ) : (
          <p className="caption-text mt-4 text-muted">Daily verse available below.</p>
        )}
        {showFullPrivateNote && dailyMotivation ? (
          <div className="mt-4 rounded-[28px] bg-[var(--card-strong)] px-4 py-4">
            <p className="medium-label text-text">{dailyMotivation.full}</p>
          </div>
        ) : null}
      </Card>

      <Card className="px-5 py-5">
        <p className="text-sm text-muted">Today's workout</p>
        <h2 className="large-title mt-2 font-semibold text-text">{activeWorkoutName ?? todaysWorkout.name}</h2>
        <p className="medium-label mt-2 text-muted">
          {activeWorkoutName
            ? "Session in progress. Jump back in when you are ready."
            : `${todaysWorkout.focus} | ${todaysWorkout.exercises.length} exercises | ${todaysWorkout.durationMinutes} min`}
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
            onClick={onPreviewWorkout}
          >
            Preview
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
          onToggle={onToggleStretch}
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
          <div className="mt-5 space-y-4 animate-soft-in">
            <StrengthPredictionCard predictions={strengthPredictions} />
            <DailyBibleCard verse={dailyVerse} onOpen={onOpenDailyVerse} />

            <Card className="px-5 py-5">
              <p className="text-sm text-muted">Shared progress</p>
              <h3 className="mt-2 text-xl font-semibold tracking-[-0.04em] text-text">Couple summary</h3>
              <p className="medium-label mt-3 text-muted">{sharedSummary.weeklyHighlight}</p>
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
                      <p className="caption-text mt-1 text-muted">
                        {formatDate(session.performedAt)} | {session.exercises.length} exercises
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
