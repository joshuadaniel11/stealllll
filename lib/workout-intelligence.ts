import type {
  ActiveWorkout,
  ExerciseTemplate,
  MeasurementEntry,
  Profile,
  UserId,
  WorkoutSession,
} from "@/lib/types";

type CompressionInsight = {
  averageCompletedExercises: number;
  suggestedExerciseIds: string[];
  suggestedExerciseNames: string[];
  note: string;
};

type RecommendedExercise = {
  index: number;
  reason: string;
};

type AestheticSignal = {
  title: string;
  value: string;
  detail: string;
};

function getRepTop(repRange: string) {
  const matches = repRange.match(/\d+/g);
  if (!matches?.length) {
    return 12;
  }
  return Number(matches[matches.length - 1]);
}

function getExercisePriority(template: ExerciseTemplate, index: number) {
  const repTop = getRepTop(template.repRange);
  const heavyBonus = repTop <= 8 ? 18 : repTop <= 10 ? 12 : repTop <= 12 ? 8 : 4;
  const favoriteBonus = template.favorite ? 10 : 0;
  const earlyOrderBonus = Math.max(0, 14 - index * 2);
  return template.sets * 5 + heavyBonus + favoriteBonus + earlyOrderBonus;
}

function getCompletedExerciseCount(session: WorkoutSession) {
  return session.exercises.filter((exercise) => exercise.sets.some((set) => set.completed)).length;
}

export function getAdaptiveCompressionInsight(
  workout: Profile["workoutPlan"][number] | undefined,
  sessions: WorkoutSession[],
): CompressionInsight | null {
  if (!workout) {
    return null;
  }

  const matchingPartials = sessions.filter(
    (session) => session.workoutDayId === workout.id && session.partial,
  );

  if (matchingPartials.length < 2) {
    return null;
  }

  const averageCompletedExercises =
    matchingPartials.reduce((sum, session) => sum + getCompletedExerciseCount(session), 0) /
    matchingPartials.length;

  if (averageCompletedExercises >= workout.exercises.length - 0.5) {
    return null;
  }

  const suggestedExercises = workout.exercises
    .map((exercise, index) => ({
      exercise,
      score: getExercisePriority(exercise, index),
    }))
    .sort((a, b) => b.score - a.score)
    .slice(0, Math.min(Math.max(3, Math.round(averageCompletedExercises)), 4));

  return {
    averageCompletedExercises: Math.max(1, Math.round(averageCompletedExercises)),
    suggestedExerciseIds: suggestedExercises.map((item) => item.exercise.id),
    suggestedExerciseNames: suggestedExercises.map((item) => item.exercise.name),
    note: `You usually finish about ${Math.max(1, Math.round(averageCompletedExercises))} exercises on this day. If time is tight, start with the highest-payoff lifts first.`,
  };
}

export function getRecommendedExercise(
  activeWorkout: ActiveWorkout,
  workoutTemplate: Profile["workoutPlan"][number] | undefined,
): RecommendedExercise | null {
  if (!workoutTemplate) {
    return null;
  }

  const incomplete = activeWorkout.exercises
    .map((exercise, index) => ({ exercise, index, template: workoutTemplate.exercises[index] }))
    .filter((item) => item.exercise.sets.some((set) => !set.completed));

  if (!incomplete.length) {
    return null;
  }

  const best = incomplete
    .map((item) => ({
      index: item.index,
      score: getExercisePriority(item.template, item.index),
      reason:
        getRepTop(item.template.repRange) <= 8
          ? "Best next if you want the highest-payoff lift first."
          : item.template.favorite
            ? "Best next based on your stronger anchor exercise."
            : "Best next to keep this session efficient.",
    }))
    .sort((a, b) => b.score - a.score)[0];

  return { index: best.index, reason: best.reason };
}

function getRecentSessions(sessions: WorkoutSession[], limit = 8) {
  return sessions
    .slice()
    .sort((a, b) => +new Date(b.performedAt) - +new Date(a.performedAt))
    .slice(0, limit);
}

export function getAestheticSignal(profileId: UserId, sessions: WorkoutSession[], measurements: MeasurementEntry[]): AestheticSignal {
  const recentSessions = getRecentSessions(sessions);
  const countByWorkout = (pattern: RegExp) => recentSessions.filter((session) => pattern.test(session.workoutName)).length;
  const latestBodyFat = measurements.at(-1)?.bodyFatPercent;
  const previousBodyFat = measurements.at(-2)?.bodyFatPercent;
  const leaningOut = latestBodyFat !== undefined && previousBodyFat !== undefined && latestBodyFat < previousBodyFat;

  if (profileId === "natasha") {
    const gluteDays = countByWorkout(/glute/i);
    const backDays = countByWorkout(/back/i);
    const shoulderDays = countByWorkout(/upper|shoulder/i);
    const strongest =
      gluteDays >= backDays && gluteDays >= shoulderDays
        ? {
            title: "Aesthetic engine",
            value: "Glute shape ahead",
            detail: `${gluteDays} recent glute-led sessions are outpacing the rest of the split. That usually means curve-building is landing first and the lower-body shape signal is strongest right now.`,
          }
        : backDays >= shoulderDays
          ? {
              title: "Aesthetic engine",
              value: "Back detail rising",
              detail: `${backDays} recent back-focused sessions are sharpening the upper-body line. That is the signal most likely to tighten the waist-to-shoulder contrast next.`,
            }
          : {
              title: "Aesthetic engine",
              value: "Hourglass signal building",
              detail: `${gluteDays + shoulderDays} recent glute and upper-body sessions are working together. That usually means overall silhouette change is starting to look more obvious.`,
            };

    return strongest;
  }

  const chestDays = countByWorkout(/chest/i);
  const backDays = countByWorkout(/back/i);
  const shoulderLegDays = countByWorkout(/shoulder|leg/i);

  if (chestDays >= backDays && chestDays >= shoulderLegDays) {
    return {
      title: "Aesthetic engine",
      value: "Chest size ahead",
      detail: `${chestDays} recent chest sessions are leading the split. That usually means the thicker upper-body look is developing faster than the rest right now.`,
    };
  }

  if (leaningOut) {
    return {
      title: "Aesthetic engine",
      value: "Waistline tightening",
      detail: "Your recent check-ins suggest you are leaning out while still training consistently. That is usually the fastest route to looking harder and more defined overall.",
    };
  }

  return {
    title: "Aesthetic engine",
    value: "Frame widening",
    detail: `${backDays + shoulderLegDays} recent back, shoulder, and leg sessions are reinforcing width and posture. That usually shows up as a more athletic frame before smaller details do.`,
  };
}
