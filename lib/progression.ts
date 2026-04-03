import type { ExerciseTemplate, RecommendationConfidence, SetLog, WorkoutSession } from "@/lib/types";

type PerformanceSummary = {
  lastSession: string;
  bestPerformance: string;
  suggestion: string;
};

type ExerciseHistoryEntry = {
  performedAt: string;
  sets: SetLog[];
  averageReps: number;
  bestSet: SetLog;
  sessionScore: number;
};

type ProgressionAction = "increase" | "repeat" | "reduce" | "baseline";

export type ExerciseProgressionRead = {
  action: ProgressionAction;
  actionLabel: string;
  confidence: RecommendationConfidence;
  confidenceLabel: string;
  reason: string;
  evidenceLabel: string;
  sessionsTracked: number;
  lastSession: string;
  currentBest: string;
  lastWeight: number | null;
  lastAverageReps: number | null;
  recommendedWeight: number | null;
  recommendedRepTarget: number | null;
  projectedPerformance: string | null;
};

const millisecondsPerDay = 86_400_000;

const roundToNearestHalf = (value: number) => Math.round(value * 2) / 2;
const formatSet = (weight: number, reps: number) => `${roundToNearestHalf(weight)}kg x ${reps}`;
const getSetScore = (weight: number, reps: number) => weight * (1 + reps / 30);

function clamp(value: number, min: number, max: number) {
  return Math.min(Math.max(value, min), max);
}

function getRepRangeBounds(repRange?: string) {
  if (!repRange) {
    return { low: null, high: null };
  }

  const matches = repRange.match(/\d+/g)?.map(Number) ?? [];

  if (!matches.length) {
    return { low: null, high: null };
  }

  if (matches.length === 1) {
    return { low: matches[0], high: matches[0] };
  }

  return { low: matches[0], high: matches[matches.length - 1] };
}

function getLoadStep(weight: number) {
  if (weight >= 80) {
    return 5;
  }

  if (weight >= 40) {
    return 2.5;
  }

  return 1.25;
}

export function getSuggestedLoadStep(weight: number) {
  return getLoadStep(weight);
}

function getMatchedExerciseHistory(exerciseName: string, sessions: WorkoutSession[]) {
  return sessions
    .flatMap((session) =>
      session.exercises
        .filter((exercise) => exercise.exerciseName.toLowerCase() === exerciseName.toLowerCase())
        .map((exercise) => {
          const completedSets = exercise.sets.filter((set) => set.completed && set.weight > 0 && set.reps > 0);

          if (!completedSets.length) {
            return null;
          }

          const bestSet = completedSets.reduce((top, current) =>
            getSetScore(current.weight, current.reps) > getSetScore(top.weight, top.reps) ? current : top,
          );
          const averageReps =
            completedSets.reduce((sum, set) => sum + set.reps, 0) / Math.max(completedSets.length, 1);
          const sessionScore = completedSets.reduce(
            (top, set) => Math.max(top, getSetScore(set.weight, set.reps)),
            0,
          );

          return {
            performedAt: session.performedAt,
            sets: completedSets,
            averageReps,
            bestSet,
            sessionScore,
          } satisfies ExerciseHistoryEntry;
        }),
    )
    .filter((entry): entry is ExerciseHistoryEntry => Boolean(entry))
    .sort((a, b) => +new Date(b.performedAt) - +new Date(a.performedAt));
}

function getRecommendationConfidence(
  history: ExerciseHistoryEntry[],
  referenceDate = new Date(),
): { confidence: RecommendationConfidence; confidenceLabel: string } {
  if (!history.length) {
    return {
      confidence: "low",
      confidenceLabel: "Low confidence",
    };
  }

  const recent = history.slice(0, 3);
  const lastEntry = history[0];
  const daysSinceLast = Math.max(
    0,
    Math.round((referenceDate.getTime() - new Date(lastEntry.performedAt).getTime()) / millisecondsPerDay),
  );
  const step = getLoadStep(lastEntry.bestSet.weight);
  const weightSpread =
    recent.length > 1
      ? Math.max(...recent.map((entry) => entry.bestSet.weight)) - Math.min(...recent.map((entry) => entry.bestSet.weight))
      : 0;
  const repSpread =
    recent.length > 1
      ? Math.max(...recent.map((entry) => entry.averageReps)) - Math.min(...recent.map((entry) => entry.averageReps))
      : 0;
  const scoreDeltas = recent
    .slice(0, -1)
    .map((entry, index) => recent[index].sessionScore - recent[index + 1].sessionScore);
  const directionConsistency = scoreDeltas.length
    ? scoreDeltas.filter((delta) => delta >= 0).length / scoreDeltas.length
    : 0.5;

  let score = 0.18;
  score += Math.min(history.length, 5) * 0.08;
  score += daysSinceLast <= 10 ? 0.18 : daysSinceLast <= 21 ? 0.12 : daysSinceLast <= 45 ? 0.06 : 0.02;
  score += weightSpread <= step * 1.5 ? 0.1 : weightSpread <= step * 3 ? 0.05 : 0.02;
  score += repSpread <= 2 ? 0.1 : repSpread <= 4 ? 0.05 : 0.02;
  score += directionConsistency >= 0.66 ? 0.1 : 0.04;

  const normalizedScore = clamp(score, 0.18, 0.92);

  if (normalizedScore >= 0.72) {
    return { confidence: "high", confidenceLabel: "High confidence" };
  }

  if (normalizedScore >= 0.46) {
    return { confidence: "medium", confidenceLabel: "Medium confidence" };
  }

  return { confidence: "low", confidenceLabel: "Low confidence" };
}

function buildEvidenceLabel(history: ExerciseHistoryEntry[], referenceDate = new Date()) {
  if (!history.length) {
    return "No logged history yet";
  }

  const daysSinceLast = Math.max(
    0,
    Math.round((referenceDate.getTime() - new Date(history[0].performedAt).getTime()) / millisecondsPerDay),
  );

  if (daysSinceLast === 0) {
    return `${history.length} logged session${history.length === 1 ? "" : "s"} | last trained today`;
  }

  if (daysSinceLast === 1) {
    return `${history.length} logged session${history.length === 1 ? "" : "s"} | last trained yesterday`;
  }

  return `${history.length} logged session${history.length === 1 ? "" : "s"} | last trained ${daysSinceLast}d ago`;
}

function buildExerciseProgressionRead(
  exercise: ExerciseTemplate,
  sessions: WorkoutSession[],
  referenceDate = new Date(),
): ExerciseProgressionRead {
  const history = getMatchedExerciseHistory(exercise.name, sessions);
  const { low: repLow, high: repHigh } = getRepRangeBounds(exercise.repRange);
  const repTarget = exercise.suggestedRepTarget ?? repLow ?? repHigh ?? null;
  const lastEntry = history[0];
  const previousEntry = history[1];

  if (!lastEntry) {
    const baselineReason = exercise.progressionNote
      ? `${exercise.progressionNote} Start with a comfortable baseline and leave one to two reps in reserve.`
      : "Start with a comfortable baseline and leave one to two reps in reserve.";

    return {
      action: "baseline",
      actionLabel: "Build a baseline",
      confidence: "low",
      confidenceLabel: "Low confidence",
      reason: baselineReason,
      evidenceLabel: "No logged history yet",
      sessionsTracked: 0,
      lastSession: "No previous session yet",
      currentBest: "Set a baseline today",
      lastWeight: null,
      lastAverageReps: null,
      recommendedWeight: null,
      recommendedRepTarget: repTarget,
      projectedPerformance: null,
    };
  }

  const { confidence, confidenceLabel } = getRecommendationConfidence(history, referenceDate);
  const currentBestEntry = history.reduce((top, entry) => (entry.sessionScore > top.sessionScore ? entry : top), history[0]);
  const step = getLoadStep(lastEntry.bestSet.weight);
  const roundedAverageReps = Math.round(lastEntry.averageReps);
  const clearlyAtTopRange = repHigh !== null && lastEntry.averageReps >= repHigh - 0.25;
  const underRepFloor = repLow !== null && lastEntry.averageReps < repLow - 1.25;
  const dippedFromPrevious =
    previousEntry && lastEntry.averageReps + 1 < previousEntry.averageReps && lastEntry.bestSet.weight >= previousEntry.bestSet.weight;
  const canReset = lastEntry.bestSet.weight > step;

  let action: ProgressionAction = "repeat";
  let actionLabel = "Hold and own it";
  let recommendedWeight = roundToNearestHalf(lastEntry.bestSet.weight);
  let reason = "Stay here and chase cleaner reps before adding load.";

  if (clearlyAtTopRange) {
    action = "increase";
    actionLabel = `Add ${step}kg next time`;
    recommendedWeight = roundToNearestHalf(lastEntry.bestSet.weight + step);
    reason = `You are finishing around the top of ${exercise.repRange}, so the next session can climb one clean step.`;
  } else if ((underRepFloor || dippedFromPrevious) && canReset) {
    action = "reduce";
    actionLabel = `Reset by ${step}kg`;
    recommendedWeight = roundToNearestHalf(Math.max(0, lastEntry.bestSet.weight - step));
    reason = repLow !== null && underRepFloor
      ? `Recent reps are landing below the floor of ${exercise.repRange}, so a small reset should bring quality back.`
      : "Recent performance dipped at this load, so a small reset should restore clean reps.";
  }

  if (exercise.progressionNote) {
    reason = `${reason} ${exercise.progressionNote}`;
  }

  const projectedPerformance =
    recommendedWeight > 0 && repTarget
      ? formatSet(recommendedWeight, repTarget)
      : recommendedWeight > 0
        ? formatSet(recommendedWeight, roundedAverageReps)
        : null;

  return {
    action,
    actionLabel,
    confidence,
    confidenceLabel,
    reason,
    evidenceLabel: buildEvidenceLabel(history, referenceDate),
    sessionsTracked: history.length,
    lastSession: lastEntry.sets.map((set) => formatSet(set.weight, set.reps)).join(" - "),
    currentBest: formatSet(currentBestEntry.bestSet.weight, currentBestEntry.bestSet.reps),
    lastWeight: roundToNearestHalf(lastEntry.bestSet.weight),
    lastAverageReps: roundedAverageReps,
    recommendedWeight,
    recommendedRepTarget: repTarget,
    projectedPerformance,
  };
}

export function getExerciseProgressionRead(
  exercise: ExerciseTemplate,
  sessions: WorkoutSession[],
  referenceDate = new Date(),
) {
  return buildExerciseProgressionRead(exercise, sessions, referenceDate);
}

export function getLastExerciseSets(exerciseName: string, sessions: WorkoutSession[]): SetLog[] {
  return getMatchedExerciseHistory(exerciseName, sessions)[0]?.sets ?? [];
}

export function getSuggestedStartingWeight(
  exercise: ExerciseTemplate,
  sessions: WorkoutSession[],
  referenceDate = new Date(),
) {
  const read = buildExerciseProgressionRead(exercise, sessions, referenceDate);

  if (read.recommendedWeight === null || read.lastWeight === null || read.lastAverageReps === null) {
    return null;
  }

  return {
    suggestedWeight: read.recommendedWeight,
    lastWeight: read.lastWeight,
    lastAverageReps: read.lastAverageReps,
    action: read.action,
    actionLabel: read.actionLabel,
    confidence: read.confidence,
    confidenceLabel: read.confidenceLabel,
    reason: read.reason,
    evidenceLabel: read.evidenceLabel,
    projectedPerformance: read.projectedPerformance,
    sessionsTracked: read.sessionsTracked,
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
  referenceDate = new Date(),
): PerformanceSummary {
  const read = buildExerciseProgressionRead(exercise, sessions, referenceDate);

  let suggestion = read.reason;

  if (read.projectedPerformance) {
    suggestion = `${read.actionLabel}. ${read.projectedPerformance} is the next clean target. ${read.confidenceLabel}.`;
  } else {
    suggestion = `${read.actionLabel}. ${read.reason}`;
  }

  return {
    lastSession: read.lastSession,
    bestPerformance: read.currentBest,
    suggestion,
  };
}
