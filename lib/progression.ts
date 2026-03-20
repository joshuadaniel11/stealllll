import type { ExerciseTemplate, SetLog, WorkoutSession } from "@/lib/types";

type PerformanceSummary = {
  lastSession: string;
  bestPerformance: string;
  suggestion: string;
};

const formatSet = (weight: number, reps: number) => `${weight}kg x ${reps}`;
const getSetScore = (weight: number, reps: number) => weight * (1 + reps / 30);

function getTargetRepTop(repRange: string) {
  const matches = repRange.match(/\d+/g);
  if (!matches?.length) {
    return null;
  }
  return Number(matches[matches.length - 1]);
}

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

export function getSuggestedStartingWeight(exercise: ExerciseTemplate, sessions: WorkoutSession[]) {
  const previousSets = getLastExerciseSets(exercise.name, sessions);
  if (!previousSets.length) {
    return null;
  }

  const targetTop = getTargetRepTop(exercise.repRange);
  const lastAverageReps =
    previousSets.reduce((sum, set) => sum + set.reps, 0) / Math.max(previousSets.length, 1);
  const baseWeight = previousSets[0]?.weight ?? previousSets.at(-1)?.weight ?? 0;

  if (!baseWeight) {
    return null;
  }

  let suggestedWeight = baseWeight;
  if (targetTop && lastAverageReps >= targetTop) {
    suggestedWeight += baseWeight >= 40 ? 2.5 : 1.25;
  } else if (targetTop && lastAverageReps + 2 < targetTop) {
    suggestedWeight = Math.max(0, baseWeight - (baseWeight >= 40 ? 2.5 : 1.25));
  }

  return {
    suggestedWeight: Math.round(suggestedWeight * 2) / 2,
    lastWeight: baseWeight,
    lastAverageReps: Math.round(lastAverageReps),
  };
}

export function getPreviousBestScore(exerciseName: string, sessions: WorkoutSession[]) {
  const sets = sessions
    .flatMap((session) =>
      session.exercises
        .filter((exercise) => exercise.exerciseName === exerciseName)
        .flatMap((exercise) => exercise.sets.filter((set) => set.completed && (set.weight > 0 || set.reps > 0))),
    );

  if (!sets.length) {
    return 0;
  }

  return Math.max(...sets.map((set) => getSetScore(set.weight, set.reps)));
}

export function isPersonalBestSet(set: SetLog, previousBestScore: number) {
  if (!set.completed || (set.weight <= 0 && set.reps <= 0)) {
    return false;
  }

  return getSetScore(set.weight, set.reps) > previousBestScore;
}

export function getWorkoutPrSummary(session: WorkoutSession, previousSessions: WorkoutSession[]) {
  const prHits = session.exercises.flatMap((exercise) => {
    const previousBest = getPreviousBestScore(exercise.exerciseName, previousSessions);
    const bestSet = exercise.sets
      .filter((set) => isPersonalBestSet(set, previousBest))
      .sort((a, b) => getSetScore(b.weight, b.reps) - getSetScore(a.weight, a.reps))[0];

    if (!bestSet) {
      return [];
    }

    const priorSets = previousSessions
      .flatMap((priorSession) =>
        priorSession.exercises
          .filter((item) => item.exerciseName === exercise.exerciseName)
          .flatMap((item) => item.sets.filter((set) => set.completed && (set.weight > 0 || set.reps > 0))),
      )
      .sort((a, b) => getSetScore(b.weight, b.reps) - getSetScore(a.weight, a.reps));

    const priorBest = priorSets[0];
    const weightDelta = priorBest ? Math.round((bestSet.weight - priorBest.weight) * 10) / 10 : 0;
    const deltaLabel =
      priorBest && weightDelta > 0
        ? `${exercise.exerciseName} up ${weightDelta}kg`
        : `${exercise.exerciseName} hit a new best`;

    return [deltaLabel];
  });

  return {
    count: prHits.length,
    highlights: prHits.slice(0, 2),
  };
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

  const targetMax = getTargetRepTop(exercise.repRange) ?? Number(exercise.repRange);
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
