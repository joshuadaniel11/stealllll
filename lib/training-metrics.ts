import { normalizeExerciseName } from "@/lib/exercise-data";
import {
  TRAINING_LOAD_ZONE_META,
  getCurrentWeekSessions,
  getCurrentWeekWindow,
  getExerciseMuscleContribution,
  getProfilePriorityZones,
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
  regionMetrics: RegionTrainingMetric[];
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

function getPriorityMultiplier(profile: Profile, zoneId: TrainingLoadZone) {
  return PROFILE_PRIORITY_MULTIPLIERS[profile.id]?.[zoneId] ?? 1;
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

function getRecoveryModifier(recoveryIndex: RecoveryIndexMetric) {
  if (recoveryIndex.score >= 75) return 1;
  if (recoveryIndex.score >= 60) return 0.96;
  if (recoveryIndex.score >= 45) return 0.92;
  return 0.88;
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
    regionMetrics,
  };
}
