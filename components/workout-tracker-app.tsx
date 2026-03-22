"use client";

import { startTransition, useEffect, useMemo, useState, type CSSProperties } from "react";
import clsx from "clsx";
import { Activity, ChartColumn, Dumbbell, Settings } from "lucide-react";

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
import { getLastExerciseSets, getWorkoutPrSummary } from "@/lib/progression";
import { createSeedState } from "@/lib/seed-data";
import {
  deserializeState,
  loadLockedProfile,
  loadState,
  saveLockedProfile,
  saveState,
} from "@/lib/storage";
import { getStrengthPredictions } from "@/lib/strength-prediction";
import type {
  ActiveWorkout,
  AppState,
  ExerciseLibraryItem,
  ExerciseTemplate,
  Profile,
  SetLog,
  UserId,
  WorkoutPlanDay,
  WorkoutSession,
} from "@/lib/types";

type TabId = "home" | "workout" | "progress";

type DeferredInstallPrompt = Event & {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed"; platform: string }>;
};

const navItems = [
  { id: "home" as const, label: "Home", icon: Activity },
  { id: "workout" as const, label: "Workout", icon: Dumbbell },
  { id: "progress" as const, label: "Progress", icon: ChartColumn },
];

const ONBOARDING_KEY = "workout-together-onboarding-seen-v1";
const days = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];

const formatDate = (value: string) =>
  new Intl.DateTimeFormat("en-NZ", { month: "short", day: "numeric" }).format(new Date(value));

const formatVolume = (session: WorkoutSession) =>
  session.exercises.flatMap((exercise) => exercise.sets).reduce((sum, set) => sum + set.weight * set.reps, 0);

function getWeekStart(date = new Date()) {
  const next = new Date(date);
  next.setDate(next.getDate() - next.getDay());
  next.setHours(0, 0, 0, 0);
  return next;
}

function getNextWorkoutFromSessions(profile: Profile, sessions: WorkoutSession[]) {
  if (!sessions.length) {
    return profile.workoutPlan[0];
  }

  const lastSession = sessions[0];
  const currentIndex = profile.workoutPlan.findIndex((workout) => workout.id === lastSession.workoutDayId);

  if (currentIndex === -1) {
    return profile.workoutPlan[0];
  }

  return profile.workoutPlan[(currentIndex + 1) % profile.workoutPlan.length];
}

function getTodayWorkout(profile: Profile, sessions: WorkoutSession[], overrideWorkoutId: string | null) {
  if (overrideWorkoutId) {
    return profile.workoutPlan.find((workout) => workout.id === overrideWorkoutId) ?? getNextWorkoutFromSessions(profile, sessions);
  }

  return getNextWorkoutFromSessions(profile, sessions);
}

function getDaysSinceLastWorkout(sessions: WorkoutSession[]) {
  if (!sessions.length) {
    return null;
  }

  const lastSessionDate = new Date(sessions[0].performedAt);
  const today = new Date();
  lastSessionDate.setHours(0, 0, 0, 0);
  today.setHours(0, 0, 0, 0);
  return Math.floor((today.getTime() - lastSessionDate.getTime()) / 86400000);
}

function getWeddingCountdown() {
  const today = new Date();
  const weddingDate = new Date("2026-11-02T00:00:00");

  if (today >= weddingDate) {
    return { months: 0, days: 0, label: "The day is here." };
  }

  const cursor = new Date(today);
  let months = 0;

  while (true) {
    const next = new Date(cursor);
    next.setMonth(next.getMonth() + 1);
    if (next <= weddingDate) {
      months += 1;
      cursor.setMonth(cursor.getMonth() + 1);
      continue;
    }
    break;
  }

  const days = Math.max(0, Math.floor((weddingDate.getTime() - cursor.getTime()) / 86400000));
  const label =
    months === 0 && days <= 14
      ? "Almost there."
      : "Counting down to your wedding day together.";

  return { months, days, label };
}

function getTodayStretch(profile: Profile) {
  const today = days[new Date().getDay()];
  return profile.stretchPlan.find((stretch) => stretch.dayLabel === today) ?? profile.stretchPlan[0];
}

function isSameLocalDay(a: string, b: Date) {
  return new Date(a).toDateString() === b.toDateString();
}

function getUserSessions(state: AppState, userId: UserId) {
  return state.sessions
    .filter((session) => session.userId === userId)
    .sort((a, b) => +new Date(b.performedAt) - +new Date(a.performedAt));
}

function getWorkoutsCompletedThisWeek(sessions: WorkoutSession[]) {
  const start = getWeekStart();
  return sessions.filter((session) => new Date(session.performedAt) >= start).length;
}

function getDynamicWeeklySummary(profile: Profile, sessions: WorkoutSession[]) {
  const weeklySessions = sessions.filter((session) => new Date(session.performedAt) >= getWeekStart());
  const totalSets = weeklySessions.reduce(
    (sum, session) => sum + session.exercises.reduce((exerciseSum, exercise) => exerciseSum + exercise.sets.length, 0),
    0,
  );
  const totalVolume = weeklySessions.reduce((sum, session) => sum + formatVolume(session), 0);
  const muscleCount = weeklySessions
    .flatMap((session) => session.exercises.map((exercise) => exercise.muscleGroup))
    .reduce<Record<string, number>>((accumulator, muscle) => {
      accumulator[muscle] = (accumulator[muscle] ?? 0) + 1;
      return accumulator;
    }, {});
  const mostTrainedMuscleGroup =
    Object.entries(muscleCount).sort((a, b) => b[1] - a[1])[0]?.[0] ??
    profile.workoutPlan[0].exercises[0].muscleGroup;
  const workoutsCompleted = weeklySessions.length;
  const consistencyLabel =
    workoutsCompleted >= 4
      ? "Excellent momentum this week"
      : workoutsCompleted >= 2
        ? "Solid consistency and steady progress"
        : "Building rhythm with a clean start";

  return {
    userId: profile.id,
    workoutsCompleted,
    totalSets,
    totalVolume,
    personalBests: Math.max(1, Math.min(weeklySessions.length, 3)),
    mostTrainedMuscleGroup,
    consistencyLabel,
  };
}

function getStreak(sessions: WorkoutSession[]) {
  const uniqueDays = Array.from(new Set(sessions.map((session) => new Date(session.performedAt).toDateString())));
  if (!uniqueDays.length) {
    return 0;
  }
  let streak = 0;
  let cursor = new Date();
  while (true) {
    if (uniqueDays.includes(cursor.toDateString())) {
      streak += 1;
      cursor.setDate(cursor.getDate() - 1);
      continue;
    }
    if (streak === 0) {
      cursor.setDate(cursor.getDate() - 1);
      if (uniqueDays.includes(cursor.toDateString())) {
        streak += 1;
        cursor.setDate(cursor.getDate() - 1);
        continue;
      }
    }
    break;
  }
  return streak;
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

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

function isValidSetLog(value: unknown): value is SetLog {
  return (
    isRecord(value) &&
    typeof value.id === "string" &&
    typeof value.weight === "number" &&
    typeof value.reps === "number" &&
    typeof value.completed === "boolean"
  );
}

function isValidActiveWorkout(value: unknown): value is ActiveWorkout {
  return (
    isRecord(value) &&
    typeof value.id === "string" &&
    (value.userId === "joshua" || value.userId === "natasha") &&
    typeof value.startedAt === "string" &&
    typeof value.workoutDayId === "string" &&
    typeof value.workoutName === "string" &&
    Array.isArray(value.exercises) &&
    value.exercises.every(
      (exercise) =>
        isRecord(exercise) &&
        typeof exercise.exerciseId === "string" &&
        typeof exercise.exerciseName === "string" &&
        typeof exercise.muscleGroup === "string" &&
        Array.isArray(exercise.sets) &&
        exercise.sets.every(isValidSetLog),
    )
  );
}

function isValidImportedState(value: Partial<AppState>) {
  if (!isRecord(value)) {
    return false;
  }

  if (value.selectedUserId && value.selectedUserId !== "joshua" && value.selectedUserId !== "natasha") {
    return false;
  }

  if (value.sessions && !Array.isArray(value.sessions)) {
    return false;
  }

  if (value.measurements && !isRecord(value.measurements)) {
    return false;
  }

  if (value.stretchCompletions && !isRecord(value.stretchCompletions)) {
    return false;
  }

  if (value.workoutOverrides && !isRecord(value.workoutOverrides)) {
    return false;
  }

  if (value.exerciseSwapMemory && !isRecord(value.exerciseSwapMemory)) {
    return false;
  }

  return true;
}

function mergeStateWithSeed(seed: AppState, incoming: Partial<AppState>): AppState {
  return {
    ...seed,
    ...incoming,
    profiles: seed.profiles,
    exerciseLibrary: seed.exerciseLibrary,
    weeklySummaries: seed.weeklySummaries,
    measurements: {
      ...seed.measurements,
      ...(incoming.measurements ?? {}),
    },
    stretchCompletions: {
      ...seed.stretchCompletions,
      ...(incoming.stretchCompletions ?? {}),
    },
    workoutOverrides: {
      ...seed.workoutOverrides,
      ...(incoming.workoutOverrides ?? {}),
    },
    exerciseSwapMemory: {
      ...seed.exerciseSwapMemory,
      ...(incoming.exerciseSwapMemory ?? {}),
    },
    bibleVerses: incoming.bibleVerses?.length ? incoming.bibleVerses : seed.bibleVerses,
    activeWorkout: isValidActiveWorkout(incoming.activeWorkout) ? incoming.activeWorkout : null,
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
  const [activeTab, setActiveTab] = useState<TabId>("home");
  const [selectedExerciseId, setSelectedExerciseId] = useState<string | null>(null);
  const [showDailyVerse, setShowDailyVerse] = useState(false);
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
  const [workoutPreviewId, setWorkoutPreviewId] = useState<string | null>(null);
  const [scrollY, setScrollY] = useState(0);

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
      setState((current) => ({ ...current, selectedUserId: deviceLockedProfile ?? launchProfile ?? current.selectedUserId }));
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

  const userSessions = useMemo(() => getUserSessions(state, selectedProfile.id), [state, selectedProfile.id]);
  const workoutOverride = state.workoutOverrides[selectedProfile.id]?.nextWorkoutId ?? null;
  const todaysWorkout = useMemo(
    () => getTodayWorkout(selectedProfile, userSessions, workoutOverride),
    [selectedProfile, userSessions, workoutOverride],
  );
  const todaysStretch = useMemo(() => getTodayStretch(selectedProfile), [selectedProfile]);
  const strengthPredictions = useMemo(
    () => getStrengthPredictions(selectedProfile.id, userSessions),
    [selectedProfile.id, userSessions],
  );
  const weddingCountdown = useMemo(() => getWeddingCountdown(), []);
  const dynamicSharedSummary = useMemo(
    () =>
      getCoupleIntelligenceSummary({
        sessions: state.sessions,
        measurements: state.measurements,
        weddingCountdown,
      }),
    [state.measurements, state.sessions, weddingCountdown],
  );
  const installState = useMemo(
    () => ({
      isStandalone,
      canPrompt: Boolean(deferredInstallPrompt),
      ...getInstallCopy(Boolean(deferredInstallPrompt), isStandalone, isIosInstallPath),
    }),
    [deferredInstallPrompt, isIosInstallPath, isStandalone],
  );
  const weeklyCount = getWorkoutsCompletedThisWeek(userSessions);
  const dynamicWeeklySummary = useMemo(
    () => getDynamicWeeklySummary(selectedProfile, userSessions),
    [selectedProfile, userSessions],
  );
  const streak = getStreak(userSessions);
  const recentWorkouts = userSessions.slice(0, 3);
  const workoutRhythmNote = useMemo(() => {
    const gapDays = getDaysSinceLastWorkout(userSessions);
    if (gapDays === null || gapDays < 3) {
      return workoutOverride ? `Moved into place. Pick up with ${todaysWorkout.dayLabel} when ready.` : null;
    }

    return `It has been ${gapDays} days. Pick up with ${todaysWorkout.dayLabel} when ready.`;
  }, [todaysWorkout.dayLabel, userSessions, workoutOverride]);
  const activeWorkoutTemplate = selectedProfile.workoutPlan.find(
    (workout) => workout.id === state.activeWorkout?.workoutDayId,
  );

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

  const editingSession = useMemo(
    () => state.sessions.find((session) => session.id === editingSessionId) ?? null,
    [editingSessionId, state.sessions],
  );

  const trendData = useMemo(
    () =>
      userSessions
        .slice()
        .reverse()
        .map((session) => ({
          date: formatDate(session.performedAt),
          volume: formatVolume(session),
        })),
    [userSessions],
  );

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
    setWorkoutPreviewId(null);
    softHaptic(10);
    startTransition(() => setActiveTab("workout"));
  };

  const skipWorkout = () => {
    if (typeof window !== "undefined" && !window.confirm(`Skip ${todaysWorkout.dayLabel} for now?`)) {
      return;
    }
    const currentIndex = selectedProfile.workoutPlan.findIndex((workout) => workout.id === todaysWorkout.id);
    const nextWorkout = selectedProfile.workoutPlan[(currentIndex + 1) % selectedProfile.workoutPlan.length];
    const previousNextWorkoutId = state.workoutOverrides[selectedProfile.id]?.nextWorkoutId ?? null;

    setState((current) => ({
      ...current,
      workoutOverrides: {
        ...current.workoutOverrides,
        [selectedProfile.id]: {
          nextWorkoutId: nextWorkout.id,
          updatedAt: new Date().toISOString(),
        },
      },
    }));
    showToast(`${todaysWorkout.dayLabel} was skipped. ${nextWorkout.dayLabel} is queued up next.`, {
      actionLabel: "Undo",
      actionKind: "undo-schedule",
      pendingScheduleUndo: { userId: selectedProfile.id, previousNextWorkoutId },
    });
  };

  const moveWorkout = (workoutId: string) => {
    const workout = selectedProfile.workoutPlan.find((item) => item.id === workoutId);
    const previousNextWorkoutId = state.workoutOverrides[selectedProfile.id]?.nextWorkoutId ?? null;
    setState((current) => ({
      ...current,
      workoutOverrides: {
        ...current.workoutOverrides,
        [selectedProfile.id]: {
          nextWorkoutId: workoutId,
          updatedAt: new Date().toISOString(),
        },
      },
    }));
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
    const completedSets = state.activeWorkout.exercises.reduce(
      (sum, exercise) => sum + exercise.sets.filter((set) => set.completed && (set.reps > 0 || set.weight > 0)).length,
      0,
    );
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
      ...current,
      activeWorkout:
        current.activeWorkout?.userId === selectedProfile.id ? null : current.activeWorkout,
    }));
    setShowWorkoutFeelingPrompt(false);
    startTransition(() => setActiveTab("home"));
  };

  const savePartialWorkout = () => {
    if (!state.activeWorkout || state.activeWorkout.userId !== selectedProfile.id) {
      return;
    }

    const completedSets = state.activeWorkout.exercises.reduce(
      (sum, exercise) => sum + exercise.sets.filter((set) => set.completed && (set.reps > 0 || set.weight > 0)).length,
      0,
    );

    if (completedSets === 0) {
      cancelWorkout();
      return;
    }

    const durationMinutes = Math.max(10, Math.round((Date.now() - +new Date(state.activeWorkout.startedAt)) / 60000));
    const completedSession: WorkoutSession = {
      id: `session-${Date.now()}`,
      userId: state.activeWorkout.userId,
      workoutDayId: state.activeWorkout.workoutDayId,
      workoutName: `${state.activeWorkout.workoutName} (Partial)`,
      performedAt: new Date().toISOString(),
      durationMinutes,
      partial: true,
      feeling: "Solid",
      exercises: state.activeWorkout.exercises
        .map((exercise) => ({
          ...exercise,
          sets: exercise.sets.filter((set) => set.completed && (set.reps > 0 || set.weight > 0)),
        }))
        .filter((exercise) => exercise.sets.length > 0),
    };

    setState((current) => ({
      ...current,
      sessions: [completedSession, ...current.sessions],
      activeWorkout: null,
      workoutOverrides: {
        ...current.workoutOverrides,
        [selectedProfile.id]: {
          nextWorkoutId: state.activeWorkout?.workoutDayId ?? null,
          updatedAt: new Date().toISOString(),
        },
      },
    }));
    setSessionSummary({
      sessionId: completedSession.id,
      workoutDayId: completedSession.workoutDayId,
      userId: completedSession.userId,
      workoutName: completedSession.workoutName,
      durationMinutes,
      completedSets,
      feeling: "Solid",
      partial: true,
    });
    showToast("Progress saved and session closed.");
    softHaptic([8, 28, 8]);
    startTransition(() => setActiveTab("home"));
  };

  const completeWorkout = (feeling: WorkoutSession["feeling"]) => {
    if (!state.activeWorkout) {
      return;
    }
    const completedSets = state.activeWorkout.exercises.reduce(
      (sum, exercise) => sum + exercise.sets.filter((set) => set.completed && (set.reps > 0 || set.weight > 0)).length,
      0,
    );
    const durationMinutes = Math.max(25, Math.round((Date.now() - +new Date(state.activeWorkout.startedAt)) / 60000));
    const completedSession: WorkoutSession = {
      id: `session-${Date.now()}`,
      userId: state.activeWorkout.userId,
      workoutDayId: state.activeWorkout.workoutDayId,
      workoutName: state.activeWorkout.workoutName,
      performedAt: new Date().toISOString(),
      durationMinutes,
      feeling,
      exercises: state.activeWorkout.exercises.map((exercise) => ({
        ...exercise,
        sets: exercise.sets.filter((set) => set.completed && (set.reps > 0 || set.weight > 0)),
      })),
    };
    const prSummary = getWorkoutPrSummary(completedSession, userSessions);
    setState((current) => ({
      ...current,
      sessions: [completedSession, ...current.sessions],
      activeWorkout: null,
      workoutOverrides: {
        ...current.workoutOverrides,
        [selectedProfile.id]: {
          nextWorkoutId: null,
          updatedAt: new Date().toISOString(),
        },
      },
      sharedSummary: {
        ...current.sharedSummary,
        combinedWorkouts: current.sharedSummary.combinedWorkouts + 1,
        weeklyHighlight: `${selectedProfile.name} finished ${completedSession.workoutName.toLowerCase()} and kept the team momentum going.`,
        recentMilestones: [`${selectedProfile.name} completed ${completedSession.workoutName}`, ...current.sharedSummary.recentMilestones.slice(0, 2)],
      },
    }));
    setShowWorkoutFeelingPrompt(false);
    setSessionSummary({
      userId: completedSession.userId,
      workoutName: completedSession.workoutName,
      durationMinutes,
      completedSets,
      feeling,
      partial: false,
      prCount: prSummary.count,
      prHighlights: prSummary.highlights,
    });
    softHaptic([10, 36, 12]);
    startTransition(() => setActiveTab("home"));
  };

  const saveMeasurement = (entry: Omit<AppState["measurements"][UserId][number], "id" | "date">) => {
    if (!entry.bodyweightKg) {
      return;
    }
    setState((current) => ({
      ...current,
      measurements: {
        ...current.measurements,
        [selectedProfile.id]: [
          {
            id: `measurement-${Date.now()}`,
            date: new Date().toISOString(),
            ...entry,
          },
          ...current.measurements[selectedProfile.id],
        ],
      },
    }));
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
      const targetSessions = getUserSessions(next, next.activeWorkout.userId);
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
    setState((current) => ({
      ...current,
      stretchCompletions: {
        ...current.stretchCompletions,
        [selectedProfile.id]: [
          {
            id: `stretch-${Date.now()}`,
            userId: selectedProfile.id,
            date: new Date().toISOString(),
            stretchTitle: todaysStretch.title,
          },
          ...current.stretchCompletions[selectedProfile.id],
        ],
      },
    }));
    showToast(`${selectedProfile.name} finished today's Bend stretch.`);
  };

  const toggleStretchCompletion = () => {
    if (!stretchCompletedToday) {
      saveStretchCompletion();
      return;
    }

    setState((current) => ({
      ...current,
      stretchCompletions: {
        ...current.stretchCompletions,
        [selectedProfile.id]: current.stretchCompletions[selectedProfile.id].filter(
          (entry) => !isSameLocalDay(entry.date, new Date()),
        ),
      },
    }));
    showToast(`${selectedProfile.name}'s Bend stretch was marked undone.`);
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
    setState((current) => ({
      ...current,
      sessions: current.sessions.filter((session) => session.userId !== selectedProfile.id),
      personalBests: {
        ...current.personalBests,
        [selectedProfile.id]: seed.personalBests[selectedProfile.id],
      },
      measurements: {
        ...current.measurements,
        [selectedProfile.id]: [],
      },
      stretchCompletions: {
        ...current.stretchCompletions,
        [selectedProfile.id]: [],
      },
      workoutOverrides: {
        ...current.workoutOverrides,
        [selectedProfile.id]: seed.workoutOverrides[selectedProfile.id],
      },
      exerciseSwapMemory: {
        ...current.exerciseSwapMemory,
        [selectedProfile.id]: {},
      },
      activeWorkout:
        current.activeWorkout?.userId === selectedProfile.id ? null : current.activeWorkout,
    }));
    showToast(`${selectedProfile.name}'s saved progress was reset on this phone.`);
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
    showToast("The app was reset to a clean start.");
    startTransition(() => setActiveTab("home"));
  };

  const isJoshuaTheme = selectedProfile.id === "joshua";
  const isNatashaTheme = selectedProfile.id === "natasha";
  const immersiveWorkoutMode = activeTab === "workout" && state.activeWorkout?.userId === selectedProfile.id;
  const compactHeader = scrollY > 18 && !immersiveWorkoutMode;
  const handleToastAction = () => {
    if (toastActionKind !== "undo-schedule" || !pendingScheduleUndo) {
      return;
    }

    setState((current) => ({
      ...current,
      workoutOverrides: {
        ...current.workoutOverrides,
        [pendingScheduleUndo.userId]: {
          nextWorkoutId: pendingScheduleUndo.previousNextWorkoutId,
          updatedAt: new Date().toISOString(),
        },
      },
    }));
    showToast("Workout order change undone.");
  };

  const enterProfile = (profileId: UserId) => {
    setProfileEntryTransition(profileId);
    softHaptic(8);
    window.setTimeout(() => {
      setSelectedExerciseId(null);
      setWorkoutPreviewId(null);
      setShowSettings(false);
      setState((current) => ({ ...current, selectedUserId: profileId }));
      setHasEnteredProfile(true);
      setProfileEntryTransition(null);
      startTransition(() => setActiveTab("home"));
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
    setWorkoutPreviewId(null);
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

      return {
        ...current,
        sessions: current.sessions.map((session) =>
          session.id === updatedSession.id ? updatedSession : session,
        ),
        workoutOverrides: shouldAdvanceCycle
          ? {
              ...current.workoutOverrides,
              [updatedSession.userId]: {
                nextWorkoutId: null,
                updatedAt: new Date().toISOString(),
              },
            }
          : current.workoutOverrides,
      };
    });
    setEditingSessionId(null);
    showToast(options?.countAsDone ? "Workout marked done. Moving to the next day." : "Workout changes saved to progress.");
  };

  const markPartialSessionComplete = (summary: SessionSummary) => {
    if (!summary.sessionId) {
      setSessionSummary(null);
      return;
    }

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

      return {
        ...current,
        sessions: current.sessions.map((session) =>
          session.id === summary.sessionId ? updatedSession : session,
        ),
        workoutOverrides: {
          ...current.workoutOverrides,
          [targetSession.userId]: {
            nextWorkoutId: null,
            updatedAt: new Date().toISOString(),
          },
        },
      };
    });

    setSessionSummary(null);
    showToast("Workout counted as done. Moving to the next day.");
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
          {activeTab === "home" && (
            <HomeScreen
                profile={selectedProfile}
                todaysWorkout={todaysWorkout}
                activeWorkoutName={state.activeWorkout?.userId === selectedProfile.id ? state.activeWorkout.workoutName : null}
                workoutRhythmNote={workoutRhythmNote}
                weeklyCount={weeklyCount}
                streak={streak}
                pbCount={state.personalBests[selectedProfile.id].length}
                strengthPredictions={strengthPredictions}
                dailyVerse={dailyVerse}
                dailyStretch={todaysStretch}
                stretchCompletedToday={stretchCompletedToday}
                sharedSummary={dynamicSharedSummary}
                recentWorkouts={recentWorkouts}
                weddingCountdown={weddingCountdown}
                onOpenDailyVerse={() => setShowDailyVerse(true)}
                onToggleStretch={toggleStretchCompletion}
              onStartWorkout={() => startWorkout(todaysWorkout)}
              onResumeWorkout={() => setActiveTab("workout")}
              onPreviewWorkout={() => {
                setWorkoutPreviewId(todaysWorkout.id);
                startTransition(() => setActiveTab("workout"));
              }}
              onSkipWorkout={skipWorkout}
              onMoveWorkout={moveWorkout}
              onOpenExercise={setSelectedExerciseId}
            />
          )}

          {activeTab === "workout" && (
            <WorkoutScreen
              profile={selectedProfile}
              todaysWorkoutId={todaysWorkout.id}
              previewWorkoutId={workoutPreviewId}
              activeWorkout={state.activeWorkout}
              activeWorkoutTemplate={activeWorkoutTemplate}
              userSessions={userSessions}
                exerciseLibrary={state.exerciseLibrary}
                onStartWorkout={startWorkout}
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
              totalWorkouts={userSessions.length}
              weeklySummary={dynamicWeeklySummary}
              trendData={trendData}
              measurements={state.measurements[selectedProfile.id]}
              userSessions={userSessions}
              stretchCompletions={state.stretchCompletions[selectedProfile.id]}
              recentSessions={userSessions.slice(0, 4)}
              onSaveMeasurement={saveMeasurement}
              onEditSession={setEditingSessionId}
            />
          )}

        </div>
      </div>

      <ExerciseDetailModal exercise={selectedExercise} userSessions={userSessions} onClose={() => setSelectedExerciseId(null)} />
      <BibleVerseModal verse={showDailyVerse ? dailyVerse : null} onClose={() => setShowDailyVerse(false)} />
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

