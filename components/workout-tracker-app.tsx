"use client";

import { startTransition, useEffect, useMemo, useState, type CSSProperties } from "react";
import clsx from "clsx";
import { Activity, ChartColumn, Dumbbell, Settings } from "lucide-react";

import { CompletionCelebration } from "@/components/completion-celebration";
import { ExerciseDetailModal } from "@/components/exercise-detail-modal";
import { EditWorkoutModal } from "@/components/edit-workout-modal";
import { OnboardingModal } from "@/components/onboarding-modal";
import { ProfileEntryScreen } from "@/components/profile-entry-screen";
import { ProgressScreen } from "@/components/progress-screen";
import { SessionSummaryModal, type SessionSummary } from "@/components/session-summary-modal";
import { SettingsModal } from "@/components/settings-modal";
import { TodaySessionScreen } from "@/components/today-session-screen";
import { Card } from "@/components/ui";
import { WorkoutFeelingModal } from "@/components/workout-feeling-modal";
import { WorkoutScreen } from "@/components/workout-screen";
import {
  appendSession,
  clearActiveWorkoutForUser,
  replaceSession,
  resetProfileProgressState,
  saveMeasurementEntry,
  setSelectedUserId,
  setWorkoutOverride,
} from "@/lib/app-actions";
import { isValidImportedState, mergeStateWithSeed } from "@/lib/app-state";
import { getProfileSessions, getProfileTrainingState } from "@/lib/profile-training-state";
import { getLastExerciseSets, getWorkoutPrSummary } from "@/lib/progression";
import { createSeedState } from "@/lib/seed-data";
import {
  deserializeState,
  loadLockedProfile,
  loadState,
  saveLockedProfile,
  saveState,
} from "@/lib/storage";
import { buildCompletedSession, buildSessionSummary, countLoggedSets } from "@/lib/workout-session";
import type { SuggestedFocusSession } from "@/lib/training-load";
import type {
  ActiveWorkout,
  AppState,
  ExerciseLibraryItem,
  RecentTrainingUpdate,
  ExerciseTemplate,
  Profile,
  SetLog,
  UserId,
  WorkoutPlanDay,
  WorkoutSession,
} from "@/lib/types";

type TabId = "session" | "workout" | "progress";

type DeferredInstallPrompt = Event & {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed"; platform: string }>;
};

const navItems = [
  { id: "session" as const, label: "Session", icon: Activity },
  { id: "workout" as const, label: "Workout", icon: Dumbbell },
  { id: "progress" as const, label: "Progress", icon: ChartColumn },
];

const ONBOARDING_KEY = "workout-together-onboarding-seen-v1";
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
      sets: exercise.sets,
      repRange: exercise.repRange,
      note: exercise.note,
    }));

  return {
    id: `active-focus-${Date.now()}`,
    userId,
    startedAt: new Date().toISOString(),
    workoutDayId: session.sourceWorkoutId ?? `focus-session-${userId}`,
    workoutName: `${session.focusText} Focus Session`,
    templateExercises,
    exercises: templateExercises.map((exercise) => ({
      exerciseId: exercise.id,
      exerciseName: exercise.name,
      muscleGroup: exercise.muscleGroup,
      note: exercise.note ?? "",
      sets: buildEmptySets(exercise, getLastExerciseSets(exercise.name, sessions)),
    })),
  };
}

function toActiveWorkoutFromSavedSession(
  session: WorkoutSession,
  workoutTemplate: WorkoutPlanDay | undefined,
): ActiveWorkout {
  const templateExercises = workoutTemplate?.exercises;

  return {
    id: `active-resume-${Date.now()}`,
    userId: session.userId,
    startedAt: new Date().toISOString(),
    workoutDayId: session.workoutDayId,
    workoutName: normalizeCompletedWorkoutName(session.workoutName),
    templateExercises,
    exercises: session.exercises.map((exercise, exerciseIndex) => {
      const templateExercise = templateExercises?.[exerciseIndex];
      const targetSetCount = templateExercise?.sets ?? exercise.sets.length;
      const sets = Array.from({ length: targetSetCount }, (_, setIndex) => {
        const existingSet = exercise.sets[setIndex];
        return existingSet
          ? { ...existingSet, id: `${exercise.exerciseId}-${setIndex}-${Date.now()}` }
          : {
              id: `${exercise.exerciseId}-${setIndex}-${Date.now()}`,
              weight: exercise.sets.at(-1)?.weight ?? 0,
              reps: 0,
              completed: false,
            };
      });

      return {
        exerciseId: templateExercise?.id ?? exercise.exerciseId,
        exerciseName: exercise.exerciseName,
        muscleGroup: exercise.muscleGroup,
        note: exercise.note ?? templateExercise?.note ?? "",
        sets,
      };
    }),
  };
}

function normalizeCompletedWorkoutName(workoutName: string) {
  return workoutName.replace(/\s*\(Partial\)$/i, "");
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

export function WorkoutTrackerApp() {
  const [state, setState] = useState<AppState>(createSeedState);
  const [hydrated, setHydrated] = useState(false);
  const [isStandalone, setIsStandalone] = useState(false);
  const [showInstallLaunch, setShowInstallLaunch] = useState(false);
  const [deferredInstallPrompt, setDeferredInstallPrompt] = useState<DeferredInstallPrompt | null>(null);
  const [isIosInstallPath, setIsIosInstallPath] = useState(false);
  const [lockedProfile, setLockedProfile] = useState<UserId | null>(null);
  const [activeTab, setActiveTab] = useState<TabId>("session");
  const [selectedExerciseId, setSelectedExerciseId] = useState<string | null>(null);
  const [showWorkoutFeelingPrompt, setShowWorkoutFeelingPrompt] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [showOnboarding, setShowOnboarding] = useState(false);
  const [completionMessage, setCompletionMessage] = useState("");
  const [showCompletionCelebration, setShowCompletionCelebration] = useState(false);
  const [sessionSummary, setSessionSummary] = useState<SessionSummary | null>(null);
  const [editingSessionId, setEditingSessionId] = useState<string | null>(null);
  const [toastActionLabel, setToastActionLabel] = useState<string | null>(null);
  const [toastActionKind, setToastActionKind] = useState<"undo-schedule" | null>(null);
  const [pendingScheduleUndo, setPendingScheduleUndo] = useState<{
    userId: UserId;
    previousNextWorkoutId: string | null;
  } | null>(null);
  const [hasEnteredProfile, setHasEnteredProfile] = useState(false);
  const [profileEntryTransition, setProfileEntryTransition] = useState<UserId | null>(null);
  const [scrollY, setScrollY] = useState(0);
  const [recentTrainingUpdate, setRecentTrainingUpdate] = useState<RecentTrainingUpdate | null>(null);

  const softHaptic = (pattern: number | number[]) => {
    if (typeof navigator !== "undefined" && "vibrate" in navigator) {
      navigator.vibrate(pattern);
    }
  };

  const showToast = (
    message: string,
    options?: {
      actionLabel?: string;
      actionKind?: "undo-schedule";
      pendingScheduleUndo?: { userId: UserId; previousNextWorkoutId: string | null } | null;
    },
  ) => {
    setCompletionMessage(message);
    setToastActionLabel(options?.actionLabel ?? null);
    setToastActionKind(options?.actionKind ?? null);
    setPendingScheduleUndo(options?.pendingScheduleUndo ?? null);
    setShowCompletionCelebration(true);
  };

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
    const localState = loadState();
    const deviceLockedProfile = loadLockedProfile();
    const profileFromQuery =
      typeof window !== "undefined"
        ? new URLSearchParams(window.location.search).get("profile")
        : null;
    const launchProfile =
      profileFromQuery === "joshua" || profileFromQuery === "natasha" ? profileFromQuery : null;
    setLockedProfile(deviceLockedProfile);
    if (localState) {
      const seed = createSeedState();
      const mergedState = mergeStateWithSeed(seed, localState);
      setState((current) => ({
        ...current,
        ...mergedState,
        selectedUserId: deviceLockedProfile ?? launchProfile ?? mergedState.selectedUserId,
      }));
      if (deviceLockedProfile || launchProfile) {
        setHasEnteredProfile(true);
      }
    } else if (deviceLockedProfile || launchProfile) {
      setState((current) => setSelectedUserId(current, deviceLockedProfile ?? launchProfile ?? current.selectedUserId));
      setHasEnteredProfile(true);
    }
    if (typeof window !== "undefined" && launchProfile) {
      window.history.replaceState({}, "", window.location.pathname);
    }
    if (typeof window !== "undefined" && !window.localStorage.getItem(ONBOARDING_KEY)) {
      setShowOnboarding(true);
    }
    setHydrated(true);
  }, []);

  useEffect(() => {
    if (typeof window === "undefined") {
      return;
    }

    const standalone =
      window.matchMedia("(display-mode: standalone)").matches ||
      Boolean((window.navigator as Navigator & { standalone?: boolean }).standalone);
    const userAgent = window.navigator.userAgent.toLowerCase();
    const isIos = /iphone|ipad|ipod/.test(userAgent);

    const handleBeforeInstallPrompt = (event: Event) => {
      event.preventDefault();
      setDeferredInstallPrompt(event as DeferredInstallPrompt);
    };

    const handleInstalled = () => {
      setDeferredInstallPrompt(null);
      setIsStandalone(true);
      showToast("STEAL is installed on this phone.");
    };

    setIsStandalone(standalone);
    setIsIosInstallPath(isIos);
    document.body.classList.toggle("app-standalone", standalone);
    window.addEventListener("beforeinstallprompt", handleBeforeInstallPrompt as EventListener);
    window.addEventListener("appinstalled", handleInstalled);

    setShowInstallLaunch(true);
    const timeout = window.setTimeout(() => {
      setShowInstallLaunch(false);
    }, standalone ? 1200 : 900);

    return () => {
      document.body.classList.remove("app-standalone");
      window.removeEventListener("beforeinstallprompt", handleBeforeInstallPrompt as EventListener);
      window.removeEventListener("appinstalled", handleInstalled);
      window.clearTimeout(timeout);
    };
  }, []);

  useEffect(() => {
    if (hydrated) {
      saveState(state);
    }
  }, [state, hydrated]);

  useEffect(() => {
    const handleScroll = () => setScrollY(window.scrollY);
    handleScroll();
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  useEffect(() => {
    if (!showCompletionCelebration) {
      return;
    }
    const timeout = window.setTimeout(() => {
      setShowCompletionCelebration(false);
      setToastActionLabel(null);
      setToastActionKind(null);
      setPendingScheduleUndo(null);
    }, toastActionKind ? 3600 : 1250);
    return () => window.clearTimeout(timeout);
  }, [showCompletionCelebration, toastActionKind]);

  const selectedProfile = useMemo(
    () => state.profiles.find((profile) => profile.id === state.selectedUserId) ?? state.profiles[0],
    [state.profiles, state.selectedUserId],
  );
  const workoutOverride = state.workoutOverrides[selectedProfile.id]?.nextWorkoutId ?? null;

  const trainingState = useMemo(
    () =>
      getProfileTrainingState(selectedProfile, state.sessions, state.exerciseLibrary, {
        workoutOverrideId: workoutOverride,
        activeWorkout: state.activeWorkout,
      }),
    [selectedProfile, state.activeWorkout, state.exerciseLibrary, state.sessions, workoutOverride],
  );
  const {
    recentSessions,
    streak,
    todaySession,
    totalWorkouts,
    trendData,
    userSessions,
    weeklySummary: dynamicWeeklySummary,
  } = trainingState;
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

  const editingSession = useMemo(
    () => state.sessions.find((session) => session.id === editingSessionId) ?? null,
    [editingSessionId, state.sessions],
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
      startTransition(() => setActiveTab("workout"));
      return;
    }

    setState((current) => ({
      ...current,
      activeWorkout: toActiveWorkout(
        selectedProfile.id,
        workout,
        userSessions,
        current.exerciseLibrary,
        current.exerciseSwapMemory[selectedProfile.id],
      ),
    }));
    softHaptic(10);
    startTransition(() => setActiveTab("workout"));
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
    setState((current) => clearActiveWorkoutForUser(current, selectedProfile.id));
    setShowWorkoutFeelingPrompt(false);
    startTransition(() => setActiveTab("session"));
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
    const completedSession = buildCompletedSession(state.activeWorkout, {
      durationMinutes,
      feeling: "Solid",
      partial: true,
    });

    setState((current) =>
      appendSession(current, completedSession, {
        clearActiveWorkoutForUser: selectedProfile.id,
        nextWorkoutId: state.activeWorkout?.workoutDayId ?? null,
      }),
    );
    setShowWorkoutFeelingPrompt(false);
    setSessionSummary(buildSessionSummary(completedSession, { partial: true }));
    markTrainingStateUpdated(selectedProfile.id, completedSession.workoutName, "partial");
    showToast("Progress saved. Training state updated.");
    softHaptic([8, 28, 8]);
    startTransition(() => setActiveTab("session"));
  };

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
    setState((current) =>
      appendSession(current, completedSession, {
        clearActiveWorkoutForUser: selectedProfile.id,
        nextWorkoutId: null,
        updateSharedSummary: true,
        sharedSummaryName: selectedProfile.name,
      }),
    );
    setShowWorkoutFeelingPrompt(false);
    setSessionSummary(buildSessionSummary(completedSession, {
      prCount: prSummary.count,
      prHighlights: prSummary.highlights,
    }));
    markTrainingStateUpdated(selectedProfile.id, completedSession.workoutName, "complete");
    softHaptic([10, 36, 12]);
    startTransition(() => setActiveTab("session"));
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
      startTransition(() => setActiveTab("session"));
      showToast("Backup imported successfully.");
    } catch {
      showToast("Import failed. Please use a valid workout backup file.");
    }
  };

  const updateSet = (
    exerciseIndex: number,
    setIndex: number,
    field: "weight" | "reps",
    value: number,
  ) => {
    setState((current) => {
      if (!current.activeWorkout) {
        return current;
      }
      const next = structuredClone(current);
      if (!next.activeWorkout) {
        return current;
      }
      const targetSet = next.activeWorkout.exercises[exerciseIndex].sets[setIndex];
      targetSet[field] = Number.isNaN(value) ? 0 : value;
      return next;
    });
  };

  const completeSet = (exerciseIndex: number, setIndex: number) => {
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
      targetSet.completed = true;
      return next;
    });
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
    showToast(`${selectedProfile.name}'s saved progress was reset on this phone.`);
    setShowSettings(false);
    startTransition(() => setActiveTab("session"));
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
    showToast("The app was reset to a clean start.");
    startTransition(() => setActiveTab("session"));
  };

  const isJoshuaTheme = selectedProfile.id === "joshua";
  const isNatashaTheme = selectedProfile.id === "natasha";
  const immersiveWorkoutMode = activeTab === "workout" && state.activeWorkout?.userId === selectedProfile.id;
  const compactHeader = scrollY > 18 && !immersiveWorkoutMode;
  const handleToastAction = () => {
    if (toastActionKind !== "undo-schedule" || !pendingScheduleUndo) {
      return;
    }

    setState((current) => setWorkoutOverride(current, pendingScheduleUndo.userId, pendingScheduleUndo.previousNextWorkoutId));
    showToast("Workout order change undone.");
  };

  const enterProfile = (profileId: UserId) => {
    setProfileEntryTransition(profileId);
    softHaptic(8);
    window.setTimeout(() => {
      setSelectedExerciseId(null);
      setShowSettings(false);
      setState((current) => setSelectedUserId(current, profileId));
      setHasEnteredProfile(true);
      setProfileEntryTransition(null);
      startTransition(() => setActiveTab("session"));
    }, 850);
  };

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
    setShowSettings(false);
    if (lockedProfile) {
      return;
    }
    setHasEnteredProfile(false);
    softHaptic(6);
  };

  const promptInstall = async () => {
    if (deferredInstallPrompt) {
      await deferredInstallPrompt.prompt();
      await deferredInstallPrompt.userChoice.catch(() => null);
      setDeferredInstallPrompt(null);
      return;
    }

    showToast(
      isIosInstallPath
        ? "Open this in Safari, tap Share, then Add to Home Screen."
        : "Use your browser menu and choose Install app or Add to Home Screen.",
    );
  };

  const toggleProfileLock = () => {
    if (lockedProfile === selectedProfile.id) {
      setLockedProfile(null);
      saveLockedProfile(null);
      showToast("This phone can switch between profiles again.");
      return;
    }

    setLockedProfile(selectedProfile.id);
    saveLockedProfile(selectedProfile.id);
    setHasEnteredProfile(true);
    showToast(`This phone is now locked to ${selectedProfile.name}.`);
  };

  const saveEditedSession = (updatedSession: WorkoutSession, options?: { countAsDone?: boolean }) => {
    setState((current) => {
      const existingSession = current.sessions.find((session) => session.id === updatedSession.id);
      const shouldAdvanceCycle =
        Boolean(options?.countAsDone) || Boolean(existingSession?.partial && updatedSession.partial === false);
      return replaceSession(current, updatedSession, { advanceWorkoutCycle: shouldAdvanceCycle });
    });
    setEditingSessionId(null);
    markTrainingStateUpdated(
      updatedSession.userId,
      updatedSession.workoutName,
      options?.countAsDone ? "complete" : "edit",
    );
    showToast(options?.countAsDone ? "Workout marked done. Moving to the next day." : "Workout changes saved to progress.");
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

      return replaceSession(current, updatedSession, { advanceWorkoutCycle: true });
    });

    setSessionSummary(null);
    if (currentTargetSession && currentUpdatedWorkoutName) {
      markTrainingStateUpdated(currentTargetSession.userId, currentUpdatedWorkoutName, "complete");
    }
    showToast("Workout counted as done. Moving to the next day.");
  };

  const openTodaySession = () => {
    setSelectedExerciseId(null);
    softHaptic(8);
    startTransition(() => setActiveTab("session"));
  };

  const regenerateTodaySession = () => {
    setState((current) => setWorkoutOverride(current, selectedProfile.id, null));
    showToast("Today's Session was refreshed from your live training state.");
  };

  const startTodaySession = () => {
    if (state.activeWorkout?.userId === selectedProfile.id) {
      showToast(`${state.activeWorkout.workoutName} is still open. Resume it from Workout mode.`);
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

    if (todaySession.status === "resume" && todaySession.partialSessionId) {
      const savedSession = state.sessions.find((session) => session.id === todaySession.partialSessionId);
      if (savedSession) {
        const workoutTemplate = selectedProfile.workoutPlan.find((workout) => workout.id === todaySession.workoutId);
        setState((current) => ({
          ...current,
          activeWorkout: toActiveWorkoutFromSavedSession(savedSession, workoutTemplate),
        }));
        softHaptic(10);
        startTransition(() => setActiveTab("workout"));
        return;
      }
    }

    if (todaySession.generatedSession && todaySession.canStartDirectly) {
      setState((current) => ({
        ...current,
        activeWorkout: toSuggestedFocusActiveWorkout(selectedProfile.id, todaySession.generatedSession!, userSessions),
      }));
      softHaptic(10);
      startTransition(() => setActiveTab("workout"));
      return;
    }

    const workoutTemplate = selectedProfile.workoutPlan.find((workout) => workout.id === todaySession.workoutId);
    if (!workoutTemplate) {
      showToast("No usable workout template is available for today's session.");
      return;
    }

    startWorkout(workoutTemplate);
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
          <Card className={clsx("hero-shell animate-fade-up px-5 py-5", compactHeader ? "py-3.5" : "py-5")}>
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className={clsx("hero-subtle text-sm font-semibold text-muted", compactHeader ? "hero-subtle-compact" : "")}>STEAL</p>
                <h1
                  className={clsx(
                    "hero-title mt-2 text-[32px] font-semibold tracking-[-0.06em] text-text",
                    compactHeader ? "hero-title-compact" : "",
                  )}
                >
                  {selectedProfile.name}
                </h1>
                {selectedProfile.id === "natasha" ? (
                  <p className={clsx("hero-subtle mt-2 text-sm font-medium text-accent", compactHeader ? "hero-subtle-compact" : "")}>For Natasha by Joshua</p>
                ) : null}
              </div>
              <button
                className="rounded-[28px] bg-[var(--card-strong)] p-3 text-muted"
                aria-label="Settings"
                onClick={() => setShowSettings(true)}
              >
                <Settings className="h-5 w-5" />
              </button>
            </div>
          </Card>
        ) : null}

        <div className="animate-page-in">
          {activeTab === "session" && (
            <TodaySessionScreen
              session={todaySession}
              recentTrainingUpdate={
                profileRecentTrainingUpdate
                  ? (() => {
                      const minutesAgo = Math.max(
                        0,
                        Math.round((Date.now() - new Date(profileRecentTrainingUpdate.timestamp).getTime()) / 60000),
                      );
                      const freshness =
                        minutesAgo <= 1 ? "just now" : minutesAgo < 60 ? `${minutesAgo} min ago` : "recently";
                      return profileRecentTrainingUpdate.kind === "partial"
                        ? `${profileRecentTrainingUpdate.workoutName} saved ${freshness}. Today's Session has already been refreshed.`
                        : profileRecentTrainingUpdate.kind === "edit"
                          ? `${profileRecentTrainingUpdate.workoutName} was updated ${freshness}. Today's Session is already in sync.`
                          : `${profileRecentTrainingUpdate.workoutName} landed ${freshness}. Today's Session has already shifted with the new load.`;
                    })()
                  : null
              }
              onPrimaryAction={startTodaySession}
              onRegenerateAction={regenerateTodaySession}
            />
          )}

          {activeTab === "workout" && (
            <WorkoutScreen
              profile={selectedProfile}
              activeWorkout={state.activeWorkout}
              activeWorkoutTemplate={activeWorkoutTemplate}
              userSessions={userSessions}
              exerciseLibrary={state.exerciseLibrary}
              onOpenTodaySession={openTodaySession}
              onUpdateSet={updateSet}
              onCopyPreviousSet={copyPreviousSet}
              onCompleteSet={completeSet}
              onSwapExercise={swapExercise}
              onCompleteWorkout={openWorkoutCompletionPrompt}
              onSaveAndExitWorkout={savePartialWorkout}
              onCancelWorkout={cancelWorkout}
            />
          )}

          {activeTab === "progress" && (
            <ProgressScreen
              profile={selectedProfile}
              trainingState={trainingState}
              measurements={state.measurements[selectedProfile.id]}
              stretchCompletions={state.stretchCompletions[selectedProfile.id]}
              recentTrainingUpdate={profileRecentTrainingUpdate}
              onOpenTodaySession={openTodaySession}
              onSaveMeasurement={saveMeasurement}
              onEditSession={setEditingSessionId}
            />
          )}

        </div>
      </div>

      <ExerciseDetailModal exercise={selectedExercise} userSessions={userSessions} onClose={() => setSelectedExerciseId(null)} />
      <CompletionCelebration
        visible={showCompletionCelebration}
        message={completionMessage}
        actionLabel={toastActionLabel}
        onAction={handleToastAction}
      />
      {showOnboarding && <OnboardingModal onClose={closeOnboarding} />}
      {showSettings && (
        <SettingsModal
          profile={selectedProfile}
          isProfileLocked={lockedProfile === selectedProfile.id}
          installState={installState}
          onClose={() => setShowSettings(false)}
          onInstall={promptInstall}
          onExport={exportData}
          onImport={importData}
          onResetProfile={resetProfileData}
          onResetAll={resetAllData}
          onChooseProfile={returnToProfileEntry}
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
        onClose={() => setSessionSummary(null)}
        onMarkComplete={markPartialSessionComplete}
      />
      <EditWorkoutModal
        session={editingSession}
        onClose={() => setEditingSessionId(null)}
        onSave={saveEditedSession}
      />

      {!immersiveWorkoutMode ? (
        <nav className="tabbar-shell fixed inset-x-4 bottom-4 mx-auto flex max-w-md items-center justify-between rounded-[30px] px-3.5 py-3.5 shadow-[var(--shadow-card)]">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                className={clsx(
                  "tabbar-button flex flex-col items-center gap-1 text-xs font-medium transition duration-300",
                  isActive ? "tabbar-button-active text-accent" : "text-muted",
                )}
                onClick={() => {
                  softHaptic(6);
                  setActiveTab(item.id);
                }}
              >
                <Icon className="h-5 w-5" />
                {item.label}
              </button>
            );
          })}
        </nav>
      ) : null}
    </main>
  );
}

