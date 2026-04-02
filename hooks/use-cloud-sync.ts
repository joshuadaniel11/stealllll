"use client";

import { useEffect, useRef } from "react";
import { applyCloudState, getSyncedAppState, getSyncedStateHash, isCloudSyncConfigured, loadCloudSnapshot, saveCloudSnapshot } from "@/lib/cloud-sync";
import { loadSyncedStateUpdatedAt, saveSyncedStateUpdatedAt } from "@/lib/storage";
import type { AppState } from "@/lib/types";

function toComparableTimestamp(value: string | null | undefined) {
  if (!value) return 0;
  const ts = Date.parse(value);
  return Number.isFinite(ts) ? ts : 0;
}

type UseCloudSyncOptions = {
  hydrated: boolean;
  state: AppState;
  setState: React.Dispatch<React.SetStateAction<AppState>>;
};

/**
 * Manages all cloud sync effects:
 * - Debounced push when local state hash changes (900ms)
 * - Pull on tab visibility + 15s interval when tab is visible
 */
export function useCloudSync({ hydrated, state, setState }: UseCloudSyncOptions) {
  const lastLocalSyncedHashRef = useRef<string | null>(null);
  const lastCloudSyncedHashRef = useRef<string | null>(null);
  const lastKnownSyncUpdatedAtRef = useRef<string | null>(null);

  // Debounced push: fires 900ms after any state change whose hash differs
  useEffect(() => {
    if (!hydrated || !isCloudSyncConfigured()) {
      return;
    }

    const syncedHash = getSyncedStateHash(getSyncedAppState(state));
    if (syncedHash === lastCloudSyncedHashRef.current) {
      return;
    }

    const timeout = window.setTimeout(() => {
      void saveCloudSnapshot(state).then((snapshot) => {
        if (!snapshot) return;
        lastCloudSyncedHashRef.current = syncedHash;
        lastKnownSyncUpdatedAtRef.current = snapshot.updatedAt;
        saveSyncedStateUpdatedAt(snapshot.updatedAt);
      });
    }, 900);

    return () => window.clearTimeout(timeout);
  }, [state, hydrated]);

  // Pull on visibility change + 15s polling
  useEffect(() => {
    if (!hydrated || !isCloudSyncConfigured() || typeof document === "undefined") {
      return;
    }

    let cancelled = false;

    const syncFromCloud = async () => {
      const snapshot = await loadCloudSnapshot();
      if (
        cancelled ||
        !snapshot?.state ||
        !snapshot.updatedAt ||
        toComparableTimestamp(snapshot.updatedAt) <= toComparableTimestamp(lastKnownSyncUpdatedAtRef.current)
      ) {
        return;
      }

      lastCloudSyncedHashRef.current = getSyncedStateHash(snapshot.state);
      lastKnownSyncUpdatedAtRef.current = snapshot.updatedAt;
      saveSyncedStateUpdatedAt(snapshot.updatedAt);

      setState((current) => {
        const next = applyCloudState(current, snapshot.state ?? {});
        lastLocalSyncedHashRef.current = getSyncedStateHash(getSyncedAppState(next));
        return next;
      });
    };

    const handleVisibility = () => {
      if (document.visibilityState === "visible") {
        void syncFromCloud();
      }
    };

    const interval = window.setInterval(() => {
      if (document.visibilityState === "visible") {
        void syncFromCloud();
      }
    }, 15_000);

    document.addEventListener("visibilitychange", handleVisibility);

    return () => {
      cancelled = true;
      window.clearInterval(interval);
      document.removeEventListener("visibilitychange", handleVisibility);
    };
  }, [hydrated, setState]);

  return {
    lastLocalSyncedHashRef,
    lastCloudSyncedHashRef,
    lastKnownSyncUpdatedAtRef,
    // Expose initializer so the hydration effect can seed the refs
    initRefs: (opts: {
      localHash: string;
      cloudHash: string | null;
      knownUpdatedAt: string | null;
    }) => {
      lastLocalSyncedHashRef.current = opts.localHash;
      lastCloudSyncedHashRef.current = opts.cloudHash;
      lastKnownSyncUpdatedAtRef.current = opts.knownUpdatedAt;
    },
  };
}

/**
 * Reads initial cloud/local state during app hydration.
 * Returns all values needed to seed the app state and sync refs.
 */
export async function resolveInitialState(seed: AppState) {
  const { loadStateEnvelope, loadState, loadLockedProfile, loadRememberedProfile } = await import("@/lib/storage");
  const { mergeStateWithSeed } = await import("@/lib/app-state");
  const { applyCloudState, getSyncedAppState, getSyncedStateHash } = await import("@/lib/cloud-sync");

  const localEnvelope = loadStateEnvelope();
  const localState = localEnvelope?.state ?? loadState();
  const localSyncedUpdatedAt = loadSyncedStateUpdatedAt();
  const cloudSnapshot = await loadCloudSnapshot();
  const cloudUpdatedAt = cloudSnapshot?.updatedAt ?? null;
  const shouldUseCloud =
    Boolean(cloudSnapshot?.state) &&
    toComparableTimestamp(cloudUpdatedAt) > toComparableTimestamp(localSyncedUpdatedAt);

  const deviceLockedProfile = loadLockedProfile();
  const rememberedProfile = loadRememberedProfile();
  const profileFromQuery =
    typeof window !== "undefined"
      ? new URLSearchParams(window.location.search).get("profile")
      : null;
  const launchProfile =
    profileFromQuery === "joshua" || profileFromQuery === "natasha" ? profileFromQuery : null;

  const mergedLocalState = localState ? mergeStateWithSeed(seed, localState) : seed;
  const initialState =
    shouldUseCloud && cloudSnapshot?.state
      ? applyCloudState(mergedLocalState, cloudSnapshot.state)
      : mergedLocalState;

  const resolvedSelectedUserId =
    deviceLockedProfile ?? launchProfile ?? rememberedProfile ?? initialState.selectedUserId;

  const localHash = getSyncedStateHash(getSyncedAppState(initialState));
  const cloudHash = shouldUseCloud
    ? localHash
    : cloudSnapshot?.state
      ? getSyncedStateHash(cloudSnapshot.state)
      : null;
  const knownUpdatedAt = shouldUseCloud
    ? cloudUpdatedAt
    : localSyncedUpdatedAt ?? cloudUpdatedAt;

  if (shouldUseCloud && cloudUpdatedAt) {
    saveSyncedStateUpdatedAt(cloudUpdatedAt);
  }

  return {
    initialState,
    resolvedSelectedUserId,
    deviceLockedProfile,
    launchProfile,
    rememberedProfile,
    localHash,
    cloudHash,
    knownUpdatedAt,
  };
}
