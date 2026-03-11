import type { ExerciseTemplate, SetLog, WorkoutSession } from "@/lib/types";

type PerformanceSummary = {
  lastSession: string;
  bestPerformance: string;
  suggestion: string;
};

const formatSet = (weight: number, reps: number) => `${weight}kg x ${reps}`;

export function getLastExerciseSets(exerciseName: string, sessions: WorkoutSession[]): SetLog[] {
  const lastMatch = sessions
    .flatMap((session) =>
      session.exercises
        .filter((item) => item.exerciseName === exerciseName)
        .map((item) => ({
          performedAt: session.performedAt,
          sets: item.sets.filter((set) => set.completed && set.weight > 0),
        })),
    )
    .filter((item) => item.sets.length > 0)
    .sort((a, b) => +new Date(b.performedAt) - +new Date(a.performedAt))[0];

  return lastMatch?.sets ?? [];
}

export function getExercisePerformance(
  exercise: ExerciseTemplate,
  sessions: WorkoutSession[],
): PerformanceSummary {
  const matching = sessions
    .flatMap((session) =>
      session.exercises
        .filter((item) => item.exerciseName === exercise.name)
        .map((item) => ({
          performedAt: session.performedAt,
          sets: item.sets.filter((set) => set.completed),
        })),
    )
    .filter((item) => item.sets.length > 0)
    .sort((a, b) => +new Date(b.performedAt) - +new Date(a.performedAt));

  if (!matching.length) {
    return {
      lastSession: "No previous session yet",
      bestPerformance: "Set a baseline today",
      suggestion: "Start comfortably and keep 1 to 2 reps in reserve.",
    };
  }

  const last = matching[0];
  const allSets = matching.flatMap((item) => item.sets);
  const best = allSets.reduce((top, current) => {
    const topScore = top.weight * top.reps;
    const currentScore = current.weight * current.reps;
    return currentScore > topScore ? current : top;
  }, allSets[0]);

  const targetMax = Number(exercise.repRange.split("-")[1] ?? exercise.repRange);
  const hitTopRange = last.sets.every((set) => set.reps >= targetMax);
  const averageReps =
    last.sets.reduce((sum, set) => sum + set.reps, 0) / Math.max(last.sets.length, 1);

  let suggestion = "Repeat the same load and tighten form.";
  if (hitTopRange) {
    suggestion = "You hit the target cleanly. Add 2.5kg next session if form stays solid.";
  } else if (averageReps < targetMax - 2) {
    suggestion = "Stay at this load next time and aim to recover 1 to 2 reps per set.";
  } else if (matching.length >= 2) {
    const previousAverage =
      matching[1].sets.reduce((sum, set) => sum + set.reps, 0) /
      Math.max(matching[1].sets.length, 1);
    if (averageReps + 1 < previousAverage) {
      suggestion = "Performance dipped. Consider a small weight reset and sharper technique.";
    }
  }

  return {
    lastSession: last.sets.map((set) => formatSet(set.weight, set.reps)).join(" - "),
    bestPerformance: formatSet(best.weight, best.reps),
    suggestion,
  };
}
