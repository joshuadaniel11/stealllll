import type { StrengthPrediction, UserId, WorkoutSession } from "@/lib/types";

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

const roundToNearestHalf = (value: number) => Math.round(value * 2) / 2;

const formatProjection = (weight: number, reps: number) => `${roundToNearestHalf(weight)}kg x ${reps}`;
const getEstimatedOneRepMax = (weight: number, reps: number) => weight * (1 + reps / 30);
const millisecondsPerWeek = 604_800_000;

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

  const cappedWeeklyE1rmGain = Math.max(
    0,
    Math.min(weightedAverage, maxWeeklyIncreaseKg * 1.35),
  );

  return cappedWeeklyE1rmGain;
}

function buildPrediction(config: LiftConfig, sessions: WorkoutSession[]): StrengthPrediction | null {
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

  return {
    exerciseName: config.label,
    currentBest: `${roundToNearestHalf(bestEntry.weight)}kg x ${bestEntry.reps}`,
    projectedPerformance: formatProjection(projectedWeight, projectedReps),
    note: "Based on recent estimated strength trend",
  };
}

export function getStrengthPredictions(userId: UserId, sessions: WorkoutSession[]) {
  return trackedLiftsByUser[userId]
    .map((config) => buildPrediction(config, sessions))
    .filter((prediction): prediction is StrengthPrediction => Boolean(prediction))
    .slice(0, 3);
}
