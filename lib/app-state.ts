import type {
  ActiveWorkout,
  AppState,
  MeasurementEntry,
  SetLog,
  StretchCompletion,
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

export function isValidActiveWorkout(value: unknown): value is ActiveWorkout {
  return (
    isRecord(value) &&
    typeof value.id === "string" &&
    isUserId(value.userId) &&
    typeof value.startedAt === "string" &&
    typeof value.workoutDayId === "string" &&
    typeof value.workoutName === "string" &&
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
  return {
    ...seed,
    ...incoming,
    selectedUserId: isUserId(incoming.selectedUserId) ? incoming.selectedUserId : seed.selectedUserId,
    profiles: seed.profiles,
    exerciseLibrary: seed.exerciseLibrary,
    weeklySummaries: seed.weeklySummaries,
    sessions: Array.isArray(incoming.sessions) ? incoming.sessions.filter(isValidWorkoutSession) : seed.sessions,
    measurements: sanitizeUserScopedList(seed.measurements, incoming.measurements, isValidMeasurementEntry),
    stretchCompletions: sanitizeUserScopedList(seed.stretchCompletions, incoming.stretchCompletions, isValidStretchCompletion),
    workoutOverrides: sanitizeWorkoutOverrides(seed.workoutOverrides, incoming.workoutOverrides),
    exerciseSwapMemory: sanitizeExerciseSwapMemory(seed.exerciseSwapMemory, incoming.exerciseSwapMemory),
    bibleVerses: incoming.bibleVerses?.length ? incoming.bibleVerses : seed.bibleVerses,
    activeWorkout: isValidActiveWorkout(incoming.activeWorkout) ? incoming.activeWorkout : null,
  };
}
