import { normalizeExerciseName } from "@/lib/exercise-data";
import {
  TRAINING_LOAD_ZONE_META,
  getCurrentWeekSessions,
  getCurrentWeekWindow,
  getExerciseMuscleContribution,
  getProfilePriorityZones,
  type NextWorkoutFocus,
  type TrainingLoadZone,
  type WeeklyTrainingLoad,
} from "@/lib/training-load";
import type { ExerciseLibraryItem, Profile, SetLog, WorkoutSession, WorkoutSessionExercise } from "@/lib/types";

type ExerciseWindowAggregate = {
  bestEstimated1RM: number;
  evsTotal: number;
  repsByWeight: Map<number, number>;
  regionEvs: Partial<Record<TrainingLoadZone, number>>;
};

export type EffectiveVolumeScoreMetric = {
  total: number;
  priorityTotal: number;
  byRegion: Record<TrainingLoadZone, number>;
  byExercise: Array<{
    exerciseName: string;
    score: number;
  }>;
};

export type WeeklyCoverageMetric = {
  averagePct: number;
  priorityAveragePct: number;
  coveredPriorityRegions: number;
  byRegion: Record<TrainingLoadZone, number>;
};

export type RecoveryIndexMetric = {
  score: number;
  acuteChronicRatio: number;
  rolling3dLoad: number;
  rolling7dLoad: number;
  rolling28dLoad: number;
  restPenalty: number;
  completionPenalty: number;
  completionPct7d: number;
  hadRestDayInLast3Days: boolean;
  hadRestDayInLast4Days: boolean;
};

export type ProgressVelocityMetric = {
  average: number;
  byRegion: Record<TrainingLoadZone, number>;
  leaders: Array<{
    zoneId: TrainingLoadZone;
    label: string;
    score: number;
  }>;
  laggards: Array<{
    zoneId: TrainingLoadZone;
    label: string;
    score: number;
  }>;
};

export type StimulusToFatigueMetric = {
  average: number;
  byRegion: Record<TrainingLoadZone, number>;
  byExercise: Array<{
    exerciseName: string;
    stimulusScore: number;
    fatigueScore: number;
    sfr: number;
  }>;
};

export type DensityScoreMetric = {
  average: number;
  bySession: Array<{
    sessionId: string;
    workoutName: string;
    density: number;
    evs: number;
    durationMinutes: number;
  }>;
};

export type AdaptationScoreMetric = {
  average: number;
  byRegion: Record<TrainingLoadZone, number>;
  exposuresByExercise: Array<{
    exerciseName: string;
    sessionsUsedLast42d: number;
    noveltyFactor: number;
  }>;
};

export type ConsistencyScoreMetric = {
  score: number;
  scheduledSessionsCompleted28d: number;
  streakFactor: number;
  onTimeCompletionFactor: number;
};

export type SymmetryScoreMetric = {
  score: number;
  comparedRegions: Array<{
    zoneId: TrainingLoadZone;
    label: string;
    coveragePct: number;
    weight: number;
  }>;
};

export type RirQualityRegionMetric = {
  zoneId: TrainingLoadZone;
  label: string;
  averageRir: number;
  rirStdDev: number;
  rirConsistencyScore: number;
  sandbagRisk: number;
  overshootRisk: number;
  confidenceScore: number;
  missingRirRatio: number;
  sampleCount: number;
};

export type RirIntelligenceMetric = {
  averageConsistencyScore: number;
  byRegion: Record<TrainingLoadZone, RirQualityRegionMetric>;
};

export type MevStatus = "below" | "at" | "above";

export type MevRegionMetric = {
  zoneId: TrainingLoadZone;
  label: string;
  baseMev: number;
  priorityMultiplier: number;
  recoveryModifier: number;
  mevEstimate: number;
  currentEvs: number;
  status: MevStatus;
};

export type MevTrackerMetric = {
  byRegion: Record<TrainingLoadZone, MevRegionMetric>;
};

export type PlateauRegionMetric = {
  zoneId: TrainingLoadZone;
  label: string;
  plateauDetected: boolean;
  plateauConfidence: number;
  weeksFlat: number;
  adherence: number;
  weeklyCoveragePct: number;
  currentWeekProgress: number;
  previousWeekProgress: number;
};

export type PlateauDetectionMetric = {
  byRegion: Record<TrainingLoadZone, PlateauRegionMetric>;
};

export type Phase1TrainingInsights = {
  primaryInsight: string | null;
  recoveryInsight: string | null;
  progressInsight: string | null;
};

export type RegionTrainingMetric = {
  zoneId: TrainingLoadZone;
  label: string;
  evs: number;
  baseTargetEVS: number;
  priorityMultiplier: number;
  recoveryModifier: number;
  targetEVS: number;
  coveragePct: number;
  progressVelocity: number;
  stimulusToFatigueRatio: number;
};

export type ProfileTrainingMetrics = {
  effectiveVolumeScore: EffectiveVolumeScoreMetric;
  weeklyCoverage: WeeklyCoverageMetric;
  recoveryIndex: RecoveryIndexMetric;
  progressVelocity: ProgressVelocityMetric;
  stimulusToFatigueRatio: StimulusToFatigueMetric;
  densityScore: DensityScoreMetric;
  adaptationScore: AdaptationScoreMetric;
  consistencyScore: ConsistencyScoreMetric;
  symmetryScore: SymmetryScoreMetric;
  rirIntelligence: RirIntelligenceMetric;
  mevTracker: MevTrackerMetric;
  plateauDetection: PlateauDetectionMetric;
  phase1Insights: Phase1TrainingInsights;
  regionMetrics: RegionTrainingMetric[];
};

type NextFocusCandidate = {
  zoneId: TrainingLoadZone;
  label: string;
  score: number;
  coveragePct: number;
  evs: number;
  targetEVS: number;
  progressVelocity: number;
  stimulusToFatigueRatio: number;
  priorityMultiplier: number;
  stablePriorityIndex: number;
};

const PROFILE_PRIORITY_MULTIPLIERS: Record<string, Partial<Record<TrainingLoadZone, number>>> = {
  joshua: {
    upperChest: 1.3,
    midChest: 1.05,
    sideDelts: 1.25,
    rearDelts: 1.15,
    lats: 1.2,
    upperAbs: 1.1,
    lowerAbs: 1.1,
    biceps: 1.1,
    triceps: 1.1,
  },
  natasha: {
    upperGlutes: 1.3,
    gluteMax: 1.25,
    sideGlutes: 1.2,
    lats: 1.1,
    upperBack: 1.15,
    lowerAbs: 1.05,
    obliques: 1.05,
    sideDelts: 1.05,
  },
};

const PHASE1_MEV_BASE_FACTOR = 0.72;

function clamp(value: number, min: number, max: number) {
  return Math.min(max, Math.max(min, value));
}

function round(value: number, digits = 2) {
  const factor = 10 ** digits;
  return Math.round(value * factor) / factor;
}

function average(values: number[]) {
  if (!values.length) {
    return 0;
  }

  return values.reduce((sum, value) => sum + value, 0) / values.length;
}

function standardDeviation(values: number[]) {
  if (values.length <= 1) {
    return 0;
  }

  const mean = average(values);
  const variance = average(values.map((value) => (value - mean) ** 2));
  return Math.sqrt(variance);
}

function getPriorityMultiplier(profile: Profile, zoneId: TrainingLoadZone) {
  return PROFILE_PRIORITY_MULTIPLIERS[profile.id]?.[zoneId] ?? 1;
}

function getStablePriorityIndex(profile: Profile, zoneId: TrainingLoadZone) {
  const index = getProfilePriorityZones(profile.id).indexOf(zoneId);
  return index === -1 ? Number.MAX_SAFE_INTEGER : index;
}

function buildZoneNumberRecord(initial = 0) {
  return (Object.keys(TRAINING_LOAD_ZONE_META) as TrainingLoadZone[]).reduce<Record<TrainingLoadZone, number>>(
    (accumulator, zoneId) => {
      accumulator[zoneId] = initial;
      return accumulator;
    },
    {} as Record<TrainingLoadZone, number>,
  );
}

function getSetRIR(set: SetLog) {
  const rir = (set as SetLog & { rir?: number }).rir;
  return typeof rir === "number" ? clamp(rir, 0, 6) : 3;
}

function getEffectiveRepsFactor(rir: number) {
  if (rir <= 1) return 1;
  if (rir === 2) return 0.92;
  if (rir === 3) return 0.8;
  if (rir === 4) return 0.65;
  return 0.45;
}

function getLoadFactor(reps: number) {
  if (reps < 5) return 0.9;
  if (reps <= 9) return 1;
  if (reps <= 15) return 0.96;
  if (reps <= 20) return 0.9;
  return 0.82;
}

function getNoveltyFactor(exposureScore: number) {
  if (exposureScore <= 4) return 1;
  if (exposureScore <= 8) return 0.95;
  if (exposureScore <= 12) return 0.9;
  return 0.85;
}

function getRoundedWeight(weight: number) {
  return Math.round(weight * 2) / 2;
}

function inferSessionRPE(session: WorkoutSession) {
  const explicit = (session as WorkoutSession & { sessionRpe?: number }).sessionRpe;
  if (typeof explicit === "number") {
    return clamp(explicit, 4, 10);
  }

  switch (session.feeling) {
    case "Strong":
      return 8;
    case "Tough":
      return 8.8;
    case "Solid":
    default:
      return 7.3;
  }
}

function getLibraryLookups(exerciseLibrary: ExerciseLibraryItem[]) {
  const byId = new Map(exerciseLibrary.map((item) => [item.id, item]));
  const byName = new Map(exerciseLibrary.map((item) => [normalizeExerciseName(item.name), item]));
  return { byId, byName };
}

function resolveLibraryItem(
  exercise: WorkoutSessionExercise,
  lookup: ReturnType<typeof getLibraryLookups>,
) {
  return lookup.byId.get(exercise.exerciseId) ?? lookup.byName.get(normalizeExerciseName(exercise.exerciseName)) ?? null;
}

function normalizeZoneContribution(contribution: Partial<Record<TrainingLoadZone, number>>) {
  const entries = (Object.entries(contribution) as Array<[TrainingLoadZone, number]>).filter(([, value]) => value > 0);
  const total = entries.reduce((sum, [, value]) => sum + value, 0);

  if (!total) {
    return [] as Array<[TrainingLoadZone, number]>;
  }

  return entries.map(([zoneId, value]) => [zoneId, value / total] as [TrainingLoadZone, number]);
}

function getExerciseClassification(exerciseName: string, equipment?: string | null) {
  const name = normalizeExerciseName(exerciseName);
  const equipmentName = normalizeExerciseName(equipment ?? "");

  const isolationLike =
    /curl|extension|pushdown|kickback|raise|fly|pec deck|woodchop|wood chop|crunch|leg extension|leg curl|calf raise/.test(name);
  const stableMachineLike = /machine|cable|smith|pec deck|lat pulldown|leg press|seated/.test(name) || /machine|cable|smith/.test(equipmentName);
  const dumbbellCompoundLike = /dumbbell press|dumbbell row|walking lunge|reverse lunge|split squat|step-up|step up|shoulder press/.test(name);
  const axialLoadingCompoundLike = /squat|deadlift|romanian deadlift|rdl|barbell row|hack squat|pendulum squat/.test(name);
  const freeWeightCompoundLike = /barbell|dumbbell|kettlebell/.test(name) || /barbell|dumbbell|kettlebell/.test(equipmentName);

  const stabilityFactor = stableMachineLike || isolationLike ? 1 : dumbbellCompoundLike ? 0.95 : 0.9;
  const fatigueFactor = axialLoadingCompoundLike
    ? 1.3
    : freeWeightCompoundLike && !stableMachineLike && !isolationLike
      ? 1.15
      : stableMachineLike && !isolationLike
        ? 1
        : 0.85;

  return {
    stabilityFactor,
    fatigueFactor,
  };
}

function getDensityPenalty(session: WorkoutSession) {
  const completedSets = session.exercises.reduce(
    (sum, exercise) => sum + exercise.sets.filter((set) => set.completed).length,
    0,
  );
  if (!completedSets) {
    return 1;
  }

  const minutesPerSet = session.durationMinutes / completedSets;
  if (minutesPerSet <= 1.2) return 1.16;
  if (minutesPerSet <= 1.8) return 1.08;
  if (minutesPerSet <= 2.5) return 1;
  return 0.94;
}

function getFailurePenalty(avgRIR: number) {
  if (avgRIR <= 0) return 1.15;
  if (avgRIR <= 1) return 1.08;
  if (avgRIR >= 4) return 0.95;
  return 1;
}

function getEstimatedOneRepMax(weight: number, reps: number) {
  return weight * (1 + reps / 30);
}

function getPctChange(current: number, baseline: number) {
  if (baseline <= 0 || current <= 0) {
    return 0;
  }
  return clamp(((current - baseline) / baseline) * 100, -100, 200);
}

function getBestRepsAtFixedLoadChange(
  current: ExerciseWindowAggregate,
  baseline: ExerciseWindowAggregate,
) {
  const sharedWeights = [...current.repsByWeight.keys()].filter((weight) => baseline.repsByWeight.has(weight)).sort((a, b) => b - a);
  if (!sharedWeights.length) {
    return 0;
  }

  const selectedWeight = sharedWeights[0]!;
  return getPctChange(current.repsByWeight.get(selectedWeight) ?? 0, baseline.repsByWeight.get(selectedWeight) ?? 0);
}

function getWindowRange(referenceDate: Date, daysBack: number, offsetDays = 0) {
  const end = new Date(referenceDate);
  end.setHours(23, 59, 59, 999);
  end.setDate(end.getDate() - offsetDays);

  const start = new Date(end);
  start.setDate(start.getDate() - (daysBack - 1));
  start.setHours(0, 0, 0, 0);

  return { start, end };
}

function isWithinRange(performedAt: string, range: { start: Date; end: Date }) {
  const date = new Date(performedAt);
  return date >= range.start && date <= range.end;
}

function aggregateExerciseWindow(
  sessions: WorkoutSession[],
  exerciseLibrary: ExerciseLibraryItem[],
  range: { start: Date; end: Date },
) {
  const lookup = getLibraryLookups(exerciseLibrary);
  const byExercise = new Map<string, ExerciseWindowAggregate>();

  for (const session of sessions) {
    if (!isWithinRange(session.performedAt, range)) {
      continue;
    }

    for (const exercise of session.exercises) {
      const completedSets = exercise.sets.filter((set) => set.completed);
      if (!completedSets.length) {
        continue;
      }

      const libraryItem = resolveLibraryItem(exercise, lookup);
      const contribution = normalizeZoneContribution(getExerciseMuscleContribution(exercise));
      const classification = getExerciseClassification(exercise.exerciseName, libraryItem?.equipment);
      const key = normalizeExerciseName(exercise.exerciseName);
      const aggregate = byExercise.get(key) ?? {
        bestEstimated1RM: 0,
        evsTotal: 0,
        repsByWeight: new Map<number, number>(),
        regionEvs: {},
      };

      for (const set of completedSets) {
        const setEvs =
          getEffectiveRepsFactor(getSetRIR(set)) *
          getLoadFactor(set.reps) *
          classification.stabilityFactor;

        aggregate.evsTotal += setEvs;
        aggregate.bestEstimated1RM = Math.max(aggregate.bestEstimated1RM, getEstimatedOneRepMax(set.weight, set.reps));
        const roundedWeight = getRoundedWeight(set.weight);
        aggregate.repsByWeight.set(roundedWeight, Math.max(aggregate.repsByWeight.get(roundedWeight) ?? 0, set.reps));

        for (const [zoneId, allocation] of contribution) {
          aggregate.regionEvs[zoneId] = (aggregate.regionEvs[zoneId] ?? 0) + setEvs * allocation;
        }
      }

      byExercise.set(key, aggregate);
    }
  }

  return byExercise;
}

function toLocalDayKey(value: Date | string) {
  const date = new Date(value);
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function getWorkoutStreak(sessions: WorkoutSession[], referenceDate = new Date()) {
  const uniqueDays = Array.from(new Set(sessions.map((session) => new Date(session.performedAt).toDateString())));
  if (!uniqueDays.length) {
    return 0;
  }

  let streak = 0;
  const cursor = new Date(referenceDate);
  while (true) {
    if (uniqueDays.includes(cursor.toDateString())) {
      streak += 1;
      cursor.setDate(cursor.getDate() - 1);
      continue;
    }

    if (streak === 0) {
      cursor.setDate(cursor.getDate() - 1);
      if (uniqueDays.includes(cursor.toDateString())) {
        streak += 1;
        cursor.setDate(cursor.getDate() - 1);
        continue;
      }
    }
    break;
  }

  return streak;
}

function getCompletionPctLast7Days(profile: Profile, sessions: WorkoutSession[], referenceDate: Date) {
  const range = getWindowRange(referenceDate, 7);
  const targetSessions = Math.max(1, Math.min(profile.workoutPlan.length, 4));
  const completedEquivalents = sessions.reduce((sum, session) => {
    if (!isWithinRange(session.performedAt, range)) {
      return sum;
    }
    return sum + (session.partial ? 0.5 : 1);
  }, 0);

  return clamp(completedEquivalents / targetSessions, 0, 1);
}

function buildRecoveryIndex(profile: Profile, sessions: WorkoutSession[], referenceDate: Date): RecoveryIndexMetric {
  const rolling3dRange = getWindowRange(referenceDate, 3);
  const rolling7dRange = getWindowRange(referenceDate, 7);
  const rolling28dRange = getWindowRange(referenceDate, 28);

  const getSessionLoad = (session: WorkoutSession) => inferSessionRPE(session) * session.durationMinutes;

  const rolling3dLoad = round(
    sessions.filter((session) => isWithinRange(session.performedAt, rolling3dRange)).reduce((sum, session) => sum + getSessionLoad(session), 0),
  );
  const rolling7dLoad = round(
    sessions.filter((session) => isWithinRange(session.performedAt, rolling7dRange)).reduce((sum, session) => sum + getSessionLoad(session), 0),
  );
  const rolling28dLoad = round(
    sessions.filter((session) => isWithinRange(session.performedAt, rolling28dRange)).reduce((sum, session) => sum + getSessionLoad(session), 0),
  );

  const acuteChronicRatio = round(rolling7dLoad / Math.max(rolling28dLoad / 4, 1), 3);
  const dayKeysWithWork = new Set(
    sessions
      .filter((session) => isWithinRange(session.performedAt, getWindowRange(referenceDate, 4)))
      .map((session) => toLocalDayKey(session.performedAt)),
  );
  const last3Days = Array.from({ length: 3 }, (_, index) => {
    const date = new Date(referenceDate);
    date.setDate(date.getDate() - index);
    return toLocalDayKey(date);
  });
  const last4Days = Array.from({ length: 4 }, (_, index) => {
    const date = new Date(referenceDate);
    date.setDate(date.getDate() - index);
    return toLocalDayKey(date);
  });

  const hadRestDayInLast3Days = last3Days.some((dayKey) => !dayKeysWithWork.has(dayKey));
  const hadRestDayInLast4Days = last4Days.some((dayKey) => !dayKeysWithWork.has(dayKey));
  const restPenalty = hadRestDayInLast3Days ? 0 : hadRestDayInLast4Days ? 8 : 15;

  const completionPct7d = getCompletionPctLast7Days(profile, sessions, referenceDate);
  const completionPenalty =
    completionPct7d >= 0.8 ? 0 : completionPct7d >= 0.5 ? 5 : rolling3dLoad > 0 ? 10 : 0;

  const rawScore =
    100 -
    Math.min(acuteChronicRatio * 18, 35) -
    Math.min(rolling3dLoad / 60, 25) -
    restPenalty -
    completionPenalty;

  return {
    score: clamp(Math.round(rawScore), 0, 100),
    acuteChronicRatio,
    rolling3dLoad,
    rolling7dLoad,
    rolling28dLoad,
    restPenalty,
    completionPenalty,
    completionPct7d: round(completionPct7d, 2),
    hadRestDayInLast3Days,
    hadRestDayInLast4Days,
  };
}

function buildDensityScore(
  sessions: WorkoutSession[],
  exerciseLibrary: ExerciseLibraryItem[],
  referenceDate: Date,
): DensityScoreMetric {
  const lookup = getLibraryLookups(exerciseLibrary);
  const range = getWindowRange(referenceDate, 28);
  const bySession = sessions
    .filter((session) => isWithinRange(session.performedAt, range))
    .map((session) => {
      let totalSessionEvs = 0;

      for (const exercise of session.exercises) {
        const completedSets = exercise.sets.filter((set) => set.completed);
        if (!completedSets.length) {
          continue;
        }

        const libraryItem = resolveLibraryItem(exercise, lookup);
        const classification = getExerciseClassification(exercise.exerciseName, libraryItem?.equipment);

        for (const set of completedSets) {
          totalSessionEvs += getEffectiveRepsFactor(getSetRIR(set)) * getLoadFactor(set.reps) * classification.stabilityFactor;
        }
      }

      return {
        sessionId: session.id,
        workoutName: session.workoutName,
        density: round(totalSessionEvs / Math.max(session.durationMinutes, 1), 3),
        evs: round(totalSessionEvs, 2),
        durationMinutes: session.durationMinutes,
      };
    })
    .filter((entry) => entry.evs > 0)
    .sort((a, b) => +new Date(sessions.find((session) => session.id === b.sessionId)?.performedAt ?? 0) - +new Date(sessions.find((session) => session.id === a.sessionId)?.performedAt ?? 0));

  return {
    average: round(average(bySession.map((entry) => entry.density)), 3),
    bySession,
  };
}

function buildAdaptationScore(
  sessions: WorkoutSession[],
  exerciseLibrary: ExerciseLibraryItem[],
  referenceDate: Date,
): AdaptationScoreMetric {
  const lookup = getLibraryLookups(exerciseLibrary);
  const range = getWindowRange(referenceDate, 42);
  const exposureCounts = new Map<string, { exerciseName: string; count: number }>();
  const regionNoveltyWeights = buildZoneNumberRecord();
  const regionNoveltyTotals = buildZoneNumberRecord();

  for (const session of sessions) {
    if (!isWithinRange(session.performedAt, range)) {
      continue;
    }

    const seenExercises = new Set<string>();
    for (const exercise of session.exercises) {
      const key = normalizeExerciseName(exercise.exerciseName);
      if (seenExercises.has(key)) {
        continue;
      }
      seenExercises.add(key);
      const record = exposureCounts.get(key) ?? { exerciseName: exercise.exerciseName, count: 0 };
      record.count += 1;
      exposureCounts.set(key, record);
    }
  }

  for (const session of sessions) {
    if (!isWithinRange(session.performedAt, range)) {
      continue;
    }

    for (const exercise of session.exercises) {
      const completedSets = exercise.sets.filter((set) => set.completed);
      if (!completedSets.length) {
        continue;
      }

      const key = normalizeExerciseName(exercise.exerciseName);
      const exposureScore = exposureCounts.get(key)?.count ?? 0;
      const noveltyFactor = getNoveltyFactor(exposureScore);
      const libraryItem = resolveLibraryItem(exercise, lookup);
      const classification = getExerciseClassification(exercise.exerciseName, libraryItem?.equipment);
      const contribution = normalizeZoneContribution(getExerciseMuscleContribution(exercise));

      let exerciseEvs = 0;
      for (const set of completedSets) {
        exerciseEvs += getEffectiveRepsFactor(getSetRIR(set)) * getLoadFactor(set.reps) * classification.stabilityFactor;
      }

      for (const [zoneId, allocation] of contribution) {
        const weightedEvs = exerciseEvs * allocation;
        regionNoveltyTotals[zoneId] += noveltyFactor * weightedEvs;
        regionNoveltyWeights[zoneId] += weightedEvs;
      }
    }
  }

  const byRegion = (Object.keys(TRAINING_LOAD_ZONE_META) as TrainingLoadZone[]).reduce<Record<TrainingLoadZone, number>>(
    (accumulator, zoneId) => {
      accumulator[zoneId] = regionNoveltyWeights[zoneId]
        ? round(regionNoveltyTotals[zoneId] / regionNoveltyWeights[zoneId], 3)
        : 1;
      return accumulator;
    },
    {} as Record<TrainingLoadZone, number>,
  );

  return {
    average: round(average(Object.values(byRegion)), 3),
    byRegion,
    exposuresByExercise: [...exposureCounts.values()]
      .map((entry) => ({
        exerciseName: entry.exerciseName,
        sessionsUsedLast42d: entry.count,
        noveltyFactor: getNoveltyFactor(entry.count),
      }))
      .sort((a, b) => b.sessionsUsedLast42d - a.sessionsUsedLast42d)
      .slice(0, 12),
  };
}

function buildConsistencyScore(profile: Profile, sessions: WorkoutSession[], referenceDate: Date): ConsistencyScoreMetric {
  const range = getWindowRange(referenceDate, 28);
  const targetSessions28d = Math.max(1, Math.min(profile.workoutPlan.length, 4) * 4);
  const sessions28d = sessions.filter((session) => isWithinRange(session.performedAt, range));
  const completedEquivalents = sessions28d.reduce((sum, session) => sum + (session.partial ? 0.5 : 1), 0);
  const scheduledSessionsCompleted28d = clamp(completedEquivalents / targetSessions28d, 0, 1);

  const streakFactor = clamp(getWorkoutStreak(sessions, referenceDate) / 7, 0, 1);

  const expectedPerWeek = Math.max(1, Math.min(profile.workoutPlan.length, 4));
  const idealIntervalDays = 7 / expectedPerWeek;
  const sortedDates = sessions28d
    .map((session) => new Date(session.performedAt))
    .sort((a, b) => +a - +b);
  let onTimeCompletionFactor = scheduledSessionsCompleted28d;
  if (sortedDates.length >= 2) {
    const diffs = sortedDates.slice(1).map((date, index) => Math.max(1, (+date - +sortedDates[index]!) / 86400000));
    const meanDeviation = average(diffs.map((gap) => Math.abs(gap - idealIntervalDays)));
    onTimeCompletionFactor = clamp(1 - meanDeviation / Math.max(idealIntervalDays, 1), 0, 1);
  }

  return {
    score: round((0.55 * scheduledSessionsCompleted28d + 0.25 * streakFactor + 0.2 * onTimeCompletionFactor) * 100, 1),
    scheduledSessionsCompleted28d: round(scheduledSessionsCompleted28d, 3),
    streakFactor: round(streakFactor, 3),
    onTimeCompletionFactor: round(onTimeCompletionFactor, 3),
  };
}

function getProfileSymmetryZones(profile: Profile) {
  if (profile.id === "joshua") {
    return ["upperChest", "sideDelts", "rearDelts", "lats", "biceps", "triceps", "upperAbs", "lowerAbs"] as const;
  }

  return ["upperGlutes", "gluteMax", "sideGlutes", "lats", "upperBack", "lowerAbs", "obliques", "sideDelts"] as const;
}

function buildSymmetryScore(profile: Profile, coverageByRegion: Record<TrainingLoadZone, number>): SymmetryScoreMetric {
  const zoneIds = getProfileSymmetryZones(profile);
  const comparedRegions = (profile.id === "joshua"
    ? [
        { zoneId: "upperChest" as const, coveragePct: coverageByRegion.upperChest, weight: getPriorityMultiplier(profile, "upperChest") },
        { zoneId: "sideDelts" as const, coveragePct: coverageByRegion.sideDelts, weight: getPriorityMultiplier(profile, "sideDelts") },
        { zoneId: "rearDelts" as const, coveragePct: coverageByRegion.rearDelts, weight: getPriorityMultiplier(profile, "rearDelts") },
        { zoneId: "lats" as const, coveragePct: coverageByRegion.lats, weight: getPriorityMultiplier(profile, "lats") },
        { zoneId: "biceps" as const, coveragePct: coverageByRegion.biceps, weight: getPriorityMultiplier(profile, "biceps") },
        { zoneId: "triceps" as const, coveragePct: coverageByRegion.triceps, weight: getPriorityMultiplier(profile, "triceps") },
        {
          zoneId: "upperAbs" as const,
          coveragePct: round((coverageByRegion.upperAbs + coverageByRegion.lowerAbs) / 2, 1),
          weight: round((getPriorityMultiplier(profile, "upperAbs") + getPriorityMultiplier(profile, "lowerAbs")) / 2, 2),
        },
      ]
    : zoneIds.map((zoneId) => ({
        zoneId,
        coveragePct: coverageByRegion[zoneId],
        weight: getPriorityMultiplier(profile, zoneId),
      })))
    .map((entry) => ({
      ...entry,
      label: TRAINING_LOAD_ZONE_META[entry.zoneId].label,
    }));

  const totalWeight = comparedRegions.reduce((sum, region) => sum + region.weight, 0);
  const weightedMean =
    comparedRegions.reduce((sum, region) => sum + region.coveragePct * region.weight, 0) / Math.max(totalWeight, 1);
  const weightedVariance =
    comparedRegions.reduce((sum, region) => sum + region.weight * (region.coveragePct - weightedMean) ** 2, 0) /
    Math.max(totalWeight, 1);
  const weightedStdDev = Math.sqrt(weightedVariance);

  return {
    score: clamp(round(100 - weightedStdDev, 1), 0, 100),
    comparedRegions,
  };
}

function getRecoveryModifier(recoveryIndex: RecoveryIndexMetric) {
  if (recoveryIndex.score >= 75) return 1;
  if (recoveryIndex.score >= 60) return 0.96;
  if (recoveryIndex.score >= 45) return 0.92;
  return 0.88;
}

function getMevRecoveryModifier(recoveryIndex: RecoveryIndexMetric) {
  if (recoveryIndex.score < 55) return 0.9;
  if (recoveryIndex.score > 80) return 1.05;
  return 1;
}

function getNextFocusRecoveryAdjustment(recoveryIndex: RecoveryIndexMetric, metric: RegionTrainingMetric) {
  const highRecentFatigue = metric.stimulusToFatigueRatio < 0.92 && metric.coveragePct > 35;
  return recoveryIndex.score < 55 && highRecentFatigue ? 0.9 : 1;
}

function getNextFocusMomentumAdjustment(metric: RegionTrainingMetric) {
  return metric.progressVelocity <= 0 && metric.coveragePct < 100 ? 1.08 : 1;
}

function getNextFocusEfficiencyAdjustment(metric: RegionTrainingMetric) {
  return metric.stimulusToFatigueRatio > 0 && metric.stimulusToFatigueRatio < 0.92 ? 0.94 : 1;
}

function buildRirIntelligence(
  sessions: WorkoutSession[],
  exerciseLibrary: ExerciseLibraryItem[],
  referenceDate: Date,
  regionMetrics: RegionTrainingMetric[],
  recoveryIndex: RecoveryIndexMetric,
): RirIntelligenceMetric {
  const lookup = getLibraryLookups(exerciseLibrary);
  const range = getWindowRange(referenceDate, 14);
  const rirValuesByRegion = new Map<TrainingLoadZone, number[]>();
  const missingRirCounts = buildZoneNumberRecord();
  const totalSetCounts = buildZoneNumberRecord();

  for (const session of sessions) {
    if (!isWithinRange(session.performedAt, range)) {
      continue;
    }

    for (const exercise of session.exercises) {
      const completedSets = exercise.sets.filter((set) => set.completed);
      if (!completedSets.length) {
        continue;
      }

      const libraryItem = resolveLibraryItem(exercise, lookup);
      const contribution = normalizeZoneContribution(getExerciseMuscleContribution(exercise));
      if (!contribution.length) {
        continue;
      }

      for (const set of completedSets) {
        const explicitRir = (set as SetLog & { rir?: number }).rir;
        for (const [zoneId, allocation] of contribution) {
          if (allocation < 0.2) {
            continue;
          }
          totalSetCounts[zoneId] += 1;
          if (typeof explicitRir !== "number") {
            missingRirCounts[zoneId] += 1;
          }
        }
      }
    }
  }

  const byRegion = (Object.keys(TRAINING_LOAD_ZONE_META) as TrainingLoadZone[]).reduce<Record<TrainingLoadZone, RirQualityRegionMetric>>(
    (accumulator, zoneId) => {
      const explicitValues: number[] = [];

      for (const session of sessions) {
        if (!isWithinRange(session.performedAt, range)) {
          continue;
        }

        for (const exercise of session.exercises) {
          const completedSets = exercise.sets.filter((set) => set.completed);
          if (!completedSets.length) {
            continue;
          }

          const contribution = normalizeZoneContribution(getExerciseMuscleContribution(exercise));
          const allocation = contribution.find(([candidateZoneId]) => candidateZoneId === zoneId)?.[1] ?? 0;
          if (allocation < 0.2) {
            continue;
          }

          for (const set of completedSets) {
            const explicitRir = (set as SetLog & { rir?: number }).rir;
            if (typeof explicitRir === "number") {
              explicitValues.push(clamp(explicitRir, 0, 6));
            }
          }
        }
      }

      const totalSamples = totalSetCounts[zoneId];
      const missingRirRatio = totalSamples ? missingRirCounts[zoneId] / totalSamples : 1;
      const fallbackRir = missingRirRatio > 0.6 ? 2.5 : explicitValues.length ? average(explicitValues) : 2.5;
      const averageRir = missingRirRatio > 0.6 ? 2.5 : explicitValues.length ? average(explicitValues) : fallbackRir;
      const rirStdDev = explicitValues.length > 1 ? standardDeviation(explicitValues) : 0;
      const rirConsistencyScore = clamp(100 - rirStdDev * 20, 0, 100);
      const regionMetric = regionMetrics.find((metric) => metric.zoneId === zoneId);
      const progressVelocity = regionMetric?.progressVelocity ?? 0;
      const evs = regionMetric?.evs ?? 0;
      const targetEvs = regionMetric?.targetEVS ?? 1;
      const highEvs = evs >= targetEvs * 0.95;
      const elevatedFatigue = (regionMetric?.stimulusToFatigueRatio ?? 1) < 0.92;
      const sandbagRisk =
        averageRir >= 4 && progressVelocity <= 0
          ? 0.85
          : averageRir >= 3 && highEvs && progressVelocity <= 0
            ? 0.65
            : 0.2;
      const overshootRisk =
        averageRir <= 0 && recoveryIndex.score < 60
          ? 0.85
          : averageRir <= 1 && elevatedFatigue
            ? 0.65
            : 0.2;
      const confidenceScore = clamp(
        missingRirRatio > 0.6 ? 55 : 100 - missingRirRatio * 60,
        35,
        100,
      );

      accumulator[zoneId] = {
        zoneId,
        label: TRAINING_LOAD_ZONE_META[zoneId].label,
        averageRir: round(averageRir, 2),
        rirStdDev: round(rirStdDev, 2),
        rirConsistencyScore: round(rirConsistencyScore, 1),
        sandbagRisk: round(sandbagRisk, 2),
        overshootRisk: round(overshootRisk, 2),
        confidenceScore: round(confidenceScore, 1),
        missingRirRatio: round(missingRirRatio, 2),
        sampleCount: totalSamples,
      };
      return accumulator;
    },
    {} as Record<TrainingLoadZone, RirQualityRegionMetric>,
  );

  return {
    averageConsistencyScore: round(average(Object.values(byRegion).map((metric) => metric.rirConsistencyScore)), 1),
    byRegion,
  };
}

function buildMevTracker(
  profile: Profile,
  recoveryIndex: RecoveryIndexMetric,
  regionMetrics: RegionTrainingMetric[],
): MevTrackerMetric {
  const recoveryModifier = getMevRecoveryModifier(recoveryIndex);

  return {
    byRegion: regionMetrics.reduce<Record<TrainingLoadZone, MevRegionMetric>>((accumulator, metric) => {
      const baseMev = round(metric.baseTargetEVS * PHASE1_MEV_BASE_FACTOR, 2);
      const mevEstimate = round(baseMev * metric.priorityMultiplier * recoveryModifier, 2);
      const status: MevStatus =
        metric.evs < mevEstimate * 0.9 ? "below" : metric.evs <= mevEstimate * 1.15 ? "at" : "above";

      accumulator[metric.zoneId] = {
        zoneId: metric.zoneId,
        label: metric.label,
        baseMev,
        priorityMultiplier: metric.priorityMultiplier,
        recoveryModifier,
        mevEstimate,
        currentEvs: metric.evs,
        status,
      };
      return accumulator;
    }, {} as Record<TrainingLoadZone, MevRegionMetric>),
  };
}

function buildWeeklyRegionProgressByOffset(
  sessions: WorkoutSession[],
  exerciseLibrary: ExerciseLibraryItem[],
  referenceDate: Date,
  offsetDays: number,
) {
  const recentWindow = getWindowRange(referenceDate, 7, offsetDays);
  const baselineWindow = getWindowRange(referenceDate, 7, offsetDays + 7);
  const recentExerciseMetrics = aggregateExerciseWindow(sessions, exerciseLibrary, recentWindow);
  const baselineExerciseMetrics = aggregateExerciseWindow(sessions, exerciseLibrary, baselineWindow);
  const regionProgressScores = buildZoneNumberRecord();
  const regionProgressWeights = buildZoneNumberRecord();

  for (const [exerciseKey, recent] of recentExerciseMetrics) {
    const baseline = baselineExerciseMetrics.get(exerciseKey);
    if (!baseline) {
      continue;
    }

    const progressScore =
      0.5 * getPctChange(recent.bestEstimated1RM, baseline.bestEstimated1RM) +
      0.3 * getBestRepsAtFixedLoadChange(recent, baseline) +
      0.2 * getPctChange(recent.evsTotal, baseline.evsTotal);

    for (const [zoneId, regionEvs] of Object.entries(recent.regionEvs) as Array<[TrainingLoadZone, number]>) {
      regionProgressScores[zoneId] += progressScore * regionEvs;
      regionProgressWeights[zoneId] += regionEvs;
    }
  }

  return (Object.keys(TRAINING_LOAD_ZONE_META) as TrainingLoadZone[]).reduce<Record<TrainingLoadZone, number>>(
    (accumulator, zoneId) => {
      accumulator[zoneId] = regionProgressWeights[zoneId]
        ? round(regionProgressScores[zoneId] / regionProgressWeights[zoneId], 1)
        : 0;
      return accumulator;
    },
    {} as Record<TrainingLoadZone, number>,
  );
}

function buildPlateauDetection(
  sessions: WorkoutSession[],
  exerciseLibrary: ExerciseLibraryItem[],
  regionMetrics: RegionTrainingMetric[],
  consistencyScore: ConsistencyScoreMetric,
  referenceDate: Date,
): PlateauDetectionMetric {
  const currentWeekProgress = buildWeeklyRegionProgressByOffset(sessions, exerciseLibrary, referenceDate, 0);
  const previousWeekProgress = buildWeeklyRegionProgressByOffset(sessions, exerciseLibrary, referenceDate, 7);
  const adherence = consistencyScore.scheduledSessionsCompleted28d;

  return {
    byRegion: regionMetrics.reduce<Record<TrainingLoadZone, PlateauRegionMetric>>((accumulator, metric) => {
      const currentWeekPv = currentWeekProgress[metric.zoneId] ?? 0;
      const previousWeekPv = previousWeekProgress[metric.zoneId] ?? 0;
      const weeksFlat = currentWeekPv <= 0 ? (previousWeekPv <= 0 ? 2 : 1) : 0;
      const plateauDetected = weeksFlat >= 2 && metric.coveragePct >= 75 && adherence >= 0.7;
      const normalizedAdherence = clamp(adherence, 0, 1);
      const normalizedVolumeSufficiency = clamp(metric.coveragePct / 100, 0, 1);
      const normalizedNegativeOrFlatProgress =
        currentWeekPv <= 0 ? clamp((-Math.min(currentWeekPv, 0) + 2) / 2, 0.5, 1) : 0;
      const plateauConfidence = round(
        average([normalizedAdherence, normalizedVolumeSufficiency, normalizedNegativeOrFlatProgress]) * 100,
        1,
      );

      accumulator[metric.zoneId] = {
        zoneId: metric.zoneId,
        label: metric.label,
        plateauDetected,
        plateauConfidence,
        weeksFlat,
        adherence: round(adherence, 2),
        weeklyCoveragePct: metric.coveragePct,
        currentWeekProgress: currentWeekPv,
        previousWeekProgress: previousWeekPv,
      };
      return accumulator;
    }, {} as Record<TrainingLoadZone, PlateauRegionMetric>),
  };
}

function buildPhase1TrainingInsights(
  profile: Profile,
  trainingLoad: WeeklyTrainingLoad,
  rirIntelligence: RirIntelligenceMetric,
  mevTracker: MevTrackerMetric,
  plateauDetection: PlateauDetectionMetric,
): Phase1TrainingInsights {
  const focusZoneId = trainingLoad.summary.suggestedNextFocus.zoneIds[0];
  const focusLabel = trainingLoad.summary.suggestedNextFocus.labels[0] ?? trainingLoad.summary.suggestedNextFocus.text;
  const focusMev = focusZoneId ? mevTracker.byRegion[focusZoneId] : null;
  const focusRir = focusZoneId ? rirIntelligence.byRegion[focusZoneId] : null;
  const plateauCandidate = Object.values(plateauDetection.byRegion)
    .filter((metric) => metric.plateauDetected)
    .sort((a, b) => b.plateauConfidence - a.plateauConfidence)[0] ?? null;

  return {
    primaryInsight:
      focusMev?.status === "below"
        ? `${focusLabel} are still below minimum effective work.`
        : focusMev?.status === "above"
          ? `${focusLabel} are above minimum work. Push quality, not more.`
          : focusLabel
            ? `${focusLabel} are sitting in a useful range.`
            : null,
    recoveryInsight:
      focusRir?.overshootRisk === 0.85
        ? `${focusLabel} are being pushed hard. Recovery needs respect.`
        : focusRir?.sandbagRisk === 0.85
          ? `${focusLabel} may be underpushed. Bring the effort in.`
          : null,
    progressInsight: plateauCandidate
      ? `${plateauCandidate.label} look flat. Change the stimulus.`
      : null,
  };
}

export function selectRirQualityByRegion(metrics: ProfileTrainingMetrics) {
  return metrics.rirIntelligence.byRegion;
}

export function selectMevStatusByRegion(metrics: ProfileTrainingMetrics) {
  return metrics.mevTracker.byRegion;
}

export function selectPlateauStatusByRegion(metrics: ProfileTrainingMetrics) {
  return metrics.plateauDetection.byRegion;
}

export function selectPhase1TrainingInsights(metrics: ProfileTrainingMetrics) {
  return metrics.phase1Insights;
}

export function selectNextFocusFromMetrics(
  profile: Profile,
  trainingLoad: WeeklyTrainingLoad,
  metrics: ProfileTrainingMetrics,
): NextWorkoutFocus {
  const priorityZones = new Set(getProfilePriorityZones(profile.id));
  const regionMetrics = metrics.regionMetrics.filter((metric) => priorityZones.has(metric.zoneId));
  const lowActivity = trainingLoad.summary.lowActivity;

  if (!regionMetrics.length) {
    return trainingLoad.summary.suggestedNextFocus;
  }

  if (lowActivity) {
    const fallback = regionMetrics
      .sort((a, b) => {
        if (a.stimulusToFatigueRatio !== b.stimulusToFatigueRatio) {
          return a.stimulusToFatigueRatio - b.stimulusToFatigueRatio;
        }
        return getStablePriorityIndex(profile, a.zoneId) - getStablePriorityIndex(profile, b.zoneId);
      })
      .slice(0, 2);

    const labels = fallback.map((metric) => metric.label);
    return {
      zoneIds: fallback.map((metric) => metric.zoneId),
      labels,
      text: labels.join(" + "),
    };
  }

  const candidates = regionMetrics.map((metric) => {
    const deficitWeight = Math.max(0, 1 - metric.coveragePct / 100);
    const recoveryAdjustment = getNextFocusRecoveryAdjustment(metrics.recoveryIndex, metric);
    const momentumAdjustment = getNextFocusMomentumAdjustment(metric);
    const efficiencyAdjustment = getNextFocusEfficiencyAdjustment(metric);
    const score =
      metric.priorityMultiplier *
      deficitWeight *
      recoveryAdjustment *
      momentumAdjustment *
      efficiencyAdjustment;

    return {
      zoneId: metric.zoneId,
      label: metric.label,
      score,
      coveragePct: metric.coveragePct,
      evs: metric.evs,
      targetEVS: metric.targetEVS,
      progressVelocity: metric.progressVelocity,
      stimulusToFatigueRatio: metric.stimulusToFatigueRatio,
      priorityMultiplier: metric.priorityMultiplier,
      stablePriorityIndex: getStablePriorityIndex(profile, metric.zoneId),
    };
  });

  const selectFromPool = (pool: NextFocusCandidate[]) =>
    [...pool]
      .sort((a, b) => {
        if (b.score !== a.score) {
          return b.score - a.score;
        }
        const aEvsGap = a.targetEVS - a.evs;
        const bEvsGap = b.targetEVS - b.evs;
        if (bEvsGap !== aEvsGap) {
          return bEvsGap - aEvsGap;
        }
        if (a.progressVelocity !== b.progressVelocity) {
          return a.progressVelocity - b.progressVelocity;
        }
        return a.stablePriorityIndex - b.stablePriorityIndex;
      })
      .slice(0, 2);

  const clearlyLagging = candidates.filter((candidate) => candidate.coveragePct < 82);
  const belowTarget = candidates.filter((candidate) => candidate.coveragePct < 100);
  const selected = clearlyLagging.length >= 2 ? selectFromPool(clearlyLagging) : belowTarget.length >= 2 ? selectFromPool(belowTarget) : selectFromPool(candidates);

  const labels = selected.map((metric) => metric.label);
  return {
    zoneIds: selected.map((metric) => metric.zoneId),
    labels,
    text: labels.join(" + "),
  };
}

export function getProfileTrainingMetrics(
  profile: Profile,
  sessions: WorkoutSession[],
  exerciseLibrary: ExerciseLibraryItem[],
  trainingLoad: WeeklyTrainingLoad,
  referenceDate = new Date(),
): ProfileTrainingMetrics {
  const lookup = getLibraryLookups(exerciseLibrary);
  const currentWeekSessions = getCurrentWeekSessions(sessions, referenceDate);
  const priorityZones = getProfilePriorityZones(profile.id);
  const recoveryIndex = buildRecoveryIndex(profile, sessions, referenceDate);
  const recoveryModifier = getRecoveryModifier(recoveryIndex);

  const zoneEvs = buildZoneNumberRecord();
  const zoneStimulus = buildZoneNumberRecord();
  const zoneFatigue = buildZoneNumberRecord();
  const weeklyExerciseScores = new Map<string, { exerciseName: string; evs: number; stimulus: number; fatigue: number }>();

  for (const session of currentWeekSessions) {
    const densityPenalty = getDensityPenalty(session);

    for (const exercise of session.exercises) {
      const completedSets = exercise.sets.filter((set) => set.completed);
      if (!completedSets.length) {
        continue;
      }

      const libraryItem = resolveLibraryItem(exercise, lookup);
      const contribution = normalizeZoneContribution(getExerciseMuscleContribution(exercise));
      if (!contribution.length) {
        continue;
      }

      const classification = getExerciseClassification(exercise.exerciseName, libraryItem?.equipment);
      const avgRIR = average(completedSets.map((set) => getSetRIR(set)));
      const failurePenalty = getFailurePenalty(avgRIR);

      let exerciseEvs = 0;
      for (const set of completedSets) {
        const setEvs =
          getEffectiveRepsFactor(getSetRIR(set)) *
          getLoadFactor(set.reps) *
          classification.stabilityFactor;
        exerciseEvs += setEvs;

        for (const [zoneId, allocation] of contribution) {
          zoneEvs[zoneId] += setEvs * allocation;
          zoneStimulus[zoneId] += setEvs * allocation;
        }
      }

      const fatigueScore = completedSets.length * classification.fatigueFactor * failurePenalty * densityPenalty;
      for (const [zoneId, allocation] of contribution) {
        zoneFatigue[zoneId] += fatigueScore * allocation;
      }

      const key = normalizeExerciseName(exercise.exerciseName);
      const existing = weeklyExerciseScores.get(key) ?? {
        exerciseName: exercise.exerciseName,
        evs: 0,
        stimulus: 0,
        fatigue: 0,
      };
      existing.evs += exerciseEvs;
      existing.stimulus += exerciseEvs;
      existing.fatigue += fatigueScore;
      weeklyExerciseScores.set(key, existing);
    }
  }

  const baseTargetByRegion = trainingLoad.metrics.reduce<Record<TrainingLoadZone, number>>((accumulator, metric) => {
    accumulator[metric.id] = metric.targetSets;
    return accumulator;
  }, {} as Record<TrainingLoadZone, number>);
  const targetByRegion = (Object.keys(TRAINING_LOAD_ZONE_META) as TrainingLoadZone[]).reduce<Record<TrainingLoadZone, number>>(
    (accumulator, zoneId) => {
      accumulator[zoneId] = round(baseTargetByRegion[zoneId] * getPriorityMultiplier(profile, zoneId) * recoveryModifier, 2);
      return accumulator;
    },
    {} as Record<TrainingLoadZone, number>,
  );

  const coverageByRegion = (Object.keys(TRAINING_LOAD_ZONE_META) as TrainingLoadZone[]).reduce<Record<TrainingLoadZone, number>>(
    (accumulator, zoneId) => {
      accumulator[zoneId] = round(clamp(zoneEvs[zoneId] / Math.max(targetByRegion[zoneId] ?? 1, 1), 0, 1.25) * 100, 1);
      return accumulator;
    },
    {} as Record<TrainingLoadZone, number>,
  );

  const recentWindow = getWindowRange(referenceDate, 28);
  const baselineWindow = getWindowRange(referenceDate, 28, 28);
  const recentExerciseMetrics = aggregateExerciseWindow(sessions, exerciseLibrary, recentWindow);
  const baselineExerciseMetrics = aggregateExerciseWindow(sessions, exerciseLibrary, baselineWindow);

  const regionProgressScores = buildZoneNumberRecord();
  const regionProgressWeights = buildZoneNumberRecord();

  for (const [exerciseKey, recent] of recentExerciseMetrics) {
    const baseline = baselineExerciseMetrics.get(exerciseKey);
    if (!baseline) {
      continue;
    }

    const progressScore =
      0.5 * getPctChange(recent.bestEstimated1RM, baseline.bestEstimated1RM) +
      0.3 * getBestRepsAtFixedLoadChange(recent, baseline) +
      0.2 * getPctChange(recent.evsTotal, baseline.evsTotal);

    for (const [zoneId, regionEvs] of Object.entries(recent.regionEvs) as Array<[TrainingLoadZone, number]>) {
      regionProgressScores[zoneId] += progressScore * regionEvs;
      regionProgressWeights[zoneId] += regionEvs;
    }
  }

  const progressByRegion = (Object.keys(TRAINING_LOAD_ZONE_META) as TrainingLoadZone[]).reduce<Record<TrainingLoadZone, number>>(
    (accumulator, zoneId) => {
      accumulator[zoneId] = regionProgressWeights[zoneId]
        ? round(regionProgressScores[zoneId] / regionProgressWeights[zoneId], 1)
        : 0;
      return accumulator;
    },
    {} as Record<TrainingLoadZone, number>,
  );

  const sfrByRegion = (Object.keys(TRAINING_LOAD_ZONE_META) as TrainingLoadZone[]).reduce<Record<TrainingLoadZone, number>>(
    (accumulator, zoneId) => {
      accumulator[zoneId] = round(zoneStimulus[zoneId] / Math.max(zoneFatigue[zoneId], 0.1), 2);
      return accumulator;
    },
    {} as Record<TrainingLoadZone, number>,
  );

  const regionMetrics = trainingLoad.metrics.map((metric) => ({
    zoneId: metric.id,
    label: metric.label,
    evs: round(zoneEvs[metric.id], 2),
    baseTargetEVS: round(baseTargetByRegion[metric.id], 2),
    priorityMultiplier: round(getPriorityMultiplier(profile, metric.id), 2),
    recoveryModifier,
    targetEVS: targetByRegion[metric.id],
    coveragePct: coverageByRegion[metric.id],
    progressVelocity: progressByRegion[metric.id],
    stimulusToFatigueRatio: sfrByRegion[metric.id],
  }));

  const priorityCoverageValues = priorityZones.map((zoneId) => coverageByRegion[zoneId]);
  const priorityProgressValues = priorityZones.map((zoneId) => progressByRegion[zoneId]).filter((value) => value !== 0);
  const prioritySfrValues = priorityZones.map((zoneId) => sfrByRegion[zoneId]).filter((value) => Number.isFinite(value));
  const densityScore = buildDensityScore(sessions, exerciseLibrary, referenceDate);
  const adaptationScore = buildAdaptationScore(sessions, exerciseLibrary, referenceDate);
  const consistencyScore = buildConsistencyScore(profile, sessions, referenceDate);
  const symmetryScore = buildSymmetryScore(profile, coverageByRegion);
  const rirIntelligence = buildRirIntelligence(sessions, exerciseLibrary, referenceDate, regionMetrics, recoveryIndex);
  const mevTracker = buildMevTracker(profile, recoveryIndex, regionMetrics);
  const plateauDetection = buildPlateauDetection(
    sessions,
    exerciseLibrary,
    regionMetrics,
    consistencyScore,
    referenceDate,
  );
  const phase1Insights = buildPhase1TrainingInsights(
    profile,
    trainingLoad,
    rirIntelligence,
    mevTracker,
    plateauDetection,
  );

  return {
    effectiveVolumeScore: {
      total: round(Object.values(zoneEvs).reduce((sum, value) => sum + value, 0), 2),
      priorityTotal: round(priorityZones.reduce((sum, zoneId) => sum + zoneEvs[zoneId], 0), 2),
      byRegion: (Object.keys(TRAINING_LOAD_ZONE_META) as TrainingLoadZone[]).reduce<Record<TrainingLoadZone, number>>(
        (accumulator, zoneId) => {
          accumulator[zoneId] = round(zoneEvs[zoneId], 2);
          return accumulator;
        },
        {} as Record<TrainingLoadZone, number>,
      ),
      byExercise: [...weeklyExerciseScores.values()]
        .map((entry) => ({
          exerciseName: entry.exerciseName,
          score: round(entry.evs, 2),
        }))
        .sort((a, b) => b.score - a.score)
        .slice(0, 8),
    },
    weeklyCoverage: {
      averagePct: round(average(Object.values(coverageByRegion)), 1),
      priorityAveragePct: round(average(priorityCoverageValues), 1),
      coveredPriorityRegions: priorityCoverageValues.filter((value) => value > 0).length,
      byRegion: coverageByRegion,
    },
    recoveryIndex,
    progressVelocity: {
      average: round(average(priorityProgressValues), 1),
      byRegion: progressByRegion,
      leaders: [...regionMetrics]
        .sort((a, b) => b.progressVelocity - a.progressVelocity)
        .slice(0, 3)
        .map((metric) => ({ zoneId: metric.zoneId, label: metric.label, score: metric.progressVelocity })),
      laggards: [...regionMetrics]
        .sort((a, b) => a.progressVelocity - b.progressVelocity)
        .slice(0, 3)
        .map((metric) => ({ zoneId: metric.zoneId, label: metric.label, score: metric.progressVelocity })),
    },
    stimulusToFatigueRatio: {
      average: round(average(prioritySfrValues), 2),
      byRegion: sfrByRegion,
      byExercise: [...weeklyExerciseScores.values()]
        .map((entry) => ({
          exerciseName: entry.exerciseName,
          stimulusScore: round(entry.stimulus, 2),
          fatigueScore: round(entry.fatigue, 2),
          sfr: round(entry.stimulus / Math.max(entry.fatigue, 0.1), 2),
        }))
        .sort((a, b) => b.sfr - a.sfr)
        .slice(0, 8),
    },
    densityScore,
    adaptationScore,
    consistencyScore,
    symmetryScore,
    rirIntelligence,
    mevTracker,
    plateauDetection,
    phase1Insights,
    regionMetrics,
  };
}
