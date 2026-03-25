import type { AppState } from "@/lib/types";
import { getSupabaseBrowserClient, getSupabaseConfig } from "@/lib/supabase";

const TABLE_NAME = "app_state_snapshots";

type SyncedAppState = Omit<AppState, "selectedUserId" | "isSessionActive" | "activeWorkout" | "lastSeenWeddingPhase">;

type CloudSnapshotRow = {
  id: string;
  state: Partial<SyncedAppState>;
  updated_at: string;
};

export type CloudSnapshot = {
  state: Partial<SyncedAppState> | null;
  updatedAt: string | null;
};

export function isCloudSyncConfigured() {
  return getSupabaseConfig().configured;
}

export function getSyncedAppState(state: AppState): SyncedAppState {
  const {
    selectedUserId: _selectedUserId,
    isSessionActive: _isSessionActive,
    activeWorkout: _activeWorkout,
    lastSeenWeddingPhase: _lastSeenWeddingPhase,
    ...syncedState
  } = state;

  return syncedState;
}

export function applyCloudState(baseState: AppState, cloudState: Partial<SyncedAppState>): AppState {
  return {
    ...baseState,
    ...cloudState,
  };
}

export function getSyncedStateHash(state: AppState | Partial<SyncedAppState>) {
  return JSON.stringify(state);
}

export async function loadCloudSnapshot(): Promise<CloudSnapshot | null> {
  const client = getSupabaseBrowserClient();
  const config = getSupabaseConfig();
  if (!client || !config.configured) {
    return null;
  }

  const { data, error } = await client
    .from(TABLE_NAME)
    .select("state, updated_at")
    .eq("id", config.syncId)
    .maybeSingle<CloudSnapshotRow>();

  if (error) {
    console.error("Supabase sync load failed.", error);
    return null;
  }

  return {
    state: data?.state ?? null,
    updatedAt: data?.updated_at ?? null,
  };
}

export async function saveCloudSnapshot(state: AppState) {
  const client = getSupabaseBrowserClient();
  const config = getSupabaseConfig();
  if (!client || !config.configured) {
    return null;
  }

  const updatedAt = new Date().toISOString();
  const payload = {
    id: config.syncId,
    state: getSyncedAppState(state),
    updated_at: updatedAt,
  };

  const { error } = await client.from(TABLE_NAME).upsert(payload, {
    onConflict: "id",
  });

  if (error) {
    console.error("Supabase sync save failed.", error);
    return null;
  }

  return {
    updatedAt,
    state: payload.state,
  };
}
