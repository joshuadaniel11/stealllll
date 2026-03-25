import type {
  ActiveWorkout,
  AppState,
  LiveSessionSignal,
  LiftReadyHistoryEntry,
  MeasurementEntry,
  MuscleCeilingLogEntry,
  MonthlyReportArchiveEntry,
  SessionSignalLogEntry,
  SetLog,
  StealArchiveEntry,
  StretchCompletion,
  WeeklyRivalryArchiveEntry,
  WorkoutOverride,
  WorkoutSession,
  WorkoutSessionExercise,
} from "@/lib/types";

type UserScopedRecord<T> = Record<AppState["selectedUserId"], T>;

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

function isUserId(value: unknown): value is AppState["selectedUserId"] {
  return value === "joshua" || value === "natasha";
}

function isValidStrongDayState(value: unknown): value is NonNullable<LiveSessionSignal["strongDayState"]> {
  return (
    isRecord(value) &&
    typeof value.strongDayDetected === "boolean" &&
    typeof value.detectedAfterSet === "number" &&
    typeof value.triggerExercise === "string" &&
    typeof value.weightDeltaPercent === "number" &&
    typeof value.repsDelta === "number" &&
    (value.strengthLevel === "strong" ||
      value.strengthLevel === "very_strong" ||
      value.strengthLevel === "exceptional")
  );
}

function isValidSetLog(value: unknown): value is SetLog {
  return (
    isRecord(value) &&
    typeof value.id === "string" &&
    typeof value.weight === "number" &&
    typeof value.reps === "number" &&
    typeof value.completed === "boolean" &&
    (typeof value.rir === "undefined" || typeof value.rir === "number")
  );
}

function isValidWorkoutSessionExercise(value: unknown): value is WorkoutSessionExercise {
  return (
    isRecord(value) &&
    typeof value.exerciseId === "string" &&
    typeof value.exerciseName === "string" &&
    typeof value.muscleGroup === "string" &&
    Array.isArray(value.sets) &&
    value.sets.every(isValidSetLog) &&
    (typeof value.note === "undefined" || typeof value.note === "string")
  );
}

function isValidLiveSessionSignal(value: unknown): value is LiveSessionSignal {
  return (
    isRecord(value) &&
    (value.signalType === "push" ||
      value.signalType === "hold" ||
      value.signalType === "bank" ||
      value.signalType === "pr_close" ||
      value.signalType === "strong_day") &&
    typeof value.targetExercise === "string" &&
    typeof value.message === "string" &&
    typeof value.firedAt === "string" &&
    typeof value.copyIndex === "number" &&
    (typeof value.strongDayState === "undefined" || value.strongDayState === null || isValidStrongDayState(value.strongDayState)) &&
    (typeof value.dismissedAt === "undefined" || value.dismissedAt === null || typeof value.dismissedAt === "string")
  );
}

function isValidWorkoutSession(value: unknown): value is WorkoutSession {
  return (
    isRecord(value) &&
    typeof value.id === "string" &&
    isUserId(value.userId) &&
    typeof value.workoutDayId === "string" &&
    typeof value.workoutName === "string" &&
    typeof value.performedAt === "string" &&
    typeof value.durationMinutes === "number" &&
    (typeof value.sessionRpe === "undefined" || typeof value.sessionRpe === "number") &&
    (!("partial" in value) || typeof value.partial === "boolean") &&
    (typeof value.liveSignal === "undefined" || value.liveSignal === null || isValidLiveSessionSignal(value.liveSignal)) &&
    (value.feeling === "Strong" || value.feeling === "Solid" || value.feeling === "Tough") &&
    Array.isArray(value.exercises) &&
    value.exercises.every(isValidWorkoutSessionExercise)
  );
}

function isValidMeasurementEntry(value: unknown): value is MeasurementEntry {
  return (
    isRecord(value) &&
    typeof value.id === "string" &&
    typeof value.date === "string" &&
    typeof value.bodyweightKg === "number" &&
    (typeof value.bodyFatPercent === "undefined" || typeof value.bodyFatPercent === "number")
  );
}

function isValidStretchCompletion(value: unknown): value is StretchCompletion {
  return (
    isRecord(value) &&
    typeof value.id === "string" &&
    isUserId(value.userId) &&
    typeof value.date === "string" &&
    typeof value.stretchTitle === "string"
  );
}

function isValidWorkoutOverride(value: unknown): value is WorkoutOverride {
  return (
    isRecord(value) &&
    (value.nextWorkoutId === null || typeof value.nextWorkoutId === "string") &&
    (value.updatedAt === null || typeof value.updatedAt === "string")
  );
}

function isStringRecord(value: unknown): value is Record<string, string> {
  return isRecord(value) && Object.values(value).every((entry) => typeof entry === "string");
}

function isNumberRecord(value: unknown): value is Record<AppState["selectedUserId"], number> {
  return (
    isRecord(value) &&
    typeof value.joshua === "number" &&
    typeof value.natasha === "number"
  );
}

function isBooleanRecord(value: unknown): value is Record<AppState["selectedUserId"], boolean> {
  return isRecord(value) && typeof value.joshua === "boolean" && typeof value.natasha === "boolean";
}

function isStringRecordByUser(value: unknown): value is Record<AppState["selectedUserId"], string> {
  return isRecord(value) && typeof value.joshua === "string" && typeof value.natasha === "string";
}

function isNullableStringRecordByUser(value: unknown): value is Record<AppState["selectedUserId"], string | null> {
  return (
    isRecord(value) &&
    (typeof value.joshua === "string" || value.joshua === null) &&
    (typeof value.natasha === "string" || value.natasha === null)
  );
}

function isWeddingPhaseRecord(
  value: unknown,
): value is Record<AppState["selectedUserId"], "build" | "define" | "peak" | "wedding_week" | "complete" | null> {
  const valid = (entry: unknown) =>
    entry === null ||
    entry === "build" ||
    entry === "define" ||
    entry === "peak" ||
    entry === "wedding_week" ||
    entry === "complete";

  return isRecord(value) && valid(value.joshua) && valid(value.natasha);
}

function isWeekStreakMilestoneRecord(value: unknown): value is Record<AppState["selectedUserId"], number[]> {
  return (
    isRecord(value) &&
    Array.isArray(value.joshua) &&
    value.joshua.every((entry) => typeof entry === "number") &&
    Array.isArray(value.natasha) &&
    value.natasha.every((entry) => typeof entry === "number")
  );
}

function isTrainingAgeStateRecord(
  value: unknown,
): value is AppState["trainingAgeState"] {
  const isEntry = (entry: unknown) =>
    isRecord(entry) &&
    typeof entry.rawSessionCount === "number" &&
    typeof entry.weightedAge === "number" &&
    Array.isArray(entry.milestonesShown) &&
    entry.milestonesShown.every((item) => typeof item === "string");

  return isRecord(value) && isEntry(value.joshua) && isEntry(value.natasha);
}

function isValidActiveWorkoutHapticState(value: unknown): value is NonNullable<ActiveWorkout["hapticState"]> {
  return (
    isRecord(value) &&
    Array.isArray(value.prApproachSetKeys) &&
    value.prApproachSetKeys.every((entry) => typeof entry === "string")
  );
}

function isValidWeeklyRivalryArchiveEntry(value: unknown): value is WeeklyRivalryArchiveEntry {
  return (
    isRecord(value) &&
    typeof value.weekStart === "string" &&
    (value.winner === "joshua" || value.winner === "natasha" || value.winner === "tied") &&
    typeof value.joshuaSessions === "number" &&
    typeof value.natashaSessions === "number"
  );
}

function isValidStealArchiveEntry(value: unknown): value is StealArchiveEntry {
  return (
    isRecord(value) &&
    typeof value.date === "string" &&
    (value.stolenBy === "joshua" || value.stolenBy === "natasha") &&
    typeof value.consecutiveCount === "number" &&
    typeof value.weekNumber === "number"
  );
}

function isValidMonthlyReportProfileData(value: unknown): value is MonthlyReportArchiveEntry["joshuaData"] {
  return (
    isRecord(value) &&
    typeof value.sessions === "number" &&
    typeof value.totalSets === "number" &&
    typeof value.topMuscleGroup === "string" &&
    typeof value.signatureLift === "string" &&
    typeof value.consistencyScore === "number" &&
    typeof value.bestWeek === "number" &&
    typeof value.newPRs === "number" &&
    typeof value.streakBest === "number"
  );
}

function isValidMonthlyReportArchiveEntry(value: unknown): value is MonthlyReportArchiveEntry {
  return (
    isRecord(value) &&
    typeof value.month === "string" &&
    typeof value.year === "number" &&
    isValidMonthlyReportProfileData(value.joshuaData) &&
    isValidMonthlyReportProfileData(value.natashaData) &&
    isRecord(value.rivalryData) &&
    isRecord(value.rivalryData.weekWins) &&
    typeof value.rivalryData.weekWins.joshua === "number" &&
    typeof value.rivalryData.weekWins.natasha === "number" &&
    typeof value.rivalryData.weekWins.tied === "number" &&
    isRecord(value.rivalryData.totalSteals) &&
    typeof value.rivalryData.totalSteals.joshua === "number" &&
    typeof value.rivalryData.totalSteals.natasha === "number" &&
    (value.rivalryData.monthWinner === "joshua" ||
      value.rivalryData.monthWinner === "natasha" ||
      value.rivalryData.monthWinner === "tied") &&
    isRecord(value.closingLines) &&
    typeof value.closingLines.joshua === "string" &&
    typeof value.closingLines.natasha === "string"
  );
}

function isValidLiftReadyHistoryEntry(value: unknown): value is LiftReadyHistoryEntry {
  return (
    isRecord(value) &&
    typeof value.weekStart === "string" &&
    typeof value.compositeScore === "number" &&
    (value.readinessLevel === "early" ||
      value.readinessLevel === "developing" ||
      value.readinessLevel === "building" ||
      value.readinessLevel === "strong" ||
      value.readinessLevel === "ready") &&
    (value.trend === "rising" || value.trend === "steady" || value.trend === "slipping") &&
    (value.phase === "build" ||
      value.phase === "define" ||
      value.phase === "peak" ||
      value.phase === "wedding_week" ||
      value.phase === "complete")
  );
}

function isValidSessionSignalLogEntry(value: unknown): value is SessionSignalLogEntry {
  return (
    isRecord(value) &&
    typeof value.sessionId === "string" &&
    (value.userId === "joshua" || value.userId === "natasha") &&
    typeof value.exercise === "string" &&
    (value.signalType === "push" ||
      value.signalType === "hold" ||
      value.signalType === "bank" ||
      value.signalType === "pr_close" ||
      value.signalType === "strong_day") &&
    typeof value.firedAt === "string" &&
    typeof value.copyIndex === "number" &&
    (typeof value.strongDayState === "undefined" || value.strongDayState === null || isValidStrongDayState(value.strongDayState))
  );
}

function isValidMuscleCeilingLogEntry(value: unknown): value is MuscleCeilingLogEntry {
  return (
    isRecord(value) &&
    (value.profile === "joshua" || value.profile === "natasha") &&
    typeof value.muscleGroup === "string" &&
    typeof value.sessionId === "string" &&
    typeof value.date === "string" &&
    typeof value.ceilingDetected === "boolean" &&
    (value.ceilingType === null || value.ceilingType === "weight" || value.ceilingType === "reps" || value.ceilingType === "both") &&
    (value.responseApplied === null ||
      value.responseApplied === "technique_swap" ||
      value.responseApplied === "rest" ||
      value.responseApplied === "rep_range_shift") &&
    typeof value.progressMadeThisSession === "boolean"
  );
}

export function isValidActiveWorkout(value: unknown): value is ActiveWorkout {
  return (
    isRecord(value) &&
    typeof value.id === "string" &&
    isUserId(value.userId) &&
    typeof value.startedAt === "string" &&
    typeof value.workoutDayId === "string" &&
    typeof value.workoutName === "string" &&
    (typeof value.liveSignal === "undefined" || value.liveSignal === null || isValidLiveSessionSignal(value.liveSignal)) &&
    (typeof value.hapticState === "undefined" || isValidActiveWorkoutHapticState(value.hapticState)) &&
    Array.isArray(value.exercises) &&
    value.exercises.every(isValidWorkoutSessionExercise)
  );
}

export function isValidImportedState(value: Partial<AppState>): boolean {
  if (!isRecord(value)) {
    return false;
  }

  if (typeof value.selectedUserId !== "undefined" && !isUserId(value.selectedUserId)) {
    return false;
  }

  if (typeof value.sessions !== "undefined" && (!Array.isArray(value.sessions) || !value.sessions.every(isValidWorkoutSession))) {
    return false;
  }

  if (typeof value.isSessionActive !== "undefined" && typeof value.isSessionActive !== "boolean") {
    return false;
  }

  if (typeof value.lastSeenWeddingPhase !== "undefined" && !isWeddingPhaseRecord(value.lastSeenWeddingPhase)) {
    return false;
  }

  if (typeof value.profileCreatedAt !== "undefined" && !isStringRecordByUser(value.profileCreatedAt)) {
    return false;
  }

  if (
    typeof value.profileActivationDates !== "undefined" &&
    !isNullableStringRecordByUser(value.profileActivationDates)
  ) {
    return false;
  }

  if (typeof value.hapticPreferences !== "undefined" && !isBooleanRecord(value.hapticPreferences)) {
    return false;
  }

  if (
    typeof value.firedWeekStreakMilestones !== "undefined" &&
    !isWeekStreakMilestoneRecord(value.firedWeekStreakMilestones)
  ) {
    return false;
  }

  if (typeof value.trainingAgeState !== "undefined" && !isTrainingAgeStateRecord(value.trainingAgeState)) {
    return false;
  }

  if (typeof value.longestStreaks !== "undefined" && !isNumberRecord(value.longestStreaks)) {
    return false;
  }

  if (
    typeof value.rivalryArchive !== "undefined" &&
    (!Array.isArray(value.rivalryArchive) || !value.rivalryArchive.every(isValidWeeklyRivalryArchiveEntry))
  ) {
    return false;
  }

  if (
    typeof value.stealArchive !== "undefined" &&
    (!Array.isArray(value.stealArchive) || !value.stealArchive.every(isValidStealArchiveEntry))
  ) {
    return false;
  }

  if (
    typeof value.monthlyReportArchive !== "undefined" &&
    (!Array.isArray(value.monthlyReportArchive) || !value.monthlyReportArchive.every(isValidMonthlyReportArchiveEntry))
  ) {
    return false;
  }

  if (
    typeof value.sessionSignalLog !== "undefined" &&
    (!Array.isArray(value.sessionSignalLog) || !value.sessionSignalLog.every(isValidSessionSignalLogEntry))
  ) {
    return false;
  }

  if (
    typeof value.ceilingLog !== "undefined" &&
    (!Array.isArray(value.ceilingLog) || !value.ceilingLog.every(isValidMuscleCeilingLogEntry))
  ) {
    return false;
  }

  if (
    typeof value.liftReadyHistory !== "undefined" &&
    (!Array.isArray(value.liftReadyHistory) || !value.liftReadyHistory.every(isValidLiftReadyHistoryEntry))
  ) {
    return false;
  }

  if (typeof value.measurements !== "undefined" && !isRecord(value.measurements)) {
    return false;
  }

  if (typeof value.stretchCompletions !== "undefined" && !isRecord(value.stretchCompletions)) {
    return false;
  }

  if (typeof value.workoutOverrides !== "undefined" && !isRecord(value.workoutOverrides)) {
    return false;
  }

  if (typeof value.exerciseSwapMemory !== "undefined" && !isRecord(value.exerciseSwapMemory)) {
    return false;
  }

  if (typeof value.activeWorkout !== "undefined" && value.activeWorkout !== null && !isValidActiveWorkout(value.activeWorkout)) {
    return false;
  }

  return true;
}

function sanitizeUserScopedList<T>(
  seed: UserScopedRecord<T[]>,
  incoming: unknown,
  validator: (value: unknown) => value is T,
): UserScopedRecord<T[]> {
  if (!isRecord(incoming)) {
    return seed;
  }

  return {
    joshua: Array.isArray(incoming.joshua) ? incoming.joshua.filter(validator) : seed.joshua,
    natasha: Array.isArray(incoming.natasha) ? incoming.natasha.filter(validator) : seed.natasha,
  };
}

function sanitizeWorkoutOverrides(
  seed: Record<AppState["selectedUserId"], WorkoutOverride>,
  incoming: unknown,
) {
  if (!isRecord(incoming)) {
    return seed;
  }

  return {
    joshua: isValidWorkoutOverride(incoming.joshua) ? incoming.joshua : seed.joshua,
    natasha: isValidWorkoutOverride(incoming.natasha) ? incoming.natasha : seed.natasha,
  };
}

function sanitizeExerciseSwapMemory(
  seed: Record<AppState["selectedUserId"], Record<string, string>>,
  incoming: unknown,
) {
  if (!isRecord(incoming)) {
    return seed;
  }

  return {
    joshua: isStringRecord(incoming.joshua) ? incoming.joshua : seed.joshua,
    natasha: isStringRecord(incoming.natasha) ? incoming.natasha : seed.natasha,
  };
}

export function mergeStateWithSeed(seed: AppState, incoming: Partial<AppState>): AppState {
  const validatedActiveWorkout = isValidActiveWorkout(incoming.activeWorkout) ? incoming.activeWorkout : null;

  return {
    ...seed,
    ...incoming,
    selectedUserId: isUserId(incoming.selectedUserId) ? incoming.selectedUserId : seed.selectedUserId,
    profiles: seed.profiles,
    isSessionActive:
      typeof incoming.isSessionActive === "boolean"
        ? incoming.isSessionActive
        : Boolean(validatedActiveWorkout),
    lastSeenWeddingPhase: isWeddingPhaseRecord(incoming.lastSeenWeddingPhase)
      ? incoming.lastSeenWeddingPhase
      : seed.lastSeenWeddingPhase,
    profileCreatedAt: isStringRecordByUser(incoming.profileCreatedAt)
      ? incoming.profileCreatedAt
      : seed.profileCreatedAt,
    profileActivationDates: isNullableStringRecordByUser(incoming.profileActivationDates)
      ? incoming.profileActivationDates
      : seed.profileActivationDates,
    hapticPreferences: isBooleanRecord(incoming.hapticPreferences)
      ? incoming.hapticPreferences
      : seed.hapticPreferences,
    firedWeekStreakMilestones: isWeekStreakMilestoneRecord(incoming.firedWeekStreakMilestones)
      ? incoming.firedWeekStreakMilestones
      : seed.firedWeekStreakMilestones,
    trainingAgeState: isTrainingAgeStateRecord(incoming.trainingAgeState)
      ? incoming.trainingAgeState
      : seed.trainingAgeState,
    exerciseLibrary: seed.exerciseLibrary,
    weeklySummaries: seed.weeklySummaries,
    sessions: Array.isArray(incoming.sessions) ? incoming.sessions.filter(isValidWorkoutSession) : seed.sessions,
    longestStreaks: isNumberRecord(incoming.longestStreaks) ? incoming.longestStreaks : seed.longestStreaks,
    rivalryArchive: Array.isArray(incoming.rivalryArchive)
      ? incoming.rivalryArchive.filter(isValidWeeklyRivalryArchiveEntry)
      : seed.rivalryArchive,
    stealArchive: Array.isArray(incoming.stealArchive)
      ? incoming.stealArchive.filter(isValidStealArchiveEntry)
      : seed.stealArchive,
    monthlyReportArchive: Array.isArray(incoming.monthlyReportArchive)
      ? incoming.monthlyReportArchive.filter(isValidMonthlyReportArchiveEntry)
      : seed.monthlyReportArchive,
    sessionSignalLog: Array.isArray(incoming.sessionSignalLog)
      ? incoming.sessionSignalLog.filter(isValidSessionSignalLogEntry)
      : seed.sessionSignalLog,
    ceilingLog: Array.isArray(incoming.ceilingLog)
      ? incoming.ceilingLog.filter(isValidMuscleCeilingLogEntry)
      : seed.ceilingLog,
    liftReadyHistory: Array.isArray(incoming.liftReadyHistory)
      ? incoming.liftReadyHistory.filter(isValidLiftReadyHistoryEntry)
      : seed.liftReadyHistory,
    measurements: sanitizeUserScopedList(seed.measurements, incoming.measurements, isValidMeasurementEntry),
    stretchCompletions: sanitizeUserScopedList(seed.stretchCompletions, incoming.stretchCompletions, isValidStretchCompletion),
    workoutOverrides: sanitizeWorkoutOverrides(seed.workoutOverrides, incoming.workoutOverrides),
    exerciseSwapMemory: sanitizeExerciseSwapMemory(seed.exerciseSwapMemory, incoming.exerciseSwapMemory),
    bibleVerses: incoming.bibleVerses?.length ? incoming.bibleVerses : seed.bibleVerses,
    activeWorkout: validatedActiveWorkout,
  };
}
