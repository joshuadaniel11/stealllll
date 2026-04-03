import type { PostgrestError } from "@supabase/supabase-js";

import { isValidImportedState } from "@/lib/app-state";
import { createSeedState } from "@/lib/seed-data";
import { getSupabaseBrowserClient, getSupabaseConfig } from "@/lib/supabase";
import type {
  AppState,
  CompletionRecord,
  DeviceState,
  ExerciseSwapMemoryRecord,
  MeasurementRecord,
  SessionRecord,
  SharedFactRecord,
  SyncedDomainState,
  WorkoutOverrideRecord,
} from "@/lib/types";
import { combinePersistedState, getSyncedDomainStateHash, migrateV1StateToV2, splitRuntimeStateToPersisted } from "@/lib/v2-state";

const LEGACY_TABLE_NAME = "app_state_snapshots";
const TABLES = {
  sessionRecords: "session_records",
  measurementRecords: "measurement_records",
  mobilityCompletionRecords: "mobility_completion_records",
  workoutOverrideRecords: "workout_override_records",
  exerciseSwapMemoryRecords: "exercise_swap_memory_records",
  sharedFactRecords: "shared_fact_records",
} as const;

type RecordTableKey = keyof typeof TABLES;

type CloudCollectionRow<T> = {
  id: string;
  state: T;
  updated_at: string;
};

type LegacyCloudSnapshotRow = {
  id: string;
  state: Partial<AppState>;
  updated_at: string;
};

export type CloudSyncedDomainSnapshot = {
  syncedDomainState: SyncedDomainState | null;
  updatedAt: string | null;
  mode: "records" | "snapshot" | null;
};

function toComparableTimestamp(value: string | null | undefined) {
  if (!value) {
    return 0;
  }

  const parsed = Date.parse(value);
  return Number.isFinite(parsed) ? parsed : 0;
}

function isMissingTableError(error: PostgrestError | null) {
  if (!error) {
    return false;
  }

  return error.code === "42P01" || /does not exist/i.test(error.message);
}

function getLegacySyncedPayload(state: AppState) {
  const {
    selectedUserId: _selectedUserId,
    isSessionActive: _isSessionActive,
    activeWorkout: _activeWorkout,
    ...syncedPayload
  } = state;

  return syncedPayload;
}

function getDefaultDeviceState(seed: AppState): DeviceState {
  return {
    version: 2,
    selectedUserId: seed.selectedUserId,
    lockedProfile: null,
    rememberedProfile: seed.selectedUserId,
    onboardingSeen: false,
    hapticPreferences: seed.hapticPreferences,
    isSessionActive: false,
    activeWorkout: null,
  };
}

async function loadRecordTable<T>(tableName: string) {
  const client = getSupabaseBrowserClient();
  const config = getSupabaseConfig();
  if (!client || !config.configured) {
    return { records: [] as T[], updatedAt: null, missing: false };
  }

  const { data, error } = await client
    .from(tableName)
    .select("id, state, updated_at")
    .eq("sync_id", config.syncId)
    .returns<Array<CloudCollectionRow<T>>>();

  if (isMissingTableError(error)) {
    return { records: [] as T[], updatedAt: null, missing: true };
  }

  if (error) {
    console.error(`Supabase record sync load failed for ${tableName}.`, error);
    return { records: [] as T[], updatedAt: null, missing: false };
  }

  const updatedAt = (data ?? []).reduce<string | null>((latest, row) => {
    if (!latest || toComparableTimestamp(row.updated_at) > toComparableTimestamp(latest)) {
      return row.updated_at;
    }
    return latest;
  }, null);

  return {
    records: (data ?? []).map((row) => row.state),
    updatedAt,
    missing: false,
  };
}

async function loadLegacySnapshotFallback(): Promise<CloudSyncedDomainSnapshot | null> {
  const client = getSupabaseBrowserClient();
  const config = getSupabaseConfig();
  if (!client || !config.configured) {
    return null;
  }

  const { data, error } = await client
    .from(LEGACY_TABLE_NAME)
    .select("state, updated_at")
    .eq("id", config.syncId)
    .maybeSingle<LegacyCloudSnapshotRow>();

  if (error) {
    console.error("Supabase legacy snapshot load failed.", error);
    return null;
  }

  if (data?.state && !isValidImportedState(data.state)) {
    console.error("Supabase legacy snapshot load rejected invalid payload.");
    return null;
  }

  if (!data?.state) {
    return {
      syncedDomainState: null,
      updatedAt: data?.updated_at ?? null,
      mode: "snapshot",
    };
  }

  const seed = createSeedState();
  const migrated = migrateV1StateToV2(seed, data.state, {
    lockedProfile: null,
    rememberedProfile: seed.selectedUserId,
    onboardingSeen: false,
  });

  return {
    syncedDomainState: migrated.syncedDomainState,
    updatedAt: data.updated_at ?? null,
    mode: "snapshot",
  };
}

export function isCloudSyncConfigured() {
  return getSupabaseConfig().configured;
}

export async function loadCloudSyncedDomainState(): Promise<CloudSyncedDomainSnapshot | null> {
  const client = getSupabaseBrowserClient();
  const config = getSupabaseConfig();
  if (!client || !config.configured) {
    return null;
  }

  const [
    sessionRecords,
    measurementRecords,
    mobilityCompletionRecords,
    workoutOverrideRecords,
    exerciseSwapMemoryRecords,
    sharedFactRecords,
  ] = await Promise.all([
    loadRecordTable<SessionRecord>(TABLES.sessionRecords),
    loadRecordTable<MeasurementRecord>(TABLES.measurementRecords),
    loadRecordTable<CompletionRecord>(TABLES.mobilityCompletionRecords),
    loadRecordTable<WorkoutOverrideRecord>(TABLES.workoutOverrideRecords),
    loadRecordTable<ExerciseSwapMemoryRecord>(TABLES.exerciseSwapMemoryRecords),
    loadRecordTable<SharedFactRecord>(TABLES.sharedFactRecords),
  ]);

  const anyMissing =
    sessionRecords.missing ||
    measurementRecords.missing ||
    mobilityCompletionRecords.missing ||
    workoutOverrideRecords.missing ||
    exerciseSwapMemoryRecords.missing ||
    sharedFactRecords.missing;

  if (anyMissing) {
    return loadLegacySnapshotFallback();
  }

  const syncedDomainState: SyncedDomainState = {
    version: 2,
    sessionRecords: sessionRecords.records,
    measurementRecords: measurementRecords.records,
    mobilityCompletionRecords: mobilityCompletionRecords.records,
    workoutOverrideRecords: workoutOverrideRecords.records,
    exerciseSwapMemoryRecords: exerciseSwapMemoryRecords.records,
    sharedFactRecords: sharedFactRecords.records,
  };

  const updatedAt = [
    sessionRecords.updatedAt,
    measurementRecords.updatedAt,
    mobilityCompletionRecords.updatedAt,
    workoutOverrideRecords.updatedAt,
    exerciseSwapMemoryRecords.updatedAt,
    sharedFactRecords.updatedAt,
  ].reduce<string | null>((latest, value) => {
    if (!value) {
      return latest;
    }
    if (!latest || toComparableTimestamp(value) > toComparableTimestamp(latest)) {
      return value;
    }
    return latest;
  }, null);

  return {
    syncedDomainState,
    updatedAt,
    mode: "records",
  };
}

async function upsertRecordTable<T extends { id: string; updatedAt: string }>(tableName: string, records: T[]) {
  const client = getSupabaseBrowserClient();
  const config = getSupabaseConfig();
  if (!client || !config.configured || !records.length) {
    return { ok: true, missing: false };
  }

  const payload = records.map((record) => ({
    sync_id: config.syncId,
    id: record.id,
    updated_at: record.updatedAt,
    state: record,
  }));

  const { error } = await client.from(tableName).upsert(payload, {
    onConflict: "sync_id,id",
  });

  if (isMissingTableError(error)) {
    return { ok: false, missing: true };
  }

  if (error) {
    console.error(`Supabase record sync save failed for ${tableName}.`, error);
    return { ok: false, missing: false };
  }

  return { ok: true, missing: false };
}

async function saveLegacySnapshotFallback(syncedDomainState: SyncedDomainState) {
  const client = getSupabaseBrowserClient();
  const config = getSupabaseConfig();
  if (!client || !config.configured) {
    return null;
  }

  const seed = createSeedState();
  const runtimeState = combinePersistedState(seed, getDefaultDeviceState(seed), syncedDomainState);
  const updatedAt = new Date().toISOString();
  const payload = {
    id: config.syncId,
    state: getLegacySyncedPayload(runtimeState),
    updated_at: updatedAt,
  };

  const { error } = await client.from(LEGACY_TABLE_NAME).upsert(payload, {
    onConflict: "id",
  });

  if (error) {
    console.error("Supabase legacy snapshot save failed.", error);
    return null;
  }

  return {
    updatedAt,
    syncedDomainState,
    mode: "snapshot" as const,
  };
}

export async function saveCloudSyncedDomainState(syncedDomainState: SyncedDomainState) {
  const client = getSupabaseBrowserClient();
  const config = getSupabaseConfig();
  if (!client || !config.configured) {
    return null;
  }

  const results = await Promise.all([
    upsertRecordTable(TABLES.sessionRecords, syncedDomainState.sessionRecords),
    upsertRecordTable(TABLES.measurementRecords, syncedDomainState.measurementRecords),
    upsertRecordTable(TABLES.mobilityCompletionRecords, syncedDomainState.mobilityCompletionRecords),
    upsertRecordTable(TABLES.workoutOverrideRecords, syncedDomainState.workoutOverrideRecords),
    upsertRecordTable(TABLES.exerciseSwapMemoryRecords, syncedDomainState.exerciseSwapMemoryRecords),
    upsertRecordTable(TABLES.sharedFactRecords, syncedDomainState.sharedFactRecords),
  ]);

  if (results.some((result) => result.missing)) {
    return saveLegacySnapshotFallback(syncedDomainState);
  }

  if (results.some((result) => !result.ok)) {
    return null;
  }

  return {
    updatedAt: new Date().toISOString(),
    syncedDomainState,
    mode: "records" as const,
  };
}

export { getSyncedDomainStateHash };

// Legacy compatibility shims — keep old call-sites working without mass rename

export async function loadCloudSnapshot(): Promise<{ state: AppState; updatedAt: string | null } | null> {
  const snapshot = await loadCloudSyncedDomainState();
  if (!snapshot) {
    return null;
  }
  const seed = createSeedState();
  if (!snapshot.syncedDomainState) {
    return { state: seed, updatedAt: snapshot.updatedAt };
  }
  const state = combinePersistedState(seed, getDefaultDeviceState(seed), snapshot.syncedDomainState);
  return { state, updatedAt: snapshot.updatedAt };
}

export async function saveCloudSnapshot(state: AppState): Promise<{ updatedAt: string } | null> {
  const persisted = splitRuntimeStateToPersisted(state, {
    previousSyncedDomainState: null,
    lockedProfile: null,
    rememberedProfile: state.selectedUserId,
    onboardingSeen: false,
  });
  const result = await saveCloudSyncedDomainState(persisted.syncedDomainState);
  return result ? { updatedAt: result.updatedAt } : null;
}

export function applyCloudState(current: AppState, cloudState: Partial<AppState>): AppState {
  return { ...current, ...cloudState };
}

export function getSyncedAppState(state: AppState): AppState {
  return state;
}

export function getSyncedStateHash(state: AppState | Partial<AppState>): string {
  try {
    const str = JSON.stringify(state) ?? "";
    let h = 0;
    for (let i = 0; i < str.length; i++) {
      h = (Math.imul(31, h) + str.charCodeAt(i)) | 0;
    }
    return h.toString(36);
  } catch {
    return "0";
  }
}
