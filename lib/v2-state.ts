import { mergeStateWithSeed } from "@/lib/app-state";
import type {
  ActiveWorkout,
  AppState,
  CompletionRecord,
  DeviceState,
  ExerciseSwapMemoryRecord,
  MeasurementRecord,
  SessionRecord,
  SharedFactRecord,
  SyncRecordBase,
  SyncedDomainState,
  UserId,
  V2MigrationResult,
  WorkoutOverrideRecord,
} from "@/lib/types";

type SyncCollections = Pick<
  SyncedDomainState,
  | "sessionRecords"
  | "measurementRecords"
  | "mobilityCompletionRecords"
  | "workoutOverrideRecords"
  | "exerciseSwapMemoryRecords"
  | "sharedFactRecords"
>;

type SyncPayload<T extends SyncRecordBase> = T extends SyncRecordBase
  ? Omit<T, "updatedAt" | "deletedAt">
  : never;

function stripSyncMeta<T extends SyncRecordBase>(record: T): Omit<T, "updatedAt" | "deletedAt"> {
  const { updatedAt: _updatedAt, deletedAt: _deletedAt, ...rest } = record;
  return rest;
}

function getComparableTimestamp(value: string | null | undefined) {
  if (!value) {
    return 0;
  }

  const parsed = Date.parse(value);
  return Number.isFinite(parsed) ? parsed : 0;
}

function diffSyncRecords<T extends SyncRecordBase>(
  currentPayloads: Array<SyncPayload<T>>,
  previousRecords: T[] = [],
  now = new Date().toISOString(),
): T[] {
  const previousById = new Map(previousRecords.map((record) => [record.id, record]));
  const currentIds = new Set<string>();
  const nextRecords: T[] = [];

  for (const payload of currentPayloads) {
    currentIds.add(payload.id);
    const previous = previousById.get(payload.id);

    if (!previous) {
      nextRecords.push({
        ...payload,
        updatedAt: now,
        deletedAt: null,
      } as T);
      continue;
    }

    const changed =
      previous.deletedAt !== null &&
      typeof previous.deletedAt !== "undefined"
        ? true
        : JSON.stringify(stripSyncMeta(previous)) !== JSON.stringify(payload);

    if (changed) {
      nextRecords.push({
        ...payload,
        updatedAt: now,
        deletedAt: null,
      } as T);
      continue;
    }

    nextRecords.push({
      ...previous,
      deletedAt: null,
    });
  }

  for (const previous of previousRecords) {
    if (currentIds.has(previous.id)) {
      continue;
    }

    if (previous.deletedAt) {
      nextRecords.push(previous);
      continue;
    }

    nextRecords.push({
      ...previous,
      updatedAt: now,
      deletedAt: now,
    });
  }

  return nextRecords.sort(
    (left, right) => getComparableTimestamp(right.updatedAt) - getComparableTimestamp(left.updatedAt),
  );
}

function mergeSyncRecords<T extends SyncRecordBase>(localRecords: T[] = [], remoteRecords: T[] = []) {
  const merged = new Map<string, T>();

  for (const record of [...localRecords, ...remoteRecords]) {
    const existing = merged.get(record.id);
    if (!existing) {
      merged.set(record.id, record);
      continue;
    }

    const recordUpdatedAt = getComparableTimestamp(record.updatedAt);
    const existingUpdatedAt = getComparableTimestamp(existing.updatedAt);

    if (recordUpdatedAt > existingUpdatedAt) {
      merged.set(record.id, record);
      continue;
    }

    if (recordUpdatedAt === existingUpdatedAt && !existing.deletedAt && record.deletedAt) {
      merged.set(record.id, record);
    }
  }

  return [...merged.values()].sort(
    (left, right) => getComparableTimestamp(right.updatedAt) - getComparableTimestamp(left.updatedAt),
  );
}

export function buildDefaultDeviceState(seed: AppState): DeviceState {
  return {
    version: 2,
    selectedUserId: seed.selectedUserId,
    lockedProfile: null,
    rememberedProfile: seed.selectedUserId,
    onboardingSeen: false,
    hapticPreferences: seed.hapticPreferences,
    isSessionActive: seed.isSessionActive,
    activeWorkout: seed.activeWorkout,
  };
}

export function buildDeviceStateSnapshot(
  state: AppState,
  {
    lockedProfile,
    rememberedProfile,
    onboardingSeen,
  }: {
    lockedProfile: UserId | null;
    rememberedProfile: UserId | null;
    onboardingSeen: boolean;
  },
): DeviceState {
  return {
    version: 2,
    selectedUserId: state.selectedUserId,
    lockedProfile,
    rememberedProfile,
    onboardingSeen,
    hapticPreferences: state.hapticPreferences,
    isSessionActive: state.isSessionActive,
    activeWorkout: buildActiveWorkout(state.activeWorkout),
  };
}

function buildSharedFactPayloads(state: AppState) {
  const sharedFacts: Array<SyncPayload<SharedFactRecord>> = [];

  for (const userId of ["joshua", "natasha"] as const) {
    sharedFacts.push({
      id: `profile-created-at:${userId}`,
      factType: "profile_created_at",
      userId,
      value: state.profileCreatedAt[userId],
    });
    sharedFacts.push({
      id: `profile-activation-date:${userId}`,
      factType: "profile_activation_date",
      userId,
      value: state.profileActivationDates[userId],
    });
    sharedFacts.push({
      id: `last-seen-wedding-phase:${userId}`,
      factType: "last_seen_wedding_phase",
      userId,
      value: state.lastSeenWeddingPhase[userId],
    });
    sharedFacts.push({
      id: `fired-week-streak-milestones:${userId}`,
      factType: "fired_week_streak_milestones",
      userId,
      value: state.firedWeekStreakMilestones[userId],
    });
    sharedFacts.push({
      id: `training-age-state:${userId}`,
      factType: "training_age_state",
      userId,
      value: state.trainingAgeState[userId],
    });
    sharedFacts.push({
      id: `longest-streak:${userId}`,
      factType: "longest_streak",
      userId,
      value: state.longestStreaks[userId],
    });
    sharedFacts.push({
      id: `personal-bests:${userId}`,
      factType: "personal_bests",
      userId,
      value: state.personalBests[userId],
    });
  }

  sharedFacts.push({
    id: "shared-summary",
    factType: "shared_summary",
    value: state.sharedSummary,
  });

  for (const entry of state.rivalryArchive) {
    sharedFacts.push({
      id: `weekly-rivalry:${entry.weekStart}`,
      factType: "weekly_rivalry_archive",
      value: entry,
    });
  }

  for (const entry of state.stealArchive) {
    sharedFacts.push({
      id: `steal-archive:${entry.date}:${entry.stolenBy}`,
      factType: "steal_archive",
      value: entry,
    });
  }

  for (const entry of state.monthlyReportArchive) {
    sharedFacts.push({
      id: `monthly-report:${entry.year}:${entry.month}`,
      factType: "monthly_report_archive",
      value: entry,
    });
  }

  for (const entry of state.sessionSignalLog) {
    sharedFacts.push({
      id: `session-signal:${entry.sessionId}:${entry.signalType}`,
      factType: "session_signal_log",
      value: entry,
    });
  }

  for (const entry of state.ceilingLog) {
    sharedFacts.push({
      id: `ceiling-log:${entry.sessionId}:${entry.muscleGroup}`,
      factType: "ceiling_log",
      value: entry,
    });
  }

  for (const entry of state.liftReadyHistory) {
    sharedFacts.push({
      id: `lift-ready:${entry.weekStart}`,
      factType: "lift_ready_history",
      value: entry,
    });
  }

  return sharedFacts;
}

function buildWorkoutOverridePayloads(state: AppState): Array<Omit<WorkoutOverrideRecord, "updatedAt" | "deletedAt">> {
  return (["joshua", "natasha"] as const).map((userId) => ({
    id: `workout-override:${userId}`,
    userId,
    nextWorkoutId: state.workoutOverrides[userId].nextWorkoutId,
  }));
}

function buildExerciseSwapPayloads(state: AppState): Array<Omit<ExerciseSwapMemoryRecord, "updatedAt" | "deletedAt">> {
  return (["joshua", "natasha"] as const).flatMap((userId) =>
    Object.entries(state.exerciseSwapMemory[userId]).map(([sourceExerciseId, swapExerciseId]) => ({
      id: `exercise-swap:${userId}:${sourceExerciseId}`,
      userId,
      sourceExerciseId,
      swapExerciseId,
    })),
  );
}

function buildMeasurementPayloads(state: AppState): Array<Omit<MeasurementRecord, "updatedAt" | "deletedAt">> {
  return (["joshua", "natasha"] as const).flatMap((userId) =>
    state.measurements[userId].map((entry) => ({
      ...entry,
      userId,
    })),
  );
}

function buildCompletionPayloads(state: AppState): Array<Omit<CompletionRecord, "updatedAt" | "deletedAt">> {
  return (["joshua", "natasha"] as const).flatMap((userId) =>
    state.stretchCompletions[userId].map((entry) => ({
      ...entry,
      completionType: "mobility" as const,
    })),
  );
}

function buildSessionPayloads(state: AppState): Array<Omit<SessionRecord, "updatedAt" | "deletedAt">> {
  return state.sessions.map((session) => ({
    ...session,
  }));
}

function hydrateSharedFacts(seed: AppState, records: SharedFactRecord[]) {
  const activeRecords = records.filter((record) => !record.deletedAt);

  const sharedState = {
    profileCreatedAt: { ...seed.profileCreatedAt },
    profileActivationDates: { ...seed.profileActivationDates },
    lastSeenWeddingPhase: { ...seed.lastSeenWeddingPhase },
    firedWeekStreakMilestones: { ...seed.firedWeekStreakMilestones },
    trainingAgeState: { ...seed.trainingAgeState },
    longestStreaks: { ...seed.longestStreaks },
    personalBests: { ...seed.personalBests },
    sharedSummary: seed.sharedSummary,
    rivalryArchive: [] as AppState["rivalryArchive"],
    stealArchive: [] as AppState["stealArchive"],
    monthlyReportArchive: [] as AppState["monthlyReportArchive"],
    sessionSignalLog: [] as AppState["sessionSignalLog"],
    ceilingLog: [] as AppState["ceilingLog"],
    liftReadyHistory: [] as AppState["liftReadyHistory"],
  };

  for (const record of activeRecords) {
    switch (record.factType) {
      case "profile_created_at":
        sharedState.profileCreatedAt[record.userId] = record.value;
        break;
      case "profile_activation_date":
        sharedState.profileActivationDates[record.userId] = record.value;
        break;
      case "last_seen_wedding_phase":
        sharedState.lastSeenWeddingPhase[record.userId] = record.value;
        break;
      case "fired_week_streak_milestones":
        sharedState.firedWeekStreakMilestones[record.userId] = record.value;
        break;
      case "training_age_state":
        sharedState.trainingAgeState[record.userId] = record.value;
        break;
      case "longest_streak":
        sharedState.longestStreaks[record.userId] = record.value;
        break;
      case "personal_bests":
        sharedState.personalBests[record.userId] = record.value;
        break;
      case "shared_summary":
        sharedState.sharedSummary = record.value;
        break;
      case "weekly_rivalry_archive":
        sharedState.rivalryArchive.push(record.value);
        break;
      case "steal_archive":
        sharedState.stealArchive.push(record.value);
        break;
      case "monthly_report_archive":
        sharedState.monthlyReportArchive.push(record.value);
        break;
      case "session_signal_log":
        sharedState.sessionSignalLog.push(record.value);
        break;
      case "ceiling_log":
        sharedState.ceilingLog.push(record.value);
        break;
      case "lift_ready_history":
        sharedState.liftReadyHistory.push(record.value);
        break;
    }
  }

  sharedState.rivalryArchive.sort((left, right) => right.weekStart.localeCompare(left.weekStart));
  sharedState.stealArchive.sort((left, right) => right.date.localeCompare(left.date));
  sharedState.monthlyReportArchive.sort((left, right) =>
    `${right.year}-${right.month}`.localeCompare(`${left.year}-${left.month}`),
  );
  sharedState.sessionSignalLog.sort((left, right) => right.firedAt.localeCompare(left.firedAt));
  sharedState.ceilingLog.sort((left, right) => right.date.localeCompare(left.date));
  sharedState.liftReadyHistory.sort((left, right) => right.weekStart.localeCompare(left.weekStart));

  return sharedState;
}

function buildMeasurementsByUser(seed: AppState, records: MeasurementRecord[]) {
  const next = {
    joshua: [] as AppState["measurements"]["joshua"],
    natasha: [] as AppState["measurements"]["natasha"],
  };

  for (const record of records.filter((entry) => !entry.deletedAt)) {
    next[record.userId].push({
      id: record.id,
      date: record.date,
      bodyweightKg: record.bodyweightKg,
      bodyFatPercent: record.bodyFatPercent,
    });
  }

  next.joshua.sort((left, right) => right.date.localeCompare(left.date));
  next.natasha.sort((left, right) => right.date.localeCompare(left.date));

  return {
    ...seed.measurements,
    ...next,
  };
}

function buildStretchCompletionsByUser(seed: AppState, records: CompletionRecord[]) {
  const next = {
    joshua: [] as AppState["stretchCompletions"]["joshua"],
    natasha: [] as AppState["stretchCompletions"]["natasha"],
  };

  for (const record of records.filter((entry) => !entry.deletedAt)) {
    next[record.userId].push({
      id: record.id,
      userId: record.userId,
      date: record.date,
      stretchTitle: record.stretchTitle,
    });
  }

  next.joshua.sort((left, right) => right.date.localeCompare(left.date));
  next.natasha.sort((left, right) => right.date.localeCompare(left.date));

  return {
    ...seed.stretchCompletions,
    ...next,
  };
}

function buildWorkoutOverrides(seed: AppState, records: WorkoutOverrideRecord[]) {
  const next = { ...seed.workoutOverrides };

  for (const record of records.filter((entry) => !entry.deletedAt)) {
    next[record.userId] = {
      nextWorkoutId: record.nextWorkoutId,
      updatedAt: record.updatedAt,
    };
  }

  return next;
}

function buildExerciseSwapMemory(seed: AppState, records: ExerciseSwapMemoryRecord[]) {
  const next = {
    joshua: {} as Record<string, string>,
    natasha: {} as Record<string, string>,
  };

  for (const record of records.filter((entry) => !entry.deletedAt)) {
    next[record.userId][record.sourceExerciseId] = record.swapExerciseId;
  }

  return {
    ...seed.exerciseSwapMemory,
    ...next,
  };
}

function buildSessions(records: SessionRecord[]) {
  return records
    .filter((record) => !record.deletedAt)
    .sort((left, right) => right.performedAt.localeCompare(left.performedAt))
    .map((record) => {
      const { updatedAt: _updatedAt, deletedAt: _deletedAt, ...session } = record;
      return session;
    });
}

function buildActiveWorkout(activeWorkout: ActiveWorkout | null) {
  if (!activeWorkout) {
    return null;
  }

  return {
    ...activeWorkout,
  };
}

export function buildDefaultSyncedDomainState(seed: AppState): SyncedDomainState {
  return splitRuntimeStateToPersisted(seed, {
    previousSyncedDomainState: null,
    lockedProfile: null,
    rememberedProfile: seed.selectedUserId,
    onboardingSeen: false,
  }).syncedDomainState;
}

export function splitRuntimeStateToPersisted(
  state: AppState,
  {
    previousSyncedDomainState,
    lockedProfile,
    rememberedProfile,
    onboardingSeen,
  }: {
    previousSyncedDomainState: SyncedDomainState | null;
    lockedProfile: UserId | null;
    rememberedProfile: UserId | null;
    onboardingSeen: boolean;
  },
  now = new Date().toISOString(),
) {
  const previous = previousSyncedDomainState ?? {
    version: 2 as const,
    sessionRecords: [],
    measurementRecords: [],
    mobilityCompletionRecords: [],
    workoutOverrideRecords: [],
    exerciseSwapMemoryRecords: [],
    sharedFactRecords: [],
  };

  const syncedDomainState: SyncedDomainState = {
    version: 2,
    sessionRecords: diffSyncRecords(buildSessionPayloads(state), previous.sessionRecords, now),
    measurementRecords: diffSyncRecords(buildMeasurementPayloads(state), previous.measurementRecords, now),
    mobilityCompletionRecords: diffSyncRecords(
      buildCompletionPayloads(state),
      previous.mobilityCompletionRecords,
      now,
    ),
    workoutOverrideRecords: diffSyncRecords(
      buildWorkoutOverridePayloads(state),
      previous.workoutOverrideRecords,
      now,
    ),
    exerciseSwapMemoryRecords: diffSyncRecords(
      buildExerciseSwapPayloads(state),
      previous.exerciseSwapMemoryRecords,
      now,
    ),
    sharedFactRecords: diffSyncRecords(buildSharedFactPayloads(state), previous.sharedFactRecords, now),
  };

  const deviceState = buildDeviceStateSnapshot(state, {
    lockedProfile,
    rememberedProfile,
    onboardingSeen,
  });

  return {
    deviceState,
    syncedDomainState,
  };
}

export function combinePersistedState(seed: AppState, deviceState: DeviceState | null, syncedDomainState: SyncedDomainState | null): AppState {
  const device = deviceState ?? buildDefaultDeviceState(seed);
  const synced = syncedDomainState ?? buildDefaultSyncedDomainState(seed);
  const sharedFacts = hydrateSharedFacts(seed, synced.sharedFactRecords);

  return {
    ...seed,
    selectedUserId: device.selectedUserId,
    isSessionActive: device.isSessionActive,
    activeWorkout: buildActiveWorkout(device.activeWorkout),
    hapticPreferences: device.hapticPreferences,
    sessions: buildSessions(synced.sessionRecords),
    measurements: buildMeasurementsByUser(seed, synced.measurementRecords),
    stretchCompletions: buildStretchCompletionsByUser(seed, synced.mobilityCompletionRecords),
    workoutOverrides: buildWorkoutOverrides(seed, synced.workoutOverrideRecords),
    exerciseSwapMemory: buildExerciseSwapMemory(seed, synced.exerciseSwapMemoryRecords),
    profileCreatedAt: sharedFacts.profileCreatedAt,
    profileActivationDates: sharedFacts.profileActivationDates,
    lastSeenWeddingPhase: sharedFacts.lastSeenWeddingPhase,
    firedWeekStreakMilestones: sharedFacts.firedWeekStreakMilestones,
    trainingAgeState: sharedFacts.trainingAgeState,
    longestStreaks: sharedFacts.longestStreaks,
    personalBests: sharedFacts.personalBests,
    sharedSummary: sharedFacts.sharedSummary,
    rivalryArchive: sharedFacts.rivalryArchive,
    stealArchive: sharedFacts.stealArchive,
    monthlyReportArchive: sharedFacts.monthlyReportArchive,
    sessionSignalLog: sharedFacts.sessionSignalLog,
    ceilingLog: sharedFacts.ceilingLog,
    liftReadyHistory: sharedFacts.liftReadyHistory,
  };
}

export function mergeSyncedDomainStates(
  localState: SyncedDomainState | null,
  remoteState: SyncedDomainState | null,
): SyncedDomainState | null {
  if (!localState) {
    return remoteState;
  }

  if (!remoteState) {
    return localState;
  }

  return {
    version: 2,
    sessionRecords: mergeSyncRecords(localState.sessionRecords, remoteState.sessionRecords),
    measurementRecords: mergeSyncRecords(localState.measurementRecords, remoteState.measurementRecords),
    mobilityCompletionRecords: mergeSyncRecords(
      localState.mobilityCompletionRecords,
      remoteState.mobilityCompletionRecords,
    ),
    workoutOverrideRecords: mergeSyncRecords(localState.workoutOverrideRecords, remoteState.workoutOverrideRecords),
    exerciseSwapMemoryRecords: mergeSyncRecords(
      localState.exerciseSwapMemoryRecords,
      remoteState.exerciseSwapMemoryRecords,
    ),
    sharedFactRecords: mergeSyncRecords(localState.sharedFactRecords, remoteState.sharedFactRecords),
  };
}

export function getSyncedDomainStateHash(state: SyncedDomainState | null) {
  return JSON.stringify(state ?? null);
}

export function migrateV1StateToV2(
  seed: AppState,
  legacyState: Partial<AppState>,
  {
    lockedProfile,
    rememberedProfile,
    onboardingSeen,
  }: {
    lockedProfile: UserId | null;
    rememberedProfile: UserId | null;
    onboardingSeen: boolean;
  },
): V2MigrationResult {
  const mergedState = mergeStateWithSeed(seed, legacyState);
  const { deviceState, syncedDomainState } = splitRuntimeStateToPersisted(mergedState, {
    previousSyncedDomainState: null,
    lockedProfile,
    rememberedProfile,
    onboardingSeen,
  });

  return {
    deviceState,
    syncedDomainState,
    backupKey: "steal-v1-state-backup",
  };
}
