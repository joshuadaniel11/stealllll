import type { AppState, DeviceState, PersistedAppStateV2, SyncedDomainState, UserId } from "@/lib/types";

const LEGACY_STORAGE_KEY = "workout-together-state-v2-clean-start";
const DEVICE_STORAGE_KEY = "steal-device-state-v2";
const SYNCED_STORAGE_KEY = "steal-synced-domain-state-v2";
const STORAGE_VERSION = 2;
const PROFILE_LOCK_KEY = "workout-together-profile-lock";
const LAST_PROFILE_KEY = "workout-together-last-profile";
const LEGACY_ONBOARDING_KEY = "workout-together-onboarding-seen-v1";
const SYNC_STATE_UPDATED_AT_KEY = "steal-synced-state-updated-at-v2";
const LEGACY_BACKUP_KEY = "steal-v1-state-backup";

type StoredLegacyStateEnvelope = {
  version: number;
  savedAt: string;
  state: AppState;
};

function isObject(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

function isUserId(value: unknown): value is UserId {
  return value === "joshua" || value === "natasha";
}

function isDeviceState(value: unknown): value is DeviceState {
  return (
    isObject(value) &&
    value.version === 2 &&
    isUserId(value.selectedUserId) &&
    (value.lockedProfile === null || isUserId(value.lockedProfile)) &&
    (value.rememberedProfile === null || isUserId(value.rememberedProfile)) &&
    typeof value.onboardingSeen === "boolean" &&
    isObject(value.hapticPreferences) &&
    typeof value.hapticPreferences.joshua === "boolean" &&
    typeof value.hapticPreferences.natasha === "boolean" &&
    typeof value.isSessionActive === "boolean" &&
    ("activeWorkout" in value)
  );
}

function isSyncedDomainState(value: unknown): value is SyncedDomainState {
  return (
    isObject(value) &&
    value.version === 2 &&
    Array.isArray(value.sessionRecords) &&
    Array.isArray(value.measurementRecords) &&
    Array.isArray(value.mobilityCompletionRecords) &&
    Array.isArray(value.workoutOverrideRecords) &&
    Array.isArray(value.exerciseSwapMemoryRecords) &&
    Array.isArray(value.sharedFactRecords)
  );
}

export function deserializeState(raw: string): Partial<AppState> | null {
  try {
    const parsed = JSON.parse(raw) as unknown;

    if (
      isObject(parsed) &&
      typeof parsed.version === "number" &&
      "state" in parsed &&
      isObject(parsed.state)
    ) {
      return parsed.state as Partial<AppState>;
    }

    return isObject(parsed) ? (parsed as Partial<AppState>) : null;
  } catch {
    return null;
  }
}

export function loadStateEnvelope(): StoredLegacyStateEnvelope | null {
  if (typeof window === "undefined") {
    return null;
  }

  const raw = window.localStorage.getItem(LEGACY_STORAGE_KEY);
  if (!raw) {
    return null;
  }

  try {
    const parsed = JSON.parse(raw) as unknown;
    if (
      isObject(parsed) &&
      typeof parsed.version === "number" &&
      typeof parsed.savedAt === "string" &&
      "state" in parsed &&
      isObject(parsed.state)
    ) {
      return parsed as StoredLegacyStateEnvelope;
    }
  } catch {
    return null;
  }

  return null;
}

export function loadState(): Partial<AppState> | null {
  if (typeof window === "undefined") {
    return null;
  }

  const envelope = loadStateEnvelope();
  const parsed = envelope?.state ?? deserializeState(window.localStorage.getItem(LEGACY_STORAGE_KEY) ?? "");
  if (!parsed) {
    window.localStorage.removeItem(LEGACY_STORAGE_KEY);
    return null;
  }

  return parsed;
}

function readJson<T>(storageKey: string) {
  if (typeof window === "undefined") {
    return null;
  }

  const raw = window.localStorage.getItem(storageKey);
  if (!raw) {
    return null;
  }

  try {
    return JSON.parse(raw) as T;
  } catch {
    return null;
  }
}

export function loadPersistedAppStateV2(): PersistedAppStateV2 | null {
  const deviceState = readJson<DeviceState>(DEVICE_STORAGE_KEY);
  const syncedDomainState = readJson<SyncedDomainState>(SYNCED_STORAGE_KEY);

  if (!deviceState || !syncedDomainState || !isDeviceState(deviceState) || !isSyncedDomainState(syncedDomainState)) {
    return null;
  }

  return {
    version: STORAGE_VERSION,
    savedAt: new Date().toISOString(),
    deviceState,
    syncedDomainState,
  };
}

export function savePersistedAppStateV2({
  deviceState,
  syncedDomainState,
}: {
  deviceState: DeviceState;
  syncedDomainState: SyncedDomainState;
}) {
  if (typeof window === "undefined") {
    return;
  }

  try {
    window.localStorage.setItem(DEVICE_STORAGE_KEY, JSON.stringify(deviceState));
    window.localStorage.setItem(SYNCED_STORAGE_KEY, JSON.stringify(syncedDomainState));
  } catch {
    // Ignore storage quota failures so the app keeps running.
  }
}

export function saveLegacyBackup(raw: string) {
  if (typeof window === "undefined") {
    return;
  }

  try {
    window.localStorage.setItem(LEGACY_BACKUP_KEY, raw);
  } catch {
    // Ignore backup failures.
  }
}

export function loadLegacyBackup() {
  if (typeof window === "undefined") {
    return null;
  }

  return window.localStorage.getItem(LEGACY_BACKUP_KEY);
}

export function loadLegacyRawState() {
  if (typeof window === "undefined") {
    return null;
  }

  return window.localStorage.getItem(LEGACY_STORAGE_KEY);
}

export function loadLegacyLockedProfile(): UserId | null {
  if (typeof window === "undefined") {
    return null;
  }

  const value = window.localStorage.getItem(PROFILE_LOCK_KEY);
  return isUserId(value) ? value : null;
}

export function loadLegacyRememberedProfile(): UserId | null {
  if (typeof window === "undefined") {
    return null;
  }

  const value = window.localStorage.getItem(LAST_PROFILE_KEY);
  return isUserId(value) ? value : null;
}

export function loadLegacyOnboardingSeen() {
  if (typeof window === "undefined") {
    return false;
  }

  return window.localStorage.getItem(LEGACY_ONBOARDING_KEY) === "true";
}

export function removeLegacyStateKeys() {
  if (typeof window === "undefined") {
    return;
  }

  window.localStorage.removeItem(LEGACY_STORAGE_KEY);
}

export function loadSyncedStateUpdatedAt(): string | null {
  if (typeof window === "undefined") {
    return null;
  }

  const value = window.localStorage.getItem(SYNC_STATE_UPDATED_AT_KEY);
  return typeof value === "string" && value.length > 0 ? value : null;
}

export function saveSyncedStateUpdatedAt(updatedAt: string | null) {
  if (typeof window === "undefined") {
    return;
  }

  if (!updatedAt) {
    window.localStorage.removeItem(SYNC_STATE_UPDATED_AT_KEY);
    return;
  }

  window.localStorage.setItem(SYNC_STATE_UPDATED_AT_KEY, updatedAt);
}

// Compatibility aliases so existing callers don't need to be renamed
export const loadLockedProfile = loadLegacyLockedProfile;
export const loadRememberedProfile = loadLegacyRememberedProfile;

export function saveLockedProfile(profile: UserId | null): void {
  if (typeof window === "undefined") {
    return;
  }
  if (profile) {
    window.localStorage.setItem(PROFILE_LOCK_KEY, profile);
  } else {
    window.localStorage.removeItem(PROFILE_LOCK_KEY);
  }
}

export function saveRememberedProfile(profile: UserId): void {
  if (typeof window === "undefined") {
    return;
  }
  window.localStorage.setItem(LAST_PROFILE_KEY, profile);
}

export function saveState(state: AppState): void {
  if (typeof window === "undefined") {
    return;
  }
  try {
    const envelope = { version: STORAGE_VERSION, savedAt: new Date().toISOString(), state };
    window.localStorage.setItem(LEGACY_STORAGE_KEY, JSON.stringify(envelope));
  } catch {
    // Ignore storage quota failures.
  }
}
