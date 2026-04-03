import type { RecommendationConfidence, StrengthPrediction, UserId, WorkoutSession } from "@/lib/types";

type LiftConfig = {
  label: string;
  aliases: string[];
  maxWeeklyIncreaseKg: number;
  projectedRepTarget: number;
};

type LiftEntry = {
  date: string;
  weight: number;
  reps: number;
  score: number;
};

const trackedLiftsByUser: Record<UserId, LiftConfig[]> = {
  joshua: [
    { label: "Flat Dumbbell Press", aliases: ["Flat Dumbbell Press", "Bench Press"], maxWeeklyIncreaseKg: 1.5, projectedRepTarget: 8 },
    { label: "Incline Dumbbell Press", aliases: ["Incline Dumbbell Press"], maxWeeklyIncreaseKg: 1.25, projectedRepTarget: 8 },
    { label: "Leg Press", aliases: ["Leg Press"], maxWeeklyIncreaseKg: 7.5, projectedRepTarget: 10 },
    { label: "Neutral-Grip Lat Pulldown", aliases: ["Neutral-Grip Lat Pulldown", "Lat Pulldown"], maxWeeklyIncreaseKg: 2.5, projectedRepTarget: 8 },
    { label: "Machine Shoulder Press", aliases: ["Machine Shoulder Press", "Shoulder Press", "Dumbbell Shoulder Press"], maxWeeklyIncreaseKg: 1.5, projectedRepTarget: 8 },
  ],
  natasha: [
    { label: "Machine Hip Thrust", aliases: ["Machine Hip Thrust", "Barbell Hip Thrust", "Hip Thrust"], maxWeeklyIncreaseKg: 5, projectedRepTarget: 8 },
    { label: "Leg Press (Glute Bias)", aliases: ["Leg Press (Glute Bias)", "Leg Press"], maxWeeklyIncreaseKg: 7.5, projectedRepTarget: 10 },
    { label: "Wide-Grip Lat Pulldown", aliases: ["Wide-Grip Lat Pulldown", "Lat Pulldown"], maxWeeklyIncreaseKg: 2.5, projectedRepTarget: 10 },
    { label: "Seated Dumbbell Shoulder Press", aliases: ["Seated Dumbbell Shoulder Press", "Shoulder Press"], maxWeeklyIncreaseKg: 1.25, projectedRepTarget: 10 },
    { label: "Smith Machine Squat", aliases: ["Smith Machine Squat"], maxWeeklyIncreaseKg: 2.5, projectedRepTarget: 8 },
  ],
};

const millisecondsPerWeek = 604_800_000;
const millisecondsPerDay = 86_400_000;

const roundToNearestHalf = (value: number) => Math.round(value * 2) / 2;
const formatProjection = (weight: number, reps: number) => `${roundToNearestHalf(weight)}kg x ${reps}`;
const getEstimatedOneRepMax = (weight: number, reps: number) => weight * (1 + reps / 30);

function clamp(value: number, min: number, max: number) {
  return Math.min(Math.max(value, min), max);
}

function getLiftEntries(sessions: WorkoutSession[], aliases: string[]) {
  return sessions
    .slice()
    .sort((a, b) => +new Date(a.performedAt) - +new Date(b.performedAt))
    .flatMap((session) =>
      session.exercises.flatMap((exercise) => {
        if (!aliases.some((alias) => alias.toLowerCase() === exercise.exerciseName.toLowerCase())) {
          return [];
        }

        const bestSet = exercise.sets
          .filter((set) => set.completed && set.weight > 0 && set.reps > 0)
          .reduce<{ weight: number; reps: number; score: number } | null>((top, set) => {
            const score = set.weight * (1 + set.reps / 30);
            if (!top || score > top.score) {
              return { weight: set.weight, reps: set.reps, score };
            }
            return top;
          }, null);

        if (!bestSet) {
          return [];
        }

        return [
          {
            date: session.performedAt,
            weight: bestSet.weight,
            reps: bestSet.reps,
            score: bestSet.score,
          },
        ];
      }),
    )
    .slice(-6);
}

function getWeightedWeeklyE1rmGain(entries: LiftEntry[], maxWeeklyIncreaseKg: number) {
  if (entries.length < 2) {
    return 0;
  }

  const recentEntries = entries.slice(-5);
  const lastEntry = recentEntries[recentEntries.length - 1];
  const weightedGains = recentEntries
    .slice(0, -1)
    .map((entry, index) => {
      const elapsedWeeks = Math.max((+new Date(lastEntry.date) - +new Date(entry.date)) / millisecondsPerWeek, 1);
      const e1rmGain = getEstimatedOneRepMax(lastEntry.weight, lastEntry.reps) - getEstimatedOneRepMax(entry.weight, entry.reps);
      const weeklyGain = e1rmGain / elapsedWeeks;
      const weight = index + 1;

      return { weeklyGain, weight };
    })
    .filter((gain) => Number.isFinite(gain.weeklyGain));

  if (!weightedGains.length) {
    return 0;
  }

  const weightedAverage =
    weightedGains.reduce((sum, item) => sum + item.weeklyGain * item.weight, 0) /
    weightedGains.reduce((sum, item) => sum + item.weight, 0);

  return Math.max(0, Math.min(weightedAverage, maxWeeklyIncreaseKg * 1.35));
}

function getPredictionConfidence(entries: LiftEntry[], referenceDate = new Date()) {
  const lastEntry = entries[entries.length - 1];
  const recent = entries.slice(-3);
  const daysSinceLast = Math.max(
    0,
    Math.round((referenceDate.getTime() - new Date(lastEntry.date).getTime()) / millisecondsPerDay),
  );
  const scoreSpread =
    recent.length > 1
      ? Math.max(...recent.map((entry) => entry.score)) - Math.min(...recent.map((entry) => entry.score))
      : 0;

  let score = 0.18;
  score += Math.min(entries.length, 6) * 0.08;
  score += daysSinceLast <= 10 ? 0.16 : daysSinceLast <= 21 ? 0.1 : 0.04;
  score += scoreSpread <= 8 ? 0.14 : scoreSpread <= 18 ? 0.08 : 0.04;

  const normalized = clamp(score, 0.18, 0.9);

  if (normalized >= 0.72) {
    return {
      confidence: "high" as RecommendationConfidence,
      confidenceLabel: "High confidence",
    };
  }

  if (normalized >= 0.46) {
    return {
      confidence: "medium" as RecommendationConfidence,
      confidenceLabel: "Medium confidence",
    };
  }

  return {
    confidence: "low" as RecommendationConfidence,
    confidenceLabel: "Low confidence",
  };
}

function getTrendLabel(weeklyE1rmGain: number) {
  if (weeklyE1rmGain >= 1.25) {
    return "Building fast";
  }

  if (weeklyE1rmGain >= 0.45) {
    return "Steady trend";
  }

  return "Slow trend";
}

function buildPrediction(
  config: LiftConfig,
  sessions: WorkoutSession[],
  referenceDate = new Date(),
): StrengthPrediction | null {
  const entries = getLiftEntries(sessions, config.aliases);
  if (entries.length < 3) {
    return null;
  }

  const last = entries[entries.length - 1];
  const recentRepAverage =
    entries.slice(-3).reduce((sum, entry) => sum + entry.reps, 0) / Math.min(entries.length, 3);
  const projectedReps = Math.max(5, Math.round((recentRepAverage + config.projectedRepTarget) / 2));
  const lastEstimatedOneRepMax = getEstimatedOneRepMax(last.weight, last.reps);
  const weeklyE1rmGain = getWeightedWeeklyE1rmGain(entries, config.maxWeeklyIncreaseKg);
  const projectedEstimatedOneRepMax = lastEstimatedOneRepMax + weeklyE1rmGain * 8;
  const projectedWeight = projectedEstimatedOneRepMax / (1 + projectedReps / 30);
  const bestEntry = entries.reduce((top, entry) => (entry.score > top.score ? entry : top), entries[0]);
  const { confidence, confidenceLabel } = getPredictionConfidence(entries, referenceDate);
  const trendLabel = getTrendLabel(weeklyE1rmGain);
  const note =
    weeklyE1rmGain >= 0.45
      ? `Recent estimated strength is climbing cleanly from ${formatProjection(last.weight, last.reps)}.`
      : `Recent estimated strength is steady, so this outlook is a smaller nudge than a big leap.`;

  return {
    exerciseName: config.label,
    currentBest: `${roundToNearestHalf(bestEntry.weight)}kg x ${bestEntry.reps}`,
    projectedPerformance: formatProjection(projectedWeight, projectedReps),
    note,
    confidence,
    confidenceLabel,
    trendLabel,
  };
}

export function getStrengthPredictions(userId: UserId, sessions: WorkoutSession[], referenceDate = new Date()) {
  return trackedLiftsByUser[userId]
    .map((config) => buildPrediction(config, sessions, referenceDate))
    .filter((prediction): prediction is StrengthPrediction => Boolean(prediction))
    .slice(0, 3);
}
