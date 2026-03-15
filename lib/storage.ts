import type { AppState } from "@/lib/types";

const STORAGE_KEY = "workout-together-state-v2-clean-start";
const STORAGE_VERSION = 1;
const PROFILE_KEY = "workout-together-last-profile";
const PROFILE_LOCK_KEY = "workout-together-profile-lock";

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

export function loadState(): Partial<AppState> | null {
  if (typeof window === "undefined") {
    return null;
  }

  const raw = window.localStorage.getItem(STORAGE_KEY);
  if (!raw) {
    return null;
  }

  return deserializeState(raw);
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

  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(payload));
}

export function loadRememberedProfile(): AppState["selectedUserId"] | null {
  if (typeof window === "undefined") {
    return null;
  }

  const value = window.localStorage.getItem(PROFILE_KEY);
  return value === "joshua" || value === "natasha" ? value : null;
}

export function saveRememberedProfile(userId: AppState["selectedUserId"] | null) {
  if (typeof window === "undefined") {
    return;
  }

  if (!userId) {
    window.localStorage.removeItem(PROFILE_KEY);
    return;
  }

  window.localStorage.setItem(PROFILE_KEY, userId);
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
