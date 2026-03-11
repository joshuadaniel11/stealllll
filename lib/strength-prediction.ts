import type { StrengthPrediction, UserId, WorkoutSession } from "@/lib/types";

type LiftConfig = {
  label: string;
  aliases: string[];
  maxWeeklyIncreaseKg: number;
};

type LiftEntry = {
  date: string;
  weight: number;
  reps: number;
  score: number;
};

const trackedLiftsByUser: Record<UserId, LiftConfig[]> = {
  joshua: [
    { label: "Flat Dumbbell Press", aliases: ["Flat Dumbbell Press", "Bench Press"], maxWeeklyIncreaseKg: 1.5 },
    { label: "Incline Dumbbell Press", aliases: ["Incline Dumbbell Press"], maxWeeklyIncreaseKg: 1.25 },
    { label: "Leg Press", aliases: ["Leg Press"], maxWeeklyIncreaseKg: 7.5 },
    { label: "Neutral-Grip Lat Pulldown", aliases: ["Neutral-Grip Lat Pulldown", "Lat Pulldown"], maxWeeklyIncreaseKg: 2.5 },
    { label: "Machine Shoulder Press", aliases: ["Machine Shoulder Press", "Shoulder Press"], maxWeeklyIncreaseKg: 1.5 },
  ],
  natasha: [
    { label: "Barbell Hip Thrust", aliases: ["Barbell Hip Thrust", "Hip Thrust"], maxWeeklyIncreaseKg: 5 },
    { label: "Leg Press (Glute Bias)", aliases: ["Leg Press (Glute Bias)", "Leg Press"], maxWeeklyIncreaseKg: 7.5 },
    { label: "Wide-Grip Lat Pulldown", aliases: ["Wide-Grip Lat Pulldown", "Lat Pulldown"], maxWeeklyIncreaseKg: 2.5 },
    { label: "Seated Dumbbell Shoulder Press", aliases: ["Seated Dumbbell Shoulder Press", "Shoulder Press"], maxWeeklyIncreaseKg: 1.25 },
    { label: "Smith Machine Squat", aliases: ["Smith Machine Squat"], maxWeeklyIncreaseKg: 2.5 },
  ],
};

const roundToNearestHalf = (value: number) => Math.round(value * 2) / 2;

const formatProjection = (weight: number, reps: number) => `${roundToNearestHalf(weight)}kg x ${reps}`;

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

function buildPrediction(config: LiftConfig, sessions: WorkoutSession[]): StrengthPrediction | null {
  const entries = getLiftEntries(sessions, config.aliases);
  if (entries.length < 3) {
    return null;
  }

  const first = entries[0];
  const last = entries[entries.length - 1];
  const elapsedWeeks = Math.max((+new Date(last.date) - +new Date(first.date)) / 604_800_000, 1);
  const rawWeeklyGain = (last.weight - first.weight) / elapsedWeeks;
  const weeklyGain = Math.max(0, Math.min(rawWeeklyGain, config.maxWeeklyIncreaseKg));
  const projectedWeight = last.weight + weeklyGain * 8;
  const recentRepAverage =
    entries.slice(-3).reduce((sum, entry) => sum + entry.reps, 0) / Math.min(entries.length, 3);
  const projectedReps = Math.max(5, Math.round(recentRepAverage));
  const bestEntry = entries.reduce((top, entry) => (entry.score > top.score ? entry : top), entries[0]);

  return {
    exerciseName: config.label,
    currentBest: `${roundToNearestHalf(bestEntry.weight)}kg x ${bestEntry.reps}`,
    projectedPerformance: formatProjection(projectedWeight, projectedReps),
    note: "Based on recent progress",
  };
}

export function getStrengthPredictions(userId: UserId, sessions: WorkoutSession[]) {
  return trackedLiftsByUser[userId]
    .map((config) => buildPrediction(config, sessions))
    .filter((prediction): prediction is StrengthPrediction => Boolean(prediction))
    .slice(0, 3);
}
