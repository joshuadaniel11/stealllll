"use client";

import { useState } from "react";
import { ChevronDown } from "lucide-react";

import { DailyBibleCard } from "@/components/daily-bible-card";
import { DailyStretchCard } from "@/components/daily-stretch-card";
import { ScrollReveal } from "@/components/scroll-reveal";
import { StrengthPredictionCard } from "@/components/strength-prediction-card";
import { Card, MiniMetric } from "@/components/ui";
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

const workoutMotivationByProfile: Record<string, Record<string, { preview: string }>> = {
  natasha: {
    "natasha-glutes-hams": {
      preview: "🍑🔥 Build those round, juicy glutes until Joshua can't stop thinking about getting his hands all over you later.",
    },
    "natasha-back-arms": {
      preview: "😈🖤 Make that back look so tempting Joshua goes crazy watching you walk away from him.",
    },
    "natasha-glutes-quads": {
      preview: "🍑💋 Train legs and curves so good Joshua is desperate to pull you closer the second he sees you.",
    },
    "natasha-upper-core": {
      preview: "✨🫦 Tighten that waist and shape that body until Joshua is fully obsessed with how sinful you look.",
    },
    "natasha-core-explosive": {
      preview: "⚡😏 Move hot, feel dangerous, and carry that teasing little energy straight back to Joshua.",
    },
  },
  joshua: {
    "joshua-chest-triceps": {
      preview: "😈💪 Press up that thick chest and triceps until Natasha wants herself pinned up close against you.",
    },
    "joshua-back-biceps": {
      preview: "🖤💪 Train that wide back and biceps until Natasha gets hot just thinking about your arms wrapped tight around her.",
    },
    "joshua-legs": {
      preview: "🔥🦵 Build those shoulders and legs so Natasha feels that hard, athletic look and wants you on her instantly.",
    },
    "joshua-shoulders-arms": {
      preview: "💪😏 Hit chest and triceps again so Natasha can feel exactly how much thicker and harder you've gotten.",
    },
    "joshua-upper-strength": {
      preview: "🖤🔥 Finish back and biceps hard so Natasha can see that wider, sexier shape and start wanting you on sight.",
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
  workoutRhythmNote,
  weeklyCount,
  streak,
  pbCount,
  strengthPredictions,
  dailyVerse,
  dailyStretch,
  stretchCompletedToday,
  sharedSummary,
  recentWorkouts,
  weddingCountdown,
  onOpenDailyVerse,
  onToggleStretch,
  onStartWorkout,
  onResumeWorkout,
  onPreviewWorkout,
  onSkipWorkout,
  onMoveWorkout,
  onOpenExercise,
}: {
  profile: Profile;
  todaysWorkout: WorkoutPlanDay;
  activeWorkoutName: string | null;
  workoutRhythmNote: string | null;
  weeklyCount: number;
  streak: number;
  pbCount: number;
  strengthPredictions: StrengthPrediction[];
  dailyVerse: BibleVerse;
  dailyStretch: StretchRecommendation;
  stretchCompletedToday: boolean;
  sharedSummary: SharedSummary;
  recentWorkouts: WorkoutSession[];
  weddingCountdown: { months: number; days: number; label: string };
  onOpenDailyVerse: () => void;
  onToggleStretch: () => void;
  onStartWorkout: () => void;
  onResumeWorkout: () => void;
  onPreviewWorkout: () => void;
  onSkipWorkout: () => void;
  onMoveWorkout: (workoutId: string) => void;
  onOpenExercise: (id: string | null) => void;
}) {
  const [showDetails, setShowDetails] = useState(false);
  const [showMoveChoices, setShowMoveChoices] = useState(false);
  const dailyMotivation = getWorkoutMotivation(profile.id, todaysWorkout.id);
  const smallDailyMessage = dailyMotivation?.preview ?? dailyVerse.preview;

  return (
    <div className="space-y-3">
      <ScrollReveal delay={0} y={14} scale={0.995}>
        <div className="px-2 pt-1 text-center">
          <p className="caption-text text-muted">Until November 2, 2026</p>
          <h2 className="mt-2 text-[2.3rem] font-semibold leading-[0.95] tracking-[-0.07em] text-text">
            {weddingCountdown.months} months • {weddingCountdown.days} days
          </h2>
          <p className="caption-text mt-2 text-muted">{weddingCountdown.label}</p>
        </div>
      </ScrollReveal>

      <ScrollReveal delay={30} y={14} scale={0.995}>
        <Card className="px-5 py-5">
          <p className="text-sm text-muted">{profile.name}</p>
          <p className="medium-label mt-3 max-w-[29ch] font-medium text-text">{smallDailyMessage}</p>
          <p className="caption-text mt-3 text-muted">
            {dailyMotivation ? "Private note for today's session." : "Daily verse available below."}
          </p>
        </Card>
      </ScrollReveal>

      <ScrollReveal delay={60} y={14} scale={0.995}>
        <Card className="px-5 py-6">
          <p className="text-sm text-muted">Today</p>
          <h2 className="large-title mt-2 font-semibold text-text">{activeWorkoutName ?? todaysWorkout.name}</h2>
          <p className="medium-label mt-2 text-muted">
            {activeWorkoutName
              ? "Session in progress. Jump back in when you're ready."
              : `${todaysWorkout.focus} • ${todaysWorkout.exercises.length} exercises • ${todaysWorkout.durationMinutes} min`}
          </p>
          {workoutRhythmNote ? <p className="caption-text mt-3 text-muted">{workoutRhythmNote}</p> : null}

          <div className="mt-6">
            <button
              className="w-full rounded-[30px] bg-white px-5 py-5 text-base font-semibold text-black shadow-[var(--shadow-soft)]"
              onClick={activeWorkoutName ? onResumeWorkout : onStartWorkout}
            >
              {activeWorkoutName ? "Resume Workout Mode" : "Begin Session"}
            </button>
            <div className="mt-3 flex items-center justify-between gap-3">
              <button
                className="text-sm font-medium text-muted transition-colors hover:text-text"
                onClick={onPreviewWorkout}
              >
                Preview workout
              </button>
              {!activeWorkoutName ? (
                <button
                  className="text-sm font-medium text-muted transition-colors hover:text-text"
                  onClick={() => setShowMoveChoices((current) => !current)}
                >
                  {showMoveChoices ? "Close options" : "Move or skip"}
                </button>
              ) : null}
            </div>
          </div>

          {!activeWorkoutName && showMoveChoices ? (
            <div className="mt-4 space-y-2">
              <div className="grid grid-cols-2 gap-2">
                <button
                  className="rounded-[22px] bg-[var(--card-strong)] px-4 py-3 text-sm font-medium text-muted"
                  onClick={onSkipWorkout}
                >
                  Skip for now
                </button>
                <button
                  className="rounded-[22px] bg-[var(--card-strong)] px-4 py-3 text-sm font-medium text-muted"
                  onClick={() => setShowMoveChoices(false)}
                >
                  Keep today
                </button>
              </div>
              <div className="grid grid-cols-1 gap-2">
                {profile.workoutPlan.map((workout) => (
                  <button
                    key={workout.id}
                    className={`rounded-[22px] px-4 py-3 text-left text-sm font-medium ${
                      workout.id === todaysWorkout.id ? "bg-accentSoft text-text" : "bg-[var(--card-strong)] text-muted"
                    }`}
                    onClick={() => {
                      onMoveWorkout(workout.id);
                      setShowMoveChoices(false);
                    }}
                  >
                    {workout.dayLabel} • {workout.name}
                  </button>
                ))}
              </div>
            </div>
          ) : null}
        </Card>
      </ScrollReveal>

      <ScrollReveal delay={90} y={12} scale={0.996}>
        <div className="grid grid-cols-3 gap-2.5">
          <MiniMetric label="This week" value={`${weeklyCount}`} />
          <MiniMetric label="Streak" value={`${streak}`} />
          <MiniMetric label="Last PR" value={`${pbCount}`} />
        </div>
      </ScrollReveal>

      <ScrollReveal delay={120} y={12} scale={0.996}>
        <DailyStretchCard stretch={dailyStretch} completed={stretchCompletedToday} onToggle={onToggleStretch} />
      </ScrollReveal>

      <ScrollReveal delay={150} y={12} scale={0.996}>
        <Card className="px-5 py-4">
          <button
            className="flex w-full items-center justify-between text-left"
            onClick={() => setShowDetails((current) => !current)}
          >
            <div>
              <p className="text-sm text-muted">More</p>
              <p className="medium-label mt-2 text-text">
                Open secondary details only when you want them.
              </p>
            </div>
            <ChevronDown
              className={`h-5 w-5 text-muted transition-transform duration-300 ${showDetails ? "rotate-180" : ""}`}
            />
          </button>

          {showDetails ? (
            <div className="mt-4 space-y-3">
              <StrengthPredictionCard predictions={strengthPredictions} />
              <DailyBibleCard verse={dailyVerse} onOpen={onOpenDailyVerse} />

              <Card className="px-5 py-5">
                <p className="text-sm text-muted">Couple summary</p>
                <p className="medium-label mt-3 text-text">{sharedSummary.weeklyHighlight}</p>
                <div className="mt-4 grid grid-cols-2 gap-3">
                  <MiniMetric label="Together" value={`${sharedSummary.combinedWorkouts}`} />
                  <MiniMetric label="Team streak" value={`${sharedSummary.teamStreak}d`} />
                </div>
              </Card>

              <Card className="px-5 py-5">
                <p className="text-sm text-muted">Recent workouts</p>
                <div className="mt-3 space-y-2">
                  {recentWorkouts.length ? (
                    recentWorkouts.slice(0, 2).map((session) => (
                      <button
                        key={session.id}
                        className="w-full rounded-[24px] bg-[var(--card-strong)] px-4 py-4 text-left"
                        onClick={() => onOpenExercise(session.exercises[0]?.exerciseId ?? null)}
                      >
                        <p className="text-sm font-medium text-text">{session.workoutName}</p>
                        <p className="caption-text mt-1 text-muted">
                          {formatDate(session.performedAt)} • {session.exercises.length} exercises
                        </p>
                      </button>
                    ))
                  ) : (
                    <div className="rounded-[24px] bg-[var(--card-strong)] px-4 py-4 text-sm text-muted">
                      Your first logged session will appear here.
                    </div>
                  )}
                </div>
              </Card>
            </div>
          ) : null}
        </Card>
      </ScrollReveal>
    </div>
  );
}
