import type { AppState } from "@/lib/types";

const STORAGE_KEY = "workout-together-state-v2-clean-start";
const STORAGE_VERSION = 1;
const PROFILE_LOCK_KEY = "workout-together-profile-lock";
const LAST_PROFILE_KEY = "workout-together-last-profile";
const SYNC_STATE_UPDATED_AT_KEY = "workout-together-synced-state-updated-at";

type StoredStateEnvelope = {
  version: number;
  savedAt: string;
  state: AppState;
};

function isObject(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
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
      if (parsed.version > STORAGE_VERSION) {
        return null;
      }
      return parsed.state as Partial<AppState>;
    }

    return isObject(parsed) ? (parsed as Partial<AppState>) : null;
  } catch {
    return null;
  }
}

export function loadStateEnvelope(): StoredStateEnvelope | null {
  if (typeof window === "undefined") {
    return null;
  }

  const raw = window.localStorage.getItem(STORAGE_KEY);
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
      isObject(parsed.state) &&
      parsed.version <= STORAGE_VERSION
    ) {
      return parsed as StoredStateEnvelope;
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
  const parsed = envelope?.state ?? deserializeState(window.localStorage.getItem(STORAGE_KEY) ?? "");
  if (!parsed) {
    window.localStorage.removeItem(STORAGE_KEY);
    return null;
  }

  return parsed;
}

export function saveState(state: AppState) {
  if (typeof window === "undefined") {
    return;
  }

  const payload: StoredStateEnvelope = {
    version: STORAGE_VERSION,
    savedAt: new Date().toISOString(),
    state,
  };

  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(payload));
  } catch {
    // Storage can fail in private mode or when quota is exceeded. Ignore so the app keeps running.
  }
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

export function loadLockedProfile(): AppState["selectedUserId"] | null {
  if (typeof window === "undefined") {
    return null;
  }

  const value = window.localStorage.getItem(PROFILE_LOCK_KEY);
  return value === "joshua" || value === "natasha" ? value : null;
}

export function saveLockedProfile(userId: AppState["selectedUserId"] | null) {
  if (typeof window === "undefined") {
    return;
  }

  if (!userId) {
    window.localStorage.removeItem(PROFILE_LOCK_KEY);
    return;
  }

  window.localStorage.setItem(PROFILE_LOCK_KEY, userId);
}

export function loadRememberedProfile(): AppState["selectedUserId"] | null {
  if (typeof window === "undefined") {
    return null;
  }

  const value = window.localStorage.getItem(LAST_PROFILE_KEY);
  return value === "joshua" || value === "natasha" ? value : null;
}

export function saveRememberedProfile(userId: AppState["selectedUserId"] | null) {
  if (typeof window === "undefined") {
    return;
  }

  if (!userId) {
    window.localStorage.removeItem(LAST_PROFILE_KEY);
    return;
  }

  window.localStorage.setItem(LAST_PROFILE_KEY, userId);
}
