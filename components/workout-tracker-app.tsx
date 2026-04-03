"use client";

import { startTransition, useCallback, useEffect, useMemo, useRef, useState, type CSSProperties } from "react";
import { ErrorBoundary, SectionErrorBoundary } from "@/components/error-boundary";
import { useUIState } from "@/hooks/use-ui-state";
import { useInstallPrompt } from "@/hooks/use-install-prompt";
import { useCloudSync } from "@/hooks/use-cloud-sync";
import clsx from "clsx";
import { Settings } from "lucide-react";

import { AppNav } from "@/components/app-nav";
import { BibleVerseModal } from "@/components/bible-verse-modal";
import { CompletionCelebration } from "@/components/completion-celebration";
import { ExerciseDetailModal } from "@/components/exercise-detail-modal";
import { HomeScreen } from "@/components/home-screen";
import { EditWorkoutModal } from "@/components/edit-workout-modal";
import { OnboardingModal } from "@/components/onboarding-modal";
import { ProfileEntryScreen } from "@/components/profile-entry-screen";
import { ProgressScreen } from "@/components/progress-screen";
import { SessionSummaryModal, type SessionSummary } from "@/components/session-summary-modal";
import { SettingsModal } from "@/components/settings-modal";
import { Card } from "@/components/ui";
import { WorkoutFeelingModal } from "@/components/workout-feeling-modal";
import { WorkoutScreen } from "@/components/workout-screen";
import { getCoupleIntelligenceSummary } from "@/lib/couple-intelligence";
import {
  addStretchCompletion,
  appendSession,
  clearActiveWorkoutForUser,
  removeStretchCompletionsForDay,
  replaceSession,
  resetProfileProgressState,
  saveMeasurementEntry,
  setSelectedUserId,
  setWorkoutOverride,
} from "@/lib/app-actions";
import { isValidImportedState, mergeStateWithSeed } from "@/lib/app-state";
import { applyCloudState, getSyncedAppState, getSyncedStateHash, isCloudSyncConfigured, loadCloudSnapshot, saveCloudSnapshot } from "@/lib/cloud-sync";
import {
  buildMuscleCeilingLogEntries,
  getRivalryCardCopy,
  getMomentumPillCopy,
  getMonthlyReportCard,
  getProfileSessions,
  getProfileTrainingState,
  getQueuedWorkoutForProfile,
  getRestDayRead,
  getRestRecoveryLabel,
  getStealState,
  getStreakAndMomentum,
  getWeddingRivalryState,
  syncLiftReadyHistory,
  syncTrainingAgeState,
  getWeeklyRivalryState,
  syncProfileMaturityState,
  syncStealArchive,
  syncWeeklyRivalryArchive,
  syncMonthlyReportArchive,
} from "@/lib/profile-training-state";
import { getCurrentWeekWindow } from "@/lib/training-load";
import { getWeekStreakMilestone, HapticService, isPrApproachSet } from "@/lib/haptics";
import { buildActiveLiveSignal, buildSessionSignalLogEntry, getLiveSessionSignal } from "@/lib/live-session-signal";
import { getLastExerciseSets, getWorkoutPrSummary } from "@/lib/progression";
import { createSeedState } from "@/lib/seed-data";
import { getWeddingPhaseTransitionCopy, WeddingDateService } from "@/lib/wedding-date";
import {
  deserializeState,
  loadLockedProfile,
  loadRememberedProfile,
  loadState,
  loadStateEnvelope,
  loadSyncedStateUpdatedAt,
  saveLockedProfile,
  saveRememberedProfile,
  saveState,
  saveSyncedStateUpdatedAt,
} from "@/lib/storage";
import { getStrengthPredictions } from "@/lib/strength-prediction";
import {
  buildCompletedSession,
  buildResumedActiveWorkout,
  buildSessionSummary,
  countLoggedSets,
} from "@/lib/workout-session";
import { selectDailyMobilityPrompt } from "@/lib/daily-mobility";
import type { SuggestedFocusSession } from "@/lib/training-load";
import type { ActiveWorkout, AppState, ExerciseLibraryItem, HapticEvent, MuscleKey, RecentTrainingUpdate, ExerciseTemplate, Profile, SetLog, UserId, WorkoutPlanDay, WorkoutSession } from "@/lib/types";
import { buildCoachReadModel, buildWorkoutViewModel, buildProgressViewModel } from "@/lib/view-models";

const ONBOARDING_KEY = "workout-together-onboarding-seen-v1";

function isSameLocalDay(a: string, b: Date) {
  return new Date(a).toDateString() === b.toDateString();
}

function getLatestPartialSessionForWorkout(
  sessions: WorkoutSession[],
  userId: UserId,
  workoutDayId: string,
) {
  return (
    sessions.find(
      (session) => session.userId === userId && session.workoutDayId === workoutDayId && session.partial,
    ) ?? null
  );
}

function buildEmptySets(exercise: ExerciseTemplate, previousSets: SetLog[] = []): SetLog[] {
  return Array.from({ length: exercise.sets }, (_, index) => ({
    id: `${exercise.id}-${index}-${Date.now()}`,
    weight: previousSets[index]?.weight ?? previousSets.at(-1)?.weight ?? 0,
    reps: 0,
    completed: false,
  }));
}

function toActiveWorkout(
  userId: UserId,
  workout: WorkoutPlanDay,
  sessions: WorkoutSession[],
  exerciseLibrary: ExerciseLibraryItem[],
  exerciseSwapMemory: Record<string, string>,
): ActiveWorkout {
  return {
    id: `active-${Date.now()}`,
    userId,
    startedAt: new Date().toISOString(),
    workoutDayId: workout.id,
    workoutName: workout.name,
    liveSignal: null,
    hapticState: {
      prApproachSetKeys: [],
    },
    exercises: workout.exercises.map((exercise) => {
      const rememberedSwapId = exerciseSwapMemory[exercise.id];
      const rememberedSwap = rememberedSwapId
        ? exerciseLibrary.find((item) => item.id === rememberedSwapId)
        : null;
      const activeExerciseName = rememberedSwap?.name ?? exercise.name;
      const activeMuscleGroup = rememberedSwap?.muscleGroup ?? exercise.muscleGroup;

      return {
        exerciseId: rememberedSwap?.id ?? exercise.id,
        exerciseName: activeExerciseName,
        muscleGroup: activeMuscleGroup,
        primaryMuscles: rememberedSwap?.primaryMuscles ?? exercise.primaryMuscles,
        secondaryMuscles: rememberedSwap?.secondaryMuscles ?? exercise.secondaryMuscles,
        note: rememberedSwap?.cues[0] ?? "",
        sets: buildEmptySets(exercise, getLastExerciseSets(activeExerciseName, sessions)),
      };
    }),
  };
}

function toSuggestedFocusActiveWorkout(
  userId: UserId,
  session: SuggestedFocusSession,
  sessions: WorkoutSession[],
) {
  const templateExercises = session.exercises
    .filter(
      (
        exercise,
      ): exercise is typeof exercise & { exerciseId: string; sets: number; repRange: string } =>
        Boolean(exercise.exerciseId) && Boolean(exercise.sets) && Boolean(exercise.repRange),
    )
    .map((exercise) => ({
      id: exercise.exerciseId,
      name: exercise.name,
      muscleGroup: exercise.muscleGroup,
      primaryMuscles: [] as MuscleKey[],
      secondaryMuscles: [] as MuscleKey[],
      sets: exercise.sets,
      repRange: exercise.repRange,
      suggestedRepTarget: exercise.suggestedRepTarget ?? undefined,
      note: exercise.note,
    }));

  return {
    id: `active-focus-${Date.now()}`,
    userId,
    startedAt: new Date().toISOString(),
    workoutDayId: session.sourceWorkoutId ?? `focus-session-${userId}`,
    workoutName: `${session.focusText} Focus Session`,
    liveSignal: null,
    ceilingResponses: session.ceilingAppliedResponses,
    hapticState: {
      prApproachSetKeys: [],
    },
    templateExercises,
    exercises: templateExercises.map((exercise) => ({
      exerciseId: exercise.id,
      exerciseName: exercise.name,
      muscleGroup: exercise.muscleGroup,
      primaryMuscles: exercise.primaryMuscles,
      secondaryMuscles: exercise.secondaryMuscles,
      note: exercise.note ?? "",
      sets: buildEmptySets(exercise, getLastExerciseSets(exercise.name, sessions)),
    })),
  };
}

function normalizeCompletedWorkoutName(workoutName: string) {
  return workoutName.replace(/\s*\(Partial\)$/i, "");
}

function sanitizeSetInput(field: "weight" | "reps", value: number) {
  if (!Number.isFinite(value) || value < 0) {
    return 0;
  }

  if (field === "reps") {
    return Math.floor(value);
  }

  return Number(value.toFixed(2));
}

function toComparableTimestamp(value: string | null | undefined) {
  if (!value) {
    return 0;
  }

  const timestamp = Date.parse(value);
  return Number.isFinite(timestamp) ? timestamp : 0;
}

function getUpdatedLongestStreaks(
  currentState: AppState,
  userId: UserId,
  profile: Profile,
  sessions: WorkoutSession[],
) {
  const nextLongest = getStreakAndMomentum(profile, sessions, new Date(), currentState.longestStreaks[userId]).longestStreak;
  return {
    ...currentState.longestStreaks,
    [userId]: Math.max(currentState.longestStreaks[userId], nextLongest),
  };
}

function appendSessionSignalLog(currentState: AppState, session: WorkoutSession) {
  const signalLogEntry = buildSessionSignalLogEntry(session);
  if (!signalLogEntry) {
    return currentState.sessionSignalLog;
  }

  if (currentState.sessionSignalLog.some((entry) => entry.sessionId === signalLogEntry.sessionId)) {
    return currentState.sessionSignalLog;
  }

  return [signalLogEntry, ...currentState.sessionSignalLog];
}

function appendCeilingLog(
  currentState: AppState,
  profile: Profile,
  session: WorkoutSession,
  appliedResponses: ActiveWorkout["ceilingResponses"] = {},
) {
  const nextEntries = buildMuscleCeilingLogEntries(
    profile,
    session,
    currentState.sessions.filter((entry) => entry.userId === profile.id),
    appliedResponses,
  );

  if (!nextEntries.length) {
    return currentState.ceilingLog;
  }

  const existingKeys = new Set(currentState.ceilingLog.map((entry) => `${entry.sessionId}:${entry.muscleGroup}`));
  return [
    ...nextEntries.filter((entry) => !existingKeys.has(`${entry.sessionId}:${entry.muscleGroup}`)),
    ...currentState.ceilingLog,
  ];
}

function getInstallCopy(
  canPrompt: boolean,
  isStandalone: boolean,
  isIos: boolean,
) {
  if (isStandalone) {
    return {
      actionLabel: "Installed",
      helperText: "STEAL is running in standalone mode on this phone.",
    };
  }

  if (canPrompt) {
    return {
      actionLabel: "Install STEAL",
      helperText: "Install it from this browser for a cleaner launch, icon, and full-screen feel.",
    };
  }

  if (isIos) {
    return {
      actionLabel: "Add STEAL to Home Screen",
      helperText: "Open in Safari, tap Share, then Add to Home Screen for the proper iPhone app feel.",
    };
  }

  return {
    actionLabel: "Install from browser menu",
    helperText: "Use your browser's install or Add to Home Screen option for the proper app shell.",
  };
}

function WorkoutTrackerAppInner() {
  // Core app state — kept here since it feeds into every hook and handler
  const [state, setState] = useState<AppState>(createSeedState);
  const [hydrated, setHydrated] = useState(false);
  const [lockedProfile, setLockedProfile] = useState<UserId | null>(null);
  const [weddingDayKey, setWeddingDayKey] = useState(() => new Date().toDateString());
  const [phaseTransitionLines, setPhaseTransitionLines] = useState<Record<UserId, string | null>>({
    joshua: null,
    natasha: null,
  });
  const [recentTrainingUpdate, setRecentTrainingUpdate] = useState<RecentTrainingUpdate | null>(null);
  const previousRivalryLeaderRef = useRef<"joshua" | "natasha" | "tied" | null>(null);

  // UI state (navigation, modals, toast) — extracted into a hook
  const {
    showToast,
    activeTab,
    setActiveTab,
    scrollY,
    hasEnteredProfile,
    setHasEnteredProfile,
    profileEntryTransition,
    setProfileEntryTransition,
    showDailyVerse,
    setShowDailyVerse,
    showWorkoutFeelingPrompt,
    setShowWorkoutFeelingPrompt,
    showSettings,
    setShowSettings,
    showOnboarding,
    setShowOnboarding,
    workoutPreviewId,
    setWorkoutPreviewId,
    suggestedSessionPreview,
    setSuggestedSessionPreview,
    selectedExerciseId,
    setSelectedExerciseId,
    editingSessionId,
    setEditingSessionId,
    sessionSummary,
    setSessionSummary,
    // Backward-compat aliases for render code
    showCompletionCelebration,
    completionTitle,
    completionMessage,
    toastActionLabel,
    toastActionKind,
    pendingScheduleUndo,
  } = useUIState();

  // PWA install prompt state — extracted into a hook
  const {
    isStandalone,
    setIsStandalone,
    showInstallLaunch,
    deferredInstallPrompt,
    setDeferredInstallPrompt,
    isIosInstallPath,
  } = useInstallPrompt(() => showToast("STEAL is installed on this phone."));

  // Cloud sync (debounced push + visibility-triggered pull) — extracted into a hook
  const cloudSync = useCloudSync({ hydrated, state, setState });

  const weddingDate = useMemo(() => WeddingDateService.getState(new Date(weddingDayKey)), [weddingDayKey]);

  const markTrainingStateUpdated = (
    userId: UserId,
    workoutName: string,
    kind: "partial" | "complete" | "edit",
  ) => {
    setRecentTrainingUpdate({
      userId,
      workoutName,
      kind,
      timestamp: new Date().toISOString(),
    });
  };

  useEffect(() => {
    let cancelled = false;

    const hydrate = async () => {
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

      if (cancelled) {
        return;
      }

      const seed = createSeedState();
      const mergedLocalState = localState ? mergeStateWithSeed(seed, localState) : seed;
      const initialState =
        shouldUseCloud && cloudSnapshot?.state
          ? applyCloudState(mergedLocalState, cloudSnapshot.state)
          : mergedLocalState;
      const resolvedSelectedUserId =
        deviceLockedProfile ?? launchProfile ?? rememberedProfile ?? initialState.selectedUserId;
      const syncedHash = getSyncedStateHash(getSyncedAppState(initialState));

      cloudSync.initRefs({
        localHash: syncedHash,
        cloudHash: shouldUseCloud
          ? syncedHash
          : cloudSnapshot?.state
            ? getSyncedStateHash(cloudSnapshot.state)
            : null,
        knownUpdatedAt: shouldUseCloud
          ? cloudUpdatedAt
          : localSyncedUpdatedAt ?? cloudUpdatedAt,
      });

      if (shouldUseCloud && cloudUpdatedAt) {
        saveSyncedStateUpdatedAt(cloudUpdatedAt);
      }

      setLockedProfile(deviceLockedProfile);
      setState((current) => ({
        ...current,
        ...initialState,
        selectedUserId: resolvedSelectedUserId,
      }));

      if (initialState.isSessionActive && initialState.activeWorkout?.userId === resolvedSelectedUserId) {
        setActiveTab("workout");
      } else if (launchProfile || rememberedProfile || deviceLockedProfile) {
        setActiveTab("home");
      }

      if (deviceLockedProfile || launchProfile || rememberedProfile) {
        setHasEnteredProfile(true);
      }

      if (typeof window !== "undefined" && launchProfile) {
        window.history.replaceState({}, "", window.location.pathname);
      }
      if (typeof window !== "undefined" && !window.localStorage.getItem(ONBOARDING_KEY)) {
        setShowOnboarding(true);
      }
      setHydrated(true);
    };

    void hydrate();

    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Install prompt logic is handled by useInstallPrompt above.

  useEffect(() => {
    if (!hydrated) {
      return;
    }

    saveState(state);

    const syncedHash = getSyncedStateHash(getSyncedAppState(state));
    if (syncedHash !== cloudSync.lastLocalSyncedHashRef.current) {
      const updatedAt = new Date().toISOString();
      cloudSync.lastLocalSyncedHashRef.current = syncedHash;
      cloudSync.lastKnownSyncUpdatedAtRef.current = updatedAt;
      saveSyncedStateUpdatedAt(updatedAt);
    }
  }, [state, hydrated, cloudSync]);

  // Cloud sync push + pull are handled by useCloudSync above.

  useEffect(() => {
    const now = new Date();
    const nextMidnight = new Date(now);
    nextMidnight.setHours(24, 0, 0, 0);
    const timeout = window.setTimeout(() => {
      setWeddingDayKey(new Date().toDateString());
    }, Math.max(1000, nextMidnight.getTime() - now.getTime()));

    return () => window.clearTimeout(timeout);
  }, [weddingDayKey]);

  useEffect(() => {
    if (!hydrated) {
      return;
    }

    const currentPhase = weddingDate.currentPhase;
    const nextLines = {
      joshua: getWeddingPhaseTransitionCopy("joshua", state.lastSeenWeddingPhase.joshua, currentPhase),
      natasha: getWeddingPhaseTransitionCopy("natasha", state.lastSeenWeddingPhase.natasha, currentPhase),
    } satisfies Record<UserId, string | null>;

    if (nextLines.joshua || nextLines.natasha) {
      setPhaseTransitionLines(nextLines);
    }

    if (state.lastSeenWeddingPhase.joshua === currentPhase && state.lastSeenWeddingPhase.natasha === currentPhase) {
      return;
    }

    setState((current) => ({
      ...current,
      lastSeenWeddingPhase: {
        joshua: currentPhase,
        natasha: currentPhase,
      },
    }));
  }, [hydrated, state.lastSeenWeddingPhase, weddingDate.currentPhase]);

  useEffect(() => {
    if (!hydrated) {
      return;
    }

    setState((current) => syncLiftReadyHistory(current, new Date()));
  }, [hydrated, weddingDayKey]);

  useEffect(() => {
    if (!hydrated) {
      return;
    }

    setState((current) => syncWeeklyRivalryArchive(current, new Date()));
  }, [hydrated, state.sessions]);

  useEffect(() => {
    if (!hydrated) {
      return;
    }

    setState((current) => syncStealArchive(current, new Date()));
  }, [hydrated, state.sessions]);

  useEffect(() => {
    if (!hydrated) {
      return;
    }

    setState((current) => syncMonthlyReportArchive(current, new Date()));
  }, [hydrated, state.sessions]);

  // Scroll tracking and toast auto-dismiss are handled by useUIState above.

  const selectedProfile = useMemo(
    () => state.profiles.find((profile) => profile.id === state.selectedUserId) ?? state.profiles[0],
    [state.profiles, state.selectedUserId],
  );

  const trainingState = useMemo(
    () =>
      getProfileTrainingState(
        selectedProfile,
        state.sessions,
        state.exerciseLibrary,
        new Date(),
        state.stretchCompletions[selectedProfile.id],
        state.longestStreaks[selectedProfile.id],
        state.workoutOverrides[selectedProfile.id] ?? null,
        state.profileCreatedAt[selectedProfile.id],
        state.profileActivationDates[selectedProfile.id],
        state.lastSeenWeddingPhase[selectedProfile.id],
      ),
    [
      selectedProfile,
      state.exerciseLibrary,
      state.profileActivationDates,
      state.profileCreatedAt,
      state.lastSeenWeddingPhase,
      state.longestStreaks,
      state.sessions,
      state.stretchCompletions,
      state.workoutOverrides,
    ],
  );
  const {
    nextFocusDestination,
    recentWorkouts,
    recentSessions,
    streak,
    suggestedFocusSession,
    totalWorkouts,
    trendData,
    userSessions,
    weeklyCount,
    weeklySummary: dynamicWeeklySummary,
  } = trainingState;
  const workoutOverride = state.workoutOverrides[selectedProfile.id]?.nextWorkoutId ?? null;
  const todaysWorkout = useMemo(
    () => getQueuedWorkoutForProfile(selectedProfile, userSessions, workoutOverride),
    [selectedProfile, userSessions, workoutOverride],
  );
  const todaysMobilityPrompt = useMemo(
    () => selectDailyMobilityPrompt(selectedProfile.id),
    [selectedProfile.id],
  );
  const strengthPredictions = useMemo(
    () => getStrengthPredictions(selectedProfile.id, userSessions),
    [selectedProfile.id, userSessions],
  );
  const dynamicSharedSummary = useMemo(
    () =>
      getCoupleIntelligenceSummary({
        sessions: state.sessions,
        measurements: state.measurements,
        weddingDate,
      }),
    [state.measurements, state.sessions, weddingDate],
  );
  const installState = useMemo(
    () => ({
      isStandalone,
      canPrompt: Boolean(deferredInstallPrompt),
      ...getInstallCopy(Boolean(deferredInstallPrompt), isStandalone, isIosInstallPath),
    }),
    [deferredInstallPrompt, isIosInstallPath, isStandalone],
  );
  const activeWorkoutTemplate = useMemo(() => {
    const matchedWorkout = selectedProfile.workoutPlan.find(
      (workout) => workout.id === state.activeWorkout?.workoutDayId,
    );

    if (matchedWorkout) {
      return matchedWorkout;
    }

    if (
      state.activeWorkout?.userId === selectedProfile.id &&
      state.activeWorkout.templateExercises?.length
    ) {
      return {
        id: state.activeWorkout.workoutDayId,
        name: state.activeWorkout.workoutName,
        focus: "Suggested focus session",
        dayLabel: "Today",
        durationMinutes: 35,
        exercises: state.activeWorkout.templateExercises,
      };
    }

    return undefined;
  }, [selectedProfile.id, selectedProfile.workoutPlan, state.activeWorkout]);

  const selectedExercise = useMemo(() => {
    if (!selectedExerciseId) {
      return null;
    }
    return (
      selectedProfile.workoutPlan.flatMap((workout) => workout.exercises).find((exercise) => exercise.id === selectedExerciseId) ??
      state.exerciseLibrary.find((exercise) => exercise.id === selectedExerciseId) ??
      null
    );
  }, [selectedExerciseId, selectedProfile, state.exerciseLibrary]);
  const profileRecentTrainingUpdate =
    recentTrainingUpdate?.userId === selectedProfile.id ? recentTrainingUpdate : null;
  const momentumPillText = useMemo(
    () =>
      getMomentumPillCopy(
        selectedProfile.id,
        trainingState.streakAndMomentum,
        trainingState.userSessions.some((session) => !session.partial),
        trainingState.maturityState.isObserving,
      ),
    [
      selectedProfile.id,
      trainingState.streakAndMomentum,
      trainingState.userSessions,
      trainingState.maturityState.isObserving,
    ],
  );
  const rivalryState = useMemo(() => {
    const week = getCurrentWeekWindow(new Date());
    const joshuaHistory = state.sessions.filter((session) => session.userId === "joshua");
    const natashaHistory = state.sessions.filter((session) => session.userId === "natasha");
    return getWeeklyRivalryState(joshuaHistory, natashaHistory, week.start, new Date());
  }, [state.sessions]);
  const rivalSessions = useMemo(() => {
    const week = getCurrentWeekWindow(new Date());
    const rivalId = selectedProfile.id === "joshua" ? "natasha" : "joshua";
    return state.sessions.filter(
      (session) =>
        session.userId === rivalId &&
        !session.partial &&
        new Date(session.performedAt) >= week.start,
    );
  }, [selectedProfile.id, state.sessions]);
  const stealState = useMemo(() => {
    const week = getCurrentWeekWindow(new Date());
    const joshuaHistory = state.sessions.filter((session) => session.userId === "joshua");
    const natashaHistory = state.sessions.filter((session) => session.userId === "natasha");
    return getStealState(joshuaHistory, natashaHistory, week.start, new Date());
  }, [state.sessions]);
  const weddingRivalryState = useMemo(() => {
    if (weddingDate.isPastWedding) {
      return null;
    }
    const joshuaHistory = state.sessions.filter((session) => session.userId === "joshua");
    const natashaHistory = state.sessions.filter((session) => session.userId === "natasha");
    return getWeddingRivalryState(
      joshuaHistory,
      natashaHistory,
      weddingDate.currentPhase,
      weddingDate.weeksRemaining,
      new Date(),
    );
  }, [state.sessions, weddingDate]);
  const rivalryCopy = useMemo(
    () =>
      getRivalryCardCopy(
        selectedProfile.id,
        rivalryState,
        stealState,
        trainingState.maturityState.isObserving,
        weddingRivalryState,
      ),
    [selectedProfile.id, rivalryState, stealState, trainingState.maturityState.isObserving, weddingRivalryState],
  );
  const hapticsEnabled = state.hapticPreferences[selectedProfile.id] ?? true;
  const monthlyReport = useMemo(() => {
    const now = new Date();
    const lastDayOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate();
    if (now.getDate() !== lastDayOfMonth) {
      return null;
    }

    const joshuaHistory = state.sessions.filter((session) => session.userId === "joshua");
    const natashaHistory = state.sessions.filter((session) => session.userId === "natasha");
    return getMonthlyReportCard(joshuaHistory, natashaHistory, now.getMonth(), now.getFullYear());
  }, [state.sessions]);
  const liveSessionSignal = useMemo(() => {
    if (
      trainingState.maturityState.isObserving ||
      !state.activeWorkout ||
      state.activeWorkout.userId !== selectedProfile.id
    ) {
      return null;
    }

    const currentSessionLike: WorkoutSession = {
      id: state.activeWorkout.id,
      userId: state.activeWorkout.userId,
      workoutDayId: state.activeWorkout.workoutDayId,
      workoutName: state.activeWorkout.workoutName,
      performedAt: state.activeWorkout.startedAt,
      durationMinutes: 0,
      liveSignal: state.activeWorkout.liveSignal ?? null,
      exercises: state.activeWorkout.exercises,
      feeling: "Solid",
    };

    return getLiveSessionSignal(
      selectedProfile,
      currentSessionLike,
      userSessions,
      state.sessionSignalLog.filter((entry) => entry.userId === selectedProfile.id),
      new Date(),
    );
  }, [selectedProfile, state.activeWorkout, state.sessionSignalLog, trainingState.maturityState.isObserving, userSessions]);
  const restDayRead = useMemo(
    () =>
      getRestDayRead(
        selectedProfile.id,
        trainingState.restDayState.restReason,
        trainingState.maturityState.isObserving,
      ),
    [selectedProfile.id, trainingState.restDayState.restReason, trainingState.maturityState.isObserving],
  );
  const restRecoveryLabel = useMemo(
    () => getRestRecoveryLabel(trainingState.restDayState.recoveryScore),
    [trainingState.restDayState.recoveryScore],
  );

  const coach = useMemo(
    () =>
      buildCoachReadModel({
        profile: selectedProfile,
        trainingState,
        todaysWorkout,
        activeWorkout: state.activeWorkout ?? null,
        suggestedFocusSession,
        restDayRead,
        syncStatus: "local_only",
      }),
    [selectedProfile, trainingState, todaysWorkout, state.activeWorkout, suggestedFocusSession, restDayRead],
  );

  const editingSession = useMemo(
    () => state.sessions.find((session) => session.id === editingSessionId) ?? null,
    [editingSessionId, state.sessions],
  );

  const triggerHaptic = useCallback(
    (event: HapticEvent, userId: UserId = selectedProfile.id) => {
      HapticService.setEnabled(state.hapticPreferences[userId] ?? true);
      HapticService.trigger(event);
    },
    [selectedProfile.id, state.hapticPreferences],
  );

  useEffect(() => {
    setState((current) => syncProfileMaturityState(current, new Date()));
  }, [state.profileActivationDates, state.profileCreatedAt, state.sessions]);

  useEffect(() => {
    setState((current) => syncTrainingAgeState(current));
  }, [state.sessions]);

  useEffect(() => {
    if (!liveSessionSignal?.shouldFire || !state.activeWorkout || state.activeWorkout.userId !== selectedProfile.id) {
      return;
    }

    setState((current) => {
      if (!current.activeWorkout || current.activeWorkout.userId !== selectedProfile.id || current.activeWorkout.liveSignal?.signalType) {
        return current;
      }

      const next = structuredClone(current);
      if (!next.activeWorkout) {
        return current;
      }
      next.activeWorkout.liveSignal = buildActiveLiveSignal(liveSessionSignal);
      return next;
    });
  }, [liveSessionSignal, selectedProfile.id, state.activeWorkout]);

  useEffect(() => {
    HapticService.setEnabled(hapticsEnabled);
  }, [hapticsEnabled]);

  useEffect(() => {
    if (typeof document === "undefined") {
      return;
    }

    const syncVisibility = () => {
      HapticService.notifyVisibilityChange(document.visibilityState === "visible");
    };

    syncVisibility();
    document.addEventListener("visibilitychange", syncVisibility);
    return () => document.removeEventListener("visibilitychange", syncVisibility);
  }, []);

  useEffect(() => {
    const previousLeader = previousRivalryLeaderRef.current;
    if (previousLeader === null) {
      previousRivalryLeaderRef.current = rivalryState.leader;
      return;
    }

    const recentTrainingChange =
      recentTrainingUpdate &&
      Date.now() - new Date(recentTrainingUpdate.timestamp).getTime() < 5_000;

    if (
      recentTrainingChange &&
      previousLeader !== rivalryState.leader &&
      previousLeader !== "tied" &&
      rivalryState.leader !== "tied"
    ) {
      triggerHaptic("rivalry_lead_change");
    }

    previousRivalryLeaderRef.current = rivalryState.leader;
  }, [recentTrainingUpdate, rivalryState.leader, triggerHaptic]);


  const dailyVerse = useMemo(() => {
    const dayOfYear = Math.floor(
      (new Date().getTime() - new Date(new Date().getFullYear(), 0, 0).getTime()) / 86400000,
    );
    return state.bibleVerses[dayOfYear % state.bibleVerses.length];
  }, [state.bibleVerses]);

  const stretchCompletedToday = useMemo(
    () =>
      state.stretchCompletions[selectedProfile.id].some((entry) =>
        isSameLocalDay(entry.date, new Date()),
      ),
    [selectedProfile.id, state.stretchCompletions],
  );

  const startWorkout = (workout: WorkoutPlanDay) => {
    if (state.activeWorkout && state.activeWorkout.userId !== selectedProfile.id) {
      const activeOwner =
        state.profiles.find((profile) => profile.id === state.activeWorkout?.userId)?.name ??
        "The other profile";
      showToast(`${activeOwner} still has a workout in progress on this phone.`);
      return;
    }

    if (state.activeWorkout?.userId === selectedProfile.id) {
      showToast(`${state.activeWorkout.workoutName} is still open. Resume it before starting another workout.`);
      setSuggestedSessionPreview(false);
      setWorkoutPreviewId(null);
      startTransition(() => setActiveTab("workout"));
      return;
    }

    const savedPartial = getLatestPartialSessionForWorkout(userSessions, selectedProfile.id, workout.id);

    if (savedPartial) {
      setState((current) => {
        const currentPartial = current.sessions.find((session) => session.id === savedPartial.id);
        if (!currentPartial) {
          return current;
        }

        return {
          ...current,
          sessions: current.sessions.filter((session) => session.id !== currentPartial.id),
          isSessionActive: true,
          activeWorkout: buildResumedActiveWorkout(currentPartial, workout),
        };
      });
      setSuggestedSessionPreview(false);
      setWorkoutPreviewId(null);
      showToast(`Resumed your saved ${workout.dayLabel.toLowerCase()} session.`);
      startTransition(() => setActiveTab("workout"));
      return;
    }

    setState((current) => ({
      ...current,
      isSessionActive: true,
      activeWorkout: toActiveWorkout(
        selectedProfile.id,
        workout,
        userSessions,
        current.exerciseLibrary,
        current.exerciseSwapMemory[selectedProfile.id],
      ),
    }));
    setSuggestedSessionPreview(false);
    setWorkoutPreviewId(null);
    startTransition(() => setActiveTab("workout"));
  };

  const skipWorkout = () => {
    if (typeof window !== "undefined" && !window.confirm(`Skip ${todaysWorkout.dayLabel} for now?`)) {
      return;
    }
    const currentIndex = selectedProfile.workoutPlan.findIndex((workout) => workout.id === todaysWorkout.id);
    const nextWorkout = selectedProfile.workoutPlan[(currentIndex + 1) % selectedProfile.workoutPlan.length];
    const previousNextWorkoutId = state.workoutOverrides[selectedProfile.id]?.nextWorkoutId ?? null;

    setState((current) => setWorkoutOverride(current, selectedProfile.id, nextWorkout.id));
    showToast(`${todaysWorkout.dayLabel} was skipped. ${nextWorkout.dayLabel} is queued up next.`, {
      actionLabel: "Undo",
      actionKind: "undo-schedule",
      pendingScheduleUndo: { userId: selectedProfile.id, previousNextWorkoutId },
    });
  };

  const moveWorkout = (workoutId: string) => {
    const workout = selectedProfile.workoutPlan.find((item) => item.id === workoutId);
    const previousNextWorkoutId = state.workoutOverrides[selectedProfile.id]?.nextWorkoutId ?? null;
    setState((current) => setWorkoutOverride(current, selectedProfile.id, workoutId));
    showToast(`${workout?.dayLabel ?? "Workout"} is now lined up next.`, {
      actionLabel: "Undo",
      actionKind: "undo-schedule",
      pendingScheduleUndo: { userId: selectedProfile.id, previousNextWorkoutId },
    });
  };

  const openWorkoutCompletionPrompt = () => {
    if (!state.activeWorkout) {
      return;
    }
    const completedSets = countLoggedSets(state.activeWorkout.exercises);
    if (completedSets === 0) {
      showToast("Log at least one set before finishing the workout.");
      return;
    }
    setShowWorkoutFeelingPrompt(true);
  };

  const cancelWorkout = () => {
    if (!state.activeWorkout || state.activeWorkout.userId !== selectedProfile.id) {
      return;
    }
    setState((current) => ({
      ...clearActiveWorkoutForUser(current, selectedProfile.id),
      isSessionActive: false,
    }));
    setShowWorkoutFeelingPrompt(false);
    setSuggestedSessionPreview(false);
    setWorkoutPreviewId(null);
    startTransition(() => setActiveTab("home"));
  };

  const savePartialWorkout = () => {
    if (!state.activeWorkout || state.activeWorkout.userId !== selectedProfile.id) {
      return;
    }

    const completedSets = countLoggedSets(state.activeWorkout.exercises);

    if (completedSets === 0) {
      cancelWorkout();
      return;
    }

    const durationMinutes = Math.max(10, Math.round((Date.now() - +new Date(state.activeWorkout.startedAt)) / 60000));
    const activeWorkoutForSave =
      state.activeWorkout.liveSignal && !state.activeWorkout.liveSignal.dismissedAt
        ? {
            ...state.activeWorkout,
            liveSignal: {
              ...state.activeWorkout.liveSignal,
              dismissedAt: new Date().toISOString(),
            },
          }
        : state.activeWorkout;
    const completedSession = buildCompletedSession(activeWorkoutForSave, {
      durationMinutes,
      feeling: "Solid",
      partial: true,
    });

    setState((current) =>
      ({
        ...appendSession(current, completedSession, {
          clearActiveWorkoutForUser: selectedProfile.id,
          nextWorkoutId: state.activeWorkout?.workoutDayId ?? null,
        }),
        isSessionActive: false,
      }),
    );
      setShowWorkoutFeelingPrompt(false);
      setSuggestedSessionPreview(false);
      setWorkoutPreviewId(null);
      setSessionSummary(buildSessionSummary(completedSession, { partial: true }));
      markTrainingStateUpdated(selectedProfile.id, completedSession.workoutName, "partial");
      showToast("Progress saved. You can resume this workout from the Workout tab.", { title: "Workout saved" });
    startTransition(() => setActiveTab("home"));
  };

  const dismissLiveSessionSignal = useCallback(() => {
    setState((current) => {
      if (!current.activeWorkout?.liveSignal || current.activeWorkout.liveSignal.dismissedAt) {
        return current;
      }

      const next = structuredClone(current);
      if (!next.activeWorkout?.liveSignal) {
        return current;
      }
      next.activeWorkout.liveSignal.dismissedAt = new Date().toISOString();
      return next;
    });
  }, []);

  const completeWorkout = (feeling: WorkoutSession["feeling"]) => {
    if (!state.activeWorkout) {
      return;
    }
    const durationMinutes = Math.max(25, Math.round((Date.now() - +new Date(state.activeWorkout.startedAt)) / 60000));
    const completedSession = buildCompletedSession(state.activeWorkout, {
      durationMinutes,
      feeling,
    });
    const prSummary = getWorkoutPrSummary(completedSession, userSessions);
    const weekStreakMilestone = getWeekStreakMilestone(
      [completedSession, ...userSessions],
      state.firedWeekStreakMilestones[selectedProfile.id] ?? [],
      new Date(completedSession.performedAt),
    );
    setState((current) =>
      ({
        ...appendSession(current, completedSession, {
          clearActiveWorkoutForUser: selectedProfile.id,
          nextWorkoutId: null,
          updateSharedSummary: true,
          sharedSummaryName: selectedProfile.name,
        }),
        isSessionActive: false,
        sessionSignalLog: appendSessionSignalLog(current, completedSession),
        ceilingLog: appendCeilingLog(current, selectedProfile, completedSession, current.activeWorkout?.ceilingResponses),
        firedWeekStreakMilestones: weekStreakMilestone
          ? {
              ...current.firedWeekStreakMilestones,
              [selectedProfile.id]: [
                ...current.firedWeekStreakMilestones[selectedProfile.id],
                weekStreakMilestone,
              ],
            }
          : current.firedWeekStreakMilestones,
        longestStreaks: getUpdatedLongestStreaks(
          current,
          selectedProfile.id,
          selectedProfile,
          [
            completedSession,
            ...current.sessions.filter((session) => session.userId === selectedProfile.id),
          ],
        ),
      }),
    );
    setShowWorkoutFeelingPrompt(false);
    setSuggestedSessionPreview(false);
    setWorkoutPreviewId(null);
    setSessionSummary(buildSessionSummary(completedSession, {
      prCount: prSummary.count,
      prHighlights: prSummary.highlights,
    }));
    markTrainingStateUpdated(selectedProfile.id, completedSession.workoutName, "complete");
    triggerHaptic("session_complete");
    if (weekStreakMilestone) {
      triggerHaptic("week_streak");
    }
    startTransition(() => setActiveTab("home"));
  };

  const saveMeasurement = (entry: Omit<AppState["measurements"][UserId][number], "id" | "date">) => {
    if (!entry.bodyweightKg) {
      return;
    }
    setState((current) => saveMeasurementEntry(current, selectedProfile.id, entry));
  };

  const exportData = () => {
    const blob = new Blob([JSON.stringify(state, null, 2)], { type: "application/json" });
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `workout-together-backup-${new Date().toISOString().slice(0, 10)}.json`;
    link.click();
    window.URL.revokeObjectURL(url);
  };

  const importData = async (file: File | null) => {
    if (!file) {
      return;
    }
    try {
      const text = await file.text();
      const parsed = deserializeState(text);
      if (!parsed || !isValidImportedState(parsed)) {
        throw new Error("invalid-import");
      }
      const seed = createSeedState();
      setState(mergeStateWithSeed(seed, parsed));
      startTransition(() => setActiveTab("home"));
      showToast("Backup imported successfully.", { title: "Import complete" });
    } catch {
      showToast("Import failed. Please use a valid workout backup file.", { title: "Import failed" });
    }
  };

  const updateSet = (
    exerciseIndex: number,
    setIndex: number,
    field: "weight" | "reps",
    value: number,
  ) => {
    let shouldTriggerPrApproach = false;
    setState((current) => {
      if (!current.activeWorkout) {
        return current;
      }
      const next = structuredClone(current);
      if (!next.activeWorkout) {
        return current;
      }
      const activeExercise = next.activeWorkout.exercises[exerciseIndex];
      const targetSet = activeExercise.sets[setIndex];
      targetSet[field] = sanitizeSetInput(field, value);
      const prApproachKey = `${activeExercise.exerciseName}:${targetSet.id}`;
      const prApproachSetKeys = next.activeWorkout.hapticState?.prApproachSetKeys ?? [];
      const currentUserSessions = current.sessions.filter((session) => session.userId === next.activeWorkout?.userId);

      if (
        !prApproachSetKeys.includes(prApproachKey) &&
        isPrApproachSet(activeExercise.exerciseName, targetSet, currentUserSessions)
      ) {
        next.activeWorkout.hapticState = {
          prApproachSetKeys: [...prApproachSetKeys, prApproachKey],
        };
        shouldTriggerPrApproach = true;
      }
      return next;
    });
    if (shouldTriggerPrApproach) {
      triggerHaptic("pr_approach");
    }
  };

  const completeSet = (exerciseIndex: number, setIndex: number) => {
    let didSaveSet = false;
    setState((current) => {
      if (!current.activeWorkout) {
        return current;
      }
      const next = structuredClone(current);
      if (!next.activeWorkout) {
        return current;
      }
      const targetSet = next.activeWorkout.exercises[exerciseIndex].sets[setIndex];
      if (targetSet.weight <= 0 && targetSet.reps <= 0) {
        return current;
      }
      if (targetSet.completed) {
        return current;
      }
      targetSet.completed = true;
      didSaveSet = true;
      return next;
    });
    if (didSaveSet) {
      triggerHaptic("set_saved");
    }
  };

  const copyPreviousSet = (exerciseIndex: number, setIndex: number) => {
    setState((current) => {
      if (!current.activeWorkout || setIndex <= 0) {
        return current;
      }
      const next = structuredClone(current);
      if (!next.activeWorkout) {
        return current;
      }
      const previousSet = next.activeWorkout.exercises[exerciseIndex].sets[setIndex - 1];
      const targetSet = next.activeWorkout.exercises[exerciseIndex].sets[setIndex];
      if ((previousSet.weight <= 0 && previousSet.reps <= 0) || targetSet.completed) {
        return current;
      }
      targetSet.weight = previousSet.weight;
      targetSet.reps = previousSet.reps;
      return next;
    });
  };

  const swapExercise = (exerciseIndex: number, exerciseId: string) => {
    setState((current) => {
      if (!current.activeWorkout) {
        return current;
      }
      const replacement = current.exerciseLibrary.find((item) => item.id === exerciseId);
      if (!replacement) {
        return current;
      }
      const next = structuredClone(current);
      if (!next.activeWorkout) {
        return current;
      }
      const existing = next.activeWorkout.exercises[exerciseIndex];
      const targetProfile = next.profiles.find((profile) => profile.id === next.activeWorkout?.userId);
      const targetSessions = getProfileSessions(next.sessions, next.activeWorkout.userId);
      const templateForSlot = targetProfile?.workoutPlan
        .find((workout) => workout.id === next.activeWorkout?.workoutDayId)
        ?.exercises[exerciseIndex];
      const setCount = templateForSlot?.sets ?? existing.sets.length;
      const previousSets = getLastExerciseSets(replacement.name, targetSessions);
      const memoryKey = templateForSlot?.id ?? existing.exerciseId;

      next.activeWorkout.exercises[exerciseIndex] = {
        ...existing,
        exerciseId: replacement.id,
        exerciseName: replacement.name,
        muscleGroup: replacement.muscleGroup,
        note: replacement.cues[0] ?? existing.note ?? "",
        sets: Array.from({ length: setCount }, (_, setIndex) => ({
          id: `${replacement.id}-${setIndex}-${Date.now()}`,
          weight: previousSets[setIndex]?.weight ?? previousSets.at(-1)?.weight ?? 0,
          reps: 0,
          completed: false,
        })),
      };
      next.exerciseSwapMemory[next.activeWorkout.userId] = {
        ...next.exerciseSwapMemory[next.activeWorkout.userId],
        [memoryKey]: replacement.id,
      };
      return next;
    });
  };

  const saveStretchCompletion = () => {
    if (stretchCompletedToday) {
      return;
    }
    setState((current) =>
      addStretchCompletion(current, selectedProfile.id, todaysMobilityPrompt.primaryStretch.name),
    );
    showToast(`${selectedProfile.name} finished today's mobility prompt.`, { title: "Mobility done" });
  };

  const toggleStretchCompletion = () => {
    if (!stretchCompletedToday) {
      saveStretchCompletion();
      return;
    }

    setState((current) =>
      removeStretchCompletionsForDay(current, selectedProfile.id, (entry) => isSameLocalDay(entry.date, new Date())),
    );
    showToast(`${selectedProfile.name}'s mobility prompt was marked undone.`, { title: "Mobility updated" });
  };

  const closeOnboarding = () => {
    if (typeof window !== "undefined") {
      window.localStorage.setItem(ONBOARDING_KEY, "true");
    }
    setShowOnboarding(false);
  };

  const resetProfileData = () => {
    if (
      typeof window !== "undefined" &&
      !window.confirm(`Reset ${selectedProfile.name}'s saved progress on this phone?`)
    ) {
      return;
    }
    const seed = createSeedState();
    setState((current) => resetProfileProgressState(current, selectedProfile.id, seed));
    showToast(`${selectedProfile.name}'s saved progress was reset on this phone.`, { title: "Profile reset" });
    setShowSettings(false);
    startTransition(() => setActiveTab("home"));
  };

  const resetAllData = () => {
    if (typeof window !== "undefined" && !window.confirm("Reset the whole app to a clean start on this phone?")) {
      return;
    }
    if (typeof window !== "undefined") {
      window.localStorage.removeItem(ONBOARDING_KEY);
    }
    setState(createSeedState());
    setShowSettings(false);
    setShowOnboarding(true);
    showToast("The app was reset to a clean start.", { title: "App reset" });
    startTransition(() => setActiveTab("home"));
  };

  const isJoshuaTheme = selectedProfile.id === "joshua";
  const isNatashaTheme = selectedProfile.id === "natasha";
  const immersiveWorkoutMode = activeTab === "workout" && state.activeWorkout?.userId === selectedProfile.id;
  const compactHeader = scrollY > 18 && !(activeTab === "workout" && state.isSessionActive);
  const handleToastAction = () => {
    if (toastActionKind !== "undo-schedule" || !pendingScheduleUndo) {
      return;
    }

    setState((current) => setWorkoutOverride(current, pendingScheduleUndo.userId, pendingScheduleUndo.previousNextWorkoutId));
    showToast("Workout order change undone.", { title: "Plan restored" });
  };

  const enterProfile = (profileId: UserId) => {
    setProfileEntryTransition(profileId);
    saveRememberedProfile(profileId);
    window.setTimeout(() => {
      setSelectedExerciseId(null);
      setSuggestedSessionPreview(false);
      setWorkoutPreviewId(null);
      setShowSettings(false);
      setState((current) => setSelectedUserId(current, profileId));
      setHasEnteredProfile(true);
      setProfileEntryTransition(null);
      startTransition(() =>
        setActiveTab(
          state.isSessionActive && state.activeWorkout?.userId === profileId ? "workout" : "home",
        ),
      );
    }, 850);
  };

  const markTrainingAgeMilestoneShown = useCallback(() => {
    const milestone = trainingState.trainingAge.milestone;
    if (!milestone) {
      return;
    }

    setState((current) => {
      const existing = current.trainingAgeState[selectedProfile.id].milestonesShown;
      if (existing.includes(milestone)) {
        return current;
      }

      return {
        ...current,
        trainingAgeState: {
          ...current.trainingAgeState,
          [selectedProfile.id]: {
            ...current.trainingAgeState[selectedProfile.id],
            milestonesShown: [...existing, milestone],
          },
        },
      };
    });
  }, [selectedProfile.id, trainingState.trainingAge.milestone]);

  useEffect(() => {
    const milestone = trainingState.trainingAge.milestone;
    if (
      !showSettings ||
      !milestone ||
      state.trainingAgeState[selectedProfile.id].milestonesShown.includes(milestone)
    ) {
      return;
    }

    markTrainingAgeMilestoneShown();
  }, [
    markTrainingAgeMilestoneShown,
    selectedProfile.id,
    showSettings,
    state.trainingAgeState,
    trainingState.trainingAge.milestone,
  ]);

  if (showInstallLaunch) {
    return (
      <main className="theme-shell install-launch-shell flex min-h-screen items-center justify-center px-6 text-text">
        <div className="install-launch-card animate-soft-in text-center">
          <div className="install-launch-orb" />
          <p className="install-launch-mark">STEAL</p>
          <h1 className="install-launch-title">Joshua and Natasha</h1>
          <p className="install-launch-subtitle">
            {isStandalone ? "Ready when you are." : "Open and train beautifully."}
          </p>
        </div>
      </main>
    );
  }

  const returnToProfileEntry = () => {
    setSelectedExerciseId(null);
    setSuggestedSessionPreview(false);
    setWorkoutPreviewId(null);
    setShowSettings(false);
    if (lockedProfile) {
      return;
    }
    setHasEnteredProfile(false);
  };

  const promptInstall = async () => {
    if (deferredInstallPrompt) {
      await deferredInstallPrompt.prompt();
      try {
        await deferredInstallPrompt.userChoice;
      } catch {
        // Ignore rejected prompt-choice reads and continue clearing the prompt.
      }
      setDeferredInstallPrompt(null);
      return;
    }

    showToast(
      isIosInstallPath
        ? "Open this in Safari, tap Share, then Add to Home Screen."
        : "Use your browser menu and choose Install app or Add to Home Screen.",
      { title: "Install STEAL" },
    );
  };

  const toggleProfileLock = () => {
    if (lockedProfile === selectedProfile.id) {
      setLockedProfile(null);
      saveLockedProfile(null);
      showToast("This phone can switch between profiles again.", { title: "Phone unlocked" });
      return;
    }

    setLockedProfile(selectedProfile.id);
    saveLockedProfile(selectedProfile.id);
    saveRememberedProfile(selectedProfile.id);
    setHasEnteredProfile(true);
    showToast(`This phone is now locked to ${selectedProfile.name}.`, { title: "Phone locked" });
  };

  const toggleHaptics = () => {
    setState((current) => ({
      ...current,
      hapticPreferences: {
        ...current.hapticPreferences,
        [selectedProfile.id]: !(current.hapticPreferences[selectedProfile.id] ?? true),
      },
    }));
  };

  const saveEditedSession = (updatedSession: WorkoutSession, options?: { countAsDone?: boolean }) => {
    let weekStreakMilestone: number | null = null;
    setState((current) => {
      const existingSession = current.sessions.find((session) => session.id === updatedSession.id);
      const shouldAdvanceCycle =
        Boolean(options?.countAsDone) || Boolean(existingSession?.partial && updatedSession.partial === false);
      const replaced = replaceSession(current, updatedSession, { advanceWorkoutCycle: shouldAdvanceCycle });
      if (!shouldAdvanceCycle || updatedSession.partial) {
        return replaced;
      }
      weekStreakMilestone = getWeekStreakMilestone(
        replaced.sessions.filter((session) => session.userId === updatedSession.userId),
        current.firedWeekStreakMilestones[updatedSession.userId] ?? [],
        new Date(updatedSession.performedAt),
      );
      return {
        ...replaced,
        isSessionActive: false,
        sessionSignalLog: appendSessionSignalLog(current, updatedSession),
        ceilingLog: appendCeilingLog(
          current,
          current.profiles.find((profile) => profile.id === updatedSession.userId) ?? selectedProfile,
          updatedSession,
        ),
        firedWeekStreakMilestones: weekStreakMilestone
          ? {
              ...current.firedWeekStreakMilestones,
              [updatedSession.userId]: [
                ...current.firedWeekStreakMilestones[updatedSession.userId],
                weekStreakMilestone,
              ],
            }
          : current.firedWeekStreakMilestones,
        longestStreaks: getUpdatedLongestStreaks(
          current,
          updatedSession.userId,
          current.profiles.find((profile) => profile.id === updatedSession.userId) ?? selectedProfile,
          replaced.sessions.filter((session) => session.userId === updatedSession.userId),
        ),
      };
    });
    setEditingSessionId(null);
    markTrainingStateUpdated(
      updatedSession.userId,
      updatedSession.workoutName,
      options?.countAsDone ? "complete" : "edit",
    );
    if (options?.countAsDone) {
      triggerHaptic("session_complete", updatedSession.userId);
      if (weekStreakMilestone) {
        triggerHaptic("week_streak", updatedSession.userId);
      }
    }
    showToast(options?.countAsDone ? "Workout marked done. Moving to the next day." : "Workout changes saved to progress.", {
      title: options?.countAsDone ? "Workout complete" : "Workout updated",
    });
  };

  const markPartialSessionComplete = (summary: SessionSummary) => {
    if (!summary.sessionId) {
      setSessionSummary(null);
      return;
    }

    const currentTargetSession = state.sessions.find((session) => session.id === summary.sessionId);
    const currentUpdatedWorkoutName = currentTargetSession
      ? normalizeCompletedWorkoutName(currentTargetSession.workoutName)
      : null;

    let weekStreakMilestone: number | null = null;
    setState((current) => {
      const targetSession = current.sessions.find((session) => session.id === summary.sessionId);
      if (!targetSession) {
        return current;
      }

      const updatedSession: WorkoutSession = {
        ...targetSession,
        partial: false,
        workoutName: normalizeCompletedWorkoutName(targetSession.workoutName),
      };

      const replaced = replaceSession(current, updatedSession, { advanceWorkoutCycle: true });
      weekStreakMilestone = getWeekStreakMilestone(
        replaced.sessions.filter((session) => session.userId === updatedSession.userId),
        current.firedWeekStreakMilestones[updatedSession.userId] ?? [],
        new Date(updatedSession.performedAt),
      );
      return {
        ...replaced,
        isSessionActive: false,
        sessionSignalLog: appendSessionSignalLog(current, updatedSession),
        ceilingLog: appendCeilingLog(
          current,
          current.profiles.find((profile) => profile.id === updatedSession.userId) ?? selectedProfile,
          updatedSession,
        ),
        firedWeekStreakMilestones: weekStreakMilestone
          ? {
              ...current.firedWeekStreakMilestones,
              [updatedSession.userId]: [
                ...current.firedWeekStreakMilestones[updatedSession.userId],
                weekStreakMilestone,
              ],
            }
          : current.firedWeekStreakMilestones,
        longestStreaks: getUpdatedLongestStreaks(
          current,
          updatedSession.userId,
          current.profiles.find((profile) => profile.id === updatedSession.userId) ?? selectedProfile,
          replaced.sessions.filter((session) => session.userId === updatedSession.userId),
        ),
      };
    });

    setSessionSummary(null);
    if (currentTargetSession && currentUpdatedWorkoutName) {
      markTrainingStateUpdated(currentTargetSession.userId, currentUpdatedWorkoutName, "complete");
      triggerHaptic("session_complete", currentTargetSession.userId);
      if (weekStreakMilestone) {
        triggerHaptic("week_streak", currentTargetSession.userId);
      }
    }
    showToast("Workout counted as done. Moving to the next day.", { title: "Workout complete" });
  };

  const openSuggestedFocusSession = () => {
    if (!suggestedFocusSession) {
      showToast("No suggested session is available right now.");
      return;
    }

    if (state.activeWorkout?.userId === selectedProfile.id) {
      showToast(`Current workout still open. ${suggestedFocusSession.actionLabel} when you're ready.`);
      startTransition(() => setActiveTab("workout"));
      return;
    }

    if (state.activeWorkout && state.activeWorkout.userId !== selectedProfile.id) {
      const activeOwner =
        state.profiles.find((profile) => profile.id === state.activeWorkout?.userId)?.name ??
        "The other profile";
      showToast(`${activeOwner} still has a workout in progress on this phone.`);
      return;
    }

    if (suggestedFocusSession.canStartDirectly) {
      setState((current) => ({
        ...current,
        isSessionActive: true,
        activeWorkout: toSuggestedFocusActiveWorkout(
          selectedProfile.id,
          suggestedFocusSession,
          userSessions,
        ),
      }));
      setSuggestedSessionPreview(false);
      setWorkoutPreviewId(null);
      startTransition(() => setActiveTab("workout"));
      return;
    }

    const fallbackWorkoutId =
      suggestedFocusSession.sourceWorkoutId ?? nextFocusDestination?.workoutId ?? null;

    if (!fallbackWorkoutId) {
      showToast("No workout destination is available for this focus session yet.");
      return;
    }

    setSelectedExerciseId(null);
    setSuggestedSessionPreview(true);
    setWorkoutPreviewId(fallbackWorkoutId);
    startTransition(() => setActiveTab("workout"));
  };

  if (!hasEnteredProfile) {
    return profileEntryTransition ? (
      <main className="theme-shell flex min-h-screen items-center justify-center px-6 text-text">
        <div className="profile-entry-transition animate-soft-in text-center">
          <p className="text-[11px] font-semibold uppercase tracking-[0.3em] text-white/46">
            STEAL
          </p>
          <h1 className="mt-5 text-5xl font-semibold tracking-[-0.08em] text-white">
            let&apos;s get hot
          </h1>
        </div>
      </main>
    ) : (
      <ProfileEntryScreen
        profiles={state.profiles}
        onSelect={enterProfile}
        canInstall={!installState.isStandalone}
        installLabel={installState.actionLabel}
        installHint={installState.helperText}
        onInstall={promptInstall}
      />
    );
  }

  return (
    <main
      style={{ "--parallax-shift": `${Math.min(scrollY * 0.08, 18)}px` } as CSSProperties}
      className={clsx(
        "theme-shell min-h-screen px-4 pb-32 pt-[calc(env(safe-area-inset-top,0px)+0.9rem)] text-text transition-colors duration-500 sm:px-6",
        isJoshuaTheme ? "theme-joshua" : "",
        isNatashaTheme ? "theme-natasha" : "",
      )}
    >
      <div className="mx-auto flex max-w-md flex-col gap-5">
        {!immersiveWorkoutMode ? (
          <Card className={clsx("hero-shell animate-fade-up px-5 py-4", compactHeader ? "py-3.5" : "py-4")}>
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className={clsx("hero-subtle text-[11px] uppercase tracking-[0.22em] text-muted", compactHeader ? "hero-subtle-compact" : "")}>STEAL</p>
                <h1
                  className={clsx(
                    "hero-title mt-2 text-[30px] tracking-[-0.06em] text-text",
                    compactHeader ? "hero-title-compact" : "",
                  )}
                >
                  {selectedProfile.name}
                </h1>
                {selectedProfile.id === "natasha" ? (
                  <p className={clsx("hero-subtle mt-2 text-[12px] text-accent", compactHeader ? "hero-subtle-compact" : "")}>For Natasha by Joshua</p>
                ) : null}
              </div>
              <button
                className="rounded-[12px] border border-white/8 bg-[var(--surface-raised)] p-3 text-muted"
                aria-label="Settings"
                onClick={() => setShowSettings(true)}
              >
                <Settings className="h-5 w-5" />
              </button>
            </div>
          </Card>
        ) : null}

        <div className="animate-page-in">
          {activeTab === "home" && (
            <SectionErrorBoundary>
            <HomeScreen
                profile={selectedProfile}
                todaysWorkout={todaysWorkout}
                activeWorkoutName={state.activeWorkout?.userId === selectedProfile.id ? state.activeWorkout.workoutName : null}
                isSessionActive={state.isSessionActive}
                activeSessionSetCount={
                  state.activeWorkout?.userId === selectedProfile.id
                    ? countLoggedSets(state.activeWorkout.exercises)
                    : 0
                }
                trainingInsight={trainingState.insights.homeAction}
                liftReadyLine={trainingState.insights.liftReadyLine}
                restDayState={trainingState.restDayState}
                restDayRead={restDayRead}
                restRecoveryLabel={restRecoveryLabel}
                weeklyCount={weeklyCount}
                streak={streak}
                pbCount={(state.personalBests[selectedProfile.id] ?? []).length}
                strengthPredictions={strengthPredictions}
                dailyVerse={dailyVerse}
                dailyMobilityPrompt={todaysMobilityPrompt}
                stretchCompletedToday={stretchCompletedToday}
                sharedSummary={dynamicSharedSummary}
                recentWorkouts={recentWorkouts}
                weddingDate={weddingDate}
                phaseTransitionLine={phaseTransitionLines[selectedProfile.id]}
                recentTrainingUpdate={profileRecentTrainingUpdate}
                calendarRows={trainingState.calendarRows}
                momentumPillText={trainingState.restDayState.isRest ? null : momentumPillText}
                rivalryState={rivalryState}
                rivalryCopy={rivalryCopy}
                rivalSessions={rivalSessions}
                monthlyReport={monthlyReport}
                onOpenDailyVerse={() => setShowDailyVerse(true)}
                onToggleStretch={toggleStretchCompletion}
              onStartWorkout={() => startWorkout(todaysWorkout)}
              onResumeWorkout={() => setActiveTab("workout")}
              onPreviewWorkout={() => {
                setSuggestedSessionPreview(false);
                setWorkoutPreviewId(todaysWorkout.id);
                startTransition(() => setActiveTab("workout"));
              }}
              onSkipWorkout={skipWorkout}
              onMoveWorkout={moveWorkout}
              onOpenRecentWorkout={(workoutDayId, exerciseId) => {
                const workout = selectedProfile.workoutPlan.find((item) => item.id === workoutDayId);
                if (workout) {
                  setSuggestedSessionPreview(false);
                  setWorkoutPreviewId(workout.id);
                  startTransition(() => setActiveTab("workout"));
                  return;
                }

                if (exerciseId) {
                  setSelectedExerciseId(exerciseId);
                }
              }}
            />
            </SectionErrorBoundary>
          )}

          {activeTab === "workout" && (
            <SectionErrorBoundary>
            <WorkoutScreen
              viewModel={buildWorkoutViewModel({
                profile: selectedProfile,
                todaysWorkoutId: todaysWorkout.id,
                previewWorkoutId: workoutPreviewId,
                suggestedFocusSession,
                suggestedSessionPreview,
                signatureLifts: trainingState.signatureLifts,
                activeWorkout: state.activeWorkout ?? null,
                activeWorkoutTemplate,
                liveSignal: state.activeWorkout?.userId === selectedProfile.id ? state.activeWorkout.liveSignal ?? null : null,
                userSessions,
                exerciseLibrary: state.exerciseLibrary,
                coach,
              })}
              onStartWorkout={startWorkout}
              onUpdateSet={updateSet}
              onCopyPreviousSet={copyPreviousSet}
              onCompleteSet={completeSet}
              onSwapExercise={swapExercise}
              onCompleteWorkout={openWorkoutCompletionPrompt}
              onSaveAndExitWorkout={savePartialWorkout}
              onDismissLiveSignal={dismissLiveSessionSignal}
              onCancelWorkout={cancelWorkout}
            />
            </SectionErrorBoundary>
          )}

          {activeTab === "progress" && (
            <SectionErrorBoundary>
            <ProgressScreen
              viewModel={buildProgressViewModel({
                profile: selectedProfile,
                trainingState,
                measurements: state.measurements[selectedProfile.id],
                coach,
              })}
              onEditSession={setEditingSessionId}
            />
            </SectionErrorBoundary>
          )}

        </div>
      </div>

      <ExerciseDetailModal exercise={selectedExercise} userSessions={userSessions} onClose={() => setSelectedExerciseId(null)} />
      <BibleVerseModal verse={showDailyVerse ? dailyVerse : null} onClose={() => setShowDailyVerse(false)} />
      <CompletionCelebration
        visible={showCompletionCelebration}
        title={completionTitle}
        message={completionMessage}
        actionLabel={toastActionLabel}
        onAction={handleToastAction}
      />
      {showOnboarding && <OnboardingModal onClose={closeOnboarding} />}
      {showSettings && (
        <SettingsModal
          profile={selectedProfile}
          signatureLifts={trainingState.signatureLifts}
          trainingAge={trainingState.trainingAge}
          trainingAgeMilestone={
            trainingState.trainingAge.milestone &&
            !state.trainingAgeState[selectedProfile.id].milestonesShown.includes(trainingState.trainingAge.milestone)
              ? trainingState.trainingAge.milestone
              : null
          }
          isProfileLocked={lockedProfile === selectedProfile.id}
          hapticEnabled={hapticsEnabled}
          installState={installState}
          onClose={() => setShowSettings(false)}
          onInstall={promptInstall}
          onExport={exportData}
          onImport={importData}
          onResetProfile={resetProfileData}
          onResetAll={resetAllData}
          onChooseProfile={returnToProfileEntry}
          onToggleHaptics={toggleHaptics}
          onToggleProfileLock={toggleProfileLock}
        />
      )}
      {showWorkoutFeelingPrompt && (
        <WorkoutFeelingModal
          onSelect={completeWorkout}
          onClose={() => setShowWorkoutFeelingPrompt(false)}
        />
      )}
        <SessionSummaryModal
          summary={sessionSummary}
          nextInsight={trainingState.insights.completionNext}
          onClose={() => setSessionSummary(null)}
          onMarkComplete={markPartialSessionComplete}
          onViewProgress={() => {
            setSessionSummary(null);
            startTransition(() => setActiveTab("progress"));
          }}
        />
      <EditWorkoutModal
        session={editingSession}
        onClose={() => setEditingSessionId(null)}
        onSave={saveEditedSession}
      />

      <AppNav
        activeTab={activeTab}
        isSessionActive={state.isSessionActive}
        profileId={selectedProfile.id}
        onTabChange={setActiveTab}
      />
    </main>
  );
}

export function WorkoutTrackerApp() {
  return (
    <ErrorBoundary>
      <WorkoutTrackerAppInner />
    </ErrorBoundary>
  );
}
