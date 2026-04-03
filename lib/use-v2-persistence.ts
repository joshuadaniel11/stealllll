"use client";

import {
  startTransition,
  useEffect,
  type Dispatch,
  type MutableRefObject,
  type SetStateAction,
} from "react";

import { getSyncedDomainStateHash, isCloudSyncConfigured, loadCloudSyncedDomainState, saveCloudSyncedDomainState } from "@/lib/cloud-sync";
import { createSeedState } from "@/lib/seed-data";
import {
  loadLegacyLockedProfile,
  loadLegacyOnboardingSeen,
  loadLegacyRawState,
  loadLegacyRememberedProfile,
  loadPersistedAppStateV2,
  loadState,
  loadStateEnvelope,
  loadSyncedStateUpdatedAt,
  removeLegacyStateKeys,
  saveLegacyBackup,
  savePersistedAppStateV2,
  saveSyncedStateUpdatedAt,
} from "@/lib/storage";
import type { AppState, DeviceState, SyncStatus, SyncedDomainState, UserId } from "@/lib/types";
import {
  buildDefaultDeviceState,
  buildDefaultSyncedDomainState,
  buildDeviceStateSnapshot,
  combinePersistedState,
  mergeSyncedDomainStates,
  migrateV1StateToV2,
  splitRuntimeStateToPersisted,
} from "@/lib/v2-state";

function toComparableTimestamp(value: string | null | undefined) {
  if (!value) {
    return 0;
  }

  const timestamp = Date.parse(value);
  return Number.isFinite(timestamp) ? timestamp : 0;
}

type UseV2PersistenceParams = {
  state: AppState;
  setState: Dispatch<SetStateAction<AppState>>;
  hydrated: boolean;
  setHydrated: Dispatch<SetStateAction<boolean>>;
  lockedProfile: UserId | null;
  setLockedProfile: Dispatch<SetStateAction<UserId | null>>;
  rememberedProfile: UserId | null;
  setRememberedProfile: Dispatch<SetStateAction<UserId | null>>;
  onboardingSeen: boolean;
  setOnboardingSeen: Dispatch<SetStateAction<boolean>>;
  setSyncStatus: Dispatch<SetStateAction<SyncStatus>>;
  setActiveTab: Dispatch<SetStateAction<"home" | "workout" | "progress">>;
  setHasEnteredProfile: Dispatch<SetStateAction<boolean>>;
  syncedDomainStateRef: MutableRefObject<SyncedDomainState | null>;
  lastLocalSyncedHashRef: MutableRefObject<string | null>;
  lastCloudSyncedHashRef: MutableRefObject<string | null>;
  lastKnownSyncUpdatedAtRef: MutableRefObject<string | null>;
};

export function useV2Persistence({
  state,
  setState,
  hydrated,
  setHydrated,
  lockedProfile,
  setLockedProfile,
  rememberedProfile,
  setRememberedProfile,
  onboardingSeen,
  setOnboardingSeen,
  setSyncStatus,
  setActiveTab,
  setHasEnteredProfile,
  syncedDomainStateRef,
  lastLocalSyncedHashRef,
  lastCloudSyncedHashRef,
  lastKnownSyncUpdatedAtRef,
}: UseV2PersistenceParams) {
  useEffect(() => {
    let cancelled = false;

    const hydrate = async () => {
      const seed = createSeedState();
      const localSyncedUpdatedAt = loadSyncedStateUpdatedAt();
      const persistedV2 = loadPersistedAppStateV2();
      const legacyEnvelope = loadStateEnvelope();
      const legacyState = legacyEnvelope?.state ?? loadState();
      const legacyLockedProfile = loadLegacyLockedProfile();
      const legacyRememberedProfile = loadLegacyRememberedProfile();
      const legacyOnboardingSeen = loadLegacyOnboardingSeen();
      const profileFromQuery =
        typeof window !== "undefined"
          ? new URLSearchParams(window.location.search).get("profile")
          : null;
      const launchProfile =
        profileFromQuery === "joshua" || profileFromQuery === "natasha" ? profileFromQuery : null;

      let deviceState = persistedV2?.deviceState ?? null;
      let syncedDomainState = persistedV2?.syncedDomainState ?? null;

      if (!persistedV2 && legacyState) {
        const legacyRawState = loadLegacyRawState();
        if (legacyRawState) {
          saveLegacyBackup(legacyRawState);
        }

        const migrated = migrateV1StateToV2(seed, legacyState, {
          lockedProfile: legacyLockedProfile,
          rememberedProfile: legacyRememberedProfile ?? seed.selectedUserId,
          onboardingSeen: legacyOnboardingSeen,
        });
        deviceState = migrated.deviceState;
        syncedDomainState = migrated.syncedDomainState;
        savePersistedAppStateV2({
          deviceState,
          syncedDomainState,
        });
        removeLegacyStateKeys();
      }

      deviceState ??= buildDefaultDeviceState(seed);
      syncedDomainState ??= buildDefaultSyncedDomainState(seed);

      const cloudSnapshot = await loadCloudSyncedDomainState();
      const cloudUpdatedAt = cloudSnapshot?.updatedAt ?? null;
      const mergedSyncedDomainState: SyncedDomainState =
        mergeSyncedDomainStates(syncedDomainState, cloudSnapshot?.syncedDomainState ?? null) ?? syncedDomainState;

      if (cancelled) {
        return;
      }

      const resolvedDeviceState: DeviceState = {
        ...deviceState,
        lockedProfile: deviceState.lockedProfile ?? legacyLockedProfile,
        rememberedProfile:
          deviceState.rememberedProfile ?? legacyRememberedProfile ?? deviceState.selectedUserId,
        onboardingSeen: deviceState.onboardingSeen || legacyOnboardingSeen,
      };
      const initialState = combinePersistedState(seed, resolvedDeviceState, mergedSyncedDomainState);
      const resolvedSelectedUserId =
        resolvedDeviceState.lockedProfile ?? launchProfile ?? resolvedDeviceState.rememberedProfile ?? initialState.selectedUserId;
      const syncedHash = getSyncedDomainStateHash(mergedSyncedDomainState);

      lastLocalSyncedHashRef.current = syncedHash;
      lastCloudSyncedHashRef.current = cloudSnapshot?.syncedDomainState
        ? getSyncedDomainStateHash(cloudSnapshot.syncedDomainState)
        : null;
      syncedDomainStateRef.current = mergedSyncedDomainState;
      lastKnownSyncUpdatedAtRef.current =
        toComparableTimestamp(localSyncedUpdatedAt) > toComparableTimestamp(cloudUpdatedAt)
          ? localSyncedUpdatedAt
          : cloudUpdatedAt;

      if (cloudUpdatedAt) {
        saveSyncedStateUpdatedAt(cloudUpdatedAt);
      }

      setLockedProfile(resolvedDeviceState.lockedProfile);
      setRememberedProfile(resolvedDeviceState.rememberedProfile);
      setOnboardingSeen(resolvedDeviceState.onboardingSeen);
      setSyncStatus(isCloudSyncConfigured() ? (cloudSnapshot ? "synced" : "local_only") : "local_only");
      setState({
        ...initialState,
        selectedUserId: resolvedSelectedUserId,
      });

      if (resolvedDeviceState.isSessionActive && resolvedDeviceState.activeWorkout?.userId === resolvedSelectedUserId) {
        startTransition(() => setActiveTab("workout"));
      } else if (launchProfile || resolvedDeviceState.rememberedProfile || resolvedDeviceState.lockedProfile) {
        startTransition(() => setActiveTab("home"));
      }

      if (resolvedDeviceState.lockedProfile || launchProfile || resolvedDeviceState.rememberedProfile) {
        setHasEnteredProfile(true);
      }

      if (typeof window !== "undefined" && launchProfile) {
        window.history.replaceState({}, "", window.location.pathname);
      }
      setHydrated(true);
    };

    void hydrate();

    return () => {
      cancelled = true;
    };
  }, [
    lastCloudSyncedHashRef,
    lastKnownSyncUpdatedAtRef,
    lastLocalSyncedHashRef,
    setActiveTab,
    setHasEnteredProfile,
    setHydrated,
    setLockedProfile,
    setOnboardingSeen,
    setRememberedProfile,
    setState,
    setSyncStatus,
    syncedDomainStateRef,
  ]);

  useEffect(() => {
    if (!hydrated) {
      return;
    }

    const persistedSnapshot = splitRuntimeStateToPersisted(state, {
      previousSyncedDomainState: syncedDomainStateRef.current,
      lockedProfile,
      rememberedProfile,
      onboardingSeen,
    });
    syncedDomainStateRef.current = persistedSnapshot.syncedDomainState;
    savePersistedAppStateV2(persistedSnapshot);

    const syncedHash = getSyncedDomainStateHash(persistedSnapshot.syncedDomainState);
    if (syncedHash !== lastLocalSyncedHashRef.current) {
      const updatedAt = new Date().toISOString();
      lastLocalSyncedHashRef.current = syncedHash;
      lastKnownSyncUpdatedAtRef.current = updatedAt;
      saveSyncedStateUpdatedAt(updatedAt);
    }
  }, [
    hydrated,
    lastKnownSyncUpdatedAtRef,
    lastLocalSyncedHashRef,
    lockedProfile,
    onboardingSeen,
    rememberedProfile,
    state,
    syncedDomainStateRef,
  ]);

  useEffect(() => {
    if (!hydrated || !isCloudSyncConfigured()) {
      return;
    }

    const syncedState = syncedDomainStateRef.current;
    if (!syncedState) {
      return;
    }

    const syncedHash = getSyncedDomainStateHash(syncedState);
    if (syncedHash === lastCloudSyncedHashRef.current) {
      return;
    }

    const timeout = window.setTimeout(() => {
      setSyncStatus("syncing");
      void saveCloudSyncedDomainState(syncedState).then((snapshot) => {
        if (!snapshot) {
          setSyncStatus("sync_issue");
          return;
        }

        lastCloudSyncedHashRef.current = syncedHash;
        lastKnownSyncUpdatedAtRef.current = snapshot.updatedAt;
        saveSyncedStateUpdatedAt(snapshot.updatedAt);
        setSyncStatus("synced");
      });
    }, 900);

    return () => window.clearTimeout(timeout);
  }, [
    hydrated,
    lastCloudSyncedHashRef,
    lastKnownSyncUpdatedAtRef,
    setSyncStatus,
    state,
    syncedDomainStateRef,
  ]);

  useEffect(() => {
    if (!hydrated || !isCloudSyncConfigured() || typeof document === "undefined") {
      return;
    }

    let cancelled = false;

    const syncFromCloud = async () => {
      const snapshot = await loadCloudSyncedDomainState();
      if (
        cancelled ||
        !snapshot?.syncedDomainState ||
        !snapshot.updatedAt ||
        toComparableTimestamp(snapshot.updatedAt) <= toComparableTimestamp(lastKnownSyncUpdatedAtRef.current)
      ) {
        return;
      }

      const mergedSyncedState: SyncedDomainState =
        mergeSyncedDomainStates(syncedDomainStateRef.current, snapshot.syncedDomainState) ??
        snapshot.syncedDomainState;
      const mergedHash = getSyncedDomainStateHash(mergedSyncedState);

      lastCloudSyncedHashRef.current = getSyncedDomainStateHash(snapshot.syncedDomainState);
      lastLocalSyncedHashRef.current = mergedHash;
      lastKnownSyncUpdatedAtRef.current = snapshot.updatedAt;
      saveSyncedStateUpdatedAt(snapshot.updatedAt);
      syncedDomainStateRef.current = mergedSyncedState;
      setSyncStatus("synced");

      setState((current) => {
        const seed = createSeedState();
        const next = combinePersistedState(
          seed,
          buildDeviceStateSnapshot(current, {
            lockedProfile,
            rememberedProfile,
            onboardingSeen,
          }),
          mergedSyncedState,
        );
        return {
          ...next,
          selectedUserId: current.selectedUserId,
        };
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
    }, 15000);

    document.addEventListener("visibilitychange", handleVisibility);

    return () => {
      cancelled = true;
      window.clearInterval(interval);
      document.removeEventListener("visibilitychange", handleVisibility);
    };
  }, [
    hydrated,
    lastCloudSyncedHashRef,
    lastKnownSyncUpdatedAtRef,
    lastLocalSyncedHashRef,
    lockedProfile,
    onboardingSeen,
    rememberedProfile,
    setState,
    setSyncStatus,
    syncedDomainStateRef,
  ]);
}
