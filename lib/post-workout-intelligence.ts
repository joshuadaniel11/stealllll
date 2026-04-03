import type { ProfileTrainingState } from "@/lib/profile-training-state";
import { TRAINING_LOAD_ZONE_META, getExerciseMuscleContribution, type TrainingLoadZone } from "@/lib/training-load";
import type { PlateauIntervention, PostWorkoutIntelligenceRecap, PostWorkoutRecapCard, WorkoutSession } from "@/lib/types";

type PostWorkoutRecapSnapshot = Pick<ProfileTrainingState, "trainingLoad" | "progressSignals" | "insights" | "metrics">;

type ZoneImpact = {
  zoneId: TrainingLoadZone;
  label: string;
  rawScore: number;
  coverageBefore: number;
  coverageAfter: number;
  coverageDelta: number;
  effectiveBefore: number;
  effectiveAfter: number;
  effectiveDelta: number;
};

type PlateauCandidate = {
  kind: "detected" | "watch";
  zoneId: TrainingLoadZone;
  label: string;
  plateauConfidence: number;
  weeksFlat: number;
  weeklyCoveragePct: number;
};

function round(value: number, digits = 1) {
  const factor = 10 ** digits;
  return Math.round(value * factor) / factor;
}

function capitalize(value: string) {
  if (!value) {
    return value;
  }

  return `${value[0]!.toUpperCase()}${value.slice(1)}`;
}

function formatSigned(value: number, digits = 1) {
  const rounded = round(value, digits);
  if (rounded > 0) {
    return `+${rounded}`;
  }

  return `${rounded}`;
}

function getPlateauConfidenceLabel(confidence: number) {
  if (confidence >= 80) {
    return "High confidence";
  }

  if (confidence >= 64) {
    return "Medium confidence";
  }

  return "Low confidence";
}

function getToneFromImpact(coverageDelta: number, effectiveDelta: number): PostWorkoutRecapCard["tone"] {
  if (coverageDelta >= 6 || effectiveDelta >= 1.8) {
    return "positive";
  }

  if (coverageDelta <= 0.5 && effectiveDelta <= 0.8) {
    return "neutral";
  }

  return "positive";
}

function getTouchedZoneImpacts(
  session: WorkoutSession,
  beforeState: PostWorkoutRecapSnapshot,
  afterState: PostWorkoutRecapSnapshot,
): ZoneImpact[] {
  const touchedScores = new Map<TrainingLoadZone, number>();

  for (const exercise of session.exercises) {
    const completedSets = exercise.sets.filter((set) => set.completed && (set.reps > 0 || set.weight > 0)).length;
    if (!completedSets) {
      continue;
    }

    for (const [zoneId, weight] of Object.entries(getExerciseMuscleContribution(exercise)) as Array<[TrainingLoadZone, number]>) {
      if (weight <= 0) {
        continue;
      }

      touchedScores.set(zoneId, (touchedScores.get(zoneId) ?? 0) + weight * completedSets);
    }
  }

  return [...touchedScores.entries()]
    .map(([zoneId, rawScore]) => {
      const beforeMetric = beforeState.trainingLoad.metrics.find((metric) => metric.id === zoneId);
      const afterMetric = afterState.trainingLoad.metrics.find((metric) => metric.id === zoneId);

      return {
        zoneId,
        label: TRAINING_LOAD_ZONE_META[zoneId].label,
        rawScore: round(rawScore, 2),
        coverageBefore: beforeMetric?.percentage ?? 0,
        coverageAfter: afterMetric?.percentage ?? 0,
        coverageDelta: round((afterMetric?.percentage ?? 0) - (beforeMetric?.percentage ?? 0), 1),
        effectiveBefore: beforeMetric?.effectiveSets ?? 0,
        effectiveAfter: afterMetric?.effectiveSets ?? 0,
        effectiveDelta: round((afterMetric?.effectiveSets ?? 0) - (beforeMetric?.effectiveSets ?? 0), 1),
      } satisfies ZoneImpact;
    })
    .sort((a, b) => {
      if (b.coverageDelta !== a.coverageDelta) {
        return b.coverageDelta - a.coverageDelta;
      }

      if (b.effectiveDelta !== a.effectiveDelta) {
        return b.effectiveDelta - a.effectiveDelta;
      }

      return b.rawScore - a.rawScore;
    });
}

function getImpactHeadline(impacts: ZoneImpact[], prCount: number) {
  const primaryImpact = impacts[0];
  const supportingImpact = impacts[1];

  if (!primaryImpact) {
    return prCount > 0
      ? `${prCount} PR${prCount === 1 ? "" : "s"} logged.`
      : "Session logged cleanly.";
  }

  if (prCount > 0) {
    return `${prCount} PR${prCount === 1 ? "" : "s"}. ${primaryImpact.label} moved forward.`;
  }

  if (primaryImpact.coverageDelta >= 8) {
    return `${primaryImpact.label} moved the week forward.`;
  }

  if (supportingImpact) {
    return `${primaryImpact.label} and ${supportingImpact.label.toLowerCase()} got the clearest push today.`;
  }

  return `${primaryImpact.label} got the clearest push today.`;
}

function getImpactSummary(
  session: WorkoutSession,
  impacts: ZoneImpact[],
  afterState: PostWorkoutRecapSnapshot,
) {
  const primaryImpact = impacts[0];
  const progressSignal = afterState.insights.progressSignal || afterState.progressSignals.primarySignal.detail;

  if (!primaryImpact) {
    return progressSignal;
  }

  const feelingLine =
    session.feeling === "Strong"
      ? "That session landed with a strong signal."
      : session.feeling === "Tough"
        ? "That session still moved useful work forward under fatigue."
        : "That session kept the week moving cleanly.";
  const coverageLine =
    primaryImpact.coverageDelta > 0
      ? `${primaryImpact.label} coverage is now ${round(primaryImpact.coverageAfter, 1)}% for the week.`
      : `${primaryImpact.label} still got reinforced without muddying the week.`;

  return `${feelingLine} ${coverageLine} ${progressSignal}`;
}

function buildSessionImpactCard(impact: ZoneImpact | undefined): PostWorkoutRecapCard {
  if (!impact) {
    return {
      label: "Session impact",
      value: "Logged cleanly",
      detail: "This session is on the board and ready to shape the next read.",
      tone: "neutral",
    };
  }

  return {
    label: impact.label,
    value:
      impact.coverageDelta > 0.5
        ? `${formatSigned(impact.coverageDelta)}% this week`
        : `${round(impact.effectiveDelta, 1)} load added`,
    detail:
      impact.coverageDelta > 0
        ? `Coverage is now ${round(impact.coverageAfter, 1)}% for the week.`
        : "This was still the clearest push from the session.",
    tone: getToneFromImpact(impact.coverageDelta, impact.effectiveDelta),
  };
}

function buildBodyReadCards(afterState: PostWorkoutRecapSnapshot): PostWorkoutRecapCard[] {
  return [
    {
      label: afterState.progressSignals.primarySignal.title,
      value: afterState.progressSignals.primarySignal.value,
      detail: afterState.progressSignals.primarySignal.detail,
      tone: "neutral",
    },
    {
      label: afterState.progressSignals.supportSignal.title,
      value: afterState.progressSignals.supportSignal.value,
      detail: afterState.progressSignals.supportSignal.detail,
      tone: "neutral",
    },
  ];
}

function getPlateauCandidate(
  afterState: PostWorkoutRecapSnapshot,
  touchedZoneIds: Set<TrainingLoadZone>,
): PlateauCandidate | null {
  const focusZones = new Set(afterState.trainingLoad.summary.suggestedNextFocus.zoneIds);
  const sortedCandidates = Object.values(afterState.metrics.plateauDetection.byRegion).sort((a, b) => {
    const aRelevance = touchedZoneIds.has(a.zoneId) ? 2 : focusZones.has(a.zoneId) ? 1 : 0;
    const bRelevance = touchedZoneIds.has(b.zoneId) ? 2 : focusZones.has(b.zoneId) ? 1 : 0;

    if (Number(b.plateauDetected) !== Number(a.plateauDetected)) {
      return Number(b.plateauDetected) - Number(a.plateauDetected);
    }

    if (bRelevance !== aRelevance) {
      return bRelevance - aRelevance;
    }

    return b.plateauConfidence - a.plateauConfidence;
  });

  const detected = sortedCandidates.find((candidate) => candidate.plateauDetected);
  if (detected) {
    return {
      kind: "detected",
      zoneId: detected.zoneId,
      label: detected.label,
      plateauConfidence: detected.plateauConfidence,
      weeksFlat: detected.weeksFlat,
      weeklyCoveragePct: detected.weeklyCoveragePct,
    };
  }

  const watch = sortedCandidates.find(
    (candidate) =>
      candidate.weeksFlat >= 1 &&
      candidate.weeklyCoveragePct >= 65 &&
      candidate.plateauConfidence >= 64,
  );

  return watch
    ? {
        kind: "watch",
        zoneId: watch.zoneId,
        label: watch.label,
        plateauConfidence: watch.plateauConfidence,
        weeksFlat: watch.weeksFlat,
        weeklyCoveragePct: watch.weeklyCoveragePct,
      }
    : null;
}

function buildPlateauIntervention(
  candidate: PlateauCandidate | null,
  afterState: PostWorkoutRecapSnapshot,
): PlateauIntervention | null {
  if (!candidate) {
    return null;
  }

  const confidenceLabel = getPlateauConfidenceLabel(candidate.plateauConfidence);
  const mrv = afterState.metrics.mrvEstimator.byRegion[candidate.zoneId];
  const repRangeBias = afterState.metrics.repRangeBias.byRegion[candidate.zoneId];
  const stimulusToFatigue = afterState.metrics.stimulusToFatigueRatio.byRegion[candidate.zoneId] ?? 1;
  const progressVelocity = afterState.metrics.progressVelocity.byRegion[candidate.zoneId] ?? 0;

  let label = "Quality repeat";
  let detail = `${candidate.label} work has been flat for ${candidate.weeksFlat} week${candidate.weeksFlat === 1 ? "" : "s"}.`;
  let intervention = `Keep the lift, repeat the load, and beat last time by 1-2 reps before adding weight.`;

  if (mrv?.nearingMrv || (mrv?.mrvPressure ?? 0) >= 0.95) {
    label = "Volume trim";
    detail = `${candidate.label} work has been flat while fatigue pressure is high.`;
    intervention = `Pull one working set from the next ${candidate.label.toLowerCase()} block and keep the reps cleaner.`;
  } else if (repRangeBias?.bestRespondingRepRange && repRangeBias.confidenceScore >= 55) {
    label = "Rep-range shift";
    detail = `${candidate.label} work looks flat, and your better response has shown up in ${repRangeBias.bestRespondingRepRange}.`;
    intervention = `Move the next ${candidate.label.toLowerCase()} block into ${repRangeBias.bestRespondingRepRange} reps for the next 2 sessions.`;
  } else if (stimulusToFatigue < 0.9) {
    label = "Cleaner variation";
    detail = `${candidate.label} work is creating more fatigue than payoff right now.`;
    intervention = `Swap the main ${candidate.label.toLowerCase()} lift for a more stable variation next time.`;
  } else if (progressVelocity > 0) {
    label = "Rebuild signal";
    detail = `${candidate.label} are worth watching, but the trend is not broken enough to overhaul yet.`;
    intervention = `Keep the next ${candidate.label.toLowerCase()} session tight and avoid extra junk volume.`;
  }

  return {
    title: candidate.kind === "detected" ? `${candidate.label} plateau detected` : `${candidate.label} plateau watch`,
    label,
    confidenceLabel,
    detail: `${detail} ${confidenceLabel}.`,
    intervention,
  };
}

export function buildPostWorkoutIntelligenceRecap(input: {
  completedSession: WorkoutSession;
  beforeState: PostWorkoutRecapSnapshot;
  afterState: PostWorkoutRecapSnapshot;
  prCount?: number;
}): PostWorkoutIntelligenceRecap {
  const impacts = getTouchedZoneImpacts(input.completedSession, input.beforeState, input.afterState);
  const touchedZoneIds = new Set(impacts.map((impact) => impact.zoneId));
  const plateauCandidate = getPlateauCandidate(input.afterState, touchedZoneIds);

  return {
    headline: getImpactHeadline(impacts, input.prCount ?? 0),
    summary: getImpactSummary(input.completedSession, impacts, input.afterState),
    cards: [buildSessionImpactCard(impacts[0]), ...buildBodyReadCards(input.afterState)],
    nextMove: input.afterState.insights.completionNext,
    plateauIntervention: buildPlateauIntervention(plateauCandidate, input.afterState),
  };
}
