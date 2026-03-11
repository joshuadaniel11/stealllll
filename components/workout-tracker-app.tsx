"use client";

import { startTransition, useDeferredValue, useEffect, useMemo, useState, type CSSProperties } from "react";
import clsx from "clsx";
import { Activity, ChartColumn, Dumbbell, Search, Settings } from "lucide-react";

import { BibleVerseModal } from "@/components/bible-verse-modal";
import { CompletionCelebration } from "@/components/completion-celebration";
import { ExerciseDetailModal } from "@/components/exercise-detail-modal";
import { HomeScreen } from "@/components/home-screen";
import { LibraryScreen } from "@/components/library-screen";
import { OnboardingModal } from "@/components/onboarding-modal";
import { ProgressScreen } from "@/components/progress-screen";
import { SessionSummaryModal, type SessionSummary } from "@/components/session-summary-modal";
import { SettingsModal } from "@/components/settings-modal";
import { Card } from "@/components/ui";
import { WorkoutFeelingModal } from "@/components/workout-feeling-modal";
import { WorkoutScreen } from "@/components/workout-screen";
import { getLastExerciseSets } from "@/lib/progression";
import { createSeedState } from "@/lib/seed-data";
import { loadState, saveState } from "@/lib/storage";
import { getStrengthPredictions } from "@/lib/strength-prediction";
import type {
  ActiveWorkout,
  AppState,
  ExerciseLibraryItem,
  ExerciseTemplate,
  MuscleGroup,
  Profile,
  SetLog,
  UserId,
  WorkoutPlanDay,
  WorkoutSession,
} from "@/lib/types";

type TabId = "home" | "workout" | "progress" | "library";

const navItems = [
  { id: "home" as const, label: "Home", icon: Activity },
  { id: "workout" as const, label: "Workout", icon: Dumbbell },
  { id: "progress" as const, label: "Progress", icon: ChartColumn },
  { id: "library" as const, label: "Library", icon: Search },
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

function dedupeLibrary(items: ExerciseLibraryItem[]) {
  return Array.from(new Map(items.map((item) => [item.id, item])).values());
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
    activeWorkout: null,
  };
}

export function WorkoutTrackerApp() {
  const [state, setState] = useState<AppState>(createSeedState);
  const [hydrated, setHydrated] = useState(false);
  const [activeTab, setActiveTab] = useState<TabId>("home");
  const [selectedExerciseId, setSelectedExerciseId] = useState<string | null>(null);
  const [showDailyVerse, setShowDailyVerse] = useState(false);
  const [showWorkoutFeelingPrompt, setShowWorkoutFeelingPrompt] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [showOnboarding, setShowOnboarding] = useState(false);
  const [completionMessage, setCompletionMessage] = useState("");
  const [showCompletionCelebration, setShowCompletionCelebration] = useState(false);
  const [sessionSummary, setSessionSummary] = useState<SessionSummary | null>(null);
  const [libraryQuery, setLibraryQuery] = useState("");
  const [customExerciseName, setCustomExerciseName] = useState("");
  const [customMuscleGroup, setCustomMuscleGroup] = useState<MuscleGroup>("Full Body");
  const [workoutPreviewId, setWorkoutPreviewId] = useState<string | null>(null);
  const [scrollY, setScrollY] = useState(0);
  const deferredLibraryQuery = useDeferredValue(libraryQuery);

  const softHaptic = (pattern: number | number[]) => {
    if (typeof navigator !== "undefined" && "vibrate" in navigator) {
      navigator.vibrate(pattern);
    }
  };

  useEffect(() => {
    const localState = loadState();
    if (localState) {
      const seed = createSeedState();
      setState(mergeStateWithSeed(seed, localState));
    }
    if (typeof window !== "undefined" && !window.localStorage.getItem(ONBOARDING_KEY)) {
      setShowOnboarding(true);
    }
    setHydrated(true);
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
    const timeout = window.setTimeout(() => setShowCompletionCelebration(false), 1800);
    return () => window.clearTimeout(timeout);
  }, [showCompletionCelebration]);

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

  const filteredLibrary = useMemo(
    () =>
      dedupeLibrary(
        state.exerciseLibrary.filter((item) => {
          const query = deferredLibraryQuery.toLowerCase();
          return item.name.toLowerCase().includes(query) || item.muscleGroup.toLowerCase().includes(query);
        }),
      ),
    [state.exerciseLibrary, deferredLibraryQuery],
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
    const currentIndex = selectedProfile.workoutPlan.findIndex((workout) => workout.id === todaysWorkout.id);
    const nextWorkout = selectedProfile.workoutPlan[(currentIndex + 1) % selectedProfile.workoutPlan.length];

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
    setCompletionMessage(`${todaysWorkout.dayLabel} was skipped. ${nextWorkout.dayLabel} is queued up next.`);
    setShowCompletionCelebration(true);
  };

  const moveWorkout = (workoutId: string) => {
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
      setCompletionMessage("Log at least one set before finishing the workout.");
      setShowCompletionCelebration(true);
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
      workoutName: completedSession.workoutName,
      durationMinutes,
      completedSets,
      feeling,
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
      const parsed = JSON.parse(text) as Partial<AppState>;
      const seed = createSeedState();
      setState(mergeStateWithSeed(seed, parsed));
      startTransition(() => setActiveTab("home"));
      setCompletionMessage("Backup imported successfully.");
      setShowCompletionCelebration(true);
    } catch {
      setCompletionMessage("Import failed. Please use a valid workout backup file.");
      setShowCompletionCelebration(true);
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

  const toggleStretchCompletion = () => {
    if (!stretchCompletedToday) {
      completeStretch();
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
    setCompletionMessage(`${selectedProfile.name}'s Bend stretch was marked undone.`);
    setShowCompletionCelebration(true);
  };

  const addCustomExercise = () => {
    if (!customExerciseName.trim()) {
      return;
    }
    setState((current) => ({
      ...current,
      exerciseLibrary: [
        {
          id: `custom-${Date.now()}`,
          name: customExerciseName.trim(),
          muscleGroup: customMuscleGroup,
          equipment: "Custom",
          cues: ["Add your own notes and rep targets."],
          isCustom: true,
        },
        ...current.exerciseLibrary,
      ],
    }));
    setCustomExerciseName("");
  };

  const completeStretch = () => {
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
    setCompletionMessage(`${selectedProfile.name} finished today’s Bend stretch.`);
    setShowCompletionCelebration(true);
  };

  const closeOnboarding = () => {
    if (typeof window !== "undefined") {
      window.localStorage.setItem(ONBOARDING_KEY, "true");
    }
    setShowOnboarding(false);
  };

  const resetProfileData = () => {
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
    setCompletionMessage(`${selectedProfile.name}'s saved progress was reset on this phone.`);
    setShowCompletionCelebration(true);
    setShowSettings(false);
    startTransition(() => setActiveTab("home"));
  };

  const resetAllData = () => {
    if (typeof window !== "undefined") {
      window.localStorage.removeItem(ONBOARDING_KEY);
    }
    setState(createSeedState());
    setShowSettings(false);
    setShowOnboarding(true);
    setCompletionMessage("The app was reset to a clean start.");
    setShowCompletionCelebration(true);
    startTransition(() => setActiveTab("home"));
  };

  const isJoshuaTheme = selectedProfile.id === "joshua";
  const immersiveWorkoutMode = activeTab === "workout" && state.activeWorkout?.userId === selectedProfile.id;
  const compactHeader = scrollY > 18 && !immersiveWorkoutMode;

  return (
    <main
      style={{ "--parallax-shift": `${Math.min(scrollY * 0.08, 18)}px` } as CSSProperties}
      className={clsx(
        "theme-shell min-h-screen px-4 pb-32 pt-5 text-text transition-colors duration-500 sm:px-6",
        isJoshuaTheme ? "theme-joshua" : "",
      )}
    >
      <div className="mx-auto flex max-w-md flex-col gap-5">
        {!immersiveWorkoutMode ? (
          <Card className={clsx("hero-shell animate-fade-up px-5 py-5", compactHeader ? "py-4" : "py-5")}>
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className={clsx("hero-subtle text-sm text-muted", compactHeader ? "hero-subtle-compact" : "")}>STEALLLLL</p>
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
                onClick={() => setShowSettings(true)}
              >
                <Settings className="h-5 w-5" />
              </button>
            </div>
            <div className="ios-segmented mt-5 grid grid-cols-2">
              {state.profiles.map((profile) => (
                <button
                  key={profile.id}
                  className={clsx(
                    "ios-segment text-sm font-medium",
                    profile.id === selectedProfile.id ? "ios-segment-active" : "",
                  )}
                  onClick={() => {
                    setSelectedExerciseId(null);
                    setState((current) => ({ ...current, selectedUserId: profile.id }));
                    softHaptic(6);
                    startTransition(() => setActiveTab("home"));
                  }}
                >
                  {profile.name}
                </button>
              ))}
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
              sharedSummary={state.sharedSummary}
              recentWorkouts={recentWorkouts}
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
                exerciseLibrary={state.exerciseLibrary}
                onStartWorkout={startWorkout}
                onUpdateSet={updateSet}
                onCopyPreviousSet={copyPreviousSet}
                onCompleteSet={completeSet}
                onSwapExercise={swapExercise}
                onCompleteWorkout={openWorkoutCompletionPrompt}
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
              onSaveMeasurement={saveMeasurement}
              onExportData={exportData}
              onImportData={importData}
            />
          )}

          {activeTab === "library" && (
            <LibraryScreen
              query={libraryQuery}
              onQueryChange={setLibraryQuery}
              customExerciseName={customExerciseName}
              customMuscleGroup={customMuscleGroup}
              muscleOptions={["Chest", "Back", "Shoulders", "Biceps", "Triceps", "Legs", "Glutes", "Hamstrings", "Quads", "Core", "Full Body"]}
              filteredLibrary={filteredLibrary}
              onCustomExerciseNameChange={setCustomExerciseName}
              onCustomMuscleGroupChange={setCustomMuscleGroup}
              onAddCustomExercise={addCustomExercise}
              onOpenExercise={setSelectedExerciseId}
            />
          )}
        </div>
      </div>

      <ExerciseDetailModal exercise={selectedExercise} userSessions={userSessions} onClose={() => setSelectedExerciseId(null)} />
      <BibleVerseModal verse={showDailyVerse ? dailyVerse : null} onClose={() => setShowDailyVerse(false)} />
      <CompletionCelebration visible={showCompletionCelebration} message={completionMessage} />
      {showOnboarding && <OnboardingModal onClose={closeOnboarding} />}
      {showSettings && (
        <SettingsModal
          profile={selectedProfile}
          onClose={() => setShowSettings(false)}
          onExport={exportData}
          onImport={importData}
          onResetProfile={resetProfileData}
          onResetAll={resetAllData}
        />
      )}
      {showWorkoutFeelingPrompt && (
        <WorkoutFeelingModal
          onSelect={completeWorkout}
          onClose={() => setShowWorkoutFeelingPrompt(false)}
        />
      )}
      <SessionSummaryModal summary={sessionSummary} onClose={() => setSessionSummary(null)} />

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
