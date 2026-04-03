import { getSuggestedStartingWeight } from "@/lib/progression";
import type {
  ActiveWorkout,
  LiveSessionSignal,
  RecommendationConfidence,
  WorkoutPlanDay,
  WorkoutSession,
} from "@/lib/types";

type SessionAutoregulationTone = "positive" | "neutral" | "attention";
type SessionAutoregulationAction = "push" | "hold" | "trim" | "move_on" | "calibrate";

type HistoricalExerciseSession = {
  performedAt: string;
  sets: WorkoutSession["exercises"][number]["sets"];
};

export type SessionAutoregulationRead = {
  action: SessionAutoregulationAction;
  actionLabel: string;
  confidence: RecommendationConfidence;
  confidenceLabel: string;
  tone: SessionAutoregulationTone;
  detail: string;
  nextStep: string;
  evidenceLabel: string;
};

function roundToNearestHalf(value: number) {
  return Math.round(value * 2) / 2;
}

function formatWeight(value: number) {
  return `${roundToNearestHalf(value)}kg`;
}

function getSetScore(weight: number, reps: number) {
  return weight * (1 + reps / 30);
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

function getCompletedSets(sets: WorkoutSession["exercises"][number]["sets"]) {
  return sets.filter((set) => set.completed && (set.weight > 0 || set.reps > 0));
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

function getHistoricalExerciseSessions(exerciseName: string, sessions: WorkoutSession[]) {
  return sessions
    .filter((session) => !session.partial)
    .map((session) => {
      const matchedExercise = session.exercises.find((exercise) => exercise.exerciseName === exerciseName);
      if (!matchedExercise) {
        return null;
      }

      const completedSets = getCompletedSets(matchedExercise.sets);
      if (!completedSets.length) {
        return null;
      }

      return {
        performedAt: session.performedAt,
        sets: completedSets,
      } satisfies HistoricalExerciseSession;
    })
    .filter((entry): entry is HistoricalExerciseSession => Boolean(entry))
    .sort((a, b) => +new Date(b.performedAt) - +new Date(a.performedAt));
}

function getConfidence(
  historyCount: number,
  completedSetCount: number,
  signalType: LiveSessionSignal["signalType"] | null,
): { confidence: RecommendationConfidence; confidenceLabel: string } {
  let score = 0.2;
  score += Math.min(historyCount, 4) * 0.15;
  score += Math.min(completedSetCount, 3) * 0.14;
  score += signalType === "strong_day" || signalType === "bank" ? 0.12 : signalType ? 0.07 : 0;

  if (score >= 0.84) {
    return {
      confidence: "high",
      confidenceLabel: "High confidence",
    };
  }

  if (score >= 0.5) {
    return {
      confidence: "medium",
      confidenceLabel: "Medium confidence",
    };
  }

  return {
    confidence: "low",
    confidenceLabel: "Low confidence",
  };
}

function buildEvidenceLabel({
  historyCount,
  completedSetCount,
  comparisonSet,
  latestSet,
}: {
  historyCount: number;
  completedSetCount: number;
  comparisonSet: WorkoutSession["exercises"][number]["sets"][number] | null;
  latestSet: WorkoutSession["exercises"][number]["sets"][number] | null;
}) {
  if (comparisonSet && latestSet) {
    const currentScore = getSetScore(latestSet.weight, latestSet.reps);
    const priorScore = getSetScore(comparisonSet.weight, comparisonSet.reps);
    const pctDelta = priorScore > 0 ? Math.round(((currentScore - priorScore) / priorScore) * 100) : 0;
    const direction = pctDelta > 0 ? "+" : "";
    return `Set ${completedSetCount} vs last time: ${direction}${pctDelta}%`;
  }

  if (historyCount > 0) {
    return `${historyCount} prior session${historyCount === 1 ? "" : "s"} on this lift`;
  }

  return "Using today's live read";
}

export function buildSessionAutoregulationRead(input: {
  activeWorkout: ActiveWorkout;
  activeWorkoutTemplate?: WorkoutPlanDay;
  currentExerciseIndex: number;
  sessions: WorkoutSession[];
  liveSignal?: LiveSessionSignal | null;
}): SessionAutoregulationRead | null {
  const currentExercise = input.activeWorkout.exercises[input.currentExerciseIndex];
  if (!currentExercise) {
    return null;
  }

  const currentTemplate = input.activeWorkoutTemplate?.exercises[input.currentExerciseIndex];
  const completedSets = getCompletedSets(currentExercise.sets);
  const latestSet = completedSets.at(-1) ?? null;
  const setsRemaining = currentExercise.sets.filter((set) => !set.completed).length;
  const history = getHistoricalExerciseSessions(currentExercise.exerciseName, input.sessions);
  const comparisonSet = latestSet ? history[0]?.sets[completedSets.length - 1] ?? null : null;
  const scopedSignal =
    input.liveSignal && input.liveSignal.targetExercise === currentExercise.exerciseName && !input.liveSignal.dismissedAt
      ? input.liveSignal
      : null;
  const { low: repLow, high: repHigh } = getRepRangeBounds(currentTemplate?.repRange);
  const averageReps =
    completedSets.length > 0
      ? completedSets.reduce((sum, set) => sum + set.reps, 0) / completedSets.length
      : null;
  const { confidence, confidenceLabel } = getConfidence(history.length, completedSets.length, scopedSignal?.signalType ?? null);
  const evidenceLabel = buildEvidenceLabel({
    historyCount: history.length,
    completedSetCount: completedSets.length,
    comparisonSet,
    latestSet,
  });

  if (setsRemaining === 0) {
    return {
      action: "move_on",
      actionLabel: "Move on",
      confidence,
      confidenceLabel,
      tone: "neutral",
      detail: "This lift is already done. Save energy for the next exercise or finish the session cleanly.",
      nextStep: "Leave this one banked and shift forward.",
      evidenceLabel,
    };
  }

  if (!latestSet) {
    const suggestedStart = currentTemplate ? getSuggestedStartingWeight(currentTemplate, input.sessions) : null;
    const suggestedWeight =
      suggestedStart?.suggestedWeight && suggestedStart.suggestedWeight > 0
        ? formatWeight(suggestedStart.suggestedWeight)
        : "a clean opener";

    return {
      action: "calibrate",
      actionLabel: "Calibrate the opener",
      confidence,
      confidenceLabel,
      tone: "neutral",
      detail: `Open around ${suggestedWeight} and let the first set tell the truth before you push or trim anything.`,
      nextStep: "If the first set feels smooth, keep the load. If it feels heavy early, hold the range instead of forcing a jump.",
      evidenceLabel: suggestedStart?.evidenceLabel ?? evidenceLabel,
    };
  }

  const currentScore = getSetScore(latestSet.weight, latestSet.reps);
  const comparisonScore = comparisonSet ? getSetScore(comparisonSet.weight, comparisonSet.reps) : null;
  const outperforming = comparisonScore !== null && currentScore >= comparisonScore * 1.05;
  const underperforming = comparisonScore !== null && currentScore <= comparisonScore * 0.92;
  const atTopRange = repHigh !== null && latestSet.reps >= repHigh - 1;
  const belowFloor = repLow !== null && latestSet.reps < repLow;
  const loadStep = latestSet.weight > 0 ? getLoadStep(latestSet.weight) : 1.25;

  if (scopedSignal?.signalType === "bank" || underperforming || belowFloor) {
    const shouldMoveOn = setsRemaining <= 1 || completedSets.length >= Math.max(currentExercise.sets.length - 1, 1);

    return {
      action: shouldMoveOn ? "move_on" : "trim",
      actionLabel: shouldMoveOn ? "Move on after this set" : "Trim the ambition",
      confidence,
      confidenceLabel,
      tone: "attention",
      detail:
        scopedSignal?.signalType === "bank"
          ? "The session is asking for quality, not heroics. Protect the shape of this lift."
          : "Performance is softer than the last clean reference, so this is a hold-the-standard moment.",
      nextStep: shouldMoveOn
        ? "Count one more clean set if needed, then save your output for the next exercise."
        : `Hold ${formatWeight(latestSet.weight)} or even drop a small step. Do not chase extra load here.`,
      evidenceLabel,
    };
  }

  if (scopedSignal?.signalType === "strong_day" || scopedSignal?.signalType === "push" || scopedSignal?.signalType === "pr_close" || outperforming) {
    const shouldSuggestLoad = atTopRange && latestSet.weight > 0;

    return {
      action: "push",
      actionLabel: shouldSuggestLoad ? `Add ${loadStep}kg only if it stays crisp` : "Take one assertive set",
      confidence,
      confidenceLabel,
      tone: "positive",
      detail:
        scopedSignal?.signalType === "strong_day"
          ? "Today is reading stronger than normal. This is the right moment to press a little harder."
          : "You are ahead of the last clean reference here, so the app is giving you permission to lean in.",
      nextStep: shouldSuggestLoad
        ? `Nudge the next set from ${formatWeight(latestSet.weight)} to ${formatWeight(latestSet.weight + loadStep)} only if form still feels sharp.`
        : "Keep the load honest, hit one more clean set, and reassess after that.",
      evidenceLabel,
    };
  }

  if (setsRemaining <= 1 && averageReps !== null && repLow !== null && averageReps >= repLow) {
    return {
      action: "move_on",
      actionLabel: "Move on after this set",
      confidence,
      confidenceLabel,
      tone: "neutral",
      detail: "You already got enough useful work here. The smarter move is to leave something for the next lift.",
      nextStep: "Finish this one cleanly and carry your energy forward.",
      evidenceLabel,
    };
  }

  return {
    action: "hold",
    actionLabel: "Hold the load and own it",
    confidence,
    confidenceLabel,
    tone: "neutral",
    detail: "Nothing is screaming for a big change here. Stay clean, hit the range, and keep the session moving.",
    nextStep:
      latestSet.weight > 0
        ? `Keep ${formatWeight(latestSet.weight)} steady until the reps look more secure.`
        : "Keep this one controlled and build the pattern before you push.",
    evidenceLabel,
  };
}
